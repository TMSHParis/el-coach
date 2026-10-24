import re, colorsys

def parse_hex(h):
    h = h.lstrip('#').lower()
    if len(h) == 3: h = ''.join(c*2 for c in h)
    return tuple(int(h[i:i+2],16) for i in (0,2,4))

def to_hex(rgb):
    return '#%02x%02x%02x' % tuple(max(0,min(255,round(v))) for v in rgb)

def hsl(rgb):
    r,g,b=[v/255 for v in rgb]
    h,l,s=colorsys.rgb_to_hls(r,g,b)
    return h*360,s,l

def from_hsl(h,s,l):
    r,g,b=colorsys.hls_to_rgb((h%360)/360,l,s)
    return (r*255,g*255,b*255)

def lum(rgb):
    def f(c):
        c/=255
        return c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
    r,g,b=rgb
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)

def contrast(a,b):
    la,lb=lum(a),lum(b)
    if la<lb: la,lb=lb,la
    return (la+0.05)/(lb+0.05)

# dark L -> light L (neutres)
PTS=[(0.0,0.98),(0.03,0.965),(0.04,0.985),(0.06,1.0),(0.09,0.99),(0.10,0.965),(0.12,0.915),(0.14,0.90),(0.16,0.88),(0.20,0.84),(0.25,0.80),(0.33,0.72),(0.38,0.66),
     (0.40,0.36),(0.55,0.34),(0.70,0.30),(0.80,0.22),(0.88,0.14),(0.93,0.10),(1.0,0.067)]

def interp(L):
    for (a,fa),(b,fb) in zip(PTS,PTS[1:]):
        if a<=L<=b:
            t=(L-a)/(b-a) if b>a else 0
            return fa+(fb-fa)*t
    return PTS[-1][1]

PAGE_BG_LIGHT=(228,228,224)  # fond le plus sombre sous un texte coloré (teinte claire ~#e4e4e0)
SPECIAL={'#080808':'#f6f6f3'}

def light_of(hexv):
    if hexv in SPECIAL: return SPECIAL[hexv]
    rgb=parse_hex(hexv)
    h,s,l=hsl(rgb)
    if s<0.25:
        nl=interp(l)
        return to_hex(from_hsl(h,s,nl))
    if l<=0.22:   # teinte sombre -> teinte claire
        nl=min(0.96,max(0.84,1-l))
        return to_hex(from_hsl(h,min(s,0.55),nl))
    if l<0.38:    # bordure / aplat sombre saturé
        return to_hex(from_hsl(h,min(s,0.5),0.74))
    cap=0.33 if 40<=h<=115 else 0.40
    nl=min(l,cap)
    out=from_hsl(h,s,nl)
    # contraste suffisant sur fond clair (texte)
    while contrast(out,PAGE_BG_LIGHT)<4.7 and nl>0.12:
        nl-=0.01
        out=from_hsl(h,s,nl)
    return to_hex(out)

HEX=re.compile(r'(?<![\w&%])#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b(?![0-9a-fA-F])')
RGBA=re.compile(r'rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+)\s*)?\)')

def norm(h):
    return '#'+''.join(parse_hex(h) and '%02x'%v for v in parse_hex(h))

def var_for(hexv): return 'var(--c-%s)'%hexv.lstrip('#')

def is_sat_mid(hexv):
    h,s,l=hsl(parse_hex(hexv))
    return s>=0.35 and 0.2<=l<=0.8

def is_light_neutral(hexv):
    h,s,l=hsl(parse_hex(hexv))
    return s<0.25 and l>=0.85

# ---- usage-aware light mapping -------------------------------------------------
TEXT_PROPS={'color','fill','-webkit-text-fill-color','caret-color','text-decoration-color'}
TEXT_VARS={'w','t','t2','m','white','dim','text','muted'}
TEXT_PTS=[(0.0,0.98),(0.25,0.36),(0.55,0.34),(0.70,0.30),(0.80,0.22),(0.88,0.14),(0.93,0.10),(1.0,0.067)]

