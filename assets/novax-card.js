/*
 * NovaX™ Builder Card renderer (v16 design).
 * Draws the card on a canvas so the on-screen card and the shared PNG are identical.
 * Layers: base1 (atmosphere + horizon) → live score ring (animated) → base2 (type, glass, edge light).
 * Every card is unique: the star-dust field is seeded from the person's name + score.
 */
(function(){
"use strict";
const W=1080,H=1512,R=76;
const FONT='Inter,-apple-system,"Segoe UI",Arial,sans-serif';
const RING={cx:540,cy:566,r:186};
const RIM_Y=1068;               // crest of the horizon
const PLANET_R=1420;

/* Palettes stay inside the NovaX family (cyan → blue → violet → pink) and shift per archetype. */
const PAL={
 Visionary:{a:"#2fd4ff",b:"#4f7dff",c:"#a65cff",warm:"#ffb48a"},
 Hustler:{a:"#43b4ff",b:"#9a5cff",c:"#ff5fa8",warm:"#ffb06b"},
 Creator:{a:"#5f8dff",b:"#b05cff",c:"#ff5fa8",warm:"#ffc0a0"},
 Network:{a:"#26e0ff",b:"#3f86ff",c:"#7f6cff",warm:"#ffd0a8"},
 Future:{a:"#8cc8ff",b:"#5f6cff",c:"#c6a2ff",warm:"#ffc9b0"}
};
const MARKERS={"Vision":"01-01-Big-picture-thinking","Opportunity":"01-02-Opportunity-recognition","Ambition":"01-03-Ambition","Execution":"02-01-Execution","Ownership":"02-02-Ownership","Momentum":"02-03-Momentum","Create":"03-01-Creation","Solve":"03-02-Problem-solving","Build":"03-03-Making-ideas-real","Relationships":"04-01-Relationships","Connection":"04-02-Connection","Collaboration":"04-03-Collaboration","Curiosity":"05-01-Curiosity","Potential":"05-02-Potential","Discovery":"05-03-Self-discovery"};

/* ---------- helpers ---------- */
const hex=h=>{h=h.replace("#","");return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]};
const rgba=(h,a)=>{const[r,g,b]=hex(h);return`rgba(${r},${g},${b},${a})`};
const mix=(h1,h2,t)=>{const A=hex(h1),B=hex(h2);return`rgb(${A.map((v,i)=>Math.round(v+(B[i]-v)*t)).join(",")})`};
const lighten=(h,t)=>mix(h,"#ffffff",t);
function rng(seed){let h=1779033703^seed.length;for(let i=0;i<seed.length;i++){h=Math.imul(h^seed.charCodeAt(i),3432918353);h=h<<13|h>>>19}let a=h>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function rr(x,X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()}
function glow(x,cx,cy,r,col,a){const g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,rgba(col,a));g.addColorStop(.5,rgba(col,a*.34));g.addColorStop(1,rgba(col,0));x.fillStyle=g;x.fillRect(cx-r,cy-r,2*r,2*r)}
function spaced(x,text,cx,cy,px){
 if("letterSpacing" in x){x.letterSpacing=px+"px";x.fillText(text,cx+px/2,cy);x.letterSpacing="0px";return}
 const ch=[...text],ws=ch.map(c=>x.measureText(c).width),tot=ws.reduce((a,b)=>a+b,0)+px*(ch.length-1);let cur=cx-tot/2;const al=x.textAlign;x.textAlign="left";ch.forEach((c,i)=>{x.fillText(c,cur,cy);cur+=ws[i]+px});x.textAlign=al}
function measureSpaced(x,text,px){return"letterSpacing" in x?(x.letterSpacing=px+"px",(()=>{const w=x.measureText(text).width;x.letterSpacing="0px";return w})()):x.measureText(text).width+px*(text.length-1)}
function wrap(x,text,maxW){const words=text.split(/\s+/);let line="",out=[];for(const w of words){const t=line?line+" "+w:w;if(x.measureText(t).width>maxW&&line){out.push(line);line=w}else line=t}if(line)out.push(line);return out}
const ease=t=>1-Math.pow(1-t,3);
const loadImage=src=>new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>rej(new Error("card asset: "+src));im.src=src});
const mk=(w,h)=>{const c=document.createElement("canvas");c.width=w;c.height=h;return c};

