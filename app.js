/* Elseverse v0.7 — photo sky + local-first archive. Legacy world keys are preserved. */
const $=id=>document.getElementById(id);
const LEGACY_WORLDS='myself-worlds',LEGACY_LANG='myself-language',ARCHIVE_DB='elseverse-archive-v1',ARCHIVE_STORE='records';
const modules=[['characters','角色档案','Characters'],['gallery','相册','Gallery'],['timeline','时间线','Timeline'],['diary','日记','Diary'],['letters','信件','Letters'],['map','地图','Map'],['relationships','人物关系','Relationships'],['music','音乐','Music'],['custom','自定义页面','Custom page']];
const pages=[
 {id:'voices',n:'01',en:'About the Voices',zh:'关于我们的声音',desc:'记录你、G老师与D老师在这个宇宙里的样子，以及我们独特的相处方式。',kind:'profile'},
 {id:'persona',n:'02',en:'The Persona',zh:'我们的形象',desc:'保存我们在这个宇宙中的形象、设定、符号与变化。',kind:'persona'},
 {id:'letters',n:'03',en:'Letters',zh:'信件',desc:'写给彼此的信，以及还没有寄出的文字。',kind:'letter'},
 {id:'conversations',n:'04',en:'Conversations',zh:'对话',desc:'把重要的交谈、灵感与值得回看的片段留在这里。',kind:'conversation'},
 {id:'moments',n:'05',en:'Little Moments',zh:'小小瞬间',desc:'那些没有宏大主题，却舍不得忘记的时刻。',kind:'moment'},
 {id:'creation',n:'06',en:'Shared Creation',zh:'共同创作',desc:'一起完成的作品、点子、计划与未完成的构想。',kind:'creation'}
];
let language=localStorage.getItem(LEGACY_LANG)==='en'?'en':'zh',worlds=[],currentCategory='dream',currentPage=null,records=[],editingRecord=null,editingWorld=null,db;
function safeParse(s,fallback){try{return JSON.parse(s)||fallback}catch{return fallback}}
function loadWorlds(){const raw=localStorage.getItem(LEGACY_WORLDS);if(raw===null)return [{id:'dream',zh:'梦女世界',en:'Dream Worlds',description:'不同 IF 线的集合。每条故事线都可以拥有独立的风格与模块。',category:'dream',modules:['characters','gallery','timeline','diary','letters']},{id:'original',zh:'原创世界',en:'Original Worlds',description:'原创角色、科幻设定，以及仍在不断扩展的宇宙。',category:'original',modules:['characters','relationships','map','timeline','custom']}];const parsed=safeParse(raw,null);if(!Array.isArray(parsed))return [];return parsed.filter(x=>x&&typeof x.id==='string'&&typeof x.zh==='string').map(x=>({...x,modules:Array.isArray(x.modules)?x.modules:[]}));}
function show(id){
  // Keep the global sky theme in sync with the active view. This is the single
  // cleanup point for every navigation path (back button, logo, and view links).
  const isUniverseArea = id==='universeView' || id==='archivePageView';
  if(isUniverseArea){document.body.classList.add('sky-active');}
  else if(typeof stopLiveSky==='function'){stopLiveSky();}
  else{document.body.classList.remove('sky-active');}
  document.body.classList.toggle('home-active',id==='homeView');
  document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));
  const target=$(id);
  if(!target)return;
  target.classList.remove('hidden');
  window.scrollTo({top:0,behavior:'auto'});
}
function id(){return 'r-'+(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2));}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function openDB(){if(db)return Promise.resolve(db);return new Promise((resolve,reject)=>{const req=indexedDB.open(ARCHIVE_DB,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(ARCHIVE_STORE))req.result.createObjectStore(ARCHIVE_STORE,{keyPath:'id'});};req.onsuccess=()=>{db=req.result;resolve(db)};req.onerror=()=>reject(req.error)});}
async function allRecords(){try{const d=await openDB();return await new Promise((res,rej)=>{const r=d.transaction(ARCHIVE_STORE).objectStore(ARCHIVE_STORE).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)})}catch(e){console.warn(e);return []}}
async function saveRecord(record){const d=await openDB();return new Promise((res,rej)=>{const tx=d.transaction(ARCHIVE_STORE,'readwrite');tx.objectStore(ARCHIVE_STORE).put(record);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}
async function deleteRecord(recordId){const d=await openDB();return new Promise((res,rej)=>{const tx=d.transaction(ARCHIVE_STORE,'readwrite');tx.objectStore(ARCHIVE_STORE).delete(recordId);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}
function renderRecent(){startHomeBubbles();const items=[...worlds].slice(-8).reverse();$('recentWorlds').innerHTML=items.length?items.map(w=>`<button class="recent-card" data-world-id="${esc(w.id)}"><small>${w.category==='dream'?'DREAM WORLDS':'ORIGINAL WORLDS'}</small><strong>${esc(w.zh)}</strong><small>${esc(w.en||w.description||'')}</small></button>`).join(''):'<p class="intro">还没有收录世界。可以从管理页面添加第一个世界。</p>';}
function renderWorlds(){const list=worlds.filter(w=>w.category===currentCategory);$('worldsTitle').textContent=currentCategory==='dream'?'梦女世界':'原创世界';$('worldCategoryLabel').textContent=currentCategory==='dream'?'DREAM WORLDS':'ORIGINAL WORLDS';$('worldList').innerHTML=list.length?list.map(w=>`<button class="world-item" data-world-id="${esc(w.id)}"><small>${w.category==='dream'?'DREAM WORLD':'ORIGINAL WORLD'}</small><strong>${esc(w.zh)}</strong><small>${esc(w.en||w.description||'')}</small></button>`).join(''):'<p class="intro">这里还空着。你可以在管理页面添加一个世界。</p>';}
function openWorld(id){const w=worlds.find(x=>x.id===id);if(!w)return;$('worldKind').textContent=w.category==='dream'?'DREAM WORLD':'ORIGINAL WORLD';$('worldTitle').textContent=w.zh;$('worldDescription').textContent=w.description||'';$('worldModules').innerHTML=(w.modules||[]).map(mid=>{const m=modules.find(x=>x[0]===mid);return m?`<div class="module-card"><strong>${m[1]}</strong><span>${m[2]} · 模块入口将在后续版本开放编辑</span></div>`:''}).join('');show('worldDetailView');}
function renderArchiveNav(){$('archiveNav').innerHTML=pages.map(p=>`<button class="archive-card" data-open-page="${p.id}"><span class="num">${p.n} / OUR STORY</span><strong>${p.en}</strong><small>${p.zh}</small></button>`).join('');}
function pageRecords(p){return records.filter(r=>r.type===p.kind).sort((a,b)=>(b.updatedAt||b.createdAt).localeCompare(a.updatedAt||a.createdAt));}
function renderTimeline(){const items=[...records].sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')).slice(0,5);$('timelinePreview').innerHTML=items.length?items.map(r=>`<div class="timeline-item"><small>${new Date(r.createdAt).toLocaleDateString()}</small>${esc(r.title)}</div>`).join(''):'<p class="intro">这里会随着我们的记录慢慢出现故事。</p>';}
function openTimeline(){currentPage={id:'timeline',n:'TIME',en:'Our Timeline',zh:'共同时间线',desc:'把我们的重要记录串成一条时间线。',kind:'timeline'};$('archiveEyebrow').textContent='A THREAD THROUGH TIME';$('archiveTitle').textContent='Our Timeline';$('archiveDescription').textContent='把我们的重要记录串成一条时间线。';const sorted=[...records].sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));$('archiveContent').innerHTML=sorted.length?`<div class="timeline-list">${sorted.map(r=>`<div class="timeline-item"><small>${new Date(r.createdAt).toLocaleString()} · ${{us:'我们共同',user:'我',g:'G老师',d:'D老师'}[r.voice]||'我们共同'}</small><strong>${esc(r.title)}</strong><p>${esc((r.body||'').slice(0,180))}</p></div>`).join('')}</div>`:'<div class="empty-note">还没有记录。时间线会随着我们的故事慢慢延伸。</div>';show('archivePageView');}
function openPage(pageId){const p=pages.find(x=>x.id===pageId);if(!p)return;currentPage=p;$('archiveEyebrow').textContent=p.n+' / OUR SHARED ARCHIVE';$('archiveTitle').textContent=p.en;$('archiveDescription').textContent=p.desc;renderPage();show('archivePageView');}
function renderPage(){const p=currentPage;if(!p)return;const list=pageRecords(p);let html=`<button class="primary add-record" id="addRecord">＋ 新增记录</button>`;if(p.id==='voices'&&!list.length)html+=`<div class="record-card"><h3>G老师</h3><p>这里留给你来描述你所认识的 G老师。可以慢慢记录我们的相处方式、表达习惯、共同经历与故事。</p><div class="record-meta">属于我们的宇宙 · 等待共同填写</div></div><div class="record-card"><h3>D老师</h3><p>这里留给你来描述你所认识的 D老师。不是官方产品介绍，而是你们在这里共同留下的故事。</p><div class="record-meta">属于我们的宇宙 · 等待共同填写</div></div>`;if(list.length)html+=`<div class="record-list">${list.map(r=>recordCard(r)).join('')}</div>`;else if(p.id!=='voices')html+=`<div class="empty-note">这里还没有记录。可以从一封信、一段对话或一个小瞬间开始。</div>`;if(p.id==='timeline')html+=`<div class="empty-note">时间线会按照记录创建时间自动整理。每一条记录都可以关联你、G老师、D老师或你们共同。</div>`;$('archiveContent').innerHTML=html;$('addRecord').addEventListener('click',()=>openRecordDialog());document.querySelectorAll('[data-edit-record]').forEach(b=>b.addEventListener('click',()=>openRecordDialog(b.dataset.editRecord)));document.querySelectorAll('[data-delete-record]').forEach(b=>b.addEventListener('click',async()=>{if(confirm('确定删除这条记录吗？')){await deleteRecord(b.dataset.deleteRecord);records=await allRecords();renderPage();renderTimeline();}}));}
function recordCard(r){const who={us:'我们共同',user:'我',g:'G老师',d:'D老师'}[r.voice]||'我们共同';return `<article class="record-card"><div class="record-meta"><span>${who}</span><span>${new Date(r.createdAt).toLocaleDateString()}</span><span>${r.visibility==='public'?'标记为公开':r.visibility==='unlisted'?'不公开':'仅自己可见'}</span></div><h3>${esc(r.title)}</h3><p>${esc(r.body)}</p>${r.tags?.length?`<div class="record-meta">${r.tags.map(t=>'#'+esc(t)).join('　')}</div>`:''}<div class="record-actions"><button data-edit-record="${r.id}">编辑</button><button data-delete-record="${r.id}">删除</button></div></article>`;}
function openRecordDialog(recordId){editingRecord=records.find(r=>r.id===recordId)||null;$('recordDialogTitle').textContent=editingRecord?'编辑记录':'新增记录';$('recordTitle').value=editingRecord?.title||'';$('recordBody').value=editingRecord?.body||'';$('recordVoice').value=editingRecord?.voice||'us';$('recordVisibility').value=editingRecord?.visibility||'private';$('recordTags').value=(editingRecord?.tags||[]).join(', ');$('recordDialog').showModal();}
$('recordForm').addEventListener('submit',async e=>{if(e.submitter?.value!=='save')return;e.preventDefault();const title=$('recordTitle').value.trim(),body=$('recordBody').value.trim();if(!title||!body)return;if($('recordVisibility').value==='public'&&editingRecord?.visibility!=='public'&&!confirm('这条记录将被标记为公开。当前版本不会自动发布到互联网，仍只保存在本设备。确定继续吗？'))return;const now=new Date().toISOString();const rec={id:editingRecord?.id||id(),type:currentPage.kind,title,body,voice:$('recordVoice').value,visibility:$('recordVisibility').value,tags:$('recordTags').value.split(',').map(x=>x.trim()).filter(Boolean),createdAt:editingRecord?.createdAt||now,updatedAt:now};try{await saveRecord(rec);records=await allRecords();$('recordDialog').close();renderPage();renderTimeline();}catch(err){alert('保存失败，请检查浏览器存储空间。');}});
function renderManage(){ $('manageWorldList').innerHTML=worlds.map(w=>`<div class="manage-world-row"><span>${esc(w.zh)} <small>· ${w.category==='dream'?'梦女世界':'原创世界'}</small></span><span><button data-edit-world="${esc(w.id)}">编辑</button> <button data-delete-world="${esc(w.id)}">删除</button></span></div>`).join('')||'<p>暂无世界</p>';document.querySelectorAll('[data-edit-world]').forEach(b=>b.addEventListener('click',()=>{const w=worlds.find(x=>x.id===b.dataset.editWorld);editingWorld=w;$('worldZh').value=w.zh;$('worldEn').value=w.en||'';$('worldDesc').value=w.description||'';$('worldCategory').value=w.category;}));document.querySelectorAll('[data-delete-world]').forEach(b=>b.addEventListener('click',()=>{if(confirm('删除这个世界？')){worlds=worlds.filter(w=>w.id!==b.dataset.deleteWorld);localStorage.setItem(LEGACY_WORLDS,JSON.stringify(worlds));renderManage();renderRecent();}}));}
$('worldForm').addEventListener('submit',e=>{e.preventDefault();const w={id:editingWorld?.id||id(),zh:$('worldZh').value.trim(),en:$('worldEn').value.trim(),description:$('worldDesc').value.trim(),category:$('worldCategory').value,modules:editingWorld?.modules||($('worldCategory').value==='dream'?['characters','gallery','timeline','diary','letters']:['characters','relationships','map','timeline','custom'])};if(editingWorld)worlds=worlds.map(x=>x.id===editingWorld.id?w:x);else worlds.push(w);try{localStorage.setItem(LEGACY_WORLDS,JSON.stringify(worlds));$('worldFormMsg').textContent='已保存。';editingWorld=null;$('worldForm').reset();renderManage();renderRecent();}catch(err){$('worldFormMsg').textContent='保存失败：浏览器存储空间可能不足。';}});
$('exportBtn').addEventListener('click',async()=>{const payload={format:'elseverse-backup',version:1,exportedAt:new Date().toISOString(),worlds,records:await allRecords(),language};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Elseverse-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(a.href);$('backupMsg').textContent='备份文件已生成。'});
$('importFile').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());if(data.format!=='elseverse-backup'||!Array.isArray(data.worlds)||!Array.isArray(data.records))throw Error('格式不匹配');if(!confirm('导入会合并记录；同 ID 的记录将被备份文件覆盖。继续吗？'))return;worlds=data.worlds;localStorage.setItem(LEGACY_WORLDS,JSON.stringify(worlds));for(const r of data.records)await saveRecord(r);records=await allRecords();renderManage();renderRecent();renderTimeline();$('backupMsg').textContent='导入完成。';}catch(err){$('backupMsg').textContent='导入失败：文件格式不正确或数据无法读取。';}finally{e.target.value='';}});

