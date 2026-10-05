(function(){
/* ── 描画 ───────────────────────────────────────────────
   questions.json を読み込んで本文を組み立てる。
   本文中の #…# は赤い数字（.v）になる。<b>…</b> はそのまま太字。 */
function v(s){return s.replace(/#([^#]+)#/g,'<span class="v">$1</span>');}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');}
function fcls(f){return f==='般'?' gen':f==='既'?' kizon':f==='1'?' lo':'';}
var SRC={T:['src','T'],S:['src','S'],TS:['src both','T·S'],N:['src n','日'],
         gen:['src gen','般'],kizon:['src kizon','既']};

function rowHTML(r,k){
 var s=SRC[r.src]||SRC.T;
 return '<div class="r'+(r.src==='gen'?' gen':'')+'" data-k="'+esc(k)+'"'+
  (r.perf?' data-perf="'+esc(r.perf)+'"':'')+(r.no?' data-no="'+r.no+'"':'')+'>'+
  '<div class="khd"><button class="mkd" type="button" aria-label="覚えた" aria-pressed="false"></button>'+
  (r.no?'<span class="no">'+r.no+'</span>':'')+'<span class="kir">'+r.kir+'</span>'+
  (r.perf?'<span class="perf">'+r.perf+'</span>':'')+'</div>'+
  '<div class="sen">'+
  '<span class="t">'+v(r.t)+'</span>'+
  '<span class="p"'+(r.perf?' data-perf="'+esc(r.perf)+'"':'')+'>'+v(r.p)+'</span>'+
  '<span class="j">'+v(r.j)+'</span>'+
  '<span class="'+s[0]+'">'+s[1]+'</span></div></div>';
}
function qHTML(q,cid){
 return '<div class="q"><div class="q-hd"><span class="q-nm">'+q.nm+'</span>'+
  '<span class="q-f'+fcls(q.f)+'">'+q.f+'</span></div>'+
  (q.ask?'<div class="ask">'+q.ask+'</div>':'')+
  (q.fig?'<div class="fig" data-src="'+esc(q.fig)+'"></div>':'')+
  '<div class="rows">'+q.rows.map(function(r){
    return rowHTML(r,dkey(cid,q.nm,r.kir));}).join('')+'</div></div>';
}

/* ── 解答 ───────────────────────────────────────────────
   questions.json の exams。見出し（要求）ごとに、登録した行を並びどおりにつなぐ。
   行はそのまま参照するので、文を直せば解答も直る。隠す・覚えた印とは関係なく全文を出す。 */
/* 文の並び。「主語・目的・実施」と「主語・実施・目的」を切り替える。
   実施を先に出すときは「…した。」を「…することで、」に、目的は「…に配慮した。」に直す。 */
function revJ(j){return /した。$/.test(j)?j.replace(/した。$/,'することで、'):j.replace(/た。$/,'ることで、');}
function revP(p){var s=p.replace(/、$/,'');
 if(/て$/.test(s))return s.replace(/て$/,'た。');
 return s+(/ように$/.test(s)?'配慮した。':'に配慮した。');}
function sentHTML(s,ord){
 var txt=ord==='tjp'?s.t+revJ(s.j)+revP(s.p):s.t+s.p+s.j;
 return '<span class="ans-s">'+v(txt)+'</span>';}
function ansHTML(data,ord){
 return (data.exams||[]).map(function(ex){
  return '<section class="ans-ex"><h2 class="ans-tt">'+esc(ex.title)+'</h2>'+
   ex.items.map(function(it){
    var sens=(it.sentences||[]).map(function(s){return sentHTML(s,ord);}).join('');
    return '<div class="ans-it"><div class="ans-q"><span class="no">'+esc(it.no)+'</span>'+
     (it.cat?'<span class="ans-cat">'+esc(it.cat)+'</span>':'')+esc(it.q)+'</div>'+
     (sens?'<p class="ans-a">'+sens+'</p>':'<p class="ans-a none">（図示）</p>')+'</div>';
   }).join('')+'</section>';
 }).join('');
}

/* ── 覚えた行 ───────────────────────────────────────────
   行の見分けは「分類｜設問名｜切り口」。設問データには何も書き込まず、
   この端末の localStorage にだけ残す。文言を直すと印はその行だけ外れるが、
   外れる側（＝また出てくる側）に倒しているので練習の取りこぼしにはならない。 */
function dkey(cid,qnm,kir){return cid+'|'+qnm+'|'+kir;}
var DONE={},DSTACK=[];
function lsGet(k){try{return localStorage.getItem('kj-'+k);}catch(e){return null;}}
function lsSet(k,v){try{localStorage.setItem('kj-'+k,v);}catch(e){}}
function saveDone(){lsSet('done2',Object.keys(DONE).join('\n'));}
function loadDone(data){
 var s=lsGet('done2');
 if(s!==null){s.split('\n').forEach(function(k){if(k)DONE[k]=1;});return;}
 /* 旧「1問送りの覚えた」は設問名だけを持っていた。その設問の全行の印に読み替える */
 var old=lsGet('done')||'';
 if(old)data.cats.forEach(function(c){c.questions.forEach(function(q){
  if(old.indexOf('\n'+q.nm+'\n')>=0)
   q.rows.forEach(function(r){DONE[dkey(c.id,q.nm,r.kir)]=1;});});});
 saveDone();
}
/* いまの表示。0＝全部 ／ 1＝覚えた以外 ／ 2＝覚えただけ */
function dmode(){var c=document.body.classList;
 return c.contains('only-done')?2:c.contains('hide-done')?1:0;}
/* 行が今の設定で見えているか。件数・検索・性能語の数え方を1か所にまとめる */
function rvis(el,noGen,dm){
 if(noGen&&el.classList.contains('gen'))return false;
 var on=el.classList.contains('done');
 return dm===1?!on:dm===2?on:true;
}
function rows(cid){return document.querySelectorAll(
  (cid==='all'?'.cat':'.cat[data-cat="'+cid+'"]')+' .r');}
function count(cid,noGen,dm){var n=0;
 [].forEach.call(rows(cid),function(el){if(rvis(el,noGen,dm))n++;});
 return n;}

var DATA=null,UPD='';
/* 更新日付。令和で出す（令和1年＝2019年） */
function wareki(v){
 if(!v)return '';
 var d=new Date(v);if(isNaN(d))return '';
 var y=d.getFullYear()-2018,m=d.getMonth()+1,n=d.getDate();
 if(y<1)return '';
 return 'R'+y+'.'+(m<10?'0':'')+m+'.'+(n<10?'0':'')+n;
}
function recount(){
 if(!DATA)return;
 var noGen=document.body.classList.contains('no-gen'),dm=dmode(),total=0;
 DATA.cats.forEach(function(c){
  var n=count(c.id,noGen,dm); total+=n;
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
   if(rvis(r,noGen,dm))vis=r;
  });
  if(vis)vis.classList.add('lastvis');
 });
}

function render(data){
 DATA=data;
 document.getElementById('cats').innerHTML=data.cats.map(function(c){
  return '<section class="cat c-'+c.id+'" data-cat="'+c.id+'">'+
   '<div class="cat-hd"><span class="cat-mk">'+c.name+'</span></div>'+
   c.questions.map(function(q){return qHTML(q,c.id);}).join('')+'</section>';
 }).join('');
 /* 覚えた印を本文に載せてから数える（件数は印を反映した数にする）。
    設問データを直して行が入れ替わったときは、行き先のない印はここで捨てる。
    印が外れた行はまた出てくるだけなので、練習の取りこぼしにはならない。 */
 var seen={},lost=0;
 [].forEach.call(document.querySelectorAll('.r'),function(el){
  var on=!!DONE[el.dataset.k];
  seen[el.dataset.k]=1;
  el.classList.toggle('done',on);
  el.querySelector('.mkd').setAttribute('aria-pressed',String(on));
 });
 Object.keys(DONE).forEach(function(k){if(!seen[k]){delete DONE[k];lost++;}});
 if(lost)saveDone();

 var total=count('all',false,0);
 document.getElementById('tabs').innerHTML=data.cats.map(function(c){
  return '<button class="tab tab-'+c.id+'" role="tab" data-cat="'+c.id+'" '+
   'aria-selected="false" type="button">'+c.name+'<span class="n">'+count(c.id,false,0)+'</span></button>';
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

/* ── 図示 ───────────────────────────────────────────────
   図は figs/*.svg を読んで本文に埋め込む（CSS で線の色や空欄を切り替えるため）。
   SVG の約束は3つ。
   　.d  … 隠せる寸法・部位名。<g class="d" transform="…"><text text-anchor="middle">…</text></g>
   　　　　 空欄の四角は文字数から見積もってここで足す（隠れた設問でも寸法が要らない）
   　.mk … 注記の番号。data-no が設問の行の "no" とつながる
   　id  … 図ごとに頭に名前をつける（pty-ar など）。同じページに並ぶため */
function figPrep(box){
 [].forEach.call(box.querySelectorAll('.d'),function(g){
  var t=g.querySelector('text');if(!t||g.querySelector('rect'))return;
  var fs=parseFloat(t.getAttribute('font-size'))||12,w=0;
  t.textContent.split('').forEach(function(ch){w+=/[\x20-\x7e]/.test(ch)?.56:1;});
  w=w*fs+6;
  var r=document.createElementNS('http://www.w3.org/2000/svg','rect');
  r.setAttribute('x',-w/2);r.setAttribute('y',-fs*.92);
  r.setAttribute('width',w);r.setAttribute('height',fs*1.2);
  g.insertBefore(r,t);
 });
}
function loadFigs(){
 [].forEach.call(document.querySelectorAll('.fig[data-src]'),function(box){
  fetch(box.dataset.src).then(function(r){
   if(!r.ok)throw new Error('HTTP '+r.status);return r.text();})
  .then(function(s){box.innerHTML=s;figPrep(box);})
  .catch(function(e){box.innerHTML='<div class="fig-err">図（'+esc(box.dataset.src)+'）を読み込めませんでした　'+e.message+'</div>';});
 });
}

/* ── 操作 ─────────────────────────────────────────────── */
function init(data){
loadDone(data);
render(data);
loadFigs();
 var B=document.body,root=document.documentElement;
 var q=document.getElementById('q'),vocd=document.getElementById('vocd');
 var intro=document.getElementById('intro'),lgb=document.getElementById('lgb');
 var side=document.getElementById('side'),onebar=document.getElementById('onebar');
 var qs=[].slice.call(document.querySelectorAll('.q'));
 var secs=[].slice.call(document.querySelectorAll('.cat'));
 var tabs=[].slice.call(document.querySelectorAll('.tab'));
 var vrows=[].slice.call(document.querySelectorAll('.vrow'));
 var STEPS=[0.85,1,1.15,1.32,1.5],scale=1,cur='plan';
 var NAME={all:'すべて'},ORDER=[];
 data.cats.forEach(function(c){NAME[c.id]=c.name;ORDER.push(c.id);});
 ORDER.push('all');
 var VIEWS=['list','card','one'],view='list',oneIdx=0;
 var mobile=window.matchMedia('(max-width:1079px)');
 var save=lsSet,load=lsGet;

 /* 道具の開閉（1080px 未満だけ効く）。分類タブの右端の「設定」で開く。
    畳んだ状態を既定にして、本文の取り分を増やしている */
 var cfg=document.getElementById('cfg');
 function setCfg(on){
  B.classList.toggle('cfg',on);
  cfg.setAttribute('aria-expanded',String(on));
  save('cfg',on?'1':'');
 }
 cfg.addEventListener('click',function(){setCfg(!B.classList.contains('cfg'));});
 setCfg(load('cfg')==='1');

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
  var noGen=B.classList.contains('no-gen'),dm=dmode(),n={};
  [].forEach.call(rows(c),function(el){
   if(!rvis(el,noGen,dm))return;
   var p=el.dataset.perf;
   if(p)n[p]=(n[p]||0)+1;});
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
 /* 解答（丸ごと通読）。表示は本文の代わりに #ans を出す。分類・表示の切替で閉じる */
 var ansOn=false,va=document.getElementById('va');
 var ansOrd=load('ansord')==='tjp'?'tjp':'tpj';
 function renderAns(){
  document.getElementById('ans').innerHTML=
   '<div class="ans-tools"><button id="ansOrd" type="button">'+
   (ansOrd==='tpj'?'主語・目的・実施':'主語・実施・目的')+'</button></div>'+ansHTML(data,ansOrd);
  document.getElementById('ansOrd').addEventListener('click',function(){
   ansOrd=ansOrd==='tpj'?'tjp':'tpj';save('ansord',ansOrd);renderAns();});
 }
 renderAns();
 var ansEl=document.getElementById('ans'),catsEl=document.getElementById('cats');
 function setAns(on){
  ansOn=on;ansEl.hidden=!on;catsEl.hidden=on;
  va.classList.toggle('on',on);va.setAttribute('aria-pressed',String(on));
  VIEWS.forEach(function(k){vbtn[k].classList.toggle('on',!on&&k===view);
   vbtn[k].setAttribute('aria-pressed',String(!on&&k===view));});
  onebar.hidden=on||view!=='one';
 }
 va.addEventListener('click',function(){setAns(!ansOn);window.scrollTo({top:0,behavior:'auto'});});

 function setView(v){
  if(ansOn)setAns(false);
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
 /* 1問送りの「覚えた」は、その設問の見えている行すべてに印をつけて次へ進む */
 document.getElementById('omk').addEventListener('click',function(){
  var c=document.querySelector('.q.oncur'),at=oneIdx;
  if(c){
   var noGen=B.classList.contains('no-gen'),dm=dmode();
   mark([].filter.call(c.querySelectorAll('.r'),function(r){
    return rvis(r,noGen,dm);}),true);
  }
  /* 隠す設定だと印をつけた設問自体が消えるので、その場合は進めない（次がもう来ている） */
  oneIdx=(c&&c.hidden)?at:at+1;
  oneShow();window.scrollTo({top:0,behavior:'auto'});});

 function setCat(c){
  if(ansOn)setAns(false);
  cur=c;oneIdx=0;
  ORDER.forEach(function(k){B.classList.remove(k==='all'?'all':'c-'+k);});
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

 function qtext(e,noGen,dm){
  return e.querySelector('.q-nm').textContent+
   [].filter.call(e.querySelectorAll('.r'),function(r){
    return rvis(r,noGen,dm);}).map(function(r){return r.textContent;}).join('');
 }
 /* 見える行が1つも残らない設問・分類は、そのまま畳む（般・覚えた・検索とも同じ扱い） */
 function filter(){
  var v=q.value.trim().toLowerCase(),noGen=B.classList.contains('no-gen'),dm=dmode();
  qs.forEach(function(e){
   e.hidden=![].some.call(e.querySelectorAll('.r'),function(r){return rvis(r,noGen,dm);})||
    !!(v&&qtext(e,noGen,dm).toLowerCase().indexOf(v)===-1);});
  secs.forEach(function(s){
   s.hidden=(s.dataset.cat!==cur&&cur!=='all')||
    ![].slice.call(s.querySelectorAll('.q')).some(function(e){return !e.hidden;});});
  if(view==='one')oneShow();   /* 位置は oneShow が範囲内に丸める。頭出しは呼ぶ側で */
 }
 function masked(){var c=B.classList;return c.contains('h-p')||c.contains('h-j')||c.contains('h-d');}
 function label(){
  var c=B.classList,bl=[];
  if(c.contains('h-p'))bl.push('目的');
  if(c.contains('h-j'))bl.push('実施内容');
  if(c.contains('h-d')&&document.querySelector('.q:not([hidden]) .fig'))bl.push('図中の寸法');
  var t=q.value.trim(),p=[NAME[cur]];
  p.push(bl.length?'<b>'+bl.join('・')+'</b> を空欄にした練習用':'<b>全文</b>（読む用）');
  if(c.contains('marker'))p.push('マーカーあり');
  if(c.contains('no-gen'))p.push('般をのぞく');
  if(c.contains('hide-done'))p.push('覚えた行をのぞく');
  if(c.contains('only-done'))p.push('覚えた行だけ');
  if(t)p.push('絞り込み：'+t);
  /* 画面に出すのは表題だけ。分類も、何をどう隠しているかも、紙にだけ添える */
  document.getElementById('pm').innerHTML='1級建築士製図試験　記述練習'+
   '<span class="pm-mode">　─　'+p.join('　／　')+'</span>'+
   (UPD?'<span class="pm-date">'+UPD+'</span>':'');
  c.toggle('masked',masked());
 }
 function setScale(d){var i=STEPS.indexOf(scale);i=Math.max(0,Math.min(STEPS.length-1,i+d));
  scale=STEPS[i];root.style.setProperty('--s',scale);save('s',scale);}
 var sv=parseFloat(load('s'));if(STEPS.indexOf(sv)>=0){scale=sv;root.style.setProperty('--s',scale);}

 q.addEventListener('input',function(){
  if(q.value.trim()&&cur!=='all'){setCat('all');q.focus();return;}
  oneIdx=0;filter();label();});

 function slot(id,cls,sel,onOpen){var b=document.getElementById(id);
  function go(){var on=B.classList.toggle(cls);b.classList.toggle('on',on);
   [].forEach.call(document.querySelectorAll(sel),function(s){s.classList.remove('show');});
   if(on&&onOpen)onOpen();label();}
  b.addEventListener('click',go);return go;}
 var gp=slot('hp','h-p','.sen .p');
 var gj=slot('hj','h-j','.sen .j');
 var gd=slot('hd','h-d','.fig .d');
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
   refresh();});
 })();

 /* ── 覚えた行 ─────────────────────────────────────────
    切り口の左の○で1行ずつ印をつけ、「覚」で 全部→覚えた以外→覚えただけ を回す。
    印は端末に残るだけで、questions.json には何も書かない。
    間違えて押してもすぐ戻せるように、直前の分と全部の2つの戻し方を置いている。 */
 var dnb=document.getElementById('dn'),dnbar=document.getElementById('dnbar');
 function refresh(){recount();vocab(cur);filter();label();dnShow();}
 function dnShow(){
  var n=Object.keys(DONE).length,dm=dmode();
  dnbar.hidden=!n;
  document.getElementById('dnn').textContent=n;
  document.getElementById('dnu').disabled=!DSTACK.length;
  dnb.classList.toggle('on',dm===1);
  dnb.classList.toggle('only',dm===2);
  dnb.setAttribute('aria-pressed',String(dm>0));
  dnb.querySelector('i').textContent=dm===1?'−':dm===2?'●':'';
  dnb.title=dm===1?'覚えた行を隠している（もう一度押すと覚えた行だけ）':
   dm===2?'覚えた行だけ出している（もう一度押すと全部）':
   '押すたび　全部 → 覚えた以外 → 覚えただけ';
 }
 function mark(els,on){
  var ch=[];
  els.forEach(function(el){
   if(!!DONE[el.dataset.k]===on)return;
   if(on)DONE[el.dataset.k]=1;else delete DONE[el.dataset.k];
   el.classList.toggle('done',on);
   el.querySelector('.mkd').setAttribute('aria-pressed',String(on));
   ch.push(el);
  });
  if(!ch.length)return;
  if(on)DSTACK.push(ch.map(function(el){return el.dataset.k;}));
  saveDone();refresh();
 }
 function unmark(keys){
  var set={};keys.forEach(function(k){set[k]=1;});
  mark([].filter.call(document.querySelectorAll('.r'),function(el){
   return set[el.dataset.k];}),false);
 }
 dnb.addEventListener('click',function(){
  var dm=(dmode()+1)%3;
  B.classList.toggle('hide-done',dm===1);
  B.classList.toggle('only-done',dm===2);
  save('dm',String(dm));
  refresh();
 });
 document.getElementById('dnu').addEventListener('click',function(){
  var last=DSTACK.pop();
  if(last)unmark(last);else dnShow();
 });
 document.getElementById('dnr').addEventListener('click',function(){
  if(!confirm('覚えた印を全部外します。よろしいですか。'))return;
  DSTACK=[];DONE={};
  [].forEach.call(document.querySelectorAll('.r.done'),function(el){
   el.classList.remove('done');
   el.querySelector('.mkd').setAttribute('aria-pressed','false');});
  saveDone();refresh();
 });
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
 function senOpen(sens,open){
  sens.forEach(function(sen){[].forEach.call(sen.querySelectorAll('.t,.p,.j'),function(x){
   x.classList.toggle('show',open);});});
 }
 document.addEventListener('click',function(ev){
  var el=ev.target;if(!el||!el.closest)return;
  /* 切り口の左の○：その行だけ覚えた印をつける・外す */
  var md=el.closest('.mkd');
  if(md){var r=md.closest('.r');mark([r],!r.classList.contains('done'));return;}
  /* 図の寸法：押した1つだけ開く・閉じる */
  var dg=el.closest('.fig .d');
  if(dg){dg.classList.toggle('show');return;}
  /* 図の番号：その番号の文を開く・閉じる。文のほうも一瞬光らせて、どれか分かるようにする */
  var mk=el.closest('.fig .mk');
  if(mk){
   var rs=[].slice.call(mk.closest('.q').querySelectorAll('.r[data-no="'+mk.dataset.no+'"]'));
   var sens=rs.map(function(r){return r.querySelector('.sen');});
   if(masked()){
    var op=sens.some(function(s){return s.querySelector('.show');});
    senOpen(sens,!op);}
   rs.forEach(function(r){r.classList.remove('ping');void r.offsetWidth;r.classList.add('ping');});
   return;}
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
   all.forEach(function(x){x.classList.toggle('show',!op);});
   [].forEach.call(h.parentNode.querySelectorAll('.fig .d'),function(x){x.classList.toggle('show',!op);});}
 });
 /* 図の番号と文を結ぶ：どちらかに触れている間、もう片方にも印をつける */
 var link=null;
 function setLink(q,no){
  var k=q?no+'@'+qs.indexOf(q):null;
  if(link&&link.k===k)return;
  if(link)link.els.forEach(function(e){e.classList.remove('on');});
  link=null;if(!q)return;
  var els=[].slice.call(q.querySelectorAll('.r[data-no="'+no+'"],.fig .mk[data-no="'+no+'"]'));
  els.forEach(function(e){e.classList.add('on');});
  link={k:k,els:els};
 }
 document.addEventListener('pointerover',function(ev){
  var el=ev.target;if(!el||!el.closest)return setLink(null);
  var t=el.closest('.fig .mk,.r[data-no]');
  setLink(t&&t.closest('.q'),t&&t.dataset.no);
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
    ただし「意味のあるクリック」の上では出さない。ボタン・タブ・検索欄と、
    クリックで開け閉めする本文（文そのものと設問名）は、それぞれの動きが先。
    余白を押したときだけ全表示になる。 */
 var NOHOLD='button,a,input,textarea,select,summary,.sen,.q-hd,.fig .d,.fig .mk';
 var lpOn=false;
 document.addEventListener('pointerdown',function(ev){
  if(ev.button!==0||!isMouse(ev)||!masked())return;
  var el=ev.target;
  if(!el||!el.closest||el.closest(NOHOLD))return;
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
  else if(k==='4'){gd();e.preventDefault();}
  else if(k==='5'){dnb.click();e.preventDefault();}
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

 var dm0=parseInt(load('dm'),10)||0;
 B.classList.toggle('hide-done',dm0===1);
 B.classList.toggle('only-done',dm0===2);
 var vw=load('view');setView(VIEWS.indexOf(vw)>=0?vw:'list');
 setCat('plan');
 recount();dnShow();
}

fetch('questions.json')
 .then(function(r){
  if(!r.ok)throw new Error('HTTP '+r.status);
  var lm=r.headers.get('last-modified');
  return r.json().then(function(d){UPD=wareki(d.updated||lm);return d;});})
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
