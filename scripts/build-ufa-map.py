"""Offline regional map from Natural Earth GeoJSON; marker is Ufa city center."""
from pathlib import Path
import json,math
from html import escape
import argparse
from urllib.request import urlretrieve
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--data-dir',type=Path,default=Path('/tmp/fp-natural-earth'))
source=parser.parse_args().data_dir
source.mkdir(parents=True,exist_ok=True)
for name,dataset in [('rivers','ne_50m_rivers_lake_centerlines'),('regions','ne_50m_admin_1_states_provinces_lines')]:
 if not (source/f'{name}.geojson').is_file():
  urlretrieve(f'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/{dataset}.geojson',source/f'{name}.geojson')
W,H=740,420
west,east,south,north=46,66,52,59
merc=lambda lat:math.log(math.tan(math.pi/4+math.radians(lat)/2))
def xy(lon,lat):return ((lon-west)/(east-west)*W,(merc(north)-merc(lat))/(merc(north)-merc(south))*H)
def paths(name):
 result=[]
 for feature in json.loads((source/f'{name}.geojson').read_text())['features']:
  g=feature['geometry']
  if not g:continue
  lines=[g['coordinates']] if g['type']=='LineString' else g['coordinates'] if g['type']=='MultiLineString' else []
  for points in lines:
   if not points:continue
   xs=[p[0] for p in points];ys=[p[1] for p in points]
   if max(xs)<west or min(xs)>east or max(ys)<south or min(ys)>north:continue
   result.append('M '+' L '.join(f'{x:.1f} {y:.1f}' for x,y in [xy(*p[:2]) for p in points]))
 return ''.join(f'<path d="{d}"/>' for d in result)
svg=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="Уфа и соседние города"><rect width="740" height="420" fill="#e4e9df"/><defs><clipPath id="map-clip"><rect width="740" height="420"/></clipPath></defs><g clip-path="url(#map-clip)">']
svg.append('<g fill="none" stroke="#c4cebf" stroke-width="1.2">'+paths('regions')+'</g>')
svg.append('<g fill="none" stroke="#a2bbc2" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">'+paths('rivers')+'</g>')
for name,lon,lat in [('Казань',49.1064,55.7961),('Самара',50.1002,53.1959),('Пермь',56.2502,58.0105),('Екатеринбург',60.6057,56.8389),('Челябинск',61.4368,55.1644)]:
 x,y=xy(lon,lat);svg.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="2.4" fill="#779184"/><text x="{x+7:.1f}" y="{y+4:.1f}" font-family="Arial,sans-serif" font-size="12" fill="#677d70">{escape(name)}</text>')
x,y=xy(55.9721,54.7388)
svg.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="24" fill="#bca67533"/><circle cx="{x:.1f}" cy="{y:.1f}" r="12" fill="#bca67555"/><circle cx="{x:.1f}" cy="{y:.1f}" r="5.5" fill="#a88a4b" stroke="#f7f7f3" stroke-width="2"/><rect x="{x+18:.1f}" y="{y-17:.1f}" width="64" height="34" rx="5" fill="#f7f7f3"/><text x="{x+31:.1f}" y="{y+5:.1f}" font-family="Arial,sans-serif" font-size="16" font-weight="600" fill="#193247">Уфа</text>')
svg.append('</g></svg>')
(root/'public/evercoat-preview/assets/ufa-region.svg').write_text(''.join(svg))
print('Built offline Ufa map')
