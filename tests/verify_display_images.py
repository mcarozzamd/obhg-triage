from pathlib import Path
from PIL import Image
import json,hashlib
root=Path(__file__).resolve().parents[1]
rows=json.loads((root/'assets/display-diagrams/manifest.json').read_text())
for r in rows:
 a=Image.open(root/r['original']);b=Image.open(root/r['output']);assert a.size==b.size and a.mode==b.mode
 assert hashlib.sha256((root/r['original']).read_bytes()).hexdigest()==r['originalSha256']
 box=(0,r['titleBandHeight'],a.width,a.height);assert a.crop(box).tobytes()==b.crop(box).tobytes()
 assert hashlib.sha256(b.crop(box).tobytes()).hexdigest()==r['bodySha256']
print(str(len(rows))+'/'+str(len(rows))+' derivative clinical bodies pixel-identical to original diagrams')