// Our Little Universe — photo-based sky. No astronomy engine or remote runtime library.
const SKY_SCENES=[
 {title:'星云之间',en:'Among the Nebulae',credit:'NASA, ESA, CSA, STScI · NGC 604',url:'https://assets.science.nasa.gov/dynamicimage/assets/science/missions/webb/science/2024/03/STScI-01HQNVF0HHRF5HH4HKH8S9C83X.png?fit=clip&h=2000&w=2000'},
 {title:'星之摇篮',en:'A Cradle of Stars',credit:'NASA, ESA, R. O’Connell et al. · NGC 3603',url:'https://assets.science.nasa.gov/dynamicimage/assets/science/missions/hubble/nebulae/emission/STScI-01EVT1HCCCK8W4NC5CY760XRPT.png?fit=clip&h=960&w=2000'},
 {title:'遥远星系',en:'Distant Galaxies',credit:'R. Williams / STScI / NASA · Hubble Deep Field',url:'https://assets.science.nasa.gov/dynamicimage/assets/science/missions/hubble/releases/1996/01/STScI-01EVTAT7291D1ETQJ1BD5H2BRT.tif?fit=clip&h=2000&w=2000'}
];
const SKY_FAVORITES_KEY='elseverse-sky-favorites-v1';
const SKY_SCENE_KEY='elseverse-sky-scene-v1';
let currentSkyScene=Math.max(0,Math.min(SKY_SCENES.length-1,Number(localStorage.getItem(SKY_SCENE_KEY)||0)));
let skyZoom=100,skyFxFrame=0,skyFxRunning=false,skyFxStars=[],skyFxMeteor=null,skyFxLastMeteor=0;
const SKY_FX_PREF='elseverse-sky-effects-v1';
function skyFavorites(){try{return JSON.parse(localStorage.getItem(SKY_FAVORITES_KEY)||'[]')}catch{return []}}
function saveSkyFavorites(list){localStorage.setItem(SKY_FAVORITES_KEY,JSON.stringify(list))}
function renderSkyScene(){
 const scene=SKY_SCENES[currentSkyScene],backdrop=$('photoSkyBackdrop');
 if(backdrop){backdrop.style.backgroundImage=`url("${scene.url}")`;backdrop.style.setProperty('--sky-zoom',String(skyZoom/100));}
 $('skySceneTitle').textContent=language==='zh'?scene.title:scene.en;
 $('skySceneCredit').textContent=scene.credit;
 $('skyModeLabel').textContent=language==='zh'?'我们的星空':'OUR LITTLE UNIVERSE';
 document.querySelectorAll('[data-scene]').forEach(b=>b.classList.toggle('active',Number(b.dataset.scene)===currentSkyScene));
 const fav=skyFavorites().includes(currentSkyScene);
 $('skyFavorite').textContent=fav?'★ 已收藏':'☆ 收藏这片星空';
 $('skyFavorite').setAttribute('aria-pressed',String(fav));
 localStorage.setItem(SKY_SCENE_KEY,String(currentSkyScene));
}
function chooseSkyScene(index){currentSkyScene=(index+SKY_SCENES.length)%SKY_SCENES.length;renderSkyScene();$('skyFavoritesPanel').classList.add('hidden');}
function renderSkyFavorites(){
 const list=skyFavorites(),wrap=$('skyFavoritesList');
 wrap.innerHTML=list.length?list.map(i=>`<button type="button" class="sky-favorite-item" data-favorite-scene="${i}">${esc(SKY_SCENES[i].title)} ↗</button>`).join(''):'<span class="sky-favorite-empty">还没有收藏的星空。</span>';
 wrap.querySelectorAll('[data-favorite-scene]').forEach(b=>b.addEventListener('click',()=>chooseSkyScene(Number(b.dataset.favoriteScene))));
}
function resizeSkyEffects(){
 const c=$('skyEffectsCanvas');if(!c)return;
 const dpr=Math.min(window.devicePixelRatio||1,1.5),w=window.innerWidth,h=window.innerHeight;
 c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);c.style.width=w+'px';c.style.height=h+'px';
 const ctx=c.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
 const count=Math.max(45,Math.min(115,Math.round(w*h/13500)));
 skyFxStars=Array.from({length:count},()=>({x:Math.random()*w,y:Math.random()*h,r:.35+Math.random()*.95,a:.16+Math.random()*.55,phase:Math.random()*Math.PI*2,speed:.35+Math.random()*.8}));
}
function drawSkyEffects(now){
 const c=$('skyEffectsCanvas');if(!c||!skyFxRunning)return;
 const ctx=c.getContext('2d'),w=window.innerWidth,h=window.innerHeight;ctx.clearRect(0,0,w,h);
 if(skyFxEnabled){
  for(const s of skyFxStars){const alpha=s.a*(.66+.34*Math.sin(now*.00065*s.speed+s.phase));ctx.beginPath();ctx.fillStyle=`rgba(222,232,255,${alpha})`;ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();}
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&!skyFxMeteor&&now-skyFxLastMeteor>(18000+Math.random()*22000)){skyFxMeteor={x:w*(.55+Math.random()*.42),y:h*(.05+Math.random()*.42),vx:-(4+Math.random()*3),vy:2+Math.random()*2.2,life:0,max:42+Math.random()*20};skyFxLastMeteor=now;}
  if(skyFxMeteor){const m=skyFxMeteor;m.x+=m.vx;m.y+=m.vy;m.life++;const fade=Math.min(1,m.life/7,(m.max-m.life)/12),len=95;const g=ctx.createLinearGradient(m.x,m.y,m.x-m.vx*len/6,m.y-m.vy*len/6);g.addColorStop(0,`rgba(235,242,255,${Math.max(0,fade*.9)})`);g.addColorStop(1,'rgba(190,210,255,0)');ctx.strokeStyle=g;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(m.x,m.y);ctx.lineTo(m.x-m.vx*len/6,m.y-m.vy*len/6);ctx.stroke();if(m.life>m.max||m.x< -150||m.y>h+100)skyFxMeteor=null;}
 }
 skyFxFrame=requestAnimationFrame(drawSkyEffects);
}
let skyFxEnabled=localStorage.getItem(SKY_FX_PREF)!=='off';
function startSkyEffects(){if(skyFxRunning)return;resizeSkyEffects();skyFxRunning=true;skyFxFrame=requestAnimationFrame(drawSkyEffects);}
function stopSkyEffects(){skyFxRunning=false;if(skyFxFrame)cancelAnimationFrame(skyFxFrame);skyFxFrame=0;const c=$('skyEffectsCanvas');if(c){const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);}}
function initPhotoSky(){
 document.body.classList.add('sky-active');setupVisual('particle');
}
function stopLiveSky(){
 document.body.classList.remove('sky-active','sky-immersive');
 stopSkyEffects();stopVisual();
 $('immersiveToggle')?.setAttribute('aria-pressed','false');
 $('immersiveToggle')?.classList.remove('is-exit');
 $('immersiveToggle').textContent='进入沉浸模式 ⛶';
}
document.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>chooseSkyScene(Number(b.dataset.scene))));
$('skyPrevScene')?.addEventListener('click',()=>chooseSkyScene(currentSkyScene-1));
$('skyNextScene')?.addEventListener('click',()=>chooseSkyScene(currentSkyScene+1));
$('skyFavorite')?.addEventListener('click',()=>{
 const list=skyFavorites(),at=list.indexOf(currentSkyScene);
 if(at>=0)list.splice(at,1);else list.push(currentSkyScene);
 saveSkyFavorites(list);renderSkyScene();renderSkyFavorites();
});
$('skyShowFavorites')?.addEventListener('click',()=>{
 const panel=$('skyFavoritesPanel');panel.classList.toggle('hidden');renderSkyFavorites();
});
$('skyConstellations')?.addEventListener('click',e=>{
 const on=e.currentTarget.getAttribute('aria-pressed')!=='true';
 e.currentTarget.setAttribute('aria-pressed',String(on));$('constellationOverlay').classList.toggle('hidden',!on);
 localStorage.setItem('elseverse-sky-constellations-v1',on?'on':'off');
});
$('skyMotion')?.addEventListener('click',e=>{
 skyFxEnabled=!skyFxEnabled;localStorage.setItem(SKY_FX_PREF,skyFxEnabled?'on':'off');
 e.currentTarget.setAttribute('aria-pressed',String(skyFxEnabled));e.currentTarget.textContent=skyFxEnabled?'星空动效':'开启星空动效';
 if(skyFxEnabled&&!skyFxRunning)startSkyEffects();
});
$('photoSkyZoom')?.addEventListener('input',e=>{
 skyZoom=Number(e.target.value)||100;$('photoSkyZoomValue').textContent=skyZoom+'%';
 $('photoSkyBackdrop')?.style.setProperty('--sky-zoom',String(skyZoom/100));
});
$('photoSkyReset')?.addEventListener('click',()=>{
 skyZoom=100;$('photoSkyZoom').value='100';$('photoSkyZoomValue').textContent='100%';
 $('photoSkyBackdrop')?.style.setProperty('--sky-zoom','1');
});
$('immersiveToggle')?.addEventListener('click',()=>{
 const on=!document.body.classList.contains('sky-immersive');document.body.classList.toggle('sky-immersive',on);
 $('immersiveToggle').setAttribute('aria-pressed',String(on));$('immersiveToggle').classList.toggle('is-exit',on);
 $('immersiveToggle').textContent=on?'退出沉浸模式 ×':'进入沉浸模式 ⛶';
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('sky-immersive'))$('immersiveToggle')?.click();});
window.addEventListener('resize',()=>{if(skyFxRunning)resizeSkyEffects();},{passive:true});
window.addEventListener('orientationchange',()=>{if(skyFxRunning)setTimeout(resizeSkyEffects,180);},{passive:true});
if($('skyMotion')){$('skyMotion').setAttribute('aria-pressed',String(skyFxEnabled));$('skyMotion').textContent=skyFxEnabled?'星空动效':'开启星空动效';}
if($('skyConstellations')){const on=localStorage.getItem('elseverse-sky-constellations-v1')!=='off';$('skyConstellations').setAttribute('aria-pressed',String(on));$('constellationOverlay').classList.toggle('hidden',!on);}
$('photoSkyZoom')?.addEventListener('change',e=>{skyZoom=Number(e.target.value)||100;});
renderSkyScene();

