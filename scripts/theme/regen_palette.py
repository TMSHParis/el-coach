import re,sys
sys.path.insert(0,'scripts/theme')
import themelib
from themelib import *
pal=open('src/app/theme-palette.css').read()
dark_block=pal.split('[data-theme="light"]')[0]
D=re.findall(r'--((?:c|ct)-[0-9a-f]{6}):\s*(#[0-9a-f]{6})',dark_block)
head=pal.split(':root,')[0]
g=open('src/app/globals.css').read()
theme=re.search(r'@theme\s*\{([^{}]*)\}',g).group(1)
tw=[]
for m in re.finditer(r'(--color-[a-z-]+):\s*(#[0-9a-fA-F]{3,6})',theme):
    name,hexv=m.group(1),to_hex(parse_hex(m.group(2)))
    text = name in ('--color-mute','--color-paper')
    tw.append((name, light_text(hexv) if text else light_of(hexv)))
dl=[];ll=[]
for n,h in D:
    dl.append(f'  --{n}: {h};')
    ll.append(f'  --{n}: {(light_text(h) if n.startswith("ct-") else light_of(h))};')
out=head+''':root,
[data-theme="dark"] {
  color-scheme: dark;
  --on-strong: #fff;
  --on-accent: #000;
'''+'\n'.join(dl)+'''
}

[data-theme="light"] {
  color-scheme: light;
  --on-strong: #fff;
  --on-accent: #fff;
'''+'\n'.join(ll)+'\n  /* Variables Tailwind (@theme de globals.css) et couleurs nommées des classes utilitaires */\n'+'\n'.join(f'  {n}: {v};' for n,v in tw)+'\n  --color-white: #111111;\n  --color-black: #f6f6f3;\n  --color-red-300: #b42318;\n  --color-red-400: #c0301f;\n  --color-red-500: #b42318;\n}\n'
open('src/app/theme-palette.css','w').write(out)
print(len(D),'couleurs')
