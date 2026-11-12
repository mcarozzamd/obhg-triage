"""Display-only title-band derivatives. Original diagrams and clinical body pixels stay intact."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,subprocess,hashlib
root=Path(__file__).resolve().parents[1]
items=json.loads(subprocess.check_output(['node','-e',"global.self=global;console.log(JSON.stringify(require('./js/content.js').items.filter(x=>x.kind==='diagram').map(x=>({id:x.id,img:x.img}))))"],cwd=root,text=True))
names={r['id']:r['name']for r in json.loads((root/'DISPLAY_TITLE_MAPPING.json').read_text())}
outdir=root/'assets/display-diagrams';outdir.mkdir(exist_ok=True);audit=[]
fontfile='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
for item in items:
 original=root/item['img'];im=Image.open(original);copy=im.copy();pix=im.convert('RGB').load()
 boundary=next(y for y in range(1,im.height//3)if min(pix[0,y])>150 and max(pix[0,y])>210)
 draw=ImageDraw.Draw(copy);draw.rectangle((0,0,im.width-1,boundary-1),fill=pix[0,0])
 size=max(24,int(boundary*.42));font=ImageFont.truetype(fontfile,size)
 while draw.textbbox((0,0),names[item['id']],font=font)[2]>im.width*.93:
  size-=1;font=ImageFont.truetype(fontfile,size)
 draw.text((im.width*.025,boundary*.12),names[item['id']],font=font,fill='white')
 small=ImageFont.truetype(fontfile,max(14,int(boundary*.14)))
 draw.text((im.width*.025,boundary*.73),'Decision support only · not unit policy',font=small,fill='white')
 box=(0,boundary,im.width,im.height);assert im.crop(box).tobytes()==copy.crop(box).tobytes()
 output=outdir/(item['id']+'.png');copy.save(output)
 saved=Image.open(output);assert saved.crop(box).tobytes()==im.crop(box).tobytes()
 audit.append({'id':item['id'],'original':item['img'],'output':str(output.relative_to(root)),'titleBandHeight':boundary,'bodySha256':hashlib.sha256(im.crop(box).tobytes()).hexdigest(),'originalSha256':hashlib.sha256(original.read_bytes()).hexdigest()})
(root/'assets/display-diagrams/manifest.json').write_text(json.dumps(audit,indent=2)+'\n')
print(len(audit),'display-only title derivatives; every clinical body pixel unchanged')