def interp_pts(pts,L):
    for (a,fa),(b,fb) in zip(pts,pts[1:]):
        if a<=L<=b:
            t=(L-a)/(b-a) if b>a else 0
            return fa+(fb-fa)*t
    return pts[-1][1]

def light_text(hexv):
    rgb=parse_hex(hexv); h,s,l=hsl(rgb)
    if s<0.25 and l>=0.25:
        return to_hex(from_hsl(h,s,interp_pts(TEXT_PTS,l)))
    return light_of(hexv)

PALETTE_DARK={}   # name -> dark hex
PALETTE_LIGHT={}  # name -> light hex

def ref(hexv,text):
    hexv=to_hex(parse_hex(hexv))
    if hexv=='#000000': return '#000'
    base=hexv.lstrip('#')
    if text:
        lt=light_text(hexv); ld=light_of(hexv)
        if lt!=ld:
            n='ct-'+base; PALETTE_DARK[n]=hexv; PALETTE_LIGHT[n]=lt
            return 'var(--%s)'%n
    n='c-'+base; PALETTE_DARK[n]=hexv; PALETTE_LIGHT[n]=light_of(hexv)
    return 'var(--%s)'%n

def conv_value(value,text,sat_bg=False,prop=''):
    def hexrep(m):
        raw='#'+m.group(1)
        hv=to_hex(parse_hex(raw))
        if sat_bg and prop=='color' and is_light_neutral(hv):
            return 'var(--on-strong)'
        return ref(hv,text)
    def rgbrep(m):
        r,g,b=int(m.group(1)),int(m.group(2)),int(m.group(3))
        a=float(m.group(4)) if m.group(4) is not None else 1.0
        if (r,g,b)==(0,0,0):
            return m.group(0)
        v=ref(to_hex((r,g,b)),text)
        pct=round(a*100,1)
        pct=('%g'%pct)
        if a>=0.999: return v
        return 'color-mix(in srgb, %s %s%%, transparent)'%(v,pct)
    v=RGBA.sub(rgbrep,value)
    # ne pas retoucher les # déjà dans var(--c-...) : ils n'ont pas de '#'
    v=HEX.sub(hexrep,v)
    return v

BLOCK=re.compile(r'\{([^{}]*)\}')
DECL=re.compile(r'(?P<pre>(?:^|;)?\s*)(?P<prop>-{0,2}[a-zA-Z][\w-]*)\s*:\s*(?P<val>[^;{}]+)')

def process_block(body):
    # contexte : fond saturé ?
    sat=False
    for m in DECL.finditer(body):
        if m.group('prop').startswith('background'):
            for hm in HEX.finditer(m.group('val')):
                if is_sat_mid(to_hex(parse_hex('#'+hm.group(1)))): sat=True
            for rm in RGBA.finditer(m.group('val')):
                pass
    def declrep(m):
        prop=m.group('prop'); val=m.group('val')
        text = prop in TEXT_PROPS or (prop.startswith('--') and prop[2:] in TEXT_VARS)
        nv=conv_value(val,text,sat,prop)
        return m.group('pre')+prop+': '+nv.strip() if nv!=val else m.group(0)
    return DECL.sub(declrep,body)

def process_css(css):
    urls=[]
    def keep(m):
        urls.append(m.group(0)); return '@@URL%d@@'%(len(urls)-1)
    css=re.sub(r'url\([^)]*\)',keep,css)
    # blocs @theme laissés tels quels
    parts=re.split(r'(@theme\s*\{[^{}]*\})',css)
    out=[]
    for p in parts:
        if p.startswith('@theme'): out.append(p); continue
        out.append(BLOCK.sub(lambda m:'{'+process_block(m.group(1))+'}',p))
    css=''.join(out)
    css=re.sub(r'@@URL(\d+)@@',lambda m:urls[int(m.group(1))],css)
    return css
