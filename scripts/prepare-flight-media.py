"""Prepare frame-aligned, silent forward/reverse room transitions from supplied film."""
import json,subprocess,sys
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
out=root/'public/flight-preview/media';out.mkdir(parents=True,exist_ok=True)
video=Path(sys.argv[1]);originals=Path(sys.argv[2])
frames=[0,60,120,180,258]
def ff(args):subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y',*args],check=True)
for i,n in enumerate(frames):
 ff(['-i',str(video),'-vf',f'select=eq(n\\,{n})','-frames:v','1','-c:v','libwebp','-lossless','1',str(out/f'room-{i}.webp')])
 Image.open(originals/f'{11+i}.png').save(out/f'original-{i}.webp','WEBP',quality=95,method=6)
for i,(start,end) in enumerate(zip(frames,frames[1:])):
 for direction in ['forward','reverse']:
  vf=f'trim=start_frame={start}:end_frame={end+1},setpts=PTS-STARTPTS'
  if direction=='reverse':vf+=',reverse,setpts=PTS-STARTPTS'
  ff(['-i',str(video),'-vf',vf,'-an','-c:v','libx264','-preset','slow','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',str(out/f'{direction}-{i}.mp4')])
(out/'manifest.json').write_text(json.dumps({'source':video.name,'fps':24,'stops_frames':frames,'stops_seconds':[n/24 for n in frames],'order':['Лобби','Ресторан','Кафе','Офис','Номер отеля'],'silent':True,'posters':'Exact stop frames; originals kept separately for reduced motion and loading/error fallback.'},ensure_ascii=False,indent=2))
print('Prepared',len(list(out.iterdir())),'media files')
