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
function renderRecent(){const items=[...worlds].slice(-8).reverse();$('recentWorlds').innerHTML=items.length?items.map(w=>`<button class="recent-card" data-world-id="${esc(w.id)}"><small>${w.category==='dream'?'DREAM WORLDS':'ORIGINAL WORLDS'}</small><strong>${esc(w.zh)}</strong><small>${esc(w.en||w.description||'')}</small></button>`).join(''):'<p class="intro">还没有收录世界。可以从管理页面添加第一个世界。</p>';}
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
 document.body.classList.add('sky-active');startSkyEffects();renderSkyScene();
}
function stopLiveSky(){
 document.body.classList.remove('sky-active','sky-immersive');
 stopSkyEffects();
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
(async function init(){worlds=loadWorlds();records=await allRecords();$('year').textContent=new Date().getFullYear();$('langToggle').textContent=language==='zh'?'EN':'中文';renderRecent();renderArchiveNav();renderTimeline();})();


/* ===== v0.8 Bubble Home: living glass-sphere worlds (adapted from elseverse-bubble-v7) ===== */
(()=>{'use strict';const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent),S=mobile?384:512;const c=document.getElementById('bubbleCanvas'),ctx=c.getContext('2d',{alpha:false});let W,H,D,bs=[],t0=0,raf=0,texA,texB,texC,bgDust=[],cloudDust=[];
function hash(x,y,s){let h=(x|0)*374761393+(y|0)*668265263+s*1274126177;h=(h^(h>>>13))*1274126177;return ((h^(h>>>16))>>>0)/4294967295}function sm(a){return a*a*(3-2*a)}function noise(x,y,s){let X=Math.floor(x),Y=Math.floor(y),u=sm(x-X),v=sm(y-Y),a=hash(X,Y,s),b=hash(X+1,Y,s),d=hash(X,Y+1,s),e=hash(X+1,Y+1,s);return(a*(1-u)+b*u)*(1-v)+(d*(1-u)+e*u)*v}function fb(x,y,s,n=4){let z=0,a=.5,f=1;for(let i=0;i<n;i++){z+=noise(x*f,y*f,s+i*31)*a;a*=.5;f*=2}return z}
function nebula(sz,seed){let cc=document.createElement('canvas');cc.width=cc.height=sz;let g=cc.getContext('2d'),im=g.createImageData(sz,sz),p=im.data;for(let y=0;y<sz;y++)for(let x=0;x<sz;x++){let nx=x/sz*2.6,ny=y/sz*2.6,wx=fb(nx*1.15,ny*1.15,seed,2)*2.4,wy=fb(nx+4.7,ny+2.1,seed+90,2)*2.4;let f=fb(nx*1.45+wx,ny*1.45+wy,seed+300,4);f=Math.pow(Math.max(0,(f-.39)*2.4),1.15);let i=(y*sz+x)*4;p[i]=8+f*105;p[i+1]=14+f*110;p[i+2]=30+f*220;p[i+3]=Math.min(255,f*255*2.1)}g.putImageData(im,0,0);for(let k=0;k<170;k++){g.fillStyle=`rgba(210,230,255,${Math.random()*.35})`;g.beginPath();g.arc(Math.random()*sz,Math.random()*sz,Math.random()*.8+.1,0,Math.PI*2);g.fill()}return cc}
function bakeSphere(tex){const sz=tex.width,out=document.createElement('canvas');out.width=out.height=sz;const g=out.getContext('2d'),oim=g.createImageData(sz,sz),od=oim.data;const tim=tex.getContext('2d').getImageData(0,0,sz,sz),td=tim.data;const half=sz/2,PI2=Math.PI/2;for(let y=0;y<sz;y++)for(let x=0;x<sz;x++){const idx=(y*sz+x)*4;od[idx]=od[idx+1]=od[idx+2]=od[idx+3]=0;const dx=x/sz*2-1,dy=y/sz*2-1,d=Math.sqrt(dx*dx+dy*dy);if(d>=1)continue;const dt=Math.asin(Math.min(d,.999999))/PI2;const u=dx/(d||1e-6),v=dy/(d||1e-6);const sx=Math.min(sz-1,Math.max(0,Math.round(half+u*dt*half)));const sy=Math.min(sz-1,Math.max(0,Math.round(half+v*dt*half)));const si=(sy*sz+sx)*4;const fres=Math.pow(1-d*d,.5);const edge=d>.985?(1-d)/.015:1;const att=fres*Math.max(0,Math.min(1,edge));const a=td[si+3]/255*att;od[idx]=td[si];od[idx+1]=td[si+1];od[idx+2]=td[si+2];od[idx+3]=Math.round(a*255);}g.putImageData(oim,0,0);return out;}
function mkParticles(n){let a=[];for(let i=0;i<n;i++){let th=Math.random()*Math.PI*2,ph=Math.acos(2*Math.random()-1),rr=Math.cbrt(Math.random())*.92;a.push({th,ph,rr,v:(Math.random()-.5)*.13,size:.4+Math.random()*1.5,tw:Math.random()*6.28,ts:.2+Math.random(),col:Math.random()>.78?'245,250,255':Math.random()>.5?'155,205,255':'145,150,255'})}return a}
function bubble(x,y,r,tex){return{x,y,r,baseX:x,baseY:y,baseR:r,tex,rot:Math.random()*6.28,rotV:(Math.random()-.5)*.025,phase:Math.random()*6.28,speed:.25+Math.random()*.18,parts:mkParticles(90),pulse:0,ox:0,oy:0}}
function initDust(){bgDust=Array.from({length:mobile?190:320},()=>({x:Math.random()*W,y:Math.random()*H,z:.25+Math.random()*.9,r:.25+Math.random()*1.1,a:.12+Math.random()*.55,tw:Math.random()*6.28,sp:.15+Math.random()*.8,dx:(Math.random()-.5)*10,dy:(Math.random()-.5)*14,blue:Math.random()>.55}));cloudDust=Array.from({length:mobile?70:110},()=>({x:Math.random()*W,y:Math.random()*H,r:1+Math.random()*2.8,a:.08+Math.random()*.18,dx:(Math.random()-.5)*16,dy:(Math.random()-.5)*18,h:Math.random()>.5?215:265}))}
function refract(p,b){const dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy);if(d>b.r*1.06)return null;const dn=d/b.r,nx=dx/(d||1),ny=dy/(d||1);if(dn<.82)return{x:b.x+nx*dn*1.15*b.r,y:b.y+ny*dn*1.15*b.r,ring:false};return{x:b.x+nx*1.06*b.r,y:b.y+ny*1.06*b.r,ring:true};}
function drawBackground(t,dt){ctx.fillStyle='#07101d';ctx.fillRect(0,0,W,H);let g=ctx.createRadialGradient(W*.22,H*.26,0,W*.22,H*.26,Math.max(W,H)*.68);g.addColorStop(0,'rgba(21,42,82,.36)');g.addColorStop(.45,'rgba(12,24,48,.18)');g.addColorStop(1,'rgba(2,5,12,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);g=ctx.createRadialGradient(W*.82,H*.72,0,W*.82,H*.72,Math.max(W,H)*.55);g.addColorStop(0,'rgba(24,18,62,.23)');g.addColorStop(1,'rgba(2,5,12,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
// background wisps: very soft, drifting independently
for(let i=0;i<cloudDust.length;i++){let p=cloudDust[i];p.x+=p.dx*dt;p.y+=p.dy*dt;if(p.x<-40)p.x=W+40;if(p.x>W+40)p.x=-40;if(p.y<-40)p.y=H+40;if(p.y>H+40)p.y=-40;ctx.fillStyle=`hsla(${p.h},75%,58%,${p.a})`;ctx.shadowBlur=18;ctx.shadowColor=`hsla(${p.h},80%,65%,${p.a})`;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()}ctx.shadowBlur=0;
for(let p of bgDust){p.x+=p.dx*dt*p.z;p.y+=p.dy*dt*p.z;if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;let tw=.65+.35*Math.sin(t*p.sp+p.tw);let rs;for(let bi=0;bi<bs.length;bi++){rs=refract(p,bs[bi]);if(rs)break;}if(rs){ctx.fillStyle=p.blue?`rgba(145,195,255,${p.a*tw*(rs.ring?.42:1)})`:`rgba(230,240,255,${p.a*tw*(rs.ring?.42:1)})`;ctx.beginPath();ctx.arc(rs.x,rs.y,p.r*p.z*(rs.ring?.5:.95),0,Math.PI*2);ctx.fill();}else{ctx.fillStyle=p.blue?`rgba(145,195,255,${p.a*tw})`:`rgba(230,240,255,${p.a*tw})`;ctx.beginPath();ctx.arc(p.x,p.y,p.r*p.z,0,Math.PI*2);ctx.fill();}}}
function drawBubble(b,t){let{x,y,r}=b,p=b.pulse;let g=ctx.createRadialGradient(x,y,r*.92,x,y,r*1.24);g.addColorStop(0,`rgba(35,75,150,${.08+p*.08})`);g.addColorStop(1,'rgba(5,10,25,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r*1.24,0,Math.PI*2);ctx.fill();ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip();ctx.fillStyle='#020711';ctx.fillRect(x-r,y-r,2*r,2*r);let ph=t*b.speed+b.phase;
ctx.save();ctx.translate(x+Math.sin(ph)*r*.06,y+Math.cos(ph*.75)*r*.05);ctx.rotate(b.rot+t*b.rotV);ctx.scale(1.06+Math.sin(ph)*.05,1.06+Math.sin(ph)*.05);ctx.drawImage(b.tex,-r,-r,2*r,2*r);ctx.restore();ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.5+Math.sin(ph)*.1;ctx.translate(x+Math.cos(ph*1.4+1)*r*.08,y+Math.sin(ph*.9+2)*r*.07);ctx.rotate(-b.rot+t*b.rotV*1.7);ctx.scale(1.18,1.18);ctx.drawImage(b.tex,-r,-r,2*r,2*r);ctx.restore();ctx.globalCompositeOperation='lighter';let ct=Math.cos(t*.22),st=Math.sin(t*.22);for(let q of b.parts){q.th+=q.v*.025;let sx=q.rr*Math.sin(q.ph)*Math.cos(q.th),sy=q.rr*Math.cos(q.ph),sz=q.rr*Math.sin(q.ph)*Math.sin(q.th),rx=sx*ct-sz*st,rz=sx*st+sz*ct,depth=(rz+1.2)/2.2,alpha=(.12+Math.sin(t*q.ts+q.tw)*.32)*depth,size=q.size*depth;if(alpha>.035){ctx.fillStyle=`rgba(${q.col},${alpha})`;ctx.beginPath();ctx.arc(x+rx*r,y+sy*r,Math.max(.15,size),0,Math.PI*2);ctx.fill()}}
ctx.globalCompositeOperation='source-over';g=ctx.createRadialGradient(x,y,r*.8,x,y,r);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.88,'rgba(1,4,12,.28)');g.addColorStop(.97,'rgba(1,4,12,.68)');g.addColorStop(1,'rgba(1,4,12,.15)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore();
// glass edge thickness and uneven rim glow
ctx.save();g=ctx.createRadialGradient(x,y,r*.94,x,y,r*1.025);g.addColorStop(0,'rgba(110,160,235,0)');g.addColorStop(.5,'rgba(145,190,245,.12)');g.addColorStop(.83,'rgba(185,220,255,.42)');g.addColorStop(1,'rgba(95,145,225,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r*1.025,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x,y,r*.985,-Math.PI*.83,-Math.PI*.24);ctx.strokeStyle='rgba(225,242,255,.28)';ctx.lineWidth=Math.max(.7,r*.004);ctx.stroke();ctx.beginPath();ctx.arc(x,y,r*.99,Math.PI*.1,Math.PI*.65);ctx.strokeStyle='rgba(95,155,255,.15)';ctx.lineWidth=Math.max(.6,r*.003);ctx.stroke();ctx.restore();
// thin-film iridescence: soft, shifting spectral sheen on the glass membrane
ctx.save();ctx.beginPath();ctx.arc(x,y,r*.995,0,Math.PI*2);ctx.clip();
ctx.globalCompositeOperation='screen';
const shift=t*.035+b.phase;
// Broad, low-opacity interference bands; deliberately uneven rather than a full rainbow fill.
let film=ctx.createLinearGradient(x-r*.9+Math.sin(shift)*r*.18,y-r*.65,x+r*.95,y+r*.85);
film.addColorStop(0,'rgba(95,155,255,0)');
film.addColorStop(.19,`hsla(${205+Math.sin(shift)*10},95%,72%,.075)`);
film.addColorStop(.34,`hsla(${265+Math.sin(shift+.8)*12},95%,74%,.105)`);
film.addColorStop(.49,`hsla(${325+Math.sin(shift+1.4)*10},95%,76%,.085)`);
film.addColorStop(.62,`hsla(${42+Math.sin(shift+2)*8},95%,76%,.075)`);
film.addColorStop(.77,`hsla(${165+Math.sin(shift+2.7)*10},95%,72%,.075)`);
film.addColorStop(1,'rgba(80,150,255,0)');
ctx.fillStyle=film;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.save();ctx.beginPath();ctx.arc(x,y,r*.995,0,Math.PI*2);ctx.arc(x,y,r*.62,0,Math.PI*2,true);ctx.clip();ctx.fillStyle=film;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();
// Localized pearly color pools, like soap-film colors changing with viewing angle.
const pools=[
  {ox:-.43,oy:-.42,h:205,a:.16,sz:.55},
  {ox:.34,oy:-.08,h:285,a:.14,sz:.62},
  {ox:-.08,oy:.48,h:335,a:.11,sz:.58},
  {ox:.48,oy:.48,h:175,a:.10,sz:.42}
];
for(let i=0;i<pools.length;i++){const q=pools[i];q.h+=Math.sin(shift*2+i*1.7)*1.2;const px=x+q.ox*r+Math.sin(shift+i*1.7)*r*.035,py=y+q.oy*r+Math.cos(shift+i*1.3)*r*.03;let pg=ctx.createRadialGradient(px,py,0,px,py,r*q.sz);pg.addColorStop(0,`hsla(${q.h+Math.sin(shift+i)*16},100%,76%,${q.a})`);pg.addColorStop(.42,`hsla(${q.h+38},100%,68%,${q.a*.48})`);pg.addColorStop(1,`hsla(${q.h+70},100%,65%,0)`);ctx.fillStyle=pg;ctx.fillRect(x-r,y-r,r*2,r*2)}
// A few broken, very fine spectral glints along the membrane edge.
const rim=ctx.createLinearGradient(x-r,y-r*.8,x+r,y+r*.8);
rim.addColorStop(0,'rgba(110,190,255,0)');rim.addColorStop(.22,'rgba(170,150,255,.16)');rim.addColorStop(.42,'rgba(255,170,210,.18)');rim.addColorStop(.62,'rgba(255,225,155,.13)');rim.addColorStop(.82,'rgba(120,235,220,.16)');rim.addColorStop(1,'rgba(110,190,255,0)');
ctx.strokeStyle=rim;ctx.lineWidth=Math.max(1,r*.012);ctx.beginPath();ctx.arc(x,y,r*.978,-Math.PI*.78,Math.PI*.12);ctx.stroke();ctx.strokeStyle=rim;ctx.lineWidth=Math.max(1,r*.01);ctx.beginPath();ctx.arc(x,y,r*.99,Math.PI*1.2,Math.PI*.7);ctx.stroke();
ctx.restore();
// subtle asymmetric reflections
ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip();ctx.save();ctx.translate(x-r*.42,y-r*.48);ctx.rotate(-.61);const ww=r*.52,wh=r*.11;let wg=ctx.createLinearGradient(0,-wh/2,0,wh/2);wg.addColorStop(0,'rgba(255,253,240,.68)');wg.addColorStop(.3,'rgba(235,245,255,.30)');wg.addColorStop(1,'rgba(220,240,255,0)');ctx.fillStyle=wg;ctx.beginPath();if(ctx.roundRect){ctx.roundRect(-ww/2,-wh/2,ww,wh,r*.05);ctx.fill();}else{ctx.rect(-ww/2,-wh/2,ww,wh);ctx.fill();}ctx.fillStyle='rgba(255,252,240,.9)';ctx.fillRect(-ww/2,-wh/2,ww,wh*.18);ctx.strokeStyle='rgba(255,255,245,.32)';ctx.lineWidth=1;ctx.strokeRect(-ww/2,-wh/2,ww,wh);ctx.restore();g=ctx.createRadialGradient(x+r*.48,y+r*.6,0,x+r*.48,y+r*.6,r*.55);g.addColorStop(0,'rgba(110,150,255,.11)');g.addColorStop(1,'rgba(110,150,255,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();if(p>.01){ctx.beginPath();ctx.arc(x+b.ox,y+b.oy,r*(.2+(1-p)*.8),0,Math.PI*2);ctx.strokeStyle=`rgba(190,225,255,${p*.25})`;ctx.lineWidth=1+p*2;ctx.stroke()}ctx.globalCompositeOperation='source-over'}

const labelsEl=document.getElementById('bubbleLabels'),calm=matchMedia('(prefers-reduced-motion:reduce)').matches;let live=false,fromBubble=false;
function items(){const a=worlds.map(w=>({id:w.id,zh:w.zh,en:w.en||w.zh,sub:w.category==='dream'?'DREAM WORLD':'ORIGINAL WORLD',tex:w.category==='dream'?0:1,s:.85}));a.push({id:'@universe',zh:'我们的小宇宙',en:'Our Little Universe',sub:'A SHARED SKY',tex:2,s:1.1,uni:true});return a}
function pack(list){const top=84,bot=40,side=14,aw=W-side*2,ah=H-top-bot,sum=list.reduce((a,x)=>a+x.s*x.s,0);let R=Math.sqrt(aw*ah*.5/(Math.PI*sum));R=Math.max(44,Math.min(R,mobile?118:150));
const P=list.map((x,i)=>({r:R*x.s,x:side+aw*(.2+.6*((i*.618)%1)),y:top+ah*(.12+.76*((i*.382+.1)%1))}));
for(let k=0;k<160;k++){for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){const a=P[i],b=P[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,m=a.r+b.r+10;if(d<m){const q=(m-d)/2/d;a.x-=dx*q;a.y-=dy*q;b.x+=dx*q;b.y+=dy*q}}
for(const p of P){p.x=Math.max(side+p.r,Math.min(W-side-p.r,p.x));p.y=Math.max(top+p.r,Math.min(H-bot-p.r,p.y))}}return P}
function rebuild(){if(!texA||!W)return;const list=items(),P=pack(list),T=[texA,texB,texC];
bs=list.map((it,i)=>{const b=bubble(P[i].x,P[i].y,P[i].r,T[it.tex]);b.parts=mkParticles(P[i].r<70?26:52);b.it=it;b.fx=calm?0:3+Math.random()*5;return b});
labelsEl.innerHTML=bs.map((b,i)=>`<button type="button" class="bubble-label" data-bi="${i}"><strong>${esc(language==='en'?b.it.en:b.it.zh)}</strong><small>${esc(b.it.sub)}</small></button>`).join('')+'<p class="bubble-caption">A place for worlds within.</p>';
bs.forEach((b,i)=>{const el=labelsEl.children[i];el.style.width=el.style.height=b.baseR*2+'px';el.style.fontSize=Math.max(12,Math.min(17,b.baseR*.17))+'px'})}
function frame(now){raf=requestAnimationFrame(frame);if(!t0)t0=now;const dt=Math.min((now-t0)/1000,.08);t0=now;const t=now/1000;drawBackground(t,dt);
for(let i=0;i<bs.length;i++){const b=bs[i];if(b.pulse>0)b.pulse=Math.max(0,b.pulse-dt*1.35);b.r=b.baseR*(1+b.pulse*.03);b.x=b.baseX+Math.sin(t*b.speed*.9+b.phase)*b.fx;b.y=b.baseY+Math.cos(t*b.speed*.7+b.phase*1.3)*b.fx*1.3;drawBubble(b,t);const el=labelsEl.children[i];if(el)el.style.transform=`translate(${b.x-b.baseR}px,${b.y-b.baseR}px)`}}
function resize(){D=Math.min(devicePixelRatio||1,mobile?1.5:2);W=innerWidth;H=innerHeight;c.width=Math.round(W*D);c.height=Math.round(H*D);c.style.width=W+'px';c.style.height=H+'px';ctx.setTransform(D,0,0,D,0,0);initDust();rebuild()}
function setLive(on){if(on===live)return;live=on;document.body.classList.toggle('bubble-home',on);if(on){t0=0;if(!raf)raf=requestAnimationFrame(frame)}else{cancelAnimationFrame(raf);raf=0}}
labelsEl.addEventListener('pointerdown',e=>{const el=e.target.closest('.bubble-label');if(el&&bs[+el.dataset.bi])bs[+el.dataset.bi].pulse=1});
labelsEl.addEventListener('click',e=>{const el=e.target.closest('.bubble-label');if(!el)return;const it=bs[+el.dataset.bi].it;setTimeout(()=>{if(it.uni){show('universeView');initPhotoSky()}else{fromBubble=true;openWorld(it.id);show('worldDetailView')}},200)});
document.addEventListener('click',e=>{if(fromBubble&&e.target.closest('[data-back-worlds]')){e.stopImmediatePropagation();show('homeView')}},true);
document.addEventListener('visibilitychange',()=>{if(!live)return;if(document.hidden){cancelAnimationFrame(raf);raf=0}else if(!raf){t0=0;raf=requestAnimationFrame(frame)}});
window.addEventListener('resize',()=>{clearTimeout(window._rt);window._rt=setTimeout(resize,120)});
const _show=show;show=function(id){_show(id);if(id==='homeView')fromBubble=false;setLive(id==='homeView')};
const _rr=renderRecent;renderRecent=function(){_rr();rebuild()};
$('langToggle').addEventListener('click',rebuild);
resize();setLive(true);
setTimeout(()=>{texA=bakeSphere(nebula(S,77));texB=bakeSphere(nebula(S,888));texC=bakeSphere(nebula(S,4242));rebuild()},40);
})();
