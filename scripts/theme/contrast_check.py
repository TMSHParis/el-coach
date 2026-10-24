import re,glob,sys
sys.path.insert(0,'scripts/theme')
from themelib import *
pal=open('src/app/theme-palette.css').read()
light=pal.split('[data-theme="light"]')[1]
L=dict(re.findall(r'--((?:c|ct)-[0-9a-f]{6}):\s*(#[0-9a-f]{6})',light))
def val(name):
    m=re.match(r'var\(--((?:c|ct)-[0-9a-f]{6})\)',name)
    return parse_hex(L[m.group(1)]) if m and m.group(1) in L else None
BG=parse_hex('#f6f6f3'); WHITE=(255,255,255)
pairs=[];alone=[]
for f in glob.glob('src/**/*.css',recursive=True):
    if 'palette' in f: continue
    s=open(f).read()
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}',s):
        sel,body=m.group(1).strip(),m.group(2)
        col=re.search(r'(?<![\w-])color:\s*(var\(--(?:c|ct)-[0-9a-f]{6}\))',body)
        bg=re.search(r'background(?:-color)?:\s*(var\(--(?:c|ct)-[0-9a-f]{6}\))',body)
        if not col: continue
        c=val(col.group(1))
        if c is None: continue
        if bg and val(bg.group(1)):
            r=contrast(c,val(bg.group(1)))
            if r<4.5: pairs.append((round(r,1),f.split('/')[-1],sel[:40],col.group(1)[6:-1],bg.group(1)[6:-1]))
        elif not bg:
            r=min(contrast(c,BG),contrast(c,WHITE))
            if r<4.5 and r>1.5: alone.append((round(r,1),f.split('/')[-1],sel[:40],col.group(1)[6:-1]))
print('paires',pairs)
print('seuls',alone)
# texte secondaire jamais plus clair que #5b6068 : toutes les variantes ct- et c- utilisées en color
print('plus clair que #5b6068 en texte:',[(k,v) for k,v in L.items() if k.startswith('ct-') and lum(parse_hex(v))>lum(parse_hex('#5b6068'))])
