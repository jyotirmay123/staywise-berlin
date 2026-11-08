"""Collect free public Berlin snapshots; preserve existing vintages."""
import csv,datetime,hashlib,io,json,time,urllib.request,concurrent.futures
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"public"/"data"
OUT.mkdir(parents=True,exist_ok=True)
def get(url):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"Staywise public-data research; source credited in repository"}),timeout=90) as r:return r.read()
        except Exception:
            if attempt==2:raise
            time.sleep(2*(attempt+1))
def read_json(url):return json.loads(get(url))
page=read_json("https://insideairbnb.com/page-data/get-the-data/page-data.json")
datasets=[]
for key in page["staticQueryHashes"]:
    d=read_json("https://insideairbnb.com/page-data/sq/d/"+key+".json").get("data",{}).get("allData",{}).get("datasets",[])
    if d:
        datasets=sorted((x for x in d if x.get("link")=="berlin"),key=lambda x:x["publishDate"])
        break
if not datasets:raise RuntimeError("Provider index changed; inspect schema before updating.")
def num(value):
    try:return float(value.replace("$","").replace(",","")) if value else None
    except (ValueError,AttributeError):return None
def prepare(d):
    date=d["publishDate"];path=OUT/(date+".json")
    if path.exists():
        print("Preserving existing vintage",date,flush=True);return
    base=d["dataRoot"]+date+"/visualisations/"
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        a=pool.submit(get,base+"listings.csv");b=pool.submit(get,base+"reviews.csv")
        raw_rows=a.result().decode("utf-8-sig");raw_reviews=b.result().decode("utf-8-sig")
    rows=list(csv.DictReader(io.StringIO(raw_rows)))
    if not rows:raise RuntimeError("No listings for "+date)
    months=[str(y)+"-"+str(m).zfill(2) for y in range(2024,int(date[:4])+1) for m in range(1,13) if str(y)+"-"+str(m).zfill(2)<date[:7]]
    idx={m:i for i,m in enumerate(months)};counts={}
    for r in csv.DictReader(io.StringIO(raw_reviews)):
        m=r["date"][:7]
        if m in idx:
            if r["listing_id"] not in counts:counts[r["listing_id"]]=[0]*len(months)
            counts[r["listing_id"]][idx[m]]+=1
    listings=[];ids=set()
    for r in rows:
        if r["id"] in ids:raise RuntimeError("Duplicate source listing ID")
        ids.add(r["id"]);lat,lng=num(r["latitude"]),num(r["longitude"])
        if lat is None or lng is None or not(-90<=lat<=90 and -180<=lng<=180):raise RuntimeError("Invalid coordinate")
        listings.append({"id":r["id"],"name":r["name"],"district":r["neighbourhood_group"],"area":r["neighbourhood"],"lat":lat,"lng":lng,"type":r["room_type"],"price":num(r.get("price")),"min":num(r.get("minimum_nights")) or 1,"reviews":num(r.get("number_of_reviews")) or 0,"ltm":num(r.get("number_of_reviews_ltm")),"available":num(r.get("availability_365")) or 0,"license":bool(r.get("license","").strip()),"rm":counts.get(r["id"],[0]*len(months))})
    value={"date":date,"months":months,"listings":listings,"source":base+"listings.csv","reviewSource":base+"reviews.csv","retrieved":datetime.datetime.now(datetime.timezone.utc).isoformat()}
    path.write_text(json.dumps(value,ensure_ascii=False,separators=(",",":")),encoding="utf-8")
    print("Collected",date,len(listings),"listings",flush=True)
for d in datasets:prepare(d)
geo=OUT/"neighbourhoods.json"
if not geo.exists():
    d=datasets[-1];geo.write_bytes(get(d["dataRoot"]+d["publishDate"]+"/visualisations/neighbourhoods.geojson"))
entries=[]
for path in sorted(OUT.glob("????-??-??.json")):
    b=path.read_bytes();s=json.loads(b)
    if path.stem!=s["date"] or not s["listings"]:raise RuntimeError("Invalid stored vintage")
    entries.append({"date":s["date"],"count":len(s["listings"]),"source":s["source"],"sha256":hashlib.sha256(b).hexdigest()})
manifest={"schemaVersion":1,"updatedAt":datetime.datetime.now(datetime.timezone.utc).isoformat(),"snapshots":entries,"coverage":"Berlin city archive only; no listing-level coverage for Potsdam or neighbouring Brandenburg towns.","attribution":"Inside Airbnb · CC BY 4.0; compacted and aggregated by Staywise","licence":"https://creativecommons.org/licenses/by/4.0/"}
(OUT/"manifest.json").write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
print("Wrote",len(entries),"vintages",flush=True)