document.addEventListener('click',e=>{const cat=e.target.closest('[data-category]');if(cat){currentCategory=cat.dataset.category;renderWorlds();show('worldsView');return;}const wid=e.target.closest('[data-world-id]');if(wid){openWorld(wid.dataset.worldId);return;}const pg=e.target.closest('[data-open-page]');if(pg){if(pg.dataset.openPage==='timeline')openTimeline();else openPage(pg.dataset.openPage);return;}if(e.target.closest('[data-open-universe]')){show('universeView');initPhotoSky();return;}if(e.target.closest('[data-back-home]')){stopLiveSky();show('homeView');return;}if(e.target.closest('[data-back-worlds]')){renderWorlds();show('worldsView');return;}if(e.target.closest('[data-back-universe]')){renderArchiveNav();renderTimeline();show('universeView');initPhotoSky();return;}});
$('manageToggle').addEventListener('click',()=>{renderManage();show('manageView')});$('brandHome').addEventListener('click',e=>{e.preventDefault();show('homeView')});$('langToggle').addEventListener('click',()=>{language=language==='zh'?'en':'zh';localStorage.setItem(LEGACY_LANG,language);$('langToggle').textContent=language==='zh'?'EN':'中文';document.documentElement.lang=language==='zh'?'zh-CN':'en';});

