(function(){
/* ── 描画 ───────────────────────────────────────────────
   questions.json を読み込んで本文を組み立てる。
   本文中の #…# は赤い数字（.v）になる。<b>…</b> はそのまま太字。 */
function v(s){return s.replace(/#([^#]+)#/g,'<span class="v">$1</span>');}
function fcls(f){return f==='般'?' gen':f==='1'?' lo':'';}
var SRC={T:['src','T'],S:['src','S'],TS:['src both','T·S'],gen:['src gen','般']};

function rowHTML(r){
 var s=SRC[r.src]||SRC.T;
 return '<div class="r"><div class="kir">'+r.kir+'</div><div class="sen">'+
  '<span class="t">'+v(r.t)+'</span><span class="p">'+v(r.p)+'</span>'+
  '<span class="j">'+v(r.j)+'</span>'+
  '<span class="'+s[0]+'">'+s[1]+'</span></div></div>';
}
function qHTML(q){
 return '<div class="q"><div class="q-hd"><span class="q-nm">'+q.nm+'</span>'+
  '<span class="q-f'+fcls(q.f)+'">'+q.f+'</span></div>'+
  q.rows.map(rowHTML).join('')+'</div>';
}
function count(c){return c.questions.reduce(function(n,q){return n+q.rows.length;},0);}

function render(data){
 var total=0;
 document.getElementById('cats').innerHTML=data.cats.map(function(c){
  total+=count(c);
  return '<section class="cat c-'+c.id+'" data-cat="'+c.id+'">'+
   '<div class="cat-hd"><span class="cat-mk">'+c.name+'</span></div>'+
   c.questions.map(qHTML).join('')+'</section>';
 }).join('');

 document.getElementById('tabs').innerHTML=data.cats.map(function(c){
  return '<button class="tab tab-'+c.id+'" role="tab" data-cat="'+c.id+'" '+
   'aria-selected="false" type="button">'+c.name+'<span class="n">'+count(c)+'</span></button>';
 }).join('')+
  '<button class="tab tab-all" role="tab" data-cat="all" aria-selected="false" '+
  'type="button">すべて<span class="n">'+total+'</span></button>';

 document.getElementById('voc').innerHTML=data.vocab.map(function(w){
  return '<div class="vrow" data-voc="'+w.id+'"><span class="vtag vt-'+w.id+'">'+w.tag+
   '</span><span class="vwords">'+w.words+'</span></div>';
 }).join('')+'<div class="conn">'+data.conn+'</div>';
}

/* ── 操作 ─────────────────────────────────────────────── */
function init(data){
render(data);
 var B=document.body,root=document.documentElement;
 var q=document.getElementById('q'),fab=document.getElementById('fab'),vocd=document.getElementById('vocd');
 var qs=[].slice.call(document.querySelectorAll('.q'));
 var secs=[].slice.call(document.querySelectorAll('.cat'));
 var tabs=[].slice.call(document.querySelectorAll('.tab'));
 var vrows=[].slice.call(document.querySelectorAll('.vrow'));
 var ps=document.createElement('style');document.head.appendChild(ps);
 ps.textContent='@page{size:A4 portrait;margin:12mm}';
 var STEPS=[0.85,1,1.15,1.32,1.5],scale=1,cur='plan';
 var NAME={plan:'計画',str:'構造',mep:'設備',eco:'環境負荷低減',all:'すべて'};
 var ORDER=['plan','str','mep','eco','all'];
 var mobile=window.matchMedia('(max-width:860px)');
 vocd.open=!mobile.matches;
 
 function setCat(c){
  cur=c;
  ['c-plan','c-str','c-mep','c-eco','all'].forEach(function(k){B.classList.remove(k);});
  B.classList.add('c-'+(c==='all'?'plan':c));
  if(c==='all')B.classList.add('all');
  root.style.setProperty('--cat', c==='all'?'var(--ink)':'var(--t-'+c+')');
  tabs.forEach(function(t){t.setAttribute('aria-selected',String(t.dataset.cat===c));});
  secs.forEach(function(s){s.hidden=(c!=='all'&&s.dataset.cat!==c);});
  vrows.forEach(function(v){v.hidden=!(c==='all'||v.dataset.voc==='common'||v.dataset.voc===c);});
  filter();label();
 }
 tabs.forEach(function(t){t.addEventListener('click',function(){
  q.value='';setCat(t.dataset.cat);
  window.scrollTo({top:0,behavior:mobile.matches?'auto':'smooth'});});});
 
 function filter(){
  var v=q.value.trim().toLowerCase();
  qs.forEach(function(e){e.hidden=v&&e.textContent.toLowerCase().indexOf(v)===-1;});
  if(v)secs.forEach(function(s){
   s.hidden=![].slice.call(s.querySelectorAll('.q')).some(function(e){return !e.hidden;});});
 }
 function masked(){var c=B.classList;return c.contains('h-t')||c.contains('h-p')||c.contains('h-j');}
 function label(){
  var c=B.classList,bl=[];
  if(c.contains('h-t'))bl.push('対象');
  if(c.contains('h-p'))bl.push('目的');
  if(c.contains('h-j'))bl.push('実施内容');
  var t=q.value.trim(),p=[NAME[cur]];
  p.push(bl.length?'<b>'+bl.join('・')+'</b> を空欄にした練習用':'<b>全文</b>（読む用）');
  if(c.contains('marker'))p.push('マーカーあり');
  if(c.contains('wide'))p.push('書き込み欄あり');
  if(t)p.push('絞り込み：'+t);
  document.getElementById('pm').innerHTML='1級建築士製図試験　記述練習　─　'+p.join('　／　');
  c.toggle('masked',masked());
 }
 function setScale(d){var i=STEPS.indexOf(scale);i=Math.max(0,Math.min(STEPS.length-1,i+d));
  scale=STEPS[i];root.style.setProperty('--s',scale);}
 
 q.addEventListener('input',function(){
  if(q.value.trim()&&cur!=='all'){setCat('all');q.focus();return;}
  filter();label();});
 
 function slot(id,cls,sel,onOpen){var b=document.getElementById(id);
  function go(){var on=B.classList.toggle(cls);b.classList.toggle('on',on);
   [].forEach.call(document.querySelectorAll(sel),function(s){s.classList.remove('show');});
   if(on&&onOpen)onOpen();label();}
  b.addEventListener('click',go);return go;}
 var gt=slot('ht','h-t','.sen .t');
 var gp=slot('hp','h-p','.sen .p',function(){vocd.open=true;});
 var gj=slot('hj','h-j','.sen .j');
 function tog(id,cls){var b=document.getElementById(id);
  function go(){b.classList.toggle('on',B.classList.toggle(cls));label();}
  b.addEventListener('click',go);return go;}
 var gm=tog('mk','marker');tog('wd','wide');
 document.getElementById('sm').addEventListener('click',function(){setScale(-1);});
 document.getElementById('sp').addEventListener('click',function(){setScale(1);});
 document.getElementById('pr').addEventListener('click',function(){vocd.open=true;label();window.print();});
 
 var latched=false,downT=0;
 function peek(on){B.classList.toggle('peek',on);fab.classList.toggle('on',on);
  fab.setAttribute('aria-pressed',String(on));}
 function unpeek(){latched=false;downT=0;peek(false);}
 function fdown(ev){
  if(ev.cancelable)ev.preventDefault();
  if(latched){unpeek();return;}
  downT=Date.now();peek(true);}
 function fup(){
  if(!downT)return;
  if(Date.now()-downT<250){latched=true;downT=0;peek(true);}
  else unpeek();}
 if(window.PointerEvent){
  fab.addEventListener('pointerdown',fdown);
  fab.addEventListener('pointerup',fup);
  fab.addEventListener('pointercancel',unpeek);
  fab.addEventListener('pointerleave',function(){if(downT)unpeek();});
 }else{
  fab.addEventListener('touchstart',fdown,{passive:false});
  fab.addEventListener('touchend',fup);
  fab.addEventListener('touchcancel',unpeek);
  fab.addEventListener('mousedown',fdown);
  fab.addEventListener('mouseup',fup);
  fab.addEventListener('mouseleave',function(){if(downT)unpeek();});
 }
 fab.addEventListener('contextmenu',function(ev){ev.preventDefault();});
 fab.addEventListener('keydown',function(e){
  if(e.key===' '||e.key==='Enter'){e.preventDefault();latched=!latched;downT=0;peek(latched);}});
 
 document.addEventListener('click',function(ev){
  var el=ev.target;if(!el||!el.closest)return;
  var s=el.closest('.sen .t,.sen .p,.sen .j');
  if(s){var c=s.classList;
   if((c.contains('t')&&B.classList.contains('h-t'))||
      (c.contains('p')&&B.classList.contains('h-p'))||
      (c.contains('j')&&B.classList.contains('h-j'))){c.toggle('show');return;}}
  var h=el.closest('.q-hd');
  if(h&&masked()){
   var sp=[].slice.call(h.parentNode.querySelectorAll('.sen .t,.sen .p,.sen .j'));
   var open=sp.some(function(x){return x.classList.contains('show');});
   sp.forEach(function(x){x.classList.toggle('show',!open);});}
 });
 document.addEventListener('keydown',function(e){
  if(e.target.tagName==='INPUT'){if(e.key==='Escape'){q.value='';filter();label();q.blur();}return;}
  if(e.metaKey||e.ctrlKey||e.altKey)return;
  var k=e.key,i=ORDER.indexOf(cur);
  if(k==='1'){gt();e.preventDefault();}
  else if(k==='2'){gp();e.preventDefault();}
  else if(k==='3'){gj();e.preventDefault();}
  else if(k==='0'&&!e.repeat){peek(true);e.preventDefault();}
  else if(k==='ArrowRight'){setCat(ORDER[(i+1)%ORDER.length]);e.preventDefault();}
  else if(k==='ArrowLeft'){setCat(ORDER[(i+ORDER.length-1)%ORDER.length]);e.preventDefault();}
  else if(k.toLowerCase()==='m'){gm();}
  else if(k==='+'||k==='='){setScale(1);e.preventDefault();}
  else if(k==='-'){setScale(-1);e.preventDefault();}
  else if(k==='/'){q.focus();e.preventDefault();}
  else if(k==='Escape'){unpeek();}
 });
 document.addEventListener('keyup',function(e){if(e.key==='0')unpeek();});
 var lastY=0,tick=false;
 window.addEventListener('scroll',function(){
  if(!mobile.matches){B.classList.remove('barhide');lastY=window.scrollY||0;return;}
  if(tick)return;tick=true;
  requestAnimationFrame(function(){var y=window.scrollY||0;
   if(y>150&&y>lastY+8)B.classList.add('barhide');
   else if(y<lastY-8||y<80)B.classList.remove('barhide');
   lastY=y;tick=false;});
 },{passive:true});
 q.addEventListener('focus',function(){B.classList.remove('barhide');});
 if(mobile.addEventListener)mobile.addEventListener('change',function(){
  B.classList.remove('barhide');vocd.open=!mobile.matches;});
 window.addEventListener('beforeprint',function(){vocd.open=true;label();});
 setCat('plan');
}

fetch('questions.json')
 .then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();})
 .then(init)
 .catch(function(e){
  document.getElementById('cats').innerHTML=
   '<div class="loaderr"><b>設問データ（questions.json）を読み込めませんでした。</b>'+
   'index.html をファイルとして直接開くと、ブラウザの制限で読み込みが止まります。'+
   'ローカルで見るときは、このフォルダで <code>python -m http.server</code> を実行し '+
   '<code>http://localhost:8000/</code> を開いてください。'+
   '<span class="loaderr-d">'+e.message+'</span></div>';
 });
})();
