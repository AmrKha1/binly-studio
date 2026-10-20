## Text (`kit/text`) — p = reveal progress 0→1
- `Headline {x,y,text,p,size=72,color,anchor='middle',italic,weight=600,mode:'rise'|'words'|'type'|'mask',accent?:{word:colour},font:'serif'|'sans',out?}`
  e.g. `<Headline x={960} y={220} text="A hot bath was medicine." mode="words" accent={{medicine: C.oxblood}} p={ramp(t,T.a,T.a+1)}/>`
- `Kicker {x,y,text,p=1,size=36,color=inkMute,anchor}` tracked caps label (never below 36 — phone floor).
- `Para {x,y,w,h=600,text,p,size=48,color,align,font,weight,italic,lineHeight}` wrapped paragraph (keep short).
- `Tag {x,y,text,kind:Sem,p,size=43 (caption text renders ×1.12 = 48; floor),to?:{x,y},anchor:'left'|'right'|'center',look:'caption'|'pill'}` certainty label.
  Default look 'caption' = museum caption (colour stripe + italic serif on a paper slip); 'pill' = old solid chip (legacy — don't use).
- Red-pen verdict (Binly's ONLY verdict style; for the climax use it at hero size — full-screen claim, big handwritten note): in templates `ClaimShot … stamp="Wrong"` (verdict 'pen' is default);
  in custom scenes `RichText … strike={ramp(t,T.x,T.x+0.5)}` crosses the words out exactly + a `HandNote` verdict;
  `RedPen {lines:[{x,y,w}],p,note,noteX,noteY,strike}` for SVG text whose line widths you know.
- `HandNote {x,y,text,p,size=50,color=oxblood,rot=-3,anchor,weight}` handwritten note (Caveat, `FONT_HAND`), written on
  letter by letter. RARE accent: a scribbled note beside a detail on an image/document (often with `Circled`/an arrow) —
  never titles, labels or body text; at most one or two per chapter.
- `Stat {x,y,value:'0.061',unit?:'%',label?,p,count=true,size=180,color,anchor}` exact number, counts up, lands exactly.
- `Underline {x,y,w,p,color,thick,wobble}` · `Highlight {x,y,w,h,p,color,opacity}` (draw BEFORE text) · `Circled {x,y,rx,ry?,p,color,thick,rot}`
- `NameTag {x,y,name,sub?,p,anchor:'left'|'right',color,dark}` real person / source label.
- `TitleCard {x,y,kicker?,title,p,out?,color,kickerColor,size=96}` chapter/section title.
- `textW(text,size,font,weight)` approximate width for layout.

## Cards & paper objects (`kit/cards`) — origin centre, p = entrance (rise+settle)
- `Card {x,y,w,h,p,rot,fill,stroke,radius,shadow,children}` children in card-local coords (0,0 top-left).
- `DocumentPage {x,y,s,p,rot,title?,subtitle?,lines=11,text?,highlight?:{line,p,color},seal,sealColor,signature,style:'parchment'|'modern'|'journal',write}` ≈560×740.
- `Polaroid {id,x,y,w=460,p,rot,imageBg,caption,children}` children inside square window (centre 0,0).
- `StudyCard {x,y,p,rot,title,who?,year?,finding?,n?,tag?:{text,kind},accent}` 760×460 research card.
- `Note {x,y,text,p,rot,color,w=340,h=300,size=42}` sticky note · `OpenBook {x,y,s,p,rot,cover,lines,leftTitle,rightTitle}` ≈640×420.
- `Screen {id,x,y,w=760,h=440,p,frame:'monitor'|'tablet'|'phone',bg,children}` children in screen coords (top-left 0,0).
- `ScreenText {x,y,text,p,t,size,color,cursor}` typewriter line for screens.
- `Bubble {x,y,w,h,text?,to?:{x,y},p,kind:'speech'|'thought'|'inner',fill,color,size,type}` — `inner` = dashed plum (silent inner voice).

## Diagrams (`kit/diagrams`) — p = draw-on
- `Arrow {from,to,p,bend=0,color,width=6,head=22,dashed,double,shorten}` (curved if bend≠0).
- `Node {x,y,text,p,w?,h=110,kind:Sem,filled,size,icon?}` labelled box.
- `FlowChain {x,y,items[],p,gap=140,dir:'row'|'column',kinds?:Sem[],size,nodeW}` sequential cause→effect.
- `Cycle {x,y,r,items[],p,spin,kinds,size}` · `Venn {x,y,r,labels[],overlap?,p,kinds,spread}`
- `Bracket {a,b,p,depth,label,color,size}` · `Callout {target,label,text,p,kind,size,anchor}` elbow leader label.
- `DashedOutline {d,p,color=theory,width,fill}` (= absent/inferred) · `CrossOut {x,y,size,p}` · `CheckMark {x,y,size,p}` · `QuestionMark {x,y,size,p,color,t}`

## Effects (`kit/fx`)
- `LightPool {x,y,r,color=lamp,strength,sy}` flat light · `LightShaft {x1,x2,y,dx,len,spread,color,strength}` window beam
- `GroundShadow {x,y,w,h?,o}` · `Vignette {strength,color}` · `Pulse {x,y,r,p,color}` one ring · `Beacon {x,y,r,t,period}` repeating
- `DrawPath {d,p,stroke,width,fill,dash,cap,o}` draw any path on · `Pop {x,y,p,from,r,children}` scale-in · `SlideIn {p,dx,dy,children}`
- `WipeReveal {id,x,y,w,h,p,dir,children}` · `Particles {t,x,y,w,h,n,seed,size,color,opacity,vx,vy,wobble,shape:'dot'|'ring'|'blob',twinkle}`
- `Steam {t,x,y,w,h,n,color,strength}` rising wisps · `Flame {t,x,y,s,seed,glow}` candle/torch · `Ripples {t,x,y,r,n,period,color,sy}`

## People (`kit/people`) — origin = feet, ≈540 px tall at s=1, drawn facing right (`facing=-1` mirrors)
- `Person {x,y,s,facing,t, pose?, arms?:{front:[shoulderDeg,elbowDeg],back:[…]}, walk?:phase(cycles), stride, sit:0..1, lie:0..1, lean, look:-1..1, tilt,
  expression:'neutral'|'smile'|'happy'|'worried'|'surprised'|'thinking'|'sad'|'angry'|'determined', talk:0..1, blink?, skin:0..4,
  hair:'short'|'long'|'bun'|'curly'|'bald'|'tonsure'|'side'|'ponytail'|'none', hairColor, beard:'none'|'short'|'full'|'moustache', glasses,
  outfit:'tunic'|'robe'|'dress'|'coat'|'labcoat'|'suit'|'casual'|'royal'|'scrubs'|'nightwear'|'peasant'|'merchant'|'nun'|'soldier'|'worker', top,bottom,accent,
  hat:'none'|'coif'|'hood'|'tophat'|'crown'|'cap'|'brimmed'|'scholar'|'veil'|'beret'|'surgical'|'helmet'|'hardhat'|'wimple', hatColor, shoes,
  age:'child'|'adult'|'elder', build:'slim'|'average'|'heavy', prop?:'book'|'scroll'|'cup'|'basket'|'tool'|'lantern'|'phone', propColor, silhouette?:colour, opacity, seed}`
  poses: idle point wave(animated) think shrug present hold write cheer worried armsOut reach handsBack facepalm cross|armsCrossed carry kneel handsOnHips awe.
  nun/soldier/worker default to hat wimple/helmet/hardhat. child = 0.62× size, bigger head; elder = grey hair + stoop. prop sits in the front hand.
  Lying: `lie={1}` → body flat along the floor ≈62·s above y, head toward the back (facing -1 puts the head on the right).
  Walk: `walk={t*0.9}` + move x yourself (≈ 150 px/s at s=1). Talk: `talk={Math.abs(Math.sin(t*9))}` while speaking.
  Sitting: `sit={1}` → hips at height ≈118·s above the feet, ≈104·s behind them (place the seat there).
  Emote: `emote:'idea'|'question'|'exclaim'|'sweat'|'anger'|'love'|'sleep'|'storm'|'sparkle'`, `emoteP:0..1` pop-in (default 1) → animated icon by the head (follows facing/scale/sit/lie, idle life from t).
- `Emote {x,y,kind,s=1,t,p=1,color?}` standalone emotion icon, origin = centre, ≈100 px at s=1.
- `personHands(props)` → {front,back,head} world positions (attach held objects).
- `Crowd {x,y,w,n=9,rows=2,t,seed,s=0.6,era:'medieval'|'19thc'|'modern',silhouette?,facing:1|-1|'mixed',expression, variety?:bool (mix children/elders + builds)}`
