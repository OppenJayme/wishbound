'use strict';
(() => {
  const intro = document.getElementById('wishIntro');
  const canvas = document.createElement('canvas');
  canvas.className = 'wish-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.querySelector('.wish-sky').append(canvas);
  const ctx = canvas.getContext('2d');
  const tempo = 1.85;
  const descentOffset = -1300 / tempo;
  const timing = Object.freeze({manifest: 3900 * tempo - 1300, reveal: 4700 * tempo - 1300, finish: 6300 * tempo - 1300});
  const soundConfig = window.BIRTHDAY_STORY.wishSound || {};
  const sound = document.createElement('audio');
  sound.id = 'wishPullAudio'; sound.preload = 'auto'; sound.loop = false;
  const soundSrc = String(soundConfig.src || '');
  if (/^(?:assets\/|\.\/assets\/|https?:\/\/|data:audio\/)/i.test(soundSrc)) sound.src = soundSrc;
  sound.volume = Number.isFinite(+soundConfig.volume) ? Math.max(0, Math.min(100, +soundConfig.volume)) / 100 : .7;
  document.body.append(sound);
  const soundState = playing => document.dispatchEvent(new CustomEvent('wishbound:pullsound', {detail:{playing}}));
  sound.addEventListener('play', () => soundState(true));
  sound.addEventListener('pause', () => soundState(false));
  sound.addEventListener('ended', () => soundState(false));
  sound.addEventListener('error', () => soundState(false));
  // Give only the final descent and portrait approach more screen time.
  // Keep the earlier cloud portal and blue-to-gold flyby at their familiar pace.
  function sceneTime(elapsed) {
    if(elapsed<2800)return elapsed;
    if(elapsed<3900+descentOffset)return 2800+(elapsed-2800)*500/(1100+descentOffset);
    if(elapsed<4700+descentOffset)return 3300+(elapsed-3900-descentOffset)*600/800;
    return elapsed-800-descentOffset;
  }
  intro.style.setProperty('--wish-tempo', tempo);
  let frame = 0, width = 0, height = 0;
  const clamp = x => Math.max(0, Math.min(1, x));
  const ease = x => { const t = clamp(x); return t * t * (3 - 2 * t); };
  const glide = x => { const t = clamp(x); return t * t * t * (t * (t * 6 - 15) + 10); };
  const mix = (a,b,t) => a + (b-a)*t;
  const tint = (gold,a) => `rgba(${Math.round(mix(112,255,gold))},${Math.round(mix(195,165,gold))},${Math.round(mix(255,45,gold))},${clamp(a)})`;
  const seed = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

  function resize() {
    width = innerWidth; height = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr);
    ctx?.setTransform(dpr,0,0,dpr,0,0);
  }
  function stop(resetSound = true) {
    if (resetSound) {
      sound.pause();
      if (sound.getAttribute('src')) sound.currentTime = 0;
      soundState(false);
    }
    cancelAnimationFrame(frame); frame = 0;
    canvas.dataset.active = 'false'; canvas.dataset.camera = 'rest';
    ctx?.clearRect(0,0,width,height);
  }
  function glow(x,y,r,gold,a) {
    if (r <= 0 || a <= 0) return;
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,tint(gold,a)); g.addColorStop(.16,tint(gold,a*.6)); g.addColorStop(1,tint(gold,0));
    ctx.fillStyle=g; ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  function star(x,y,r,gold,a,rotation=0) {
    ctx.save(); ctx.translate(x,y); ctx.rotate(rotation); ctx.fillStyle=tint(gold,a);
    ctx.beginPath();
    for(let i=0;i<8;i++) { const angle=i*Math.PI/4; const s=i%2?r*.16:r; ctx.lineTo(Math.cos(angle)*s,Math.sin(angle)*s); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }

  // Small ray-marched cloud volumes: density, sunlight extinction and depth
  // are baked once. The live scene uses these on depth-sorted 3D billboards.
  const clouds=Array.from({length:4},(_,variant)=>{
    const sprite=document.createElement('canvas');sprite.width=256;sprite.height=144;
    const c=sprite.getContext('2d'),pixels=c.createImageData(256,144);
    const lobes=Array.from({length:8},(_,j)=>({
      x:(seed(j+variant*31)-.5)*2.5,y:(seed(j+variant*47)-.5)*.38,z:(seed(j+variant*67)-.5)*.7,
      rx:.5+seed(j+7)*.4,ry:.35+seed(j+13)*.28,rz:.4+seed(j+23)*.4,
    }));
    for(let py=0;py<144;py++) for(let px=0;px<256;px++) {
      const x=(px/255-.5)*4.6,y=(.5-py/143)*2.4;
      const turbulence=.87+.13*Math.sin(x*10+variant)*Math.sin(y*14+variant);
      let transmission=1,red=0,green=0,blue=0;
      for(let step=0;step<14&&transmission>.015;step++) {
        const z=1.2-step*.185;let density=0,above=0;
        for(const l of lobes) {
          const dx=((x-l.x)/l.rx)**2,dz=((z-l.z)/l.rz)**2;
          const q=dx+((y-l.y)/l.ry)**2+dz;
          if(q<1)density+=(1-q)**2;
          const sun=dx+((y+.24-l.y)/l.ry)**2+dz;
          if(sun<1)above+=(1-sun)**2;
        }
        density*=turbulence;
        if(density<.002)continue;
        const opacity=1-Math.exp(-density*.65);
        const light=Math.exp(-above*1.8)*.78+.22;
        const weight=opacity*transmission;
        red+=mix(58,255,light)*weight;green+=mix(104,250,light)*weight;blue+=mix(158,244,light)*weight;
        transmission*=1-opacity;
      }
      const alpha=1-transmission,i=(py*256+px)*4;
      if(alpha>.001){pixels.data[i]=red/alpha;pixels.data[i+1]=green/alpha;pixels.data[i+2]=blue/alpha;pixels.data[i+3]=alpha*255;}
    }
    c.putImageData(pixels,0,0);return sprite;
  });
  const cloudField=Array.from({length:36},(_,j)=>({
    x:(seed(j+80)-.5)*42,y:-.4-seed(j+140)*4,z:9+seed(j+210)*22,
    size:4+seed(j+280)*8,variant:j%4,
  }));
  function sceneCamera(t) {
    const tracking=glide((t-1900)/500)*(1-glide((t-2800)/350));
    return {yaw:mix(-.055,.16,tracking),x:mix(0,2.8,tracking),z:glide(t/3300)*1.6,
      focal:Math.min(width,height)*.95,distance:8-Math.sin(tracking*Math.PI)*1.8,tracking};
  }
  function perspective(x,y,z,camera,cx,cy) {
    const side=x*Math.cos(camera.yaw)-z*Math.sin(camera.yaw);
    const depth=Math.max(1.5,camera.distance-x*Math.sin(camera.yaw)-z*Math.cos(camera.yaw));
    return {x:cx+side*camera.focal/depth,y:cy-y*camera.focal/depth,depth};
  }
  function crystal(head,t,gold,alpha=1) {
    const camera=sceneCamera(t),unit=16*head.scale*8/camera.focal;
    const turn=.35+Math.sin(t/1400)*.55,tilt=.24+Math.sin(t/1900)*.13;
    function rotate(v) {
      const x=v.x*Math.cos(turn)+v.z*Math.sin(turn),z=-v.x*Math.sin(turn)+v.z*Math.cos(turn);
      const y=v.y*Math.cos(tilt)-z*Math.sin(tilt),zz=v.y*Math.sin(tilt)+z*Math.cos(tilt);
      const roll=-head.angle+t/7000;
      return {x:(x*Math.cos(roll)-y*Math.sin(roll))*unit,y:(x*Math.sin(roll)+y*Math.cos(roll))*unit,z:zz*unit};
    }
    const rim=Array.from({length:8},(_,j)=>{const a=j*Math.PI/4,r=j%2?.23:1;return rotate({x:Math.cos(a)*r,y:Math.sin(a)*r,z:0});});
    const poles=[rotate({x:0,y:0,z:.42}),rotate({x:0,y:0,z:-.3})];
    const faces=[];
    poles.forEach((pole,side)=>rim.forEach((a,j)=>{
      const b=rim[(j+1)%8],vertices=side?[pole,b,a]:[pole,a,b];
      const u={x:vertices[1].x-pole.x,y:vertices[1].y-pole.y,z:vertices[1].z-pole.z};
      const v={x:vertices[2].x-pole.x,y:vertices[2].y-pole.y,z:vertices[2].z-pole.z};
      const n={x:u.y*v.z-u.z*v.y,y:u.z*v.x-u.x*v.z,z:u.x*v.y-u.y*v.x};
      const length=Math.hypot(n.x,n.y,n.z)||1;
      const diffuse=Math.max(0,(-.3*n.x+.55*n.y+.78*n.z)/length);
      const specular=Math.max(0,n.z/length)**18;
      const projected=vertices.map(p=>perspective(p.x,p.y,p.z,camera,head.x,head.y));
      faces.push({projected,depth:projected.reduce((sum,p)=>sum+p.depth,0)/3,light:.48+diffuse*.52,specular});
    }));
    faces.sort((a,b)=>b.depth-a.depth);
    ctx.save();ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=alpha;
    for(const face of faces) {
      const base=[mix(103,255,gold),mix(201,190,gold),mix(255,92,gold)];
      const rgb=base.map(value=>Math.round(mix(value*face.light,255,face.specular*.8)));
      ctx.fillStyle=`rgb(${rgb.join(',')})`;ctx.strokeStyle='rgba(255,250,229,.18)';ctx.lineWidth=.45;
      ctx.beginPath();face.projected.forEach((p,j)=>j?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();ctx.stroke();
    }
    ctx.restore();canvas.dataset.meshFaces=faces.length;canvas.dataset.renderer='perspective-3d';
  }
  function cloud(x,y,size,alpha,variant=0,rotation=0) {
    ctx.save(); ctx.globalAlpha*=alpha; ctx.translate(x,y); ctx.rotate(rotation);
    ctx.drawImage(clouds[variant%clouds.length],-size/2,-size/4,size,size/2); ctx.restore();
  }
  function sky(t) {
    const exit=glide((t-3300)/600);
    ctx.save(); ctx.globalAlpha*=1-exit;
    const g=ctx.createLinearGradient(0,0,0,height);
    g.addColorStop(0,'#092951'); g.addColorStop(.46,'#1b6099'); g.addColorStop(.8,'#5c9cc5'); g.addColorStop(1,'#bfd9e7');
    ctx.fillStyle=g; ctx.fillRect(0,0,width,height);
    const camera=sceneCamera(t);
    const head=meteorPoint(Math.max(850,Math.min(t,3300)));
    const gold=ease((t-1580)/360);
    const field=cloudField.map(l=>{
      const x=l.x-camera.x+t*.0002,z=l.z-camera.z;
      const depth=x*Math.sin(camera.yaw)+z*Math.cos(camera.yaw);
      if(depth<2)return null;
      const side=x*Math.cos(camera.yaw)-z*Math.sin(camera.yaw);
      return {...l,x:width*.5+side*camera.focal/depth,y:height*.65-l.y*camera.focal/depth,
        depth,size:l.size*camera.focal/depth};
    }).filter(Boolean).sort((a,b)=>b.depth-a.depth);
    for(const l of field) {
      if(l.x+l.size/2<0||l.x-l.size/2>width)continue;
      cloud(l.x,l.y,l.size,mix(.85,.5,clamp(l.depth/32)),l.variant);
      // The moving comet warms the nearby cloud tops without washing out shading.
      const distance=Math.hypot(l.x-head.x,l.y-head.y);
      if(t>1100&&distance<l.size*.65){ctx.save();ctx.globalCompositeOperation='screen';glow(l.x,l.y,l.size*.3,gold,(1-distance/(l.size*.65))*.09);ctx.restore();}
    }
    for(let j=0;j<38;j++) {
      ctx.fillStyle=`rgba(214,239,255,${.14+seed(j)*.3})`;
      ctx.beginPath();ctx.arc(seed(j+80)*width,seed(j+120)*height*.65,.5+seed(j)*.6,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  function vortex(t) {
    const fade=1-ease((t-820)/330);
    if(!fade)return;
    const cx=width*.5,cy=height*.37;
    const zoom=1+glide(t/1100)*.7;
    ctx.save();ctx.globalAlpha*=fade;
    const aperture=ctx.createRadialGradient(cx,cy,8,cx,cy,Math.min(width,height)*.44*zoom);
    aperture.addColorStop(0,'#061b3a');aperture.addColorStop(.32,'#163e70');aperture.addColorStop(.62,'#719dbf');aperture.addColorStop(1,'#c4dfeb00');
    ctx.fillStyle=aperture;ctx.fillRect(0,0,width,height);
    for(let band=2;band>=0;band--) for(let j=0;j<18;j++) {
      const a=j*Math.PI/9+t/(3100+band*800)+band*.28;
      const breath=1+Math.sin(j*1.7+t/1900)*.045;
      const r=Math.min(width,height)*(.22+band*.12)*zoom*breath;
      cloud(cx+Math.cos(a)*r,cy+Math.sin(a)*r*.65,Math.min(width,height)*(.26+band*.1)*zoom,.73,j+band,a+Math.PI/2);
    }
    const birth=ease((t-280)/400);
    const release=1-ease((t-780)/110);
    glow(cx,cy,80+birth*65,0,birth*.8*release);
    crystal({x:cx,y:cy,scale:(8+birth*20)/13,angle:.1},t,0,birth*release);
    ctx.restore();
  }

  // Separate cinematic shots rather than an orbit around a stationary icon.
  function meteorPoint(t) {
    if(t<2050) {
      const p=clamp((t-850)/1200);
      const release=glide((t-850)/250);
      return {x:width*mix(.5,.68,p),y:height*mix(.37,.5,p),scale:mix(.65,1.55,p),angle:mix(1.2,.56,release)};
    }
    if(t<2800) {
      const p=glide((t-2050)/750);
      return {x:width*mix(.68,1.3,p),y:height*(.5+Math.sin(p*Math.PI)*.025),scale:mix(1.55,2.8,p)+Math.sin(p*Math.PI)*2.2,angle:mix(.56,.16,glide(p/.3))};
    }
    const p=glide((t-2800)/500);
    return {x:width*mix(.54,.52,p),y:height*mix(-.14,.49,p),scale:mix(1.5,4,p),angle:Math.PI/2-.06};
  }
  function meteor(t,gold,alpha=1,offsetX=0,offsetY=0,size=1) {
    const head=meteorPoint(t);
    head.x+=offsetX;head.y+=offsetY;head.scale*=size;
    const length=(t<2050?Math.min(width*.7,height*.85):t<2800?width*.95:height*.9)*size;
    const dx=Math.cos(head.angle),dy=Math.sin(head.angle);
    ctx.save();ctx.globalAlpha*=alpha;ctx.globalCompositeOperation='lighter';
    const camera=sceneCamera(t),rear=glide((t-1950)/250)*(1-glide((t-2750)/200));
    const unit=8/camera.focal;
    const samples=Array.from({length:41},(_,j)=>{
      const p=j/40,depth=length*p*unit*mix(-.65,.32,rear);
      return perspective(-dx*length*p*unit,dy*length*p*unit,depth,camera,head.x,head.y);
    });
    // Project the wake through the same camera as the mesh: its width and
    // foreshortening change as the tracking shot moves behind the star.
    for(const layer of [{width:25,alpha:.07},{width:8,alpha:.38},{width:1.7,alpha:.88,core:true}]) {
      const tail=samples[40],gradient=ctx.createLinearGradient(tail.x,tail.y,head.x,head.y);
      gradient.addColorStop(0,tint(gold,0));gradient.addColorStop(.5,tint(gold,layer.alpha*.2));
      gradient.addColorStop(1,layer.core?`rgba(255,250,232,${layer.alpha})`:tint(gold,layer.alpha));
      const edges=samples.map((p,j)=>{
        const next=samples[Math.min(40,j+1)],previous=samples[Math.max(0,j-1)];
        const angle=Math.atan2(next.y-previous.y,next.x-previous.x);
        const half=layer.width*head.scale*(1-j/41)**.8*4/p.depth;
        return {left:{x:p.x-Math.sin(angle)*half,y:p.y+Math.cos(angle)*half},right:{x:p.x+Math.sin(angle)*half,y:p.y-Math.cos(angle)*half}};
      });
      ctx.fillStyle=gradient;ctx.beginPath();
      edges.forEach((p,j)=>j?ctx.lineTo(p.left.x,p.left.y):ctx.moveTo(p.left.x,p.left.y));
      for(let j=40;j>=0;j--)ctx.lineTo(edges[j].right.x,edges[j].right.y);
      ctx.closePath();ctx.fill();
    }
    for(let j=0;j<18;j++) {
      const p=((t/620+j*.071)%1);
      const scatter=Math.sin(j*21.3)*p*head.scale*13;
      const x=head.x-dx*length*p-dy*scatter,y=head.y-dy*length*p+dx*scatter;
      star(x,y,(1-p)*2.5*size,gold,(1-p)*.6,j);
    }
    glow(head.x,head.y,68*head.scale,gold,.85);
    crystal(head,t,gold);
    const core=ctx.createRadialGradient(head.x,head.y,0,head.x,head.y,4.1*head.scale);
    core.addColorStop(0,'#ffffff');core.addColorStop(.25,'#fffdf3');core.addColorStop(1,tint(gold,0));
    ctx.fillStyle=core;ctx.beginPath();ctx.arc(head.x,head.y,4.1*head.scale,0,Math.PI*2);ctx.fill();
    ctx.restore();return head;
  }
  function rarityBurst(t,head) {
    const p=clamp((t-1550)/500);
    if(p<=0||p>=1)return;
    const alpha=Math.sin(p*Math.PI);
    ctx.save();ctx.globalCompositeOperation='lighter';
    glow(head.x,head.y,Math.min(width,height)*(.12+p*.5),1,alpha*.7);
    // The characteristic prismatic circles around the moment the wish turns gold.
    for(let j=0;j<3;j++) {
      const r=(40+p*Math.min(width,height)*.27)+j*9;
      ctx.strokeStyle=['#ffcb7270','#ff8bae45','#8ddcff65'][j];ctx.lineWidth=3-j*.6;
      ctx.globalAlpha=alpha;ctx.beginPath();ctx.arc(head.x,head.y,r,-.5,Math.PI*1.7);ctx.stroke();
    }
    ctx.restore();
  }
  function cinematic(t) {
    sky(t);vortex(t);
    if(t<850)return;
    const gold=ease((t-1580)/360);
    if(t>=2050&&t<2800) {
      // A cut to a fast rear tracking shot: blue wishes flank the gold comet.
      for(let j=0;j<5;j++) meteor(t-45-j*15,0,.35,-width*(.08+j*.09),height*(j%2?-.11:.13)*(1+j*.22),.26+j*.035);
    }
    if(t<3300) {
      const head=meteor(t,gold,ease((t-850)/130));rarityBurst(t,head);
      if(t>=2800) {
        // Fine, fading strands give the falling comet depth around its main wake.
        const descent=clamp((t-2800)/500);
        ctx.save();ctx.globalCompositeOperation='lighter';
        for(let j=0;j<6;j++) {
          const side=j%2?1:-1,offset=side*(18+j*9)*head.scale*.5;
          const length=(.07+seed(j+400)*.11)*height;
          const x=head.x+offset,y=head.y-35-j*22;
          const strand=ctx.createLinearGradient(x,y-length,x,y);
          strand.addColorStop(0,tint(1,0));strand.addColorStop(.8,tint(1,.16*Math.sin(descent*Math.PI)));strand.addColorStop(1,tint(1,0));
          ctx.strokeStyle=strand;ctx.lineWidth=.7;ctx.beginPath();
          ctx.moveTo(x+side*8,y-length);ctx.quadraticCurveTo(x,y-length*.5,x,y);ctx.stroke();
        }
        ctx.restore();
      }
      // Brief light wipe conceals the change of camera axis.
      const cut=Math.sin(clamp((t-2740)/160)*Math.PI)**2;
      if(cut>0){ctx.fillStyle=`rgba(255,239,205,${cut*.45})`;ctx.fillRect(0,0,width,height);}
    }
  }
  function framePoint(b,p,side) {
    const distance=clamp(p)*(b.width+b.height),middle=b.left+b.width/2;
    if(distance<b.width/2)return{x:middle+side*distance,y:b.top};
    if(distance<b.width/2+b.height)return{x:middle+side*b.width/2,y:b.top+distance-b.width/2};
    return{x:middle+side*(b.width/2-(distance-b.width/2-b.height)),y:b.bottom};
  }
  function portraitArrival(t) {
    const portrait=document.querySelector('#introReveal .reveal-portrait');
    if(document.getElementById('introReveal').hidden)return;
    const b=portrait.getBoundingClientRect();
    const mount={left:b.left-9,top:b.top-9,bottom:b.bottom+9,width:b.width+18,height:b.height+18};
    const trace=glide((t-3650)/550),fade=1-ease((t-4700)/800);
    ctx.save();ctx.globalAlpha*=fade;
    // Continue the descending star into the measured top of her portrait.
    // Its glow leads the frame trace instead of vanishing behind a white cut.
    const start=meteorPoint(3300),travel=glide((t-3300)/390);
    const target={x:b.left+b.width/2,y:b.top-9};
    const control={x:mix(start.x,target.x,.5)+Math.min(width,height)*.08,y:Math.min(start.y,target.y)-height*.12};
    const s=1-travel;
    const x=s*s*start.x+2*s*travel*control.x+travel*travel*target.x;
    const y=s*s*start.y+2*s*travel*control.y+travel*travel*target.y;
    const torch=1-ease((t-3690)/240);
    for(let j=25;j>0;j--) {
      const p=travel-j*.012;
      if(p<0)continue;
      const q=1-p,next=Math.min(travel,p+.013),v=1-next;
      ctx.strokeStyle=tint(1,torch*(1-j/26)*.55);ctx.lineWidth=(1-j/26)*3+.3;
      ctx.beginPath();ctx.moveTo(q*q*start.x+2*q*p*control.x+p*p*target.x,q*q*start.y+2*q*p*control.y+p*p*target.y);
      ctx.lineTo(v*v*start.x+2*v*next*control.x+next*next*target.x,v*v*start.y+2*v*next*control.y+next*next*target.y);ctx.stroke();
    }
    glow(x,y,mix(145,45,travel),1,.7*torch);
    const ripple=clamp((t-3600)/420);
    if(ripple>0&&ripple<1) {
      ctx.save();ctx.globalCompositeOperation='lighter';
      ctx.strokeStyle=tint(1,Math.sin(ripple*Math.PI)*.3);ctx.lineWidth=1.2;
      ctx.beginPath();ctx.ellipse(target.x,target.y,18+ripple*90,6+ripple*25,0,0,Math.PI*2);ctx.stroke();
      ctx.restore();
    }
    const heading=Math.atan2(s*(control.y-start.y)+travel*(target.y-control.y),s*(control.x-start.x)+travel*(target.x-control.x));
    crystal({x,y,scale:mix(42,10,travel)/13,angle:heading},t,1,torch);
    ctx.fillStyle=`rgba(255,253,231,${torch})`;ctx.beginPath();ctx.arc(x,y,mix(19,3,travel),0,Math.PI*2);ctx.fill();
    for(const side of [-1,1]) {
      ctx.strokeStyle=tint(1,.8);ctx.lineWidth=1.3;ctx.beginPath();
      for(let j=0;j<=60;j++){const p=framePoint(mount,trace*j/60,side);if(j===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}
      ctx.stroke();const tip=framePoint(mount,trace,side);glow(tip.x,tip.y,40,1,.25*Math.sin(trace*Math.PI));
    }
    for(let j=0;j<12;j++) {
      const p=clamp((t-3900-j*25)/950);
      star(b.left+(j%4)/3*b.width+Math.sin(j*4.1)*p*25,b.top+Math.floor(j/4)/2*b.height-p*45,2.5,1,Math.sin(p*Math.PI)*.65,j);
    }
    // Leave rarity to the five HTML stars, avoiding a second drifting star row.
    glow(b.left+b.width/2,b.top+b.height/2,Math.min(width,height)*.4,1,.1*fade);
    ctx.restore();
  }
  function play() {
    stop();if(!ctx||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    if (soundConfig.enabled !== false && sound.getAttribute('src')) {
      soundState(true);
      sound.play().catch(() => { soundState(false); sound.dataset.state='unavailable'; });
    }
    resize();const began=performance.now();canvas.dataset.active='true';canvas.dataset.startedAt=began;
    function draw(now) {
      const renderBegan=performance.now();
      const elapsed=now-began,t=sceneTime(elapsed/tempo);
      if(!intro.open||!['wishing','manifesting','revealed'].includes(intro.dataset.stage)){stop();return;}
      if(elapsed>timing.finish){stop(false);return;}
      if(width!==innerWidth||height!==innerHeight)resize();
      canvas.dataset.phase=t<900?'portal':t<3300?'meteor':t<3900?'portrait-bridge':'portrait-reveal';
      canvas.dataset.camera=t<2050?'front':t<2800?'flyby':t<3300?'descent':'reveal';
      ctx.clearRect(0,0,width,height);ctx.globalAlpha=ease(t/170);ctx.lineCap='round';
      if(t<3900)cinematic(t);
      if(t>=3300)portraitArrival(t);
      // A soft arrival wash recedes early enough to see the star enter the frame.
      const flash=t<3320?ease((t-3180)/140):1-glide((t-3320)/250);
      if(flash>0){ctx.fillStyle=`rgba(255,248,231,${flash*.5})`;ctx.fillRect(0,0,width,height);}
      ctx.globalAlpha=1;canvas.dataset.elapsed=t.toFixed(1);canvas.dataset.renderMs=(performance.now()-renderBegan).toFixed(1);frame=requestAnimationFrame(draw);
    }
    draw(began);
  }
  window.BIRTHDAY_WISH={play,stop,tempo,timing};
})();