/* ---------- layer 1: atmosphere, ribbons, dust, horizon ---------- */
function paintBase1(x,P,rand){
 let g=x.createLinearGradient(0,0,W*.35,H);g.addColorStop(0,"#061029");g.addColorStop(.5,"#030818");g.addColorStop(1,"#020510");x.fillStyle=g;x.fillRect(0,0,W,H);
 x.save();x.globalCompositeOperation="lighter";
 glow(x,W*1.0,H*.04,720,P.b,.36);glow(x,-80,H*.30,600,P.c,.20);glow(x,W*.5,RING.cy,520,P.a,.09);glow(x,W*1.1,H*.52,460,P.c,.12);
 x.restore();
 /* silk ribbons, top-right — a quieter nod to the original card's flowing lines */
 x.save();x.globalCompositeOperation="lighter";x.lineCap="round";
 const N=54;
 for(let pass=0;pass<2;pass++){
  for(let i=0;i<N;i++){
   const t=i/(N-1),k=Math.sin(t*Math.PI);
   const sx=W*.50+t*190,sy=-30;
   x.beginPath();x.moveTo(sx,sy);
   x.bezierCurveTo(W*.80+t*70,H*.07+t*30,W*.62+t*250,H*.24+t*40,W+60,H*.31+t*230);
   x.lineWidth=pass?1.6:9;
   const col=t<.5?mix(P.a,P.b,t*2):mix(P.b,P.c,(t-.5)*2);
   x.strokeStyle=col.replace("rgb(","rgba(").replace(")",`,${(pass?.07+.42*k:.02+.06*k).toFixed(3)})`);
   x.stroke();
  }
 }
 x.restore();
 /* seeded star dust — unique per person */
 for(let i=0;i<130;i++){
  const px=rand()*W,py=rand()*(RIM_Y-30),big=rand()>.93,r=big?1.5+rand()*1.2:.5+rand()*.9,a=(.18+rand()*.6)*(1-py/(RIM_Y+200)*.5);
  x.fillStyle=`rgba(${rand()>.6?"200,225,255":"255,255,255"},${a.toFixed(2)})`;x.beginPath();x.arc(px,py,r,0,7);x.fill();
  if(big){x.save();x.strokeStyle=`rgba(190,220,255,${(a*.5).toFixed(2)})`;x.lineWidth=1;x.beginPath();x.moveTo(px-7,py);x.lineTo(px+7,py);x.moveTo(px,py-7);x.lineTo(px,py+7);x.stroke();x.restore()}
 }
 /* atmosphere above the horizon */
 x.save();x.globalCompositeOperation="lighter";
 x.translate(W/2,RIM_Y);x.scale(1,.40);glow(x,0,0,1000,P.a,.42);glow(x,0,0,680,P.c,.34);x.restore();
 x.save();x.globalCompositeOperation="lighter";x.translate(W/2,RIM_Y+4);x.scale(1,.2);glow(x,0,0,430,P.warm,.5);x.restore();
 /* portal ripples echoing the X ring on the results hero */
 [[286,.16],[360,.09],[438,.05]].forEach(([rad,a],i)=>{const rg2=x.createLinearGradient(W/2-rad,RING.cy-rad,W/2+rad,RING.cy+rad);rg2.addColorStop(0,rgba(P.a,a));rg2.addColorStop(.5,rgba(P.b,a*.3));rg2.addColorStop(1,rgba(P.c,a));x.strokeStyle=rg2;x.lineWidth=1.6;x.beginPath();x.arc(W/2,RING.cy,rad,0,7);x.stroke()});
 /* planet */
 const cy=RIM_Y+PLANET_R;
 x.save();x.beginPath();x.arc(W/2,cy,PLANET_R,0,Math.PI*2);x.clip();
 g=x.createLinearGradient(0,RIM_Y,0,H);g.addColorStop(0,"#0a1a3e");g.addColorStop(.35,"#050f28");g.addColorStop(1,"#02050f");x.fillStyle=g;x.fillRect(0,RIM_Y-10,W,H);
 x.lineWidth=1.2;
 for(let k=1;k<26;k++){const a=.30*Math.pow(1-k/26,1.3);x.strokeStyle=rgba(k%2?P.a:P.c,a);x.beginPath();x.arc(W/2,cy,PLANET_R-k*13,0,Math.PI*2);x.stroke()}
 x.restore();
 /* rim light */
 const rg=x.createLinearGradient(0,0,W,0);rg.addColorStop(0,rgba(P.a,0));rg.addColorStop(.18,rgba(P.a,.9));rg.addColorStop(.5,"rgba(255,255,255,1)");rg.addColorStop(.82,rgba(P.c,.9));rg.addColorStop(1,rgba(P.c,0));
 x.save();x.beginPath();x.rect(0,0,W,H);x.clip();
 x.strokeStyle=rg;x.lineCap="round";
 x.shadowColor=rgba(P.a,.95);x.shadowBlur=46;x.lineWidth=5;x.beginPath();x.arc(W/2,cy,PLANET_R,0,Math.PI*2);x.stroke();
 x.shadowBlur=0;x.lineWidth=2.4;x.beginPath();x.arc(W/2,cy,PLANET_R,0,Math.PI*2);x.stroke();
 x.restore();
}

