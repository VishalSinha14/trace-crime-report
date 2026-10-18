from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path('output') / 'trace_system_architecture.png'
OUT.parent.mkdir(exist_ok=True)
W, H = 2000, 1420
NAVY, BLUE, TEAL, PALE, WHITE, INK, LINE, MUTED = '#143D63', '#2177A8', '#147D83', '#EAF4FA', '#FFFFFF', '#17324A', '#7BAAC6', '#5A7387'
im = Image.new('RGB',(W,H),WHITE); d = ImageDraw.Draw(im)

def ft(size,bold=False):
    choices=['C:/Windows/Fonts/calibrib.ttf' if bold else 'C:/Windows/Fonts/calibri.ttf','C:/Windows/Fonts/arialbd.ttf' if bold else 'C:/Windows/Fonts/arial.ttf']
    for p in choices:
        if Path(p).exists(): return ImageFont.truetype(p,size)
    return ImageFont.load_default()

title, sub, head, body, note = ft(66,True),ft(31),ft(40,True),ft(28),ft(25)
def centered(y,text,font,fill):
    b=d.textbbox((0,0),text,font=font); d.text(((W-b[2]+b[0])/2,y),text,font=font,fill=fill)
def wrap(text,font,width):
    out=[]; cur=''
    for word in text.split():
        candidate=(cur+' '+word).strip()
        if d.textlength(candidate,font=font)<=width: cur=candidate
        else: out.append(cur); cur=word
    if cur:out.append(cur)
    return out
def box(x1,y1,x2,y2,label,items,fill,accent):
    d.rounded_rectangle((x1,y1,x2,y2),radius=25,fill=fill,outline=LINE,width=4)
    d.rounded_rectangle((x1,y1,x2,y1+70),radius=25,fill=accent)
    d.rectangle((x1,y1+45,x2,y1+70),fill=accent)
    centered_x=x1+(x2-x1)/2; bb=d.textbbox((0,0),label,font=head); d.text((centered_x-(bb[2]-bb[0])/2,y1+13),label,font=head,fill=WHITE)
    y=y1+96
    for item in items:
        lines=wrap(item,body,x2-x1-70)
        d.ellipse((x1+30,y+10,x1+42,y+22),fill=accent)
        for k,line in enumerate(lines): d.text((x1+60,y+k*31),line,font=body,fill=INK)
        y+=31*len(lines)+18
def down_arrow(cx,y1,y2,label=None):
    d.line((cx,y1,cx,y2),fill=BLUE,width=8)
    d.polygon([(cx-16,y2-1),(cx+16,y2-1),(cx,y2+20)],fill=BLUE)
    if label:
        bb=d.textbbox((0,0),label,font=note); d.rounded_rectangle((cx+24,(y1+y2)//2-20,cx+24+(bb[2]-bb[0])+24,(y1+y2)//2+20),radius=10,fill=WHITE,outline='#C9DDEA',width=2); d.text((cx+36,(y1+y2)//2-12),label,font=note,fill=MUTED)

d.rounded_rectangle((65,50,W-65,210),radius=30,fill=NAVY)
centered(78,'TRACE SYSTEM ARCHITECTURE',title,WHITE)
centered(156,'Three-tier incident-reporting platform with an independent AI inference service',sub,'#DDECF5')

box(260,280,1740,520,'PRESENTATION LAYER - REACT VITE TYPESCRIPT LEAFLET',['Interactive safety map and viewport-based incident display','Incident report modal, authentication, my reports, moderator queue, and admin center','Frontend communicates only with the backend through REST APIs and Socket.IO'],PALE,BLUE)
down_arrow(1000,530,600,'REST API and Socket.IO')
box(260,625,1740,885,'APPLICATION LAYER - NODE JS EXPRESS TYPESCRIPT',['Authentication, JWT, RBAC, request validation, rate limiting, and audit logging','Incident lifecycle, moderation, analytics, notifications, corroboration, and safe-route endpoints','Orchestrates database transactions and AI analysis calls'],WHITE,NAVY)

# branching connection
d.line((1000,895,1000,960),fill=TEAL,width=8); d.line((640,960,1360,960),fill=TEAL,width=8)
for cx,label in [(640,'PostgreSQL transactions'),(1360,'HTTP analysis request')]:
    d.line((cx,960,cx,1010),fill=TEAL,width=8); d.polygon([(cx-16,1009),(cx+16,1009),(cx,1030)],fill=TEAL)
    bb=d.textbbox((0,0),label,font=note); d.rounded_rectangle((cx-(bb[2]-bb[0])/2-16,914,cx+(bb[2]-bb[0])/2+16,951),radius=10,fill=WHITE,outline='#BEE0E1',width=2); d.text((cx-(bb[2]-bb[0])/2,920),label,font=note,fill=MUTED)

box(120,1050,940,1335,'DATA LAYER - POSTGRESQL PLUS POSTGIS',['Users, incidents, media metadata, notifications, audit logs, corroborations, hotspot snapshots','PostGIS geometry storage, spatial indexes, verified-public map queries, and transactions'],PALE,TEAL)
box(1060,1050,1880,1335,'AI INFERENCE LAYER - PYTHON FASTAPI',['Text cleaning, TF-IDF features, logistic-regression classification, severity estimation','Returns category, confidence, severity, model version, and processing information'],PALE,TEAL)
d.line((150,H-45,W-150,H-45),fill=LINE,width=2)
centered(H-30,'TRACE - Technology for Reporting Analysis and Crime Evaluation',ft(25,True),NAVY)
im.save(OUT,optimize=True)
print(OUT.resolve())
