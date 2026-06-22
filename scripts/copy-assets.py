import json, os, shutil, sys

SRC = "old"                 # source root (paths in json are like "source/...")
DST = "public"              # dest root -> public/source/...

def copy(rel):
    if not rel: return False
    s = os.path.join(SRC, rel)
    if not os.path.exists(s):
        return None
    d = os.path.join(DST, rel)
    os.makedirs(os.path.dirname(d), exist_ok=True)
    shutil.copy2(s, d)
    return True

pubs = json.load(open(os.path.join(SRC, "source/publications.json")))

copied = {"teaser":0, "paper":0, "slide":0, "missing":[]}
for p in pubs:
    for field in ("teaser", "paper"):
        rel = p.get(field)
        if not rel: continue
        r = copy(rel)
        if r is True: copied[field]+=1
        elif r is None: copied["missing"].append((p["id"], field, rel))

# carousel slides
slides = json.load(open(os.path.join(SRC, "source/slides.json")))
for s in slides:
    rel = s.get("imgSrc")
    if not rel: continue
    r = copy(rel)
    if r is True: copied["slide"]+=1
    elif r is None: copied["missing"].append((s.get("link"), "slide", rel))

# small json + svg assets
for rel in [
    "source/publications.json",
    "source/updates.json",
    "source/featuredProj.json",
    "source/slides.json",
    "source/dict.json",
    "source/files/scholar.svg",
    "source/files/dblp.svg",
]:
    copy(rel)

print("teasers:", copied["teaser"], "papers:", copied["paper"], "slides:", copied["slide"])
print("missing:", copied["missing"])