/* ---------- live layer: the Builder Score ring ---------- */
function paintRing(x,P,score,t){
 const{cx,cy,r}=RING,e=ease(t),sc=Math.max(0,Math.min(100,score))/100,prog=sc*e;
 /* glass disc */
 x.save();
 x.shadowColor=rgba(P.a,.38);x.shadowBlur=70;
 let g=x.createRadialGradient(cx,cy-40,10,cx,cy,r+30);g.addColorStop(0,"rgba(10,26,60,.92)");g.addColorStop(1,"rgba(3,9,24,.94)");
 x.fillStyle=g;x.beginPath();x.arc(cx,cy,r+20,0,7);x.fill();x.restore();
 /* thin inner ring */
 x.strokeStyle="rgba(150,190,255,.14)";x.lineWidth=1.5;x.beginPath();x.arc(cx,cy,r-34,0,7);x.stroke();
 /* dial ticks: 100 of them, one for every point of score */
 for(let i=0;i<100;i++){
  const ang=-Math.PI/2+i/100*Math.PI*2,major=i%10===0,r1=r+34,r2=r1+(major?20:11),lit=i<score*e;
  x.strokeStyle=lit?(i/100<.5?mix(P.a,P.b,i/50):mix(P.b,P.c,(i-50)/50)).replace("rgb(","rgba(").replace(")",`,${major?.95:.7})`):`rgba(170,200,255,${major?.26:.12})`;
  x.lineWidth=major?3.4:2.2;x.lineCap="round";x.beginPath();x.moveTo(cx+Math.cos(ang)*r1,cy+Math.sin(ang)*r1);x.lineTo(cx+Math.cos(ang)*r2,cy+Math.sin(ang)*r2);x.stroke();
 }
 /* track + progress arc */
 x.lineCap="round";x.lineWidth=18;x.strokeStyle="rgba(255,255,255,.075)";x.beginPath();x.arc(cx,cy,r,0,7);x.stroke();
 if(prog>.002){
  const a0=-Math.PI/2,a1=a0+prog*Math.PI*2;let st;
  if(x.createConicGradient){st=x.createConicGradient(a0,cx,cy);st.addColorStop(0,P.a);st.addColorStop(Math.max(.02,prog*.5),P.b);st.addColorStop(Math.max(.04,prog),P.c);st.addColorStop(1,P.c)}
  else{st=x.createLinearGradient(cx-r,cy-r,cx+r,cy+r);st.addColorStop(0,P.a);st.addColorStop(.55,P.b);st.addColorStop(1,P.c)}
  x.save();x.strokeStyle=st;x.shadowColor=rgba(P.b,.95);x.shadowBlur=42;x.lineWidth=18;x.beginPath();x.arc(cx,cy,r,a0,a1);x.stroke();
  x.shadowBlur=0;x.lineWidth=18;x.beginPath();x.arc(cx,cy,r,a0,a1);x.stroke();
  x.strokeStyle="rgba(255,255,255,.28)";x.lineWidth=3;x.beginPath();x.arc(cx,cy,r-4,a0,a1);x.stroke();x.restore();
  /* bright head of the arc */
  const hx=cx+Math.cos(a1)*r,hy=cy+Math.sin(a1)*r;
  x.save();x.shadowColor="#fff";x.shadowBlur=28;x.fillStyle="#fff";x.beginPath();x.arc(hx,hy,7.5,0,7);x.fill();x.restore();
 }
 /* number */
 const val=Math.round(score*e);let fs=186;x.font=`800 ${fs}px ${FONT}`;while(x.measureText(String(score)).width>232&&fs>110){fs-=6;x.font=`800 ${fs}px ${FONT}`}
 x.textAlign="center";x.textBaseline="middle";
 x.save();x.shadowColor=rgba(P.a,.55);x.shadowBlur=36;
 g=x.createLinearGradient(0,cy-fs/2,0,cy+fs/2);g.addColorStop(0,"#ffffff");g.addColorStop(1,"#bcd6ff");x.fillStyle=g;
 if("letterSpacing" in x)x.letterSpacing="-4px";x.fillText(String(val),cx-2,cy-14);if("letterSpacing" in x)x.letterSpacing="0px";x.restore();
 x.fillStyle="#b9cde8";x.font=`700 22px ${FONT}`;spaced(x,"BUILDER SCORE™",cx,cy+104,4.5);
}

