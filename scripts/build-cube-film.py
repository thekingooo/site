#!/usr/bin/env python3
"""Register five supplied cube films, feather their edges and build one seekable film.

Requires Python 3 and ffmpeg/ffprobe. Run from the repository root.
Inputs: cafe, office, salon, clinic, hotel, in that order.
"""
import argparse
import json
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('sources', nargs=5, type=Path)
parser.add_argument('--work-dir', type=Path, default=Path('/tmp/prostranstvo-film'))
parser.add_argument('--reuse-normalized', action='store_true', help='Reuse already normalized films in work-dir; sources must be unchanged.')
args = parser.parse_args()
ORDER = ['cafe', 'office', 'salon', 'clinic', 'hotel']
LABELS = ['Кафе', 'Офис', 'Салон красоты', 'Клиника', 'Отель']
ANCHORS = {'cafe': (96, 1130, 840), 'office': (106, 1154, 892), 'salon': (95, 1155, 896), 'clinic': (102, 1150, 900), 'hotel': (104, 1138, 900)}
FPS, CLIP_FRAMES, BLEND_FRAMES = 30, 145, 4
args.work_dir.mkdir(parents=True, exist_ok=True)
output = Path('public/video/spaces/five-spaces.mp4')
output.parent.mkdir(parents=True, exist_ok=True)
Path('public/images/spaces').mkdir(parents=True, exist_ok=True)

def run(command):
    subprocess.run(command, check=True)

def probe(path):
    return json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)]))

def smooth(t):
    return f'(clip({t},0,1)*clip({t},0,1)*(3-2*clip({t},0,1)))'

for name, source in zip(ORDER, args.sources):
    if not source.is_file():
        raise FileNotFoundError(source)
    normalized = args.work_dir / f'{name}-normalized.mp4'
    if not args.reuse_normalized:
        info = next(s for s in probe(source)['streams'] if s['codec_type'] == 'video')
        height = 864 if name == 'cafe' else 960
        if (info['width'], info['height'], info['r_frame_rate']) != (1280, height, '30/1'):
            raise ValueError(f'{name}: source differs from the calibrated original; update anchors before rebuilding.')
        left, right, bottom = ANCHORS[name]
        sx, sy = 1040 / (right - left), 850 / bottom
        width, scaled_height = round(1280*sx/2)*2, round(height*sy/2)*2
        x = round(120-left*sx)
        # Protect the roof tip while feathering the dark source boundary.
        alpha = f'255*{smooth("X/85")}*{smooth("(W-1-X)/85")}*max({smooth("Y/55")},clip((max(max(r(X,Y),g(X,Y)),b(X,Y))-32)/48,0,1))*{smooth(f"(H-1-Y)/{max(18,height-bottom-6)}")}'
        filters = f"[0:v]trim=start_frame=16:end_frame=161,setpts=PTS-STARTPTS,format=gbrap,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='{alpha}',scale={width}:{scaled_height}:flags=lanczos,setsar=1[s];color=c=0x141616:s=1280x1024:r=30:d=4.833334[bg];[bg][s]overlay=x={x}:y=70:shortest=1:format=auto,format=yuv420p[out]"
        print(f'Normalizing {name}: scale {width}x{scaled_height}, position {x},70', flush=True)
        run(['ffmpeg','-v','error','-threads','2','-i',str(source),'-filter_complex_threads','2','-filter_complex',filters,'-map','[out]','-an','-c:v','libx264','-threads','2','-preset','fast','-crf','16','-g','3','-sc_threshold','0','-movflags','+faststart','-y',str(normalized)])
    info = probe(normalized)['streams'][0]
    if (int(info['nb_frames']), info['width'], info['height']) != (CLIP_FRAMES, 1280, 1024):
        raise ValueError(f'{name}: incomplete or incompatible normalized clip')

command = ['ffmpeg','-v','error']
for name in ORDER:
    command += ['-threads','1','-i',str(args.work_dir / f'{name}-normalized.mp4')]
filters = [f'[{i}:v]setpts=PTS-STARTPTS,fps={FPS},settb=1/{FPS}[v{i}]' for i in range(5)]
last = 'v0'
for i in range(1, 5):
    offset = i * (CLIP_FRAMES-BLEND_FRAMES) / FPS
    filters.append(f'[{last}][v{i}]xfade=transition=fade:duration={BLEND_FRAMES/FPS:.9f}:offset={offset:.9f},fps={FPS},settb=1/{FPS}[mix{i}]')
    last = f'mix{i}'
command += ['-filter_complex_threads','2','-filter_complex',';'.join(filters),'-map',f'[{last}]','-an','-c:v','libx264','-threads','4','-preset','slow','-crf','20','-g','3','-keyint_min','3','-sc_threshold','0','-pix_fmt','yuv420p','-movflags','+faststart','-y',str(output)]
print('Assembling five spaces', flush=True)
run(command)
info = probe(output)
stream = next(s for s in info['streams'] if s['codec_type'] == 'video')
frames = int(stream['nb_frames'])
expected = 5*CLIP_FRAMES-4*BLEND_FRAMES
if frames != expected or any(s['codec_type'] == 'audio' for s in info['streams']):
    raise ValueError(f'Unexpected film result: expected {expected} silent frames, got {frames}')
chapters = []
for i, (name, label) in enumerate(zip(ORDER, LABELS)):
    start = i * (CLIP_FRAMES-BLEND_FRAMES)
    frame = start+BLEND_FRAMES if i else 0
    chapters.append({'id':name,'label':label,'frame':frame,'fromFrame':start+BLEND_FRAMES//2 if i else 0})
    run(['ffmpeg','-v','error','-ss',str(frame/FPS),'-i',str(output),'-frames:v','1','-q:v','2','-y',f'public/images/spaces/{name}.jpg'])
manifest = {'fps':FPS,'frameCount':frames,'video':'/video/spaces/five-spaces.mp4','chapters':chapters}
Path('src/lib/cube-film.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(f'Finished: {frames} frames, {frames/FPS:.2f} seconds, {output.stat().st_size/1024/1024:.1f} MiB', flush=True)
