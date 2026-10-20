import concurrent.futures, json, re, subprocess, urllib.request, sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
dist=root/'dist';assets=dist/'assets'
source=(dist/'app.js').read_text(encoding='utf-8')
items=re.findall(r"\{id:'([^']+)'[^\n]*?thumbnailUrl:'([^']+)'",source)
for directory in ['posters','hero-streams']:(assets/directory).mkdir(exist_ok=True)
def run(args,**kw):subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-nostdin','-y',*args],check=True,**kw)
def poster(entry):
 index,(name,url)=entry;target=assets/'posters'/f'{name}.webp'
 if index==0:
  run(['-i',str(assets/'hero-background-poster.jpg'),'-frames:v','1','-c:v','libwebp','-quality','80','-compression_level','6',str(target)])
 elif not target.exists():
  try:
   req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
   with urllib.request.urlopen(req,timeout=10) as res:data=res.read()
   run(['-i','pipe:0','-vf',f"scale='min({1280 if index<5 else 640},iw)':-2",'-frames:v','1','-c:v','libwebp','-quality','80','-compression_level','6',str(target)],input=data)
  except Exception:
   run(['-ss','0.15','-i',str(assets/'card-previews'/f'{name}.mp4'),'-vf',"scale='min(854,iw)':-2",'-frames:v','1','-c:v','libwebp','-quality','80',str(target)])
 return {'id':name,'poster_bytes':target.stat().st_size}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:posters=list(pool.map(poster,enumerate(items)))
def stream(entry):
 index,(name,_)=entry;target=assets/'hero-streams'/f'{name}.mp4'
 src=root/'.tools'/'hero-source'/f'{name}.mp4'
 if (not target.exists() or '--refresh-video' in sys.argv) and not src.exists():raise RuntimeError('Run python tools/encode-hero-hd.py to fetch original HD sources first')
 if not target.exists() or '--refresh-video' in sys.argv:run(['-i',str(src),'-vf',"scale='min(1280,iw)':-2",'-an','-c:v','libx264','-preset','medium','-crf','21','-profile:v','main','-level:v','3.1','-maxrate','3000k','-bufsize','6000k','-pix_fmt','yuv420p','-g','48','-keyint_min','48','-sc_threshold','0','-threads','2','-movflags','+faststart',str(target)])
 return {'id':name,'input_bytes':src.stat().st_size if src.exists() else None,'stream_bytes':target.stat().st_size}
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:streams=list(pool.map(stream,enumerate(items[:5])))
studio=[]
for name in ['creative-studio-scene','creative-studio-foreground']:
 src=assets/f'{name}.png';target=assets/f'{name}.webp'
 if not target.exists():run(['-i',str(src),'-frames:v','1','-c:v','libwebp','-quality','86','-compression_level','6',str(target)])
 studio.append({'name':name,'input_bytes':src.stat().st_size,'webp_bytes':target.stat().st_size})
workflow=[]
for n in ['01','02','03']:
 src=assets/f'challenge-step-{n}.jpg';target=assets/f'challenge-step-{n}.webp'
 if not target.exists():run(['-i',str(src),'-frames:v','1','-c:v','libwebp','-quality','86',str(target)])
 workflow.append({'name':target.name,'input_bytes':src.stat().st_size,'webp_bytes':target.stat().st_size})
stats={'workflow':workflow,'posters':posters,'hero_streams':streams,'studio':studio}
(root/'docs/startup-asset-sizes.json').write_text(json.dumps(stats,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'posters_total':sum(x['poster_bytes'] for x in posters),'first_poster':posters[0],'hero_streams':streams,'studio':studio}))
