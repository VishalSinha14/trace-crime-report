from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path('output') / 'trace_systematic_workflow.png'
OUT.parent.mkdir(exist_ok=True)
W, H = 1800, 1720
NAVY, BLUE, PALE, WHITE, INK, LINE = '#123B62', '#1F6E9C', '#EAF4FA', '#FFFFFF', '#17324A', '#7DA9C4'

img = Image.new('RGB', (W,H), WHITE)
d = ImageDraw.Draw(img)

def font(size, bold=False):
    candidates = ['C:/Windows/Fonts/calibrib.ttf' if bold else 'C:/Windows/Fonts/calibri.ttf', 'C:/Windows/Fonts/arialbd.ttf' if bold else 'C:/Windows/Fonts/arial.ttf']
    for p in candidates:
        if Path(p).exists(): return ImageFont.truetype(p,size)
    return ImageFont.load_default()

title = font(68, True); subtitle = font(30); body = font(37, True); small = font(28)
d.rounded_rectangle((70,55,W-70,220), radius=28, fill=NAVY)
def ctext(y, text, f, fill):
    b=d.textbbox((0,0),text,font=f); d.text(((W-(b[2]-b[0]))/2,y),text,font=f,fill=fill)
ctext(80,'TRACE SYSTEMATIC WORKFLOW',title,WHITE)
ctext(158,'Incident reporting, verification, public visibility and live intelligence',subtitle,'#DDECF5')

steps = [
    ('1','Citizen Report','Citizen submits a narrative, location, incident details, and optional evidence.'),
    ('2','Request Validation and Authorization','Backend validates inputs, authenticates the user, and applies role-based access control.'),
    ('3','AI Analysis of the Incident Narrative','FastAPI classifies the narrative and estimates preliminary severity with confidence values.'),
    ('4','Transactional Database Persistence','Incident geometry and analysis records are stored atomically in PostgreSQL with PostGIS.'),
    ('5','Moderator Review','Authorized moderators inspect the report, analysis, corroboration, and supporting context.'),
    ('6','Public Map Visibility According to Status','Only verified public reports are exposed to standard map users; sensitive information remains protected.'),
    ('7','Community Corroboration and Live Updates','Users can corroborate reports while notifications and Socket.IO events update relevant views.'),
]

def wrap(text, f, maxw):
    words=text.split(); lines=[]; cur=''
    for w in words:
        test=(cur+' '+w).strip()
        if d.textlength(test,font=f)<=maxw: cur=test
        else: lines.append(cur); cur=w
    if cur: lines.append(cur)
    return lines

top=275; boxh=130; gap=52; left=180; right=W-180
for idx,(num,head,detail) in enumerate(steps):
    y=top+idx*(boxh+gap)
    fill=PALE if idx%2==0 else WHITE
    d.rounded_rectangle((left,y,right,y+boxh),radius=22,fill=fill,outline=LINE,width=3)
    d.ellipse((left+24,y+26,left+78,y+80),fill=BLUE)
    nb=d.textbbox((0,0),num,font=font(29,True)); d.text((left+51-(nb[2]-nb[0])/2,y+31),num,font=font(29,True),fill=WHITE)
    d.text((left+108,y+20),head,font=body,fill=INK)
    lines=wrap(detail,small,right-left-150)
    for k,line in enumerate(lines[:2]): d.text((left+110,y+69+k*30),line,font=small,fill=INK)
    if idx < len(steps)-1:
        cx=W//2; ay=y+boxh+10; by=y+boxh+gap-10
        d.line((cx,ay,cx,by),fill=BLUE,width=7)
        d.polygon([(cx-14,by-2),(cx+14,by-2),(cx,by+18)],fill=BLUE)

d.line((140,H-88,W-140,H-88),fill=LINE,width=2)
ctext(H-68,'TRACE - Technology for Reporting Analysis and Crime Evaluation',font(25,True),NAVY)
img.save(OUT, optimize=True)
print(OUT.resolve())
