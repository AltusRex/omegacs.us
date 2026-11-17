/* Home page: margin index with scroll tracking, scroll lighting and the trail draw-in. */
(function(){
  var root=document.documentElement, reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rail=document.getElementById('rail'), railBtn=rail&&rail.querySelector('.rail-toggle'), railNum=rail&&rail.querySelector('.rail-num');
  var links={};document.querySelectorAll('.rail a').forEach(function(a){links[a.getAttribute('href').slice(1)]=a;});
  var secs=[].slice.call(document.querySelectorAll('section.block[id]'));
  var bar=document.querySelector('header.top'), hero=document.querySelector('.hero'), lighting=!reduce;
  if(lighting)root.classList.add('lighting');
  var lock=null;
  function setActive(id){Object.keys(links).forEach(function(k){if(k===id)links[k].setAttribute('aria-current','true');else links[k].removeAttribute('aria-current');});
    if(railNum)railNum.textContent=id&&links[id]?links[id].getAttribute('data-n'):'';}
  function update(){
    var vh=innerHeight, line=(bar?bar.offsetHeight:0)+vh*0.3, active=null;
    secs.forEach(function(sec){var top=sec.getBoundingClientRect().top;
      if(top<=line)active=sec.id;
      if(lighting&&top<=vh*0.55)sec.classList.add('lit');});
    /* at the bottom of the page, the last sections can never reach the line: hand off to the last one */
    if(scrollY+vh>=document.documentElement.scrollHeight-4)active=secs[secs.length-1].id;
    if(lock)active=lock;
    setActive(active);
    if(rail)rail.classList.toggle('away',hero&&hero.getBoundingClientRect().bottom>vh*0.5);
  }
  var ticking=false;
  addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(function(){ticking=false;update();});}},{passive:true});
  addEventListener('resize',update);
  /* a click on the index highlights that section right away, even if it is too short to reach the line */
  Object.keys(links).forEach(function(k){links[k].addEventListener('click',function(){lock=k;setActive(k);clearTimeout(links[k]._t);links[k]._t=setTimeout(function(){lock=null;},900);
    if(rail&&!wide())close();});});
  addEventListener('wheel',function(){lock=null;},{passive:true});addEventListener('touchstart',function(){lock=null;},{passive:true});
  /* the index opens on hover or focus on wide screens; the button pins it open there and opens it as a sheet on small ones */
  var wideQ=matchMedia('(min-width: 1240px)');function wide(){return wideQ.matches;}
  function open(on){rail.classList.toggle('open',on);railBtn.setAttribute('aria-expanded',on);}
  function close(){open(false);}
  if(rail){
    try{if(wide()&&localStorage.getItem('rail')==='open')open(true);}catch(e){}
    railBtn.addEventListener('click',function(){var on=!rail.classList.contains('open');open(on);if(wide()){try{localStorage.setItem('rail',on?'open':'closed');}catch(e){}}});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&rail.classList.contains('open')&&!wide()){close();railBtn.focus();}});
    document.addEventListener('click',function(e){if(!wide()&&rail.classList.contains('open')&&!rail.contains(e.target))close();});
  }
  update();
  /* trail draw-in */
  var svg=document.querySelector('.trail-svg');
  if(svg&&!reduce&&('IntersectionObserver' in window)){svg.classList.add('pre');var so=new IntersectionObserver(function(es){if(es[0].isIntersecting){svg.getBoundingClientRect();svg.classList.add('drawn');svg.classList.remove('pre');so.disconnect();}},{threshold:.6});so.observe(svg);}
})();
(function(){
  var root=document.documentElement, reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function day(d){return MON[d.getUTCMonth()]+' '+d.getUTCDate();}
  function n(x){return x.toLocaleString('en-US');}

  /* ---------- activity matrix ---------- */
  var tip=document.getElementById('tip');
  function showTip(el,text){var r=el.getBoundingClientRect();tip.textContent=text;tip.style.left=(r.left+r.width/2)+'px';tip.style.top=r.top+'px';tip.classList.add('show');}
  function hideTip(){tip.classList.remove('show');}
  function build(data){
    var days=data.days, start=new Date(data.from+'T00:00:00Z'), unit=data.source==='github'?'contribution':'commit';
    var nz=days.filter(function(c){return c>0;}).sort(function(a,b){return a-b;});
    var q=[.25,.5,.75].map(function(p){return nz.length?nz[Math.floor(p*(nz.length-1))]:0;});
    function level(c){if(!c)return 0;var l=1;q.forEach(function(v){if(c>v)l++;});return Math.min(4,l);}
    var m=document.getElementById('matrix'), step=11+3;
    var months=document.createElement('div');months.className='months';
    var wd=document.createElement('div');wd.className='wdays';['','Mon','','Wed','','Fri',''].forEach(function(s){var e=document.createElement('span');e.textContent=s;wd.appendChild(e);});
    var cells=document.createElement('div');cells.className='cells';
    var total=0,peak=0,peakI=0,active=0,lastLabel=-9,lastMonth=-1;
    days.forEach(function(c,i){
      var d=new Date(start.getTime()+i*864e5), w=Math.floor(i/7);
      if(d.getUTCDay()===0&&d.getUTCMonth()!==lastMonth){if(w-lastLabel>=3&&d.getUTCDate()<=7){var s=document.createElement('span');s.textContent=MON[d.getUTCMonth()];s.style.left=(w*step)+'px';months.appendChild(s);lastLabel=w;}lastMonth=d.getUTCMonth();}
      var e=document.createElement('i');e.setAttribute('data-l',level(c));e.setAttribute('data-i',i);cells.appendChild(e);
      total+=c;if(c)active++;if(c>peak){peak=c;peakI=i;}
    });
    m.appendChild(document.createElement('span'));m.appendChild(months);m.appendChild(wd);m.appendChild(cells);
    function label(i){var c=days[i],d=new Date(start.getTime()+i*864e5);return (c?n(c)+' '+unit+(c===1?'':'s'):'No '+unit+'s')+' on '+day(d);}
    cells.addEventListener('mouseover',function(ev){var t=ev.target;if(t.hasAttribute('data-i'))showTip(t,label(+t.getAttribute('data-i')));});
    cells.addEventListener('mouseleave',hideTip);
    cells.addEventListener('click',function(ev){var t=ev.target;if(t.hasAttribute('data-i')){showTip(t,label(+t.getAttribute('data-i')));clearTimeout(cells._t);cells._t=setTimeout(hideTip,1800);}});
    addEventListener('scroll',hideTip,{passive:true});
    var peakDay=day(new Date(start.getTime()+peakI*864e5)), end=new Date(data.to+'T00:00:00Z');
    m.setAttribute('role','img');
    m.setAttribute('aria-label',n(total)+' '+unit+'s over the last year, on '+active+' different days. The busiest day was '+peakDay+', with '+n(peak)+'.');
    document.getElementById('matrix-note').textContent=data.source==='github'?'From GitHub, updated '+day(new Date((data.updated||data.to)+'T00:00:00Z'))+'.':'From the commit history of my repositories, through '+day(end)+'.';
    var dt=document.querySelector('[data-stat="total"]');dt.textContent=n(total);dt.setAttribute('data-count',total);
    document.querySelector('[data-stat="total"]').previousElementSibling.textContent=unit==='commit'?'Commits in the last year':'Contributions in the last year';
    var dp=document.querySelector('[data-stat="peak"]');dp.innerHTML=n(peak)+'<small></small>';dp.querySelector('small').textContent=peakDay;
    document.getElementById('activity-chart').hidden=false;
    var sc=m.parentNode;sc.scrollLeft=sc.scrollWidth;
  }
  fetch('data/activity.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():Promise.reject(r.status);}).then(build).catch(function(){
    document.querySelectorAll('[data-stat]').forEach(function(dd){dd.parentNode.hidden=true;});
  });

  /* count-up for the stat tiles, once, when they come into view */
  var stats=document.querySelector('.stats');
  if(stats&&!reduce&&'IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){if(!es[0].isIntersecting)return;io.disconnect();
      stats.querySelectorAll('dd[data-count]').forEach(function(dd){var to=+dd.getAttribute('data-count'),suf=dd.getAttribute('data-suffix')||'',t0=performance.now();
        (function tick(now){var k=Math.min(1,(now-t0)/1100);k=1-Math.pow(1-k,3);dd.textContent=n(Math.round(to*k))+suf;if(k<1)requestAnimationFrame(tick);})(t0);});
    },{threshold:.4});io.observe(stats);
  }

  /* ---------- principles linked to the work that shows them ---------- */
  /* one clear example per rule, only where the item's own text shows it; rules without one stay unlinked */
  var RULES={search:['p-vexp'],same:['w-skills'],readonly:['w-connectors'],accuracy:['w-mapper'],maintainer:['p-guide']};
  var SHORT={'w-skills':'Process skills','w-connectors':'Read-only connectors','w-agents':'Agent fleet','w-mapper':'Config mapper','p-game':'The game','p-rewire':'Rewire','p-vexp':'vexp bug hunt','p-firewall':'Home firewall','p-preserve':'Game preservation','p-guide':'Flash guide'};
  var ruleName={};
  function flash(el){el.classList.add('flash');setTimeout(function(){el.classList.remove('flash');},1600);}
  function jump(el,block){el.scrollIntoView({behavior:reduce?'auto':'smooth',block:block});setTimeout(function(){flash(el);},reduce?0:450);}
  /* under each rule: the work where it shows, as plain links that jump to it */
  document.querySelectorAll('.rules li[data-rule]').forEach(function(li){
    var key=li.getAttribute('data-rule'),ids=RULES[key]||[];ruleName[key]=li.querySelector('b').textContent.replace(/\.$/,'');
    if(!ids.length)return;
    var box=document.createElement('div');box.className='rule-links';
    var lab=document.createElement('span');lab.className='rl-label';lab.textContent='See it in';box.appendChild(lab);
    ids.forEach(function(id){var a=document.createElement('a');a.href='#'+id;a.innerHTML='<span></span><i aria-hidden="true">&#8600;</i>';a.firstChild.textContent=SHORT[id];
      a.addEventListener('click',function(ev){var el=document.getElementById(id);if(!el)return;ev.preventDefault();jump(el,'start');});box.appendChild(a);});
    li.appendChild(box);
  });
  /* on each project: the rules it was built by, linking back up */
  Object.keys(SHORT).forEach(function(id){
    var el=document.getElementById(id);if(!el)return;
    var keys=Object.keys(RULES).filter(function(k){return RULES[k].indexOf(id)>-1;});if(!keys.length)return;
    var row=document.createElement('div');row.className='built-by';var lb=document.createElement('span');lb.textContent='Built by';row.appendChild(lb);
    keys.forEach(function(k){var a=document.createElement('a');a.href='#thinking';a.textContent=ruleName[k];
      a.addEventListener('click',function(ev){ev.preventDefault();jump(document.querySelector('.rules li[data-rule="'+k+'"]'),'center');});
      row.appendChild(a);});
    var h=el.querySelector('h3'),after=el.classList.contains('item')?h.nextElementSibling:h;after.insertAdjacentElement('afterend',row);
  });

  /* ---------- background layer: a faint full-page scene that follows the section ---------- */
  var cv=document.getElementById('backdrop');if(!cv)return;
  var ctx=cv.getContext('2d'),W=0,H=0,PL=0,C={},A=1,prose=document.querySelector('section.block > div:last-child');
  /* PL is where the reading column starts, so scenes can sit in the open space to its left */
  function size(){W=innerWidth;H=innerHeight;cv.width=W;cv.height=H;PL=prose?prose.getBoundingClientRect().left:W*.3;}
  function readColors(){var cs=getComputedStyle(root);['--pz-accent','--pz-ember','--pz-lilac','--ink','--muted'].forEach(function(v){C[v.replace('--pz-','').replace('--','')]=cs.getPropertyValue(v).trim();});}
  function rgba(hex,a){var h=hex.replace('#','');if(h.length===3)h=h.replace(/./g,'$&$&');var v=parseInt(h,16);return 'rgba('+(v>>16&255)+','+(v>>8&255)+','+(v&255)+','+Math.max(0,Math.min(1,a*A))+')';}
  function hash(i){var x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);}
  function dot(x,y,r,c,a){ctx.fillStyle=rgba(c,a==null?1:a);ctx.beginPath();ctx.arc(x,y,r,0,6.2832);ctx.fill();}
  function glow(x,y,r,c,a){var g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(c,a));g.addColorStop(1,rgba(c,0));ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
  function stroke(c,a,w){ctx.strokeStyle=rgba(c,a);ctx.lineWidth=w||1;}
  function poly(pts,fill,line){ctx.beginPath();pts.forEach(function(p,i){i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);});ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(line){ctx.strokeStyle=line;ctx.lineWidth=1;ctx.stroke();}}

  /* the living world: a small isometric town on a 12 x 12 grid */
  var iso={tw:0,th:0,ox:0,oy:0};
  function P(x,y,z){return [iso.ox+(x-y)*iso.tw/2, iso.oy+(x+y)*iso.th/2-(z||0)*iso.th];}
  function isoBox(x,y,w,d,h,top,left,right){
    poly([P(x,y+d,0),P(x+w,y+d,0),P(x+w,y+d,h),P(x,y+d,h)],rgba(left,.9));
    poly([P(x+w,y,0),P(x+w,y+d,0),P(x+w,y+d,h),P(x+w,y,h)],rgba(right,.9));
    poly([P(x,y,h),P(x+w,y,h),P(x+w,y+d,h),P(x,y+d,h)],rgba(top,1));
  }
  function roof(x,y,w,d,h,rh,c){var ap=P(x+w/2,y+d/2,h+rh);
    poly([P(x,y+d,h),P(x+w,y+d,h),ap],rgba(c,.75));poly([P(x+w,y,h),P(x+w,y+d,h),ap],rgba(c,.5));}
  function route(pts,t,speed){var L=[],tot=0;for(var i=1;i<pts.length;i++){var l=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);L.push(l);tot+=l;}
    var s=(t*speed)%(tot*2);if(s>tot)s=tot*2-s;for(var j=0;j<L.length;j++){if(s<=L[j]){var k=s/L[j];return [pts[j][0]+(pts[j+1][0]-pts[j][0])*k,pts[j][1]+(pts[j+1][1]-pts[j][1])*k];}s-=L[j];}return pts[pts.length-1];}
  function world(t){
    var N=12;iso.tw=Math.min(W*.55,H*1.05)/N;iso.th=iso.tw/2;iso.ox=Math.max(PL-160,W*.2);iso.oy=H/2-N*iso.th/2+iso.th*.6;
    var day=.5+.5*Math.sin(t/45*6.2832);
    // ground tiles
    for(var gx=0;gx<N;gx++)for(var gy=0;gy<N;gy++){var road=(gy===5||gx===4)&&!(gx>9&&gy!==5);
      poly([P(gx,gy),P(gx+1,gy),P(gx+1,gy+1),P(gx,gy+1)],road?rgba(C.muted,.35):null,rgba(C.muted,.28));}
    var things=[
      {x:1,y:1,draw:function(){isoBox(1.2,1.2,1.6,1.6,1,C.muted,C.ink,C.muted);roof(1.2,1.2,1.6,1.6,1,.9,C.lilac);winL(1.2,1.2,1.6,1.6,.45);}},
      {x:1,y:7,draw:function(){isoBox(1.2,7.2,1.6,1.6,1,C.muted,C.ink,C.muted);roof(1.2,7.2,1.6,1.6,1,.9,C.lilac);winL(1.2,7.2,1.6,1.6,.45);}},
      {x:2,y:9.5,draw:function(){isoBox(2.2,9.6,1.4,1.4,.9,C.muted,C.ink,C.muted);roof(2.2,9.6,1.4,1.4,.9,.8,C.lilac);winL(2.2,9.6,1.4,1.4,.4);}},
      {x:1,y:3.1,draw:function(){isoBox(1,3.1,2.4,1.8,1.2,C.muted,C.ink,C.muted);isoBox(1.2,3.3,.5,.5,2.4,C.muted,C.ink,C.muted);
        var f=P(2.2,4.9,.35),heat=.6+.4*Math.sin(t*4)*Math.sin(t*1.7);glow(f[0],f[1],iso.tw*.9,C.ember,.8*heat);}},
      {x:6,y:6.3,draw:function(){isoBox(6,6.3,2.6,1.6,.55,C.lilac,C.ink,C.muted);isoBox(6.4,6.6,.5,.5,.85,C.ember,C.ink,C.muted);isoBox(7.3,6.7,.5,.5,.8,C.accent,C.ink,C.muted);}},
      {x:9,y:8.6,draw:function(){tree(9.6,9.2);}},{x:3.6,y:2.2,draw:function(){tree(3.6,2.2);}},{x:9.6,y:2.4,draw:function(){tree(10,2.6);}},{x:5,y:9.6,draw:function(){tree(5.6,10.2);}}
    ];
    function winL(x,y,w,d,h){var a=.25+.75*(1-day),p=P(x+w*.45,y+d,h*.55);ctx.fillStyle=rgba(C.ember,a);ctx.fillRect(p[0]-iso.tw*.06,p[1]-iso.th*.12,iso.tw*.12,iso.th*.24);}
    function tree(x,y){var b=P(x,y,0),top=P(x,y,1.3);stroke(C.muted,.9,Math.max(1,iso.tw*.04));ctx.beginPath();ctx.moveTo(b[0],b[1]);ctx.lineTo(top[0],top[1]+iso.th*.3);ctx.stroke();dot(top[0],top[1],iso.tw*.28,C.accent,.55);}
    // walkers on the roads, drawn in depth order with the buildings
    var walkers=[
      {pts:[[2.2,2.95],[3.9,2.95],[3.9,4.3],[3.55,4.3]],sp:.3,c:C.ember},
      {pts:[[8.8,5.5],[11.8,5.5]],sp:.25,c:C.accent,carry:true},
      {pts:[[3,9.4],[4.5,9.4],[4.5,5.5],[6.4,5.5],[6.4,6.1]],sp:.3,c:C.lilac},
      {pts:[[2,6.9],[4.5,6.9],[4.5,0.5]],sp:.22,c:C.ink}
    ];
    walkers.forEach(function(w,i){var p=route(w.pts,t+i*7,w.sp);things.push({x:p[0],y:p[1],draw:function(){var b=P(p[0],p[1],0),bob=Math.abs(Math.sin(t*6+i))*iso.th*.05;
      dot(b[0],b[1],iso.tw*.07,C.ink,.3);stroke(C.ink,.95,Math.max(1.4,iso.tw*.05));ctx.beginPath();ctx.moveTo(b[0],b[1]-bob);ctx.lineTo(b[0],b[1]-iso.th*.6-bob);ctx.stroke();
      dot(b[0],b[1]-iso.th*.78-bob,iso.tw*.07,w.c,1);if(w.carry){ctx.fillStyle=rgba(C.ember,.9);ctx.fillRect(b[0]+iso.tw*.04,b[1]-iso.th*.62-bob,iso.tw*.1,iso.th*.2);}}});});
    things.sort(function(a,b){return (a.x+a.y)-(b.x+b.y);}).forEach(function(o){o.draw();});
    // chimney smoke
    for(var s=0;s<6;s++){var a=(t*.25+s/6)%1,c=P(1.45+a*.4,3.55-a*.3,2.5+a*2.2);dot(c[0],c[1],iso.tw*(.08+a*.18),C.muted,.5*(1-a));}
    // night sky motes
    for(var m=0;m<26;m++)dot(hash(m)*W,hash(m+40)*H*.35,1.2,C.ink,(1-day)*(.5+.4*Math.sin(t*1.5+m)));
  }

  var SCENES={
    hero:function(t){for(var i=0;i<34;i++){var x=(hash(i)*W+Math.sin(t*.13+i)*60+W)%W,y=(hash(i+70)*H+Math.cos(t*.11+i*1.7)*40),b=.5+.5*Math.sin(t*.9+i*2.3);glow(x,y,26,C.accent,.5*b);dot(x,y,2,C.accent,.6+.4*b);}},
    thinking:function(t){
      var S=[];for(var i=0;i<16;i++)S.push([W*(.06+.88*hash(i+3)),H*(.1+.8*hash(i+33))]);
      var cyc=t%24;for(var g=0;g<4;g++){for(var j=0;j<3;j++){var a=S[g*4+j],b=S[g*4+j+1],k=Math.max(0,Math.min(1,(cyc-(g*3+j)*1.2)/1.2)),fade=cyc>20?1-(cyc-20)/4:1;
        if(k>0){stroke(C.accent,.7*fade,1.2);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k);ctx.stroke();}}}
      S.forEach(function(p,i){var tw=.6+.4*Math.sin(t*1.2+i*1.3);glow(p[0],p[1],22,C.accent,.5*tw);dot(p[0],p[1],2.4,C.accent,1);});
      for(var d=0;d<70;d++)dot(hash(d+200)*W,hash(d+300)*H,1,C.ink,.5);
    },
    process:function(t){
      var cx=W*.5,cy=H*.55,rx=W*.38,ry=H*.3;function Q(u){var a=u*6.2832;return [cx+rx*Math.cos(a)+rx*.08*Math.sin(3*a),cy+ry*Math.sin(a)];}
      stroke(C.muted,.8,2);ctx.beginPath();for(var i=0;i<=180;i++){var p=Q(i/180);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);}ctx.stroke();
      var u=(t/22)%1;for(var j=0;j<60;j++){var uu=(u-j*.004+1)%1,q=Q(uu);dot(q[0],q[1],3*(1-j/60),C.accent,.9*(1-j/60));}
      for(var s=0;s<5;s++){var since=(u-s/5+1)%1,lit=Math.max(0,1-since*2),q2=Q(s/5);if(lit)glow(q2[0],q2[1],30,C.accent,.6*lit);dot(q2[0],q2[1],5,lit>.05?C.accent:C.muted,1);}
      var w=Q(u);glow(w[0],w[1],40,C.accent,.8);
    },
    work:function(t){
      var src=[.2,.4,.6,.8].map(function(f){return [W*.1,H*f];}),hub=[W*.42,H*.5],gate=[W*.62,H*.5],dst=[.2,.4,.6,.8].map(function(f){return [W*.9,H*f];});
      stroke(C.muted,.7,1.2);ctx.beginPath();src.forEach(function(s){ctx.moveTo(s[0],s[1]);ctx.lineTo(hub[0],hub[1]);});ctx.moveTo(hub[0],hub[1]);ctx.lineTo(gate[0],gate[1]);dst.forEach(function(d){ctx.moveTo(gate[0],gate[1]);ctx.lineTo(d[0],d[1]);});ctx.stroke();
      function L(a,b,k){return [a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k];}
      for(var k=Math.floor((t-6)/1.2);k<=Math.floor(t/1.2);k++){if(k<0)continue;var age=t-k*1.2,s=src[(k*7)%4],d=dst[(k*5+1)%4],wr=k%3===0,wait=wr?1:0,p,c=wr?C.ember:C.lilac;
        if(age<2)p=L(s,hub,age/2);else if(age<3)p=L(hub,gate,age-2);else if(age<3+wait){p=gate;glow(gate[0],gate[1],30,C.ember,.6);}else if(age<4.2+wait){p=L(gate,d,(age-3-wait)/1.2);if(wr)c=C.accent;}else continue;
        glow(p[0],p[1],14,c,.6);dot(p[0],p[1],3,c,1);}
      src.forEach(function(s){ctx.fillStyle=rgba(C.muted,1);ctx.fillRect(s[0]-7,s[1]-7,14,14);});
      glow(hub[0],hub[1],40,C.accent,.5);dot(hub[0],hub[1],9,C.accent,1);dst.forEach(function(d){dot(d[0],d[1],7,C.lilac,1);});
    },
    projects:world,
    activity:function(t){
      var s=22,g=8,cols=Math.ceil(W/(s+g)),rows=Math.ceil(H/(s+g));
      for(var c=0;c<cols;c++)for(var r=0;r<rows;r++){var i=c*97+r,v=Math.sin(t*.5-c*.35+r*.1+hash(i)*2.4)*.5+.5,l=Math.min(4,Math.floor(Math.pow(v,1.8)*5));if(hash(i+99)<.6)l=0;
        ctx.fillStyle=l?rgba(C.accent,[0,.2,.35,.5,.65][l]):rgba(C.ink,.07);ctx.fillRect(c*(s+g)+4,r*(s+g)+4,s,s);}
    },
    background:function(t){
      var n=Math.ceil(H/48),lit=Math.floor(t/4)%n;
      for(var i=0;i<n;i++){var base=24+i*48,on=i===lit;stroke(on?C.accent:C.muted,on?1:.6,on?2.4:1.2);ctx.beginPath();
        for(var x=0;x<=W;x+=8){var y=base+Math.sin(x*.006+t*.2+i*1.1)*16+Math.sin(x*.017-t*.12+i)*6;x?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
    },
    contact:function(t){
      var cx=Math.max(PL*.55,W*.12),cy=H*.48,f=.8+.2*Math.sin(t*2.1)*Math.sin(t*1.3);
      stroke(C.muted,.9,1.5);ctx.beginPath();ctx.moveTo(cx,0);ctx.lineTo(cx,cy-46);ctx.stroke();
      glow(cx,cy,H*.45*f,C.accent,.35);
      poly([[cx-16,cy-44],[cx+16,cy-44],[cx+22,cy-28],[cx+22,cy+26],[cx-22,cy+26],[cx-22,cy-28]],null,rgba(C.muted,1));
      glow(cx,cy,30,C.ember,.9*f);dot(cx,cy+2,5,C.accent,f);
      for(var i=0;i<26;i++){var a=t*(.05+hash(i)*.08)+i,r=H*(.12+hash(i+20)*.4),x=cx+Math.cos(a)*r*.9,y=cy+Math.sin(a)*r,b=Math.max(0,Math.sin(t*.9+i*2.1));glow(x,y,16,C.accent,.6*b);dot(x,y,2,C.accent,.4+.6*b);}
    }
  };

  size();readColors();
  addEventListener('click',function(e){if(e.target.closest&&e.target.closest('#theme-toggle'))setTimeout(function(){readColors();if(reduce)paint(0);},0);});
  matchMedia('(prefers-color-scheme: light)').addEventListener('change',function(){readColors();if(reduce)paint(0);});

  var cur='hero',prev=null,tChange=-1e9,running=false,last=0,ease=function(k){return k*k*(3-2*k);};
  function paint(now){
    var t=reduce?30:now/1000;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,H);
    var k=reduce?1:ease(Math.min(1,(now-tChange)/1400));
    if(prev&&k<1){A=1-k;SCENES[prev](t);}
    A=prev&&k<1?k:1;SCENES[cur](t);A=1;if(k>=1)prev=null;
  }
  function loop(now){if(document.hidden){running=false;return;}if(now-last>=33){last=now;paint(now);}requestAnimationFrame(loop);}
  function kick(){if(reduce){paint(0);return;}if(!running){running=true;requestAnimationFrame(loop);}}
  document.addEventListener('visibilitychange',function(){if(!document.hidden)kick();});
  function sync(){
    var a=document.querySelector('.rail a[aria-current]'),id=a?a.getAttribute('href').slice(1):'hero',scene=SCENES[id]?id:'hero';
    if(scene!==cur){prev=cur;cur=scene;tChange=performance.now();if(reduce)paint(0);}
  }
  var tk=false;
  addEventListener('scroll',function(){if(!tk){tk=true;requestAnimationFrame(function(){tk=false;sync();});}},{passive:true});
  addEventListener('resize',function(){size();paint(performance.now());});
  document.querySelectorAll(".rail a").forEach(function(a){a.addEventListener('click',function(){setTimeout(sync,0);});});
  sync();kick();
})();