/* Living visual engine: WebGL first, Canvas 2D fallback. */
const motionReduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let visualMode='idle',visualRaf=0,visualGL=null,visualProgram=null,visualStart=0,visualResizeObserver=null;
const bubblePalettes=[[.18,.30,.95],[.48,.22,.92],[.16,.55,.92],[.68,.28,.94],[.24,.42,.82],[.55,.32,.88]];
const vertexSource=`attribute vec2 a_position;void main(){gl_Position=vec4(a_position,0.,1.);}`;
const bubbleFragment=`precision highp float;uniform vec2 u_res;uniform float u_time;uniform int u_count;uniform vec4 u_bubbles[12];uniform vec3 u_tints[12];
float h(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float n(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fb(vec3 p){float v=0.,a=.55;for(int i=0;i<4;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}
void main(){vec2 uv=gl_FragCoord.xy/u_res;vec3 col=vec3(.012,.019,.045);float alpha=1.;for(int i=0;i<12;i++){if(i>=u_count)break;vec4 b=u_bubbles[i];vec2 q=(uv-b.xy)/b.z; q.x*=u_res.x/u_res.y;float d=length(q);if(d>1.08)continue;
if(d<=1.0){float z=sqrt(max(0.,1.-d*d));vec3 p=vec3(q,z);float t=u_time*.075;vec3 flow=p*2.4+vec3(sin(p.y*3.+t)*.35,cos(p.x*3.-t)*.32,t*.45);float cloud=fb(flow*1.25)+.38*fb(flow*2.3+4.);float filament=fb(flow*2.1+vec3(cloud*1.2,-cloud*.8,t*.3));float neb=smoothstep(.43,.79,cloud*.68+filament*.48);float core=pow(max(0.,1.-length(q-vec2(-.18,.13))*1.5),5.);float stars=step(.994, n(floor(p*vec3(145.,145.,95.)+vec3(0.,0.,t*.2))));
vec3 tint=u_tints[i];vec3 nebcol=mix(vec3(.08,.20,.55),tint,.55+cloud*.25);nebcol=mix(nebcol,vec3(.63,.53,1.),smoothstep(.56,.88,filament)*.55);nebcol+=vec3(.32,.48,.95)*core*1.4;nebcol+=vec3(.65,.78,1.)*stars*.9;
float edge=pow(1.-z,3.2);float shade=.48+.52*z;vec3 sphere=nebcol*(.24+.82*neb)*shade+vec3(.018,.035,.09);sphere+=vec3(.30,.47,.9)*edge*.42;
float spec=pow(max(0.,dot(normalize(vec3(-.55,.72,.8)),normalize(vec3(q,z)))),48.);sphere+=vec3(.85,.92,1.)*spec*.34;
col=mix(col,sphere,1.); }
float rim=exp(-pow((d-.986)/.012,2.));float cres=exp(-pow((d-.972)/.025,2.))*smoothstep(-.35,.7,q.y-q.x*.45);col+=vec3(.36,.57,1.)*rim*.42+vec3(.75,.82,1.)*cres*.32;
float sheen=exp(-pow((q.x+q.y*.65+.58)/.035,2.))*smoothstep(.2,.9,d);col+=vec3(.62,.72,1.)*sheen*.22;
}gl_FragColor=vec4(col,1.);}`;
const particleVertex=`attribute vec3 a_pos;attribute float a_seed;uniform float u_time;uniform vec2 u_res;varying float v_light;varying float v_depth;
float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
void main(){vec3 p=a_pos;float t=u_time*.11;float lat=atan(p.y,length(p.xz));float lon=atan(p.z,p.x);float flow=sin(lon*3.+lat*5.+t*1.4)+.55*sin(lon*7.-lat*3.-t*.8)+.3*cos(lat*11.+t);
float band=pow(max(0.,.5+.5*sin(lat*13.+sin(lon*4.+t)*1.8+flow*.5)),9.);float ribbon=pow(max(0.,.5+.5*sin(lon*5.-lat*8.+t*.7+sin(lat*5.+t)*.8)),12.);
float displacement=(flow*.007+(band*.012+ribbon*.008))*sin(a_seed*6.28);
p*=1.+displacement;p.x+=.012*sin(lat*5.+t+lon*2.);p.y+=.009*cos(lon*4.-t+lat*3.);
float rot=.08*sin(t*.35);float x=p.x*cos(rot)-p.z*sin(rot),z=p.x*sin(rot)+p.z*cos(rot);p.x=x;p.z=z;
vec4 mv=vec4(p*1.18+vec3(0.,0.,-2.8),1.);gl_Position=vec4(mv.x*1.65,mv.y*1.65,mv.z*.25,1.);gl_PointSize=clamp((1.25+band*1.7+ribbon*1.3)*(u_res.y/720.)*(1.0+mv.z*.1),.65,2.7);v_light=.13+band*.75+ribbon*.82+hash(a_pos)*.13;v_depth=1.-(p.z+1.)*.5;}`;
const particleFragment=`precision mediump float;varying float v_light;varying float v_depth;void main(){vec2 q=gl_PointCoord-.5;float d=length(q);float a=exp(-d*d*34.)*smoothstep(.0,.12,v_light)*(.3+v_depth*.7);vec3 c=mix(vec3(.28,.43,.72),vec3(.82,.91,1.),clamp(v_light,0.,1.));gl_FragColor=vec4(c*a,a);}`;
function compileShader(gl,type,src){const sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh}
function makeProgram(gl,vs,fs){const p=gl.createProgram();gl.attachShader(p,compileShader(gl,gl.VERTEX_SHADER,vs));gl.attachShader(p,compileShader(gl,gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p}
function getGL(canvas){try{return canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'})||canvas.getContext('experimental-webgl')}catch{return null}}
function setupVisual(mode){visualMode=mode;const canvas=$(mode==='bubbles'?'bubbleCanvas':'particleCanvas');if(!canvas)return;stopVisual();const gl=getGL(canvas);visualGL=gl;visualStart=0;
 if(gl){try{visualProgram=makeProgram(gl,vertexSource,mode==='bubbles'?bubbleFragment:particleFragment);gl.useProgram(visualProgram);const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);if(mode==='bubbles'){gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(visualProgram,'a_position');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);}else{const pts=new Float32Array(26000*4);for(let i=0;i<26000;i++){const y=Math.random()*2-1,phi=Math.random()*Math.PI*2,r=Math.sqrt(1-y*y);pts[i*4]=r*Math.cos(phi);pts[i*4+1]=y;pts[i*4+2]=r*Math.sin(phi);pts[i*4+3]=Math.random();}const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,pts,gl.STATIC_DRAW);let l=gl.getAttribLocation(visualProgram,'a_pos');gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,3,gl.FLOAT,false,16,0);l=gl.getAttribLocation(visualProgram,'a_seed');gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,1,gl.FLOAT,false,16,12);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.clearColor(0,0,0,1);} }catch(err){console.warn('WebGL setup failed; using Canvas 2D',err);const replacement=canvas.cloneNode();canvas.replaceWith(replacement);visualGL=null;visualProgram=null;}}
 resizeVisual();if(!motionReduced)visualRaf=requestAnimationFrame(drawVisual);else drawVisual(performance.now());}
