const MODULES = [
  { id:"characters", zh:"角色档案", en:"Characters", descZh:"角色资料与设定", descEn:"Profiles and character details" },
  { id:"gallery", zh:"相册", en:"Gallery", descZh:"图片与视觉收藏", descEn:"Images and visual collections" },
  { id:"timeline", zh:"时间线", en:"Timeline", descZh:"事件与故事顺序", descEn:"Events and chronology" },
  { id:"diary", zh:"日记", en:"Diary", descZh:"私人记录", descEn:"Personal entries" },
  { id:"letters", zh:"信件", en:"Letters", descZh:"角色信件与文本", descEn:"Letters and written pieces" },
  { id:"map", zh:"地图", en:"Map", descZh:"地点与世界探索", descEn:"Places and world exploration" },
  { id:"relationships", zh:"人物关系", en:"Relationships", descZh:"人物关系网络", descEn:"Character connections" },
  { id:"music", zh:"音乐", en:"Music", descZh:"世界专属歌单", descEn:"World soundtrack" },
  { id:"custom", zh:"自定义页面", en:"Custom page", descZh:"自由添加内容", descEn:"Create a custom page" }
];

const translations = {
  zh: {
    archiveLabel:"个人世界档案 / PERSONAL WORLDS ARCHIVE", manage:"管理 / Manage",
    indexLabel:"世界索引 / WORLD INDEX", intro:"一个收纳不同世界、角色与故事的私人档案馆。",
    introEn:"A personal archive for worlds, characters and stories.",
    worldsLabel:"已收录的世界 / WORLDS", selectWorld:"选择一个世界",
    footerNote:"每个世界都有自己的规则、时间与风格。", back:"返回索引 / Back to index",
    contents:"内容模块 / CONTENT MODULES", insideWorld:"这个世界",
    privateAdmin:"私人管理 / PRIVATE ADMIN", manageWorlds:"管理世界",
    adminHint:"此原型将数据保存在当前浏览器中。正式上线前会接入账号与云端数据库。",
    addWorld:"新增世界 / Add a world", editWorld:"编辑世界 / Edit world",
    worldName:"世界名称 / World name", englishName:"英文名称 / English name", description:"简介 / Description",
    worldType:"所属分类 / Category", chooseModules:"选择模块 / Choose modules",
    saveWorld:"保存世界 / Save world", existingWorlds:"现有世界 / Existing worlds",
    backToWorld:"返回世界 / Back to world", prototypeModule:"MODULE PREVIEW / 模块预览",
    modulePlaceholder:"这是模块入口原型。下一阶段会为它添加真正的内容编辑、图片上传和数据保存功能。",
    footerCaption:"A quiet place for many worlds.", dream:"梦女世界 / DREAM WORLDS",
    original:"原创世界 / ORIGINAL WORLDS", noModules:"尚未选择模块",
    delete:"删除", edit:"编辑", cancelEdit:"取消编辑 / Cancel",
    confirmDelete:"确定删除这个世界吗？", saved:"世界已保存。", updated:"世界已更新。",
    saveFailed:"保存失败：数据未更改，请检查浏览器存储空间或权限。",
    empty:"暂无世界", namePlaceholder:"例如：古代 IF", englishPlaceholder:"例如：Ancient IF",
    descriptionPlaceholder:"简单介绍这个世界", dreamOption:"梦女世界 / Dream World",
    originalOption:"原创世界 / Original World",
    invalidData:"本地数据格式异常。原始数据未被覆盖，请先导出或备份后再操作。",
    chooseAtLeastOne:"请至少选择一个模块。", storageWarning:"浏览器无法保存数据，本次更改未生效。"
  },
  en: {
    archiveLabel:"PERSONAL WORLDS ARCHIVE", manage:"Manage",
    indexLabel:"WORLD INDEX", intro:"A personal archive for worlds, characters and stories.",
    introEn:"", worldsLabel:"WORLDS", selectWorld:"Select a world",
    footerNote:"Every world has its own rules, time and atmosphere.", back:"Back to index",
    contents:"CONTENT MODULES", insideWorld:"Inside this world",
    privateAdmin:"PRIVATE ADMIN", manageWorlds:"Manage worlds",
    adminHint:"This prototype stores data in this browser. Accounts and cloud database will be added before launch.",
    addWorld:"Add a world", editWorld:"Edit world", worldName:"World name",
    englishName:"English name", description:"Description", worldType:"Category",
    chooseModules:"Choose modules", saveWorld:"Save world", existingWorlds:"Existing worlds",
    backToWorld:"Back to world", prototypeModule:"MODULE PREVIEW",
    modulePlaceholder:"This is a module preview. Content editing, image uploads and persistent storage will be added in the next stage.",
    footerCaption:"A quiet place for many worlds.", dream:"DREAM WORLDS",
    original:"ORIGINAL WORLDS", noModules:"No modules selected",
    delete:"Delete", edit:"Edit", cancelEdit:"Cancel",
    confirmDelete:"Delete this world?", saved:"World saved.", updated:"World updated.",
    saveFailed:"Save failed. Your data was not changed; check browser storage permissions or space.",
    empty:"No worlds yet", namePlaceholder:"e.g. Ancient IF",
    englishPlaceholder:"e.g. Ancient IF", descriptionPlaceholder:"A short description of this world",
    dreamOption:"Dream World", originalOption:"Original World",
    invalidData:"Stored data is invalid. The original data has not been overwritten; back it up before proceeding.",
    chooseAtLeastOne:"Choose at least one module.", storageWarning:"Browser storage is unavailable. No changes were applied."
  }
};