/* ---------- layer 2: logo, medallion, type, glass, edge light ---------- */
function paintBase2(x,P,o,A,rand){
 x.textAlign="center";x.textBaseline="middle";
 /* logo */
 const lw=280,lh=lw*A.logo.height/A.logo.width;x.drawImage(A.logo,(W-lw)/2,82,lw,lh);
 /* medallion crowning the ring */
 const mx=RING.cx,my=RING.cy-RING.r,ms=176;
 x.save();x.globalCompositeOperation="lighter";glow(x,mx,my,170,P.b,.5);x.restore();
 x.fillStyle="#040b1f";x.beginPath();x.arc(mx,my,ms/2-4,0,7);x.fill();
 x.drawImage(A.icon,mx-ms/2,my-ms/2,ms,ms);
 /* title */
 const title=(o.title+"™").toUpperCase();x.font=`800 31px ${FONT}`;
 const tw=measureSpaced(x,title,8),tg=x.createLinearGradient(W/2-tw/2,0,W/2+tw/2,0);tg.addColorStop(0,lighten(P.a,.45));tg.addColorStop(1,lighten(P.c,.5));
 x.fillStyle=tg;spaced(x,title,W/2,876,8);
 /* name */
 let ns=118;x.font=`800 ${ns}px ${FONT}`;while(x.measureText(o.name).width>880&&ns>52){ns-=3;x.font=`800 ${ns}px ${FONT}`}
 x.save();x.shadowColor=rgba(P.a,.35);x.shadowBlur=40;x.fillStyle="#fff";if("letterSpacing" in x)x.letterSpacing="-2px";x.fillText(o.name,W/2,968);if("letterSpacing" in x)x.letterSpacing="0px";x.restore();
 /* quote */
 const q=`“${o.quote}”`;let qs=38,lines;for(;qs>=31;qs--){x.font=`italic 500 ${qs}px ${FONT}`;lines=wrap(x,q,790);if(lines.length<=3)break}
 const lh2=Math.round(qs*1.32);x.fillStyle="rgba(222,234,250,.9)";x.font=`italic 500 ${qs}px ${FONT}`;
 lines.slice(0,3).forEach((ln,i)=>x.fillText(ln,W/2,1142+i*lh2));
 /* glass strengths bar */
 const bx=64,by=1282,bw=W-128,bh=168;
 x.save();rr(x,bx,by,bw,bh,52);
 let g=x.createLinearGradient(0,by,0,by+bh);g.addColorStop(0,"rgba(140,180,255,.14)");g.addColorStop(1,"rgba(90,120,255,.03)");x.fillStyle=g;x.fill();
 x.shadowColor="rgba(0,0,0,.5)";x.shadowBlur=40;x.shadowOffsetY=18;x.strokeStyle="rgba(0,0,0,0)";x.stroke();x.restore();
 x.save();rr(x,bx,by,bw,bh,52);g=x.createLinearGradient(bx,by,bx+bw,by+bh);g.addColorStop(0,"rgba(255,255,255,.55)");g.addColorStop(.35,rgba(P.a,.22));g.addColorStop(.7,"rgba(255,255,255,.07)");g.addColorStop(1,rgba(P.c,.5));x.strokeStyle=g;x.lineWidth=2;x.stroke();
 x.restore();
 const colW=bw/3;
 for(let i=0;i<3;i++){
  const cx=bx+colW*(i+.5),label=o.strengths[i];if(!label)continue;
  if(i>0){x.fillStyle="rgba(255,255,255,.10)";x.fillRect(bx+colW*i-.5,by+32,1.5,bh-64)}
  const im=A.markers[i];if(im){x.save();x.shadowColor=rgba(P.b,.55);x.shadowBlur=26;x.drawImage(im,cx-40,by+20,80,80);x.restore()}
  x.fillStyle="#eef5ff";x.font=`700 29px ${FONT}`;x.fillText(label,cx,by+bh-32,colW-30);
 }
 /* edge light */
 x.save();
 g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,"rgba(255,255,255,.85)");g.addColorStop(.22,rgba(P.a,.75));g.addColorStop(.5,"rgba(255,255,255,.10)");g.addColorStop(.78,rgba(P.b,.55));g.addColorStop(1,rgba(P.c,.95));
 rr(x,2,2,W-4,H-4,R-2);x.strokeStyle=g;x.lineWidth=4;x.shadowColor=rgba(P.a,.7);x.shadowBlur=26;x.stroke();x.restore();
 rr(x,12,12,W-24,H-24,R-12);x.strokeStyle="rgba(255,255,255,.06)";x.lineWidth=1.5;x.stroke();
 /* soft specular sheen from the top-left */
 x.save();rr(x,0,0,W,H,R);x.clip();g=x.createLinearGradient(0,0,W*.8,H*.5);g.addColorStop(0,"rgba(255,255,255,.12)");g.addColorStop(.55,"rgba(255,255,255,.02)");g.addColorStop(1,"rgba(255,255,255,0)");x.fillStyle=g;x.fillRect(0,0,W,H);x.restore();
 /* fine film grain — kills gradient banding on phone screens */
 const gt=mk(200,200),gx=gt.getContext("2d"),id=gx.createImageData(200,200);for(let i=0;i<id.data.length;i+=4){const v=rand()*255;id.data[i]=id.data[i+1]=id.data[i+2]=v;id.data[i+3]=rand()*255*.5}gx.putImageData(id,0,0);
 x.save();x.globalAlpha=.05;x.fillStyle=x.createPattern(gt,"repeat");x.fillRect(0,0,W,H);x.restore();
}