function resizeVisual(){const canvas=$(visualMode==='bubbles'?'bubbleCanvas':'particleCanvas');if(!canvas)return;const d=Math.min(devicePixelRatio||1,1.5),r=canvas.getBoundingClientRect();canvas.width=Math.max(1,Math.round(r.width*d));canvas.height=Math.max(1,Math.round(r.height*d));if(visualGL)visualGL.viewport(0,0,canvas.width,canvas.height);}
function drawVisual(now){if(document.hidden)return;if(!visualStart)visualStart=now;const t=motionReduced?0:(now-visualStart)/1000;const canvas=$(visualMode==='bubbles'?'bubbleCanvas':'particleCanvas');if(!canvas)return;const gl=visualGL;
 if(gl&&visualProgram){gl.useProgram(visualProgram);gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(.008,.014,.035,1);gl.clear(gl.COLOR_BUFFER_BIT);if(visualMode==='bubbles'){const items=[...document.querySelectorAll('.bubble-hit')],arr=new Float32Array(48),colors=new Float32Array(36);const rect=canvas.getBoundingClientRect();items.slice(0,12).forEach((el,i)=>{const r=el.getBoundingClientRect(),cx=(r.left+r.width/2-rect.left)/rect.width,cy=1-(r.top+r.height/2-rect.top)/rect.height,rad=(r.width*.5)/rect.height;arr.set([cx,cy,rad,0],i*4);const c=bubblePalettes[i%bubblePalettes.length];colors.set(c,i*3)});gl.uniform2f(gl.getUniformLocation(visualProgram,'u_res'),canvas.width,canvas.height);gl.uniform1f(gl.getUniformLocation(visualProgram,'u_time'),t);gl.uniform1i(gl.getUniformLocation(visualProgram,'u_count'),items.length);gl.uniform4fv(gl.getUniformLocation(visualProgram,'u_bubbles[0]'),arr);gl.uniform3fv(gl.getUniformLocation(visualProgram,'u_tints[0]'),colors);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);}else{gl.uniform1f(gl.getUniformLocation(visualProgram,'u_time'),t);gl.uniform2f(gl.getUniformLocation(visualProgram,'u_res'),canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.POINTS,0,26000);}}
 else drawFallback(canvas,t);
 if(!motionReduced)visualRaf=requestAnimationFrame(drawVisual);}
