"""Read the public MAX chart endpoints and SMI's factual price tables. No credentials.
Original response bytes + SHA256 are retained. No synthetic or interpolated observations.
"""
import concurrent.futures, datetime as dt, hashlib, json, re, time, urllib.request
from html.parser import HTMLParser
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
SPEC = [
 ('dysprosium','Dysprosium oxide','dysprosiumoxid','Rare earth','suspended'),
 ('neodymium','Neodymium oxide','neodymoxid','Rare earth','reference'),
 ('praseodymium','Praseodymium oxide','praseodymoxid','Rare earth','reference'),
 ('terbium','Terbium oxide','terbiumoxid','Rare earth','suspended'),
 ('gallium','Gallium','gallium','Technology','suspended'),
 ('germanium','Germanium','germanium','Technology','suspended'),
 ('hafnium','Hafnium','hafnium','Technology','reference'),
 ('indium','Indium','indium','Technology','on-request'),
 ('rhenium','Rhenium','rhenium','Technology','reference'),
 ('antimony','Antimony','antimon','Technology','reference'),
 ('bismuth','Bismuth','bismut','Technology','reference'),
 ('tellurium','Tellurium','tellur','Technology','unverified'),
 ('gold','Gold','gold','Precious','unverified'),
 ('silver','Silver','silber','Precious','unverified'),
 ('platinum','Platinum','platin','Precious','unverified'),
 ('palladium','Palladium','palladium','Precious','unverified'),
 ('rhodium','Rhodium','rhodium','Precious','reference'),
 ('iridium','Iridium','iridium','Precious','reference'),
 ('ruthenium','Ruthenium','ruthenium','Precious','reference'),
]
class Tables(HTMLParser):
 def __init__(self):
  super().__init__();self.tables=[];self.table=None;self.row=None;self.cell=None;self.text=[];self.ignore=0
 def handle_starttag(self,tag,attrs):
  if tag in ('script','style'):self.ignore+=1
  if tag=='table':self.table=[]
  elif tag=='tr' and self.table is not None:self.row=[]
  elif tag in ('td','th') and self.row is not None:self.cell=[]
 def handle_data(self,data):
  if not self.ignore:self.text.append(data)
  if self.cell is not None:self.cell.append(data)
 def handle_endtag(self,tag):
  if tag in ('script','style'):self.ignore=max(0,self.ignore-1)
  if tag in ('td','th') and self.cell is not None:
   self.row.append(' '.join(' '.join(self.cell).split()));self.cell=None
  elif tag=='tr' and self.row is not None:
   self.table.append(self.row);self.row=None
  elif tag=='table' and self.table is not None:self.tables.append(self.table);self.table=None

def fetch(url):
 for attempt in range(3):
  try:
   with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'RareMetalsLab/1.0 (public historical research)'}),timeout=40) as r:return r.read()
  except Exception:
   if attempt==2:raise
   time.sleep(attempt+1)

def chart(spec):
 id,name,key,group,status=spec
 url='https://charts.tradium.net/wp-json/tradiumcharts/v1/getdata?period=complete&type='+key
 cached=Path('/tmp/metal-raw')/(key+'.json')
 raw=cached.read_bytes() if '--cached' in __import__('sys').argv and cached.exists() else fetch(url)
 data=json.loads(raw);obs=[];unavailable=[]
 for date,values in data.items():
  row={'date':dt.datetime.strptime(date,'%d.%m.%Y').date().isoformat()}
  for currency in ('eur','usd'):
   value=float(values[currency].replace(',','.'))
   if value<=-100:
    unavailable.append({'date':row['date'],'reason':'provider percentage at or below -100; cannot form positive price index'});break
   row[currency]=100+value
  else:obs.append(row)
 obs.sort(key=lambda r:r['date'])
 path=ROOT/'data/raw'/(key+'.json');path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(raw)
 page='https://strategicmetalsinvest.com/'+id+'-prices/'
 tables=[];asof=None;note=None;quote=None;error=None
 try:
  html=fetch(page).decode();p=Tables();p.feed(html);tables=[t for t in p.tables if t and any(any(term in c.lower() for term in ['price','2026','period','2025']) for c in t[0])]
  text=' '.join(' '.join(p.text).split())
  match=re.search(r'Price as of ([A-Za-z]+ \d{1,2} \d{4})',text)
  if match:asof=match[1]
  match=re.search(r'Current [A-Za-z ]+price:\s*\$([\d,.]+) per (kg|oz|ounce)',text,re.I)
  if match:quote={'value':float(match[1].replace(',','')),'currency':'USD','unit':match[2]}
  match=re.search(r'This price is based on.{0,500}?Currency conversions.{0,140}',text)
  if match:note=match[0]
 except Exception as e:error=str(e)
 print(id,len(obs),obs[0]['date'],obs[-1]['date'],'tables',len(tables),flush=True)
 return {'id':id,'name':name,'group':group,'status':status,'statusAsOf':'2026-11-12','statusSource':'https://doobloo.com/preisverzeichnis/','chartKey':key,'source':url,'page':page,'rawFile':'raw/'+key+'.json','sha256':hashlib.sha256(raw).hexdigest(),'observations':obs,'unavailableObservations':unavailable,'retailSnapshot':{'asOf':asof,'quote':quote,'tables':tables,'note':note,'error':error}}

def main():
 with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:metals=list(pool.map(chart,SPEC))
 dataset={'schemaVersion':1,'retrievedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'seriesType':'cumulative percentage converted to relative index (100 + percentage); not absolute prices','source':'https://strategicmetalsinvest.com/historical-price-charts/','metals':metals,'facts':{'minimumEur':10000,'minimumSource':'https://strategicmetalsinvest.com/how-to-invest/','custodyPartner':'doobloo AG; insured Swiss bonded warehouse per SMI FAQ','referenceNotResale':True,'dooblooStorageMonthlyPct':0.09,'smiFeesVerified':False,'reviewedOn':'2026-11-12'}}
 (ROOT/'data/metals.json').write_text(json.dumps(dataset,separators=(',',':'))+'\n')
 print('Saved',len(metals),'metals',sum(len(m['observations'])for m in metals),'observations',flush=True)
if __name__=='__main__':main()
