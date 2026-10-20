"""Encode full-screen hero media from originals, never from thumbnail previews."""
import concurrent.futures
import json
import re
import subprocess
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.tools' / 'hero-source'
ASSETS = ROOT / 'dist' / 'assets'

def probe(path):
    return json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,profile,level,bit_rate,r_frame_rate:format=duration,size', '-of', 'json', str(path)]))

def encode(item):
    name, url = item
    original = CACHE / (name + '.mp4')
    if not original.exists():
        request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Referer': 'https://openart.ai/', 'Range': 'bytes=0-'})
        pending = original.with_suffix('.download')
        with urllib.request.urlopen(request, timeout=120) as response, pending.open('wb') as output:
            expected = int(response.headers.get('Content-Length', 0))
            received = 0
            while chunk := response.read(1024 * 1024):
                output.write(chunk)
                received += len(chunk)
            if expected and received != expected:
                raise RuntimeError('Incomplete source download: ' + name)
        probe(pending)
        pending.replace(original)
    before = probe(original)
    target = ASSETS / 'hero-streams' / (name + '.mp4')
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-i', str(original), '-map', '0:v:0', '-an', '-vf', "scale='min(1280,iw)':-2", '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-profile:v', 'main', '-level:v', '3.1', '-maxrate', '3000k', '-bufsize', '6000k', '-pix_fmt', 'yuv420p', '-g', '48', '-keyint_min', '48', '-sc_threshold', '0', '-threads', '2', '-movflags', '+faststart', str(target)], check=True)
    after = probe(target)
    if after['streams'][0]['width'] < min(1280, before['streams'][0]['width']):
        raise RuntimeError('Unexpected hero resolution loss: ' + name)
    if abs(float(after['format']['duration']) - float(before['format']['duration'])) > .15:
        raise RuntimeError('Encoded duration differs from original: ' + name)
    result = {'id': name, 'original': before, 'delivered': after}
    print(json.dumps(result), flush=True)
    return result

if __name__ == '__main__':
    CACHE.mkdir(parents=True, exist_ok=True)
    items = re.findall(r"\{id:'([^']+)'[^\n]*?videoSrc:'([^']+)'", (ROOT / 'dist' / 'app.js').read_text(encoding='utf-8'))[:5]
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(encode, items))
    (ROOT / 'docs' / 'hero-hd-media.json').write_text(json.dumps(results, indent=2) + '\n', encoding='utf-8')
