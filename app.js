(function(){
/* ── 描画 ───────────────────────────────────────────────
   questions.json を読み込んで本文を組み立てる。
   本文中の #…# は赤い数字（.v）になる。<b>…</b> はそのまま太字。 */
function v(s){return s.replace(/#([^#]+)#/g,'<span class="v">$1</span>');}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');}
function fcls(f){return f==='般'?' gen':f==='既'?' kizon':f==='1'?' lo':'';}
var SRC={T:['src','T'],S:['src','S'],TS:['src both','T·S'],N:['src n','日'],
         gen:['src gen','般'],kizon:['src kizon','既']};

function rowHTML(r){
 var s=SRC[r.src]||SRC.T;
 return '<div class="r'+(r.src==='gen'?' gen':'')+'">'+
  '<div class="khd"><span class="kir">'+r.kir+'</span>'+
  (r.perf?'<span class="perf">'+r.perf+'</span>':'')+'</div>'+
  '<div class="sen">'+
  '<span class="t">'+v(r.t)+'</span>'+
  '<span class="p"'+(r.perf?' data-perf="'+esc(r.perf)+'"':'')+'>'+v(r.p)+'</span>'+
  '<span class="j">'+v(r.j)+'</span>'+
  '<span class="'+s[0]+'">'+s[1]+'</span></div></div>';
}
function qHTML(q){
 var allgen=q.rows.length&&q.rows.every(function(r){return r.src==='gen';});
 return '<div class="q"'+(allgen?' data-allgen="1"':'')+'><div class="q-hd"><span class="q-nm">'+q.nm+'</span>'+
  '<span class="q-f'+fcls(q.f)+'">'+q.f+'</span></div>'+
  '<div class="rows">'+q.rows.map(rowHTML).join('')+'</div></div>';
}
function count(c,noGen){return c.questions.reduce(function(n,q){
  return n+q.rows.filter(function(r){return !(noGen&&r.src==='gen');}).length;},0);}

var DATA=null;
function recount(){
 if(!DATA)return;
 var noGen=document.body.classList.contains('no-gen'),total=0;
 DATA.cats.forEach(function(c){
  var n=count(c,noGen); total+=n;
  var el=document.querySelector('.tab[data-cat="'+c.id+'"] .n');
  if(el)el.textContent=n;
 });
 var all=document.querySelector('.tab[data-cat="all"] .n');
 if(all)all.textContent=total;
 // 隠れた行を飛ばして、見えている最後の行だけ下線を消す
 [].forEach.call(document.querySelectorAll('.q'),function(q){
  var rs=[].slice.call(q.querySelectorAll('.r')),vis=null;
  rs.forEach(function(r){
   r.classList.remove('lastvis');
   if(!(noGen&&r.classList.contains('gen')))vis=r;
  });
  if(vis)vis.classList.add('lastvis');
 });
}

function render(data){
 DATA=data;
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

 function chips(words){
  return words.split('／').map(function(w){
   w=w.trim();
   return '<span class="vw" data-w="'+esc(w)+'">'+w+'<i></i></span>';
  }).join('');
 }
 document.getElementById('voc').innerHTML=data.vocab.map(function(w){
  return '<div class="vrow" data-voc="'+w.id+'"><span class="vtag vt-'+w.id+'">'+w.tag+
   '</span><span class="vwords">'+chips(w.words)+'</span></div>';
 }).join('')+
  '<div class="vrow" data-voc="other" hidden><span class="vtag vt-other">他分類</span>'+
  '<span class="vwords" id="vother"></span></div>'+
  '<div class="conn"><b>目的</b>の接続　'+data.conn+'</div>'+
  '<div class="conn conn-j"><b>実施内容</b>の語尾　'+data.verbs+'</div>'+
  '<div class="note-rev">'+data.reverse+'</div>';
 document.getElementById('grade').innerHTML=data.grade;
}

/* ── 操作 ─────────────────────────────────────────────── */
function init(data){
render(data);
 var B=document.body,root=document.documentElement;
 var q=document.getElementById('q'),vocd=document.getElementById('vocd');
 var intro=document.getElementById('intro'),lgb=document.getElementById('lgb');
 var side=document.getElementById('side'),onebar=document.getElementById('onebar');
 var qs=[].slice.call(document.querySelectorAll('.q'));
 var secs=[].slice.call(document.querySelectorAll('.cat'));
 var tabs=[].slice.call(document.querySelectorAll('.tab'));
 var vrows=[].slice.call(document.querySelectorAll('.vrow'));
 var STEPS=[0.85,1,1.15,1.32,1.5],scale=1,cur='plan';
 var NAME={plan:'計画',str:'構造',mep:'設備',eco:'環境負荷低減',all:'すべて'};
 var ORDER=['plan','str','mep','eco','all'];
 var VIEWS=['list','card','one'],view='list',oneIdx=0;
 var mobile=window.matchMedia('(max-width:1079px)');
 function save(k,v){try{localStorage.setItem('kj-'+k,v);}catch(e){}}
 function load(k){try{return localStorage.getItem('kj-'+k);}catch(e){return null;}}

 /* 凡例・使い方：初回だけ開く。以後は畳んだまま */
 if(!load('seen')){intro.hidden=false;lgb.setAttribute('aria-expanded','true');save('seen','1');}
 lgb.addEventListener('click',function(){
  intro.hidden=!intro.hidden;
  lgb.setAttribute('aria-expanded',String(!intro.hidden));
  lgb.querySelector('i').textContent=intro.hidden?'＋':'−';
 });
 vocd.open=!mobile.matches;

 /* ── 性能語の一覧（右レール／凡例内） ───────────────── */
 function perfCounts(c){
  var noGen=B.classList.contains('no-gen'),n={};
  DATA.cats.forEach(function(k){
   if(c!=='all'&&k.id!==c)return;
   k.questions.forEach(function(qq){qq.rows.forEach(function(r){
    if(noGen&&r.src==='gen')return;
    if(r.perf)n[r.perf]=(n[r.perf]||0)+1;});});});
  return n;
 }
 function sideRender(c){
  if(!side)return;
  var n=perfCounts(c);
  var ws=Object.keys(n).sort(function(a,b){return n[b]-n[a]||a.localeCompare(b,'ja');});
  var others=DATA.cats.filter(function(k){return k.id!==c;}).map(function(k){
   var m=perfCounts(k.id);
   return '<span>'+k.name+' '+Object.keys(m).length+'語</span>';}).join('');
  side.innerHTML='<h3>性能語の一覧<em>目的はここから選ぶ</em></h3>'+
   '<div class="sw">'+ws.map(function(w){
    return '<span class="'+(n[w]<2?'rare':'')+'">'+w+'<i>'+n[w]+'</i></span>';}).join('')+'</div>'+
   '<div class="sn">目的の骨格は <b>性能語 ＋ 接続</b> の2つだけ。ここが常に見えていれば、'+
   '思い出す作業が<b>選ぶ作業</b>に変わる。</div>'+
   '<div class="sf"><span>'+NAME[c]+' '+ws.length+'語</span>'+
   (c==='all'?'':others)+'</div>';
 }
 function vocab(c){
  var n=perfCounts(c),shown={};
  vrows.forEach(function(v){
   if(v.dataset.voc==='other')return;
   v.hidden=!(c==='all'||v.dataset.voc==='common'||v.dataset.voc==='kizon'||v.dataset.voc===c);
   [].forEach.call(v.querySelectorAll('.vw'),function(w){
    var k=n[w.dataset.w]||0;
    w.querySelector('i').textContent=k||'';
    w.classList.toggle('zero',!k);
    if(!v.hidden)shown[w.dataset.w]=1;});});
  var extra=Object.keys(n).filter(function(w){return !shown[w];}).sort();
  var row=document.querySelector('.vrow[data-voc="other"]');
  row.hidden=!extra.length;
  document.getElementById('vother').innerHTML=extra.map(function(w){
   return '<span class="vw" data-w="'+esc(w)+'">'+w+'<i>'+n[w]+'</i></span>';}).join('');
  sideRender(c);
 }

 /* ── 表示の切替（リスト／カード／1問送り） ───────────── */
 var vbtn={list:document.getElementById('vl'),card:document.getElementById('vc'),one:document.getElementById('vo')};
 function shownQs(){return qs.filter(function(e){
  return !e.hidden&&e.closest('.cat')&&!e.closest('.cat').hidden;});}
 function oneShow(){
  var list=shownQs();
  qs.forEach(function(e){e.classList.remove('oncur');});
  if(!list.length){onebar.hidden=true;return;}
  oneIdx=Math.max(0,Math.min(list.length-1,oneIdx));
  list[oneIdx].classList.add('oncur');
  onebar.hidden=(view!=='one');
 }
 function setView(v){
  view=v;save('view',v);
  VIEWS.forEach(function(k){
   B.classList.toggle('v-'+k,k===v);
   vbtn[k].classList.toggle('on',k===v);
   vbtn[k].setAttribute('aria-pressed',String(k===v));});
  onebar.hidden=(v!=='one');
  if(v==='one')oneShow();else qs.forEach(function(e){e.classList.remove('oncur');});
  label();
 }
 VIEWS.forEach(function(k){vbtn[k].addEventListener('click',function(){setView(k);});});
 document.getElementById('oprev').addEventListener('click',function(){
  oneIdx--;oneShow();window.scrollTo({top:0,behavior:'auto'});});
 document.getElementById('onext').addEventListener('click',function(){
  oneIdx++;oneShow();window.scrollTo({top:0,behavior:'auto'});});
 document.getElementById('omk').addEventListener('click',function(){
  var c=document.querySelector('.q.oncur');
  if(c){var k=c.querySelector('.q-nm').textContent;var d=load('done')||'';
   if(d.indexOf('\n'+k+'\n')<0)save('done',(d||'\n')+k+'\n');}
  oneIdx++;oneShow();window.scrollTo({top:0,behavior:'auto'});});

 function setCat(c){
  cur=c;oneIdx=0;
  ['c-plan','c-str','c-mep','c-eco','all'].forEach(function(k){B.classList.remove(k);});
  B.classList.add('c-'+(c==='all'?'plan':c));
  if(c==='all')B.classList.add('all');
  root.style.setProperty('--cat', c==='all'?'var(--ink)':'var(--t-'+c+')');
  tabs.forEach(function(t){t.setAttribute('aria-selected',String(t.dataset.cat===c));});
  secs.forEach(function(s){s.hidden=(c!=='all'&&s.dataset.cat!==c);});
  vocab(c);
  filter();label();
  if(view==='one')oneShow();
 }
 tabs.forEach(function(t){t.addEventListener('click',function(){
  q.value='';setCat(t.dataset.cat);
  window.scrollTo({top:0,behavior:mobile.matches?'auto':'smooth'});});});

 function qtext(e){
  var noGen=B.classList.contains('no-gen');
  return e.querySelector('.q-nm').textContent+
   [].filter.call(e.querySelectorAll('.r'),function(r){
    return !(noGen&&r.classList.contains('gen'));}).map(function(r){return r.textContent;}).join('');
 }
 function filter(){
  var v=q.value.trim().toLowerCase(),noGen=B.classList.contains('no-gen');
  qs.forEach(function(e){
   e.hidden=!!(noGen&&e.dataset.allgen)||!!(v&&qtext(e).toLowerCase().indexOf(v)===-1);});
  if(v||noGen)secs.forEach(function(s){
   s.hidden=(s.dataset.cat!==cur&&cur!=='all')||
    ![].slice.call(s.querySelectorAll('.q')).some(function(e){return !e.hidden;});});
  if(view==='one'){oneIdx=0;oneShow();}
 }
 function masked(){var c=B.classList;return c.contains('h-p')||c.contains('h-j');}
 function label(){
  var c=B.classList,bl=[];
  if(c.contains('h-p'))bl.push('目的');
  if(c.contains('h-j'))bl.push('実施内容');
  var t=q.value.trim(),p=[NAME[cur]];
  p.push(bl.length?'<b>'+bl.join('・')+'</b> を空欄にした練習用':'<b>全文</b>（読む用）');
  if(c.contains('marker'))p.push('マーカーあり');
  if(c.contains('no-gen'))p.push('般をのぞく');
  if(t)p.push('絞り込み：'+t);
  document.getElementById('pm').innerHTML='1級建築士製図試験　記述練習　─　'+p.join('　／　');
  c.toggle('masked',masked());
 }
 function setScale(d){var i=STEPS.indexOf(scale);i=Math.max(0,Math.min(STEPS.length-1,i+d));
  scale=STEPS[i];root.style.setProperty('--s',scale);save('s',scale);}
 var sv=parseFloat(load('s'));if(STEPS.indexOf(sv)>=0){scale=sv;root.style.setProperty('--s',scale);}

 q.addEventListener('input',function(){
  if(q.value.trim()&&cur!=='all'){setCat('all');q.focus();return;}
  filter();label();});

 function slot(id,cls,sel,onOpen){var b=document.getElementById(id);
  function go(){var on=B.classList.toggle(cls);b.classList.toggle('on',on);
   [].forEach.call(document.querySelectorAll(sel),function(s){s.classList.remove('show');});
   if(on&&onOpen)onOpen();label();}
  b.addEventListener('click',go);return go;}
 var gp=slot('hp','h-p','.sen .p');
 var gj=slot('hj','h-j','.sen .j');
 function tog(id,cls){var b=document.getElementById(id);
  function go(){b.classList.toggle('on',B.classList.toggle(cls));label();}
  b.addEventListener('click',go);return go;}
 var gm=tog('mk','marker');
 (function(){
  var b=document.getElementById('gn');
  b.classList.add('on');b.setAttribute('aria-pressed','true');
  b.addEventListener('click',function(){
   var show=!B.classList.toggle('no-gen');
   b.classList.toggle('on',show);b.setAttribute('aria-pressed',String(show));
   recount();vocab(cur);filter();label();});
 })();
 document.getElementById('sm').addEventListener('click',function(){setScale(-1);});
 document.getElementById('sp').addEventListener('click',function(){setScale(1);});
 document.getElementById('pr').addEventListener('click',function(){vocd.open=true;label();window.print();});

 /* 全表示：丸ボタン（fixed）はやめて、ツール列のボタンにする。
    iOS Safari の下部バーに潜って押せない問題が原理的に起きない。 */
 var pkb=document.getElementById('pk');
 function peek(on){B.classList.toggle('peek',on);pkb.classList.toggle('on',on);
  pkb.setAttribute('aria-pressed',String(on));}
 pkb.addEventListener('click',function(){peek(!B.classList.contains('peek'));});
 /* 押している間だけの全表示（0キー／左ボタン長押し）。
    離したら押す前に戻すので、ボタンで固定した全表示を巻き添えにしない。 */
 var held=null;
 function hold(on){
  B.classList.toggle('hold',on);
  if(on){if(held===null)held=B.classList.contains('peek');peek(true);}
  else if(held!==null){peek(held);held=null;}
 }

 /* 本文はどこをタップしても1回で開く。隠している枠が2つあっても、
    全表示と同じように文まるごとが一度で出る（設問名で設問まるごと） */
 document.addEventListener('click',function(ev){
  var el=ev.target;if(!el||!el.closest)return;
  var sen=el.closest('.sen');
  if(sen&&masked()){
   var sp=[].slice.call(sen.querySelectorAll('.t,.p,.j'));
   var open=sp.some(function(x){return x.classList.contains('show');});
   sp.forEach(function(x){x.classList.toggle('show',!open);});
   return;}
  var h=el.closest('.q-hd');
  if(h&&masked()){
   var all=[].slice.call(h.parentNode.querySelectorAll('.sen .t,.sen .p,.sen .j'));
   var op=all.some(function(x){return x.classList.contains('show');});
   all.forEach(function(x){x.classList.toggle('show',!op);});}
 });
 /* マウスのときだけ効く2つ（ホバーで覗く／左ボタン長押しで全表示）。
    メディアクエリではなく pointerType を見る。環境によって
    (hover:hover) が false を返すことがあり、そこで取りこぼさないため。 */
 function isMouse(ev){return !ev.pointerType||ev.pointerType==='mouse';}

 /* 空欄にカーソルを置くと、その文だけ出る（クリック不要）。
    少しだけ待つのは、通りすがりのカーソルで答が流れないようにするため。 */
 var HOV=120,hovEl=null,hovT=null;
 function setHov(s){
  clearTimeout(hovT);
  if(s===hovEl)return;
  if(!s){if(hovEl)hovEl.classList.remove('hov');hovEl=null;return;}
  hovT=setTimeout(function(){
   if(hovEl)hovEl.classList.remove('hov');
   hovEl=s;s.classList.add('hov');},HOV);
 }
 document.addEventListener('pointerover',function(ev){
  if(!isMouse(ev))return;
  var el=ev.target;if(!el||!el.closest)return setHov(null);
  var box=el.closest('.sen .p,.sen .j');
  var c=box&&box.classList;
  var on=!!box&&((c.contains('p')&&B.classList.contains('h-p'))||
                 (c.contains('j')&&B.classList.contains('h-j')));
  setHov(on?box.closest('.sen'):null);
 });
 document.addEventListener('pointerout',function(ev){if(!ev.relatedTarget)setHov(null);});

 /* 左ボタンを押している間は全表示。待ち時間は置かない（押した瞬間に出す）。
    画面のどこで押しても効く。離したあとの click はそのまま通すので、
    本文をクリックして1文だけ開いたままにする操作は今までどおり効く。
    検索欄だけは、文字を選べるように外してある。 */
 var lpOn=false;
 document.addEventListener('pointerdown',function(ev){
  if(ev.button!==0||!isMouse(ev)||!masked())return;
  var el=ev.target;
  if(el&&el.closest&&el.closest('input,textarea,select'))return;
  lpOn=true;hold(true);
 });
 function lpEnd(){if(!lpOn)return;lpOn=false;hold(false);}
 document.addEventListener('pointerup',lpEnd);
 document.addEventListener('pointercancel',lpEnd);
 window.addEventListener('blur',function(){lpEnd();setHov(null);});

 document.addEventListener('keydown',function(e){
  if(e.target.tagName==='INPUT'){if(e.key==='Escape'){q.value='';filter();label();q.blur();}return;}
  if(e.metaKey||e.ctrlKey||e.altKey)return;
  var k=e.key,i=ORDER.indexOf(cur);
  if(k==='2'){gp();e.preventDefault();}
  else if(k==='3'){gj();e.preventDefault();}
  else if(k==='0'&&!e.repeat){hold(true);e.preventDefault();}
  else if(k==='ArrowRight'){setCat(ORDER[(i+1)%ORDER.length]);e.preventDefault();}
  else if(k==='ArrowLeft'){setCat(ORDER[(i+ORDER.length-1)%ORDER.length]);e.preventDefault();}
  else if(k.toLowerCase()==='v'){setView(VIEWS[(VIEWS.indexOf(view)+1)%VIEWS.length]);}
  else if(k.toLowerCase()==='m'){gm();}
  else if(k.toLowerCase()==='p'){vocd.open=true;label();window.print();e.preventDefault();}
  else if(k==='+'||k==='='){setScale(1);e.preventDefault();}
  else if(k==='-'){setScale(-1);e.preventDefault();}
  else if(k==='/'){q.focus();e.preventDefault();}
  else if(k==='Escape'){held=null;peek(false);}
 });
 document.addEventListener('keyup',function(e){if(e.key==='0')hold(false);});
 if(mobile.addEventListener)mobile.addEventListener('change',function(){vocd.open=!mobile.matches;});
 window.addEventListener('beforeprint',function(){vocd.open=true;label();});

 var vw=load('view');setView(VIEWS.indexOf(vw)>=0?vw:'list');
 setCat('plan');
 recount();
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