/* ---------- public API ---------- */
async function prepare(o){
 try{await Promise.all(["500 20px Inter","700 20px Inter","800 20px Inter","italic 500 20px Inter"].map(f=>document.fonts.load(f)))}catch(e){}
 const P=PAL[o.profile]||PAL.Visionary,base=o.assetBase||"assets/";
 const strengths=(o.strengths||[]).slice(0,3);
 const [logo,icon,...markers]=await Promise.all([loadImage(base+"NovaX_APPROVED_LOGO_ASSET.png"),loadImage(base+`builder-icon-${o.profile.toLowerCase()}.png`),...strengths.map(s=>MARKERS[s]?loadImage(base+`strength-markers/${MARKERS[s]}.png`).catch(()=>null):Promise.resolve(null))]);
 const A={logo,icon,markers};
 const seed=String(o.name)+"|"+o.score+"|"+o.profile;
 const b1=mk(W,H);paintBase1(b1.getContext("2d"),P,rng(seed));
 const b2=mk(W,H);paintBase2(b2.getContext("2d"),P,{...o,strengths},A,rng(seed+"g"));
 const score=Math.max(0,Math.min(100,Math.round(Number(o.score)||0)));
 function draw(x,t){
  x.clearRect(0,0,W,H);x.save();rr(x,0,0,W,H,R);x.clip();
  x.drawImage(b1,0,0);paintRing(x,P,score,t);x.drawImage(b2,0,0);x.restore();
 }
 function full(){const c=mk(W,H);draw(c.getContext("2d"),1);return c}
 return{draw,full,palette:P,width:W,height:H};
}
window.NovaXCard={prepare,PAL,W,H};
})();