const starterWorlds = [
  { id:"dream", zh:"梦女世界", en:"Dream Worlds", description:"不同 IF 线的集合。每条故事线都可以拥有独立的风格与模块。", category:"dream", modules:["characters","gallery","timeline","diary","letters"] },
  { id:"original", zh:"原创世界", en:"Original Worlds", description:"原创角色、科幻设定，以及仍在不断扩展的宇宙。", category:"original", modules:["characters","relationships","map","timeline","custom"] }
];

const STORAGE_KEY = "myself-worlds";
const LANGUAGE_KEY = "myself-language";
const VALID_MODULE_IDS = new Set(MODULES.map(m => m.id));
const $ = id => document.getElementById(id);
const t = key => translations[language]?.[key] ?? translations.zh[key] ?? key;

let language = safeGetItem(LANGUAGE_KEY) === "en" ? "en" : "zh";
let worlds = loadWorlds();
let dataLoadFailed = false;
let currentWorldId = null;
let currentModuleId = null;
let currentViewId = "homeView";
let editingWorldId = null;

function safeGetItem(key) {
  try { return localStorage.getItem(key); }
  catch (error) { console.warn("localStorage unavailable", error); return null; }
}
function safeSetItem(key, value) {
  try { localStorage.setItem(key, value); return true; }
  catch (error) { console.warn("localStorage write failed", error); return false; }
}
function cloneStarterWorlds() {
  return starterWorlds.map(w => ({...w, modules:[...w.modules]}));
}
function normaliseWorlds(value) {
  if (!Array.isArray(value)) return null;
  const cleaned = [];
  const ids = new Set();
  for (const item of value) {
    if (!item || typeof item !== "object" || typeof item.id !== "string" ||
        typeof item.zh !== "string" || !item.id.trim() || !item.zh.trim() || ids.has(item.id)) return null;
    ids.add(item.id);
    cleaned.push({
      id:item.id.slice(0,100), zh:item.zh.trim().slice(0,50),
      en:typeof item.en === "string" ? item.en.slice(0,60) : "",
      description:typeof item.description === "string" ? item.description.slice(0,240) : "",
      category:item.category === "original" ? "original" : "dream",
      modules:Array.isArray(item.modules) ? [...new Set(item.modules.filter(id => VALID_MODULE_IDS.has(id)))] : []
    });
  }
  return cleaned;
}
function loadWorlds() {
  let raw;
  try { raw = localStorage.getItem(STORAGE_KEY); }
  catch (error) { return cloneStarterWorlds(); }
  if (raw === null) return cloneStarterWorlds();
  try {
    const parsed = JSON.parse(raw);
    const result = normaliseWorlds(parsed);
    if (result !== null) return result;
  } catch (error) { console.warn("Could not parse saved worlds", error); }
  dataLoadFailed = true;
  return cloneStarterWorlds();
}
function persistWorldList(nextWorlds) {
  return safeSetItem(STORAGE_KEY, JSON.stringify(nextWorlds));
}
function makeId() {
  if (window.crypto?.randomUUID) return "world-" + crypto.randomUUID();
  let id;
  do { id = "world-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,10); }
  while (worlds.some(w => w.id === id));
  return id;
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[ch]);
}
function moduleLabel(id) {
  const m = MODULES.find(x => x.id === id);
  return m ? (language === "zh" ? m.zh : m.en) : "";
}
function moduleDescription(id) {
  const m = MODULES.find(x => x.id === id);
  return m ? (language === "zh" ? m.descZh : m.descEn) : "";
}
function show(viewId, {preserveScroll=false}={}) {
  const views = ["homeView","worldView","adminView","moduleView"];
  if (!views.includes(viewId)) viewId = "homeView";
  const scrollY = window.scrollY;
  currentViewId = viewId;
  views.forEach(id => $(id).classList.toggle("hidden", id !== viewId));
  if (preserveScroll) window.scrollTo(0, scrollY);
  else window.scrollTo({top:0, behavior:"auto"});
}
function renderHome() {
  $("worldCount").textContent = String(worlds.length).padStart(2,"0");
  $("worldGrid").innerHTML = worlds.map((w,i) => `
    <button class="world-card" type="button" data-world="${escapeHTML(w.id)}">
      <div class="card-top"><span class="card-index">${String(i+1).padStart(2,"0")}</span><span class="card-arrow" aria-hidden="true">↗</span></div>
      <div><div class="card-title">${escapeHTML(language==="zh" ? w.zh : (w.en || w.zh))}</div>
      <div class="card-subtitle">${escapeHTML(language==="zh" ? (w.en || "") : w.zh)}</div></div>
      <div class="card-bottom"><span class="card-category">${w.category==="dream" ? t("dream") : t("original")}</span></div>
    </button>`).join("") || `<p class="intro-copy">${t("empty")}</p>`;
  document.querySelectorAll("[data-world]").forEach(btn => btn.addEventListener("click",()=>openWorld(btn.dataset.world)));
}
function updateWorldContent() {
  const w = worlds.find(x=>x.id===currentWorldId);
  if (!w) return false;
  $("worldKind").textContent = w.category==="dream" ? t("dream") : t("original");
  $("worldTitle").textContent = language==="zh" ? w.zh : (w.en || w.zh);
  $("worldDescription").textContent = w.description || "";
  $("moduleGrid").innerHTML = w.modules.map(id => {
    const m = MODULES.find(x=>x.id===id);
    return m ? `<button class="module-card" type="button" data-module="${m.id}"><strong>${escapeHTML(moduleLabel(id))}</strong><span>${escapeHTML(moduleDescription(id))}</span></button>` : "";
  }).join("") || `<p class="intro-copy">${t("noModules")}</p>`;
  document.querySelectorAll("[data-module]").forEach(btn=>btn.addEventListener("click",()=>openModule(btn.dataset.module)));
  return true;
}
function openWorld(id) {
  if (!worlds.some(w=>w.id===id)) { currentWorldId=null; currentModuleId=null; show("homeView"); return; }
  currentWorldId=id; currentModuleId=null; updateWorldContent(); show("worldView");
}
function updateModuleContent() {
  const w=worlds.find(x=>x.id===currentWorldId), m=MODULES.find(x=>x.id===currentModuleId);
  if (!w || !m) return false;
  $("moduleWorldName").textContent=language==="zh"?w.zh:(w.en||w.zh);
  $("moduleTitle").textContent=moduleLabel(m.id);
  $("moduleDescription").textContent=moduleDescription(m.id);
  return true;
}
function openModule(id) {
  const w=worlds.find(x=>x.id===currentWorldId);
  if (!w || !w.modules.includes(id) || !VALID_MODULE_IDS.has(id)) { show("homeView"); return; }
  currentModuleId=id; updateModuleContent(); show("moduleView");
}
function backToWorld() {
  if (!worlds.some(w=>w.id===currentWorldId)) { currentWorldId=null; currentModuleId=null; show("homeView"); return; }
  currentModuleId=null; updateWorldContent(); show("worldView");
}
function selectedModuleIds() {
  return [...document.querySelectorAll('input[name="modules"]:checked')].map(el=>el.value);
}
function defaultModules(category) {
  return category==="original"
    ? ["characters","relationships","map","timeline","custom"]
    : ["characters","gallery","timeline","diary","letters"];
}
function renderChoices(selectedIds) {
  const selected=new Set(selectedIds);
  $("moduleChoices").innerHTML=MODULES.map(m=>`
    <label class="module-choice"><input type="checkbox" name="modules" value="${m.id}" ${selected.has(m.id)?"checked":""}>
    <span>${escapeHTML(moduleLabel(m.id))}</span></label>`).join("");
}
function updateChoiceLabels() {
  document.querySelectorAll("#moduleChoices .module-choice").forEach(label=>{
    const input=label.querySelector("input"), span=label.querySelector("span");
    if(input&&span) span.textContent=moduleLabel(input.value);
  });
}
function resetEditor() {
  editingWorldId=null;
  $("worldForm").reset();
  $("category").value="dream";
  renderChoices(defaultModules("dream"));
  $("formTitle").textContent=t("addWorld");
  $("cancelEdit").classList.add("hidden");
  $("formMessage").textContent="";
}
function beginEdit(id) {
  const w=worlds.find(x=>x.id===id);
  if(!w) return;
  editingWorldId=id;
  $("nameZh").value=w.zh;
  $("nameEn").value=w.en;
  $("description").value=w.description;
  $("category").value=w.category;
  renderChoices(w.modules);
  $("formTitle").textContent=t("editWorld");
  $("cancelEdit").classList.remove("hidden");
  $("formMessage").textContent="";
  show("adminView");
  $("nameZh").focus({preventScroll:true});
}
function renderAdmin() {
  $("adminWorldList").innerHTML=worlds.map(w=>{
    const names=w.modules.map(moduleLabel).filter(Boolean).join(" · ");
    const category=w.category==="dream"?t("dream"):t("original");
    return `<div class="admin-row"><div><strong>${escapeHTML(w.zh)}</strong><small>${escapeHTML(w.en||"")} · ${escapeHTML(category)} · ${escapeHTML(names||t("noModules"))}</small></div>
      <div class="admin-actions"><button class="edit-button" type="button" data-edit="${escapeHTML(w.id)}">${t("edit")}</button><button class="delete-button" type="button" data-delete="${escapeHTML(w.id)}">${t("delete")}</button></div></div>`;
  }).join("") || `<p class="intro-copy">${t("empty")}</p>`;
  document.querySelectorAll("[data-delete]").forEach(btn=>btn.addEventListener("click",()=>deleteWorld(btn.dataset.delete)));
  document.querySelectorAll("[data-edit]").forEach(btn=>btn.addEventListener("click",()=>beginEdit(btn.dataset.edit)));
}
function deleteWorld(id) {
  if(!confirm(t("confirmDelete"))) return;
  const deletingCurrentWorld = id === currentWorldId;
  const deletingEditedWorld = id === editingWorldId;
  const next=worlds.filter(w=>w.id!==id);
  if(!persistWorldList(next)) { $("formMessage").textContent=t("saveFailed"); return; }
  worlds=next;
  if(deletingCurrentWorld){currentWorldId=null;currentModuleId=null;}
  renderHome(); renderAdmin();
  if(deletingEditedWorld) resetEditor();
  if(deletingCurrentWorld && ["worldView","moduleView"].includes(currentViewId)) show("homeView");
}
function applyLanguage() {
  const scrollY=window.scrollY;
  document.documentElement.lang=language==="zh"?"zh-CN":"en";
  document.querySelectorAll("[data-i18n]").forEach(el=>{el.textContent=t(el.dataset.i18n);});
  document.querySelectorAll("[data-placeholder]").forEach(el=>{el.placeholder=t(el.dataset.placeholder);});
  $("langToggle").textContent=language==="zh"?"EN":"中文";
  // Keep the second bilingual tagline only in Chinese mode to avoid duplicate English copy.
  document.querySelector(".intro-en").classList.toggle("hidden",language==="en");
  renderHome(); renderAdmin(); updateChoiceLabels();
  if(currentWorldId) updateWorldContent();
  if(currentModuleId) updateModuleContent();
  if(editingWorldId) $("formTitle").textContent=t("editWorld");
  window.scrollTo(0,scrollY);
}
function openAdmin() {
  if(!editingWorldId) resetEditor();
  renderAdmin();
  show("adminView");
}
$("langToggle").addEventListener("click",()=>{
  language=language==="zh"?"en":"zh";
  safeSetItem(LANGUAGE_KEY,language);
  applyLanguage();
});
$("adminToggle").addEventListener("click",openAdmin);
$("backHome").addEventListener("click",()=>show("homeView"));
$("adminBack").addEventListener("click",()=>{resetEditor();show("homeView");});
$("backWorld").addEventListener("click",backToWorld);
$("cancelEdit").addEventListener("click",resetEditor);
document.querySelector("[data-home]").addEventListener("click",e=>{e.preventDefault();show("homeView");});
$("category").addEventListener("change",()=>{
  if(!editingWorldId) renderChoices(defaultModules($("category").value));
});
$("worldForm").addEventListener("submit",e=>{
  e.preventDefault();
  const zh=$("nameZh").value.trim();
  if(!zh){$("nameZh").focus();return;}
  const modules=selectedModuleIds();
  if(!modules.length){$("formMessage").textContent=t("chooseAtLeastOne");return;}
  const payload={
    id:editingWorldId||makeId(), zh, en:$("nameEn").value.trim(),
    description:$("description").value.trim(),
    category:$("category").value==="original"?"original":"dream", modules
  };
  const next=editingWorldId
    ? worlds.map(w=>w.id===editingWorldId?payload:w)
    : [...worlds,payload];
  if(!persistWorldList(next)){ $("formMessage").textContent=t("saveFailed"); return; }
  const wasEditing=Boolean(editingWorldId);
  worlds=next;
  if(currentWorldId===payload.id && currentViewId!=="adminView") updateWorldContent();
  renderHome(); renderAdmin(); resetEditor();
  $("formMessage").textContent=wasEditing?t("updated"):t("saved");
  show("adminView");
});
$("year").textContent=String(new Date().getFullYear());
renderChoices(defaultModules("dream"));
renderHome(); renderAdmin(); applyLanguage();
if(dataLoadFailed) $("formMessage").textContent=t("invalidData");
