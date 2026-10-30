"""Prepare the user's full-HD film for the Evercoat review page.

Run with the MP4 extracted from the four supplied RAR volumes. Stop frames were
visually selected from this specific 12-second source; don't reuse for a new film.
"""
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
video = Path(sys.argv[1])
out = root / 'public/evercoat-preview/media'
out.mkdir(parents=True, exist_ok=True)
probe = json.loads(subprocess.check_output([
    'ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_streams',
    '-show_format', '-of', 'json', str(video)
]))
stream = probe['streams'][0]
assert (stream['width'], stream['height'], stream['r_frame_rate'], stream['nb_frames']) == (1920, 1080, '30/1', '360'), 'Different source: select stop frames again'
frames = [0, 75, 126, 186, 279]

def ff(args):
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *args], check=True)

for i, frame in enumerate(frames):
    ff(['-i', str(video), '-vf', f'select=eq(n\\,{frame})', '-frames:v', '1',
        '-c:v', 'libwebp', '-lossless', '1', str(out / f'room-{i}.webp')])
    # Existing supplied renders stay in the lower page and reduced-motion mode.
    shutil.copy2(root / f'public/flight-preview/media/original-{i}.webp', out / f'original-{i}.webp')

for i, (start, end) in enumerate(zip(frames, frames[1:])):
    for direction in ['forward', 'reverse']:
        vf = f'trim=start_frame={start}:end_frame={end + 1},setpts=N/(30*TB)'
        if direction == 'reverse':
            vf += ',reverse,setpts=N/(30*TB)'
        # Explicit CFR prevents the source's zero packet durations from causing
        # an MP4 edit list to discard the last encoded arrival frame.
        ff(['-i', str(video), '-vf', vf, '-r', '30', '-fps_mode', 'cfr', '-an', '-c:v', 'libx264', '-preset', 'medium',
            '-threads', '4', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
            str(out / f'{direction}-{i}.mp4')])
        print(f'Encoded {direction}-{i}', flush=True)

(out / 'manifest.json').write_text(json.dumps({
    'source': video.name,
    'source_sha256': hashlib.sha256(video.read_bytes()).hexdigest(),
    'source_bytes': video.stat().st_size,
    'width': 1920, 'height': 1080, 'fps': 30,
    'source_duration': 12, 'stops_frames': frames,
    'stops_seconds': [n / 30 for n in frames],
    'playback_rate': 3,
    'flight_seconds': [(b - a + 1) / 30 / 3 for a, b in zip(frames, frames[1:])],
    'order': ['Лобби', 'Ресторан', 'Кафе', 'Офис', 'Номер отеля'],
    'silent': True,
    'posters': 'Lossless exact source stop frames; original renders retained for reduced motion and lower sections.'
}, ensure_ascii=False, indent=2))
print('Prepared full-HD media', flush=True)
