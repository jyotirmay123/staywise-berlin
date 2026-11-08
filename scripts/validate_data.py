import hashlib,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]/"public"/"data"
m=json.loads((root/"manifest.json").read_text())
assert m["schemaVersion"]==1 and len(m["snapshots"])>=1
for entry in m["snapshots"]:
    raw=(root/(entry["date"]+".json")).read_bytes()
    assert hashlib.sha256(raw).hexdigest()==entry["sha256"],"Checksum mismatch"
    s=json.loads(raw)
    assert s["date"]==entry["date"] and len(s["listings"])==entry["count"]
    assert len({x["id"] for x in s["listings"]})==len(s["listings"])
    for x in s["listings"]:
        assert isinstance(x["id"],str) and isinstance(x["lat"],(int,float)) and isinstance(x["lng"],(int,float))
        assert -90<=x["lat"]<=90 and -180<=x["lng"]<=180
        assert len(x["rm"])==len(s["months"]) and all(isinstance(n,int) and n>=0 for n in x["rm"])
        assert x["ltm"] is None or isinstance(x["ltm"],(int,float))
        assert x["price"] is None or isinstance(x["price"],(int,float))
g=json.loads((root/"neighbourhoods.json").read_text())
assert g["type"]=="FeatureCollection" and len(g["features"])>0
print("Validated",len(m["snapshots"]),"JSON vintages, hashes, rows and boundaries.")