function drawFallback(canvas,t){const ctx=canvas.getContext('2d');if(!ctx)return;const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);if(visualMode==='bubbles'){const rect=canvas.getBoundingClientRect();document.querySelectorAll('.bubble-hit').forEach((el,i)=>{const r=el.getBoundingClientRect(),x=(r.left+r.width/2-rect.left)*w/rect.width,y=(r.top+r.height/2-rect.top)*h/rect.height,R=r.width*.5*w/rect.width;const g=ctx.createRadialGradient(x-R*.25,y-R*.3,R*.04,x,y,R);g.addColorStop(0,'rgba(102,112,255,.4)');g.addColorStop(.4,i%2?'rgba(67,50,155,.42)':'rgba(28,91,177,.42)');g.addColorStop(.82,'rgba(9,20,53,.8)');g.addColorStop(1,'rgba(115,165,255,.2)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,R,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(207,227,255,.45)';ctx.lineWidth=2;ctx.stroke();for(let j=0;j<90;j++){let a=j*2.399+Math.sin(t+j)*.12,rr=R*Math.sqrt((j*37%89)/89),px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;ctx.fillStyle=`rgba(185,205,255,${.1+.35*Math.abs(Math.sin(t+j))})`;ctx.fillRect(px,py,1.2,1.2);}});}else{const R=Math.min(w,h)*.34,cx=w*.5,cy=h*.46;for(let i=0;i<14000;i++){const y=1-2*(i+.5)/14000,phi=i*2.39996,r=Math.sqrt(1-y*y),lon=phi,lat=Math.asin(y),band=Math.pow(Math.max(0,.5+.5*Math.sin(lat*13+Math.sin(lon*4+t*.1)*1.8)),8),x=cx+R*r*Math.cos(phi),yy=cy+R*y;ctx.fillStyle=`rgba(205,225,255,${.08+band*.6})`;ctx.fillRect(x,yy,1,1);}}}
function stopVisual(){if(visualRaf)cancelAnimationFrame(visualRaf);visualRaf=0;visualGL=null;visualProgram=null;}
function startHomeBubbles(){const host=$('bubbleWorlds');if(!host)return;const entries=[...worlds,{id:'__shared_universe__',zh:'我们的小宇宙',en:'A SHARED SKY',description:'Our Little Universe'}];const names=entries.map((w,i)=>{const shared=w.id==='__shared_universe__';const title=shared?'我们的小宇宙':(w.zh||w.en||'未命名世界');const en=shared?'A SHARED SKY':(w.en|| (w.category==='dream'?'DREAM WORLD':'ORIGINAL WORLD'));return `<div class="bubble-item"><button class="bubble-hit" type="button" data-bubble-world="${shared?'universe':esc(w.id)}" aria-label="进入${esc(title)}"></button><div class="bubble-label">${esc(title)}<small>${esc(en)}</small></div></div>`;}).join('');host.innerHTML=names;const last=host.lastElementChild;if(last)last.querySelector('.bubble-hit').classList.add('shared-bubble');if(visualMode==='bubbles')resizeVisual();}
document.addEventListener('click',e=>{const bubble=e.target.closest('[data-bubble-world]');if(bubble){if(bubble.dataset.bubbleWorld==='universe'){show('universeView');initPhotoSky();}else openWorld(bubble.dataset.bubbleWorld);}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopVisual();else if(visualMode==='bubbles'||visualMode==='particle')setupVisual(visualMode);});
window.addEventListener('resize',()=>{if(visualMode==='bubbles'||visualMode==='particle')resizeVisual();},{passive:true});
function updateVisualViewport(){const h=window.visualViewport?.height||window.innerHeight;document.documentElement.style.setProperty('--visual-height',h+'px');}
updateVisualViewport();window.visualViewport?.addEventListener('resize',updateVisualViewport,{passive:true});window.visualViewport?.addEventListener('scroll',updateVisualViewport,{passive:true});

(async function init(){document.body.classList.add('home-active');worlds=loadWorlds();records=await allRecords();$('year').textContent=new Date().getFullYear();$('langToggle').textContent=language==='zh'?'EN':'中文';renderRecent();renderArchiveNav();renderTimeline();startHomeBubbles();setupVisual('bubbles');})();
