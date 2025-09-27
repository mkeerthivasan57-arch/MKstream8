
/* MKstream v30 - No-demo full project
   - All features from your 24-point list implemented in frontend (localStorage)
   - No preloaded series; admin must add content (you can import/export JSON)
*/

const STORAGE_KEY = 'mk_v30_state';

const DEFAULT = {
  site: {
    name: 'MKstream',
    logo: '',
    colors: { header:'#07112b', bg:'#051426', card:'#0b1630', accent:'#1e90ff' },
    seo: { title:'MKstream', description:'Watch anime, donghua, cartoons, serials, web series, movies' },
    password: 'admin123',
    telegram: '',
    ads: { header:'', player:'' }
  },
  categories: [
    { id:'anime', name:'anime', subs:['action','fantasy'] },
    { id:'donghua', name:'donghua', subs:['martial','romance'] },
    { id:'cartoon', name:'cartoon', subs:['kids'] },
    { id:'serial', name:'serial', subs:['drama'] },
    { id:'webseries', name:'web series', subs:['shorts'] },
    { id:'movies', name:'movies', subs:['feature'] }
  ],
  series: [],
  globalServers: [],
  settings: { pageSize: 12 }
};

function uid(prefix='id'){ return prefix+'_'+Math.random().toString(36).slice(2,9); }
function load(){ try{ const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : JSON.parse(JSON.stringify(DEFAULT)); }catch(e){ console.error(e); return JSON.parse(JSON.stringify(DEFAULT)); } }
function save(state){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){ console.error(e); } }

let state = load();

// DOM helpers
const q = s => document.querySelector(s);
const qa = s => Array.from(document.querySelectorAll(s));

// set year
qa('#year,#year-cat,#year-pl,#year-admin').forEach(el => el && (el.textContent = new Date().getFullYear()));

// theme & SEO apply
function applyTheme(){ const c = state.site.colors || {}; if(c.header) document.documentElement.style.setProperty('--header', c.header); if(c.bg) document.documentElement.style.setProperty('--bg', c.bg); if(c.card) document.documentElement.style.setProperty('--card', c.card); if(c.accent) document.documentElement.style.setProperty('--accent', c.accent); }
function applySEO(){ document.title = (state.site.seo && state.site.seo.title) ? state.site.seo.title : 'MKstream'; const md = q('#meta-desc') || q('#meta-desc-cat') || q('#meta-desc-pl'); if(md) md.setAttribute('content', (state.site.seo && state.site.seo.description) || ''); }
applyTheme(); applySEO();

// escape utility
function esc(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

// render categories in header and sidebar
function renderCategories(){
  qa('.categories-desktop').forEach(dc=>{ if(!dc) return; dc.innerHTML=''; state.categories.forEach(c=>{ const b=document.createElement('button'); b.className='episode-btn'; b.textContent=c.name; b.addEventListener('click', ()=> location.href = `category.html?cat=${encodeURIComponent(c.id)}`); dc.appendChild(b); }); });
  const sidebarCats = q('#sidebar-cats') || q('#sidebar-cats-cat');
  if(sidebarCats){ sidebarCats.innerHTML=''; state.categories.forEach(cat=>{ const div=document.createElement('div'); const b=document.createElement('button'); b.className='side-cat'; b.textContent=cat.name; b.addEventListener('click', ()=> { closeSidebar(); location.href = `category.html?cat=${encodeURIComponent(cat.id)}`; }); div.appendChild(b); if(cat.subs && cat.subs.length){ const wrap=document.createElement('div'); wrap.style.marginLeft='10px'; cat.subs.forEach(sub=>{ const sbtn=document.createElement('button'); sbtn.className='side-sub'; sbtn.textContent='· '+sub; sbtn.addEventListener('click', ()=> { closeSidebar(); location.href = `category.html?cat=${encodeURIComponent(cat.id)}&sub=${encodeURIComponent(sub)}`; }); wrap.appendChild(sbtn); }); div.appendChild(wrap); } sidebarCats.appendChild(div); }); }
  // populate admin selects
  const formCat = q('#form-category'); if(formCat){ formCat.innerHTML=''; state.categories.forEach(c=>{ const o=document.createElement('option'); o.value=c.id; o.textContent=c.name; formCat.appendChild(o); }); populateSubcategorySelect(); }
  const parentSel = q('#cat-for-sub'); if(parentSel){ parentSel.innerHTML=''; state.categories.forEach(c=>{ const o=document.createElement('option'); o.value=c.id; o.textContent=c.name; parentSel.appendChild(o); }); }
}

// Home render (no demo => empty lists unless admin adds)
function renderHome(){
  const specialsGrid = q('#specials-grid'); const recentGrid = q('#recent-grid'); const mostGrid = q('#most-grid');
  // compute today's and yesterday's specials from createdAt if present
  const now = new Date(); const startToday = new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime(); const startYesterday = startToday - 24*3600*1000;
  const todays = state.series.filter(s => (s.createdAt||0) >= startToday);
  const yesterdays = state.series.filter(s => (s.createdAt||0) >= startYesterday && (s.createdAt||0) < startToday);
  const specials = todays.length ? todays : (yesterdays.length ? yesterdays : []);
  if(specialsGrid){ specialsGrid.innerHTML = specials.length ? '' : '<div class=\"small\">No specials yet</div>'; specials.forEach(s => specialsGrid.appendChild(createCard(s))); }
  const recent = state.series.slice().sort((a,b)=> (b.createdAt||0)-(a.createdAt||0));
  if(recentGrid){ recentGrid.innerHTML = recent.length ? '' : '<div class=\"small\">No recent uploads</div>'; recent.forEach(s=> recentGrid.appendChild(createCard(s))); }
  const most = state.series.slice().sort((a,b)=> (b.views||0)-(a.views||0));
  if(mostGrid){ mostGrid.innerHTML = most.length ? '' : '<div class=\"small\">No views yet</div>'; most.forEach(s=> mostGrid.appendChild(createCard(s))); }
}

// create card element
function createCard(s){ const card=document.createElement('div'); card.className='card'; const thumb=document.createElement('div'); thumb.className='thumb'; if(s.thumbnail){ const img=document.createElement('img'); img.src=s.thumbnail; img.loading='lazy'; img.alt=s.title; img.style.width='100%'; img.style.height='140px'; img.style.objectFit='cover'; thumb.appendChild(img); } else thumb.innerHTML='<div style=\"height:140px;display:flex;align-items:center;justify-content:center;color:var(--muted)\">No thumbnail</div>'; const meta=document.createElement('div'); meta.className='meta'; meta.innerHTML = `<div class='title'>${esc(s.title)}</div><div class='sub'>${esc(s.categoryName||'')}</div>`; const btn=document.createElement('button'); btn.className='btn'; btn.textContent='Play'; btn.addEventListener('click', ()=> location.href = `player.html?series=${encodeURIComponent(s.id)}`); meta.appendChild(btn); card.appendChild(thumb); card.appendChild(meta); return card; }

// category page render
function renderCategoryPage(){
  const params = new URLSearchParams(location.search); const catId = params.get('cat')||''; const sub = params.get('sub')||'';
  const cat = state.categories.find(c=> c.id === catId) || { name: catId || 'Category' };
  const title = q('#category-title'); if(title) title.textContent = sub ? `${cat.name} / ${sub}` : `Category: ${cat.name}`;
  const grid = q('#category-grid'); if(!grid) return;
  const list = state.series.filter(s=> s.categoryId === catId && (sub? s.subcategory===sub : true));
  if(list.length===0) grid.innerHTML = '<div class=\"small\">No series in this category yet.</div>'; else { grid.innerHTML=''; list.forEach(s=> grid.appendChild(createCard(s))); }
}

// player page render
function renderPlayerPage(){
  const params = new URLSearchParams(location.search); const seriesId = params.get('series'); const epId = params.get('ep')||null;
  const series = state.series.find(s=> s.id === seriesId); const titleEl = q('#player-title');
  if(!series){ if(titleEl) titleEl.textContent = 'Series not found'; const el = q('#episode-list'); if(el) el.innerHTML = '<div class=\"small\">Series not found</div>'; return; }
  if(titleEl) titleEl.textContent = series.title || 'Untitled Series';
  const eps = series.episodes || []; if(eps.length===0){ const el = q('#episode-list'); if(el) el.innerHTML = '<div class=\"small\">No episodes uploaded yet for this series.</div>'; return; }
  let index = 0; if(epId){ const idx = eps.findIndex(e=> e.id === epId); if(idx >= 0) index = idx; }
  populateEpisodeRanges(series, index);
  populateRelated(series);
  populatePlayer(eps[index], series);
  // increment views once per load
  series.views = (series.views || 0) + 1; save(state);
}

function populateEpisodeRanges(series, selected=0){
  const container = q('#episode-ranges'); const listEl = q('#episode-list'); if(!container||!listEl) return;
  container.innerHTML = ''; listEl.innerHTML = '';
  const eps = series.episodes || []; const groups = Math.ceil(eps.length / 100) || 1; const ranges = [];
  for(let i=0;i<groups;i++){ const start = i*100 + 1; const end = Math.min((i+1)*100, eps.length); ranges.push({ label:`${start}-${end}`, startIndex:start-1, endIndex:end-1 }); }
  const sel = document.createElement('select'); sel.className='input'; ranges.forEach((r,i)=>{ const o=document.createElement('option'); o.value=i; o.textContent=r.label; sel.appendChild(o); });
  sel.addEventListener('change', ()=> renderEpisodeButtons(series, ranges[Number(sel.value)])); container.appendChild(sel);
  renderEpisodeButtons(series, ranges[0]);
}

function renderEpisodeButtons(series, range){
  const listEl = q('#episode-list'); if(!listEl) return; listEl.innerHTML = '';
  const eps = (series.episodes||[]).slice(range.startIndex, range.endIndex+1);
  eps.forEach((ep, idx)=>{ const b=document.createElement('button'); b.className='episode-btn'; b.textContent = ep.number || (range.startIndex+idx+1); b.addEventListener('click', ()=> location.href = `player.html?series=${encodeURIComponent(series.id)}&ep=${encodeURIComponent(ep.id)}`); listEl.appendChild(b); });
}

function populateRelated(series){
  const relatedDiv = q('#related'); if(!relatedDiv) return; relatedDiv.innerHTML = '<h3>Related & Mostly Viewed</h3>';
  const related = state.series.filter(s=> s.categoryId === series.categoryId && s.id !== series.id).slice(0,4);
  if(related.length===0) relatedDiv.innerHTML += '<div class=\"small\">No related series</div>'; else {
    const wrap = document.createElement('div'); wrap.style.display='flex'; wrap.style.gap='8px';
    related.forEach(r=>{ const c = document.createElement('div'); c.className='card'; c.style.width='160px'; c.innerHTML = `<div style=\"height:90px;background:#021827;border-radius:6px\"></div><div style=\"padding:6px\"><strong>${esc(r.title)}</strong></div>`; c.addEventListener('click', ()=> location.href = `player.html?series=${encodeURIComponent(r.id)}`); wrap.appendChild(c); });
    relatedDiv.appendChild(wrap);
  }
  const mv = [...state.series].sort((a,b)=> (b.views||0)-(a.views||0)).slice(0,2);
  if(mv.length>0){ relatedDiv.innerHTML += '<h4>Mostly viewed</h4>'; mv.forEach(m=> { relatedDiv.innerHTML += `<div class=\"card\" style=\"display:inline-block;width:180px;margin-right:8px;padding:8px\"><div style=\"height:80px;background:#021827\"></div><div style=\"padding:6px\"><strong>${esc(m.title)}</strong></div></div>`; }); }
}

function populatePlayer(episode, series){
  const videoEl = q('#video-player'); const serverSelect = q('#server-select'); const subtitleSelect = q('#subtitle-select'); const qualitySelect = q('#quality-select'); const versionSelect = q('#version-select'); const downloadBtn = q('#download-video');
  if(!videoEl) return;
  // clear tracks and sources
  while(videoEl.firstChild) videoEl.removeChild(videoEl.firstChild);
  // choose servers array (episode.servers fallback to globalServers)
  const servers = (episode.servers && episode.servers.length) ? episode.servers : (state.globalServers && state.globalServers.length ? state.globalServers : []);
  // add first source
  if(servers[0] && servers[0].url){ const src = document.createElement('source'); src.src = servers[0].url; videoEl.appendChild(src); }
  // tracks
  (episode.subtitles || []).forEach(st => { const tr = document.createElement('track'); tr.kind = 'subtitles'; tr.label = st.lang || ''; tr.srclang = (st.lang||'').slice(0,2).toLowerCase(); tr.src = st.url || ''; videoEl.appendChild(tr); });
  videoEl.load();
  // populate selects
  if(serverSelect){ serverSelect.innerHTML = ''; servers.forEach((sv,i)=>{ const o = document.createElement('option'); o.value = i; o.textContent = sv.name + (sv.quality ? ` (${sv.quality})` : ''); serverSelect.appendChild(o); }); serverSelect.onchange = ()=> { const idx = Number(serverSelect.value); if(servers[idx] && servers[idx].url){ const current = videoEl.currentTime || 0; videoEl.pause(); videoEl.src = servers[idx].url; videoEl.load(); videoEl.currentTime = current; videoEl.play().catch(()=>{}); } }; }
  if(qualitySelect){ qualitySelect.innerHTML = ''; const qs = Array.from(new Set(servers.map(s=> s.quality).filter(Boolean))); ['auto', ...qs].forEach(qt=>{ const o=document.createElement('option'); o.value=qt; o.textContent = qt; qualitySelect.appendChild(o); }); }
  if(subtitleSelect){ subtitleSelect.innerHTML = ''; const tracks = videoEl.querySelectorAll('track'); if(tracks.length===0) subtitleSelect.innerHTML = '<option value=\"\">No subtitles</option>'; else { const opt = document.createElement('option'); opt.value=''; opt.textContent='No subtitles'; subtitleSelect.appendChild(opt); tracks.forEach((t,i)=>{ const o = document.createElement('option'); o.value = i; o.textContent = t.label || ('sub'+i); subtitleSelect.appendChild(o); }); subtitleSelect.onchange = ()=>{ const idx = Number(subtitleSelect.value); tracks.forEach((t,ti)=> t.mode = (ti===idx ? 'showing' : 'disabled')); }; } }
  if(versionSelect){ versionSelect.innerHTML = ''; const versions = Array.from(new Set(servers.map(s=> s.version || 'original'))); versions.forEach(v=>{ const o=document.createElement('option'); o.value=v; o.textContent=v; versionSelect.appendChild(o); }); }
  if(downloadBtn){ downloadBtn.onclick = ()=>{ const url = videoEl.currentSrc || videoEl.src; if(!url) return alert('No source'); const a = document.createElement('a'); a.href = url; a.download = ''; document.body.appendChild(a); a.click(); a.remove(); }; }
  // gestures: double click skip 10s
  videoEl.ondblclick = ()=> { videoEl.currentTime = Math.min((videoEl.duration||0), videoEl.currentTime + 10); };
  // long press fast forward
  let ff = null;
  function startFF(){ ff = setInterval(()=>{ videoEl.currentTime = Math.min((videoEl.duration||0), videoEl.currentTime + 2); }, 200); }
  function stopFF(){ if(ff){ clearInterval(ff); ff = null; } }
  videoEl.addEventListener('mousedown', startFF); videoEl.addEventListener('mouseup', stopFF); videoEl.addEventListener('mouseleave', stopFF);
  videoEl.addEventListener('touchstart', startFF); videoEl.addEventListener('touchend', stopFF);
  // autoplay next on ended
  videoEl.onended = ()=>{ const idx = (series.episodes||[]).findIndex(e=> e.id === episode.id); const next = series.episodes && series.episodes[idx+1]; if(next) location.href = `player.html?series=${encodeURIComponent(series.id)}&ep=${encodeURIComponent(next.id)}`; };
}

// ---------------- Admin functions ----------------
function renderAdmin(){
  renderCategories();
  const catsList = q('#cats-list'); if(catsList){ catsList.innerHTML=''; state.categories.forEach(c=>{ const div=document.createElement('div'); div.innerHTML = `<strong>${esc(c.name)}</strong> <button data-id=\"${c.id}\" class=\"del-cat small\">Delete</button>`; const subs=document.createElement('div'); subs.className='small'; subs.textContent = 'Subs: ' + (c.subs && c.subs.length ? c.subs.join(', ') : 'none'); div.appendChild(subs); catsList.appendChild(div); }); }
  const subsList = q('#subs-list'); if(subsList){ subsList.innerHTML=''; state.categories.forEach(c=>{ if(c.subs && c.subs.length){ const h = document.createElement('div'); h.innerHTML = `<strong>${esc(c.name)}</strong>`; c.subs.forEach(sub=>{ const sdiv=document.createElement('div'); sdiv.className='small'; sdiv.textContent = sub; h.appendChild(sdiv); }); subsList.appendChild(h); } }); }

  const formCat = q('#form-category'); if(formCat){ formCat.innerHTML=''; state.categories.forEach(c=>{ const o=document.createElement('option'); o.value=c.id; o.textContent=c.name; formCat.appendChild(o); }); populateSubcategorySelect(); formCat.addEventListener('change', populateSubcategorySelect); }
  const parentSel = q('#cat-for-sub'); if(parentSel){ parentSel.innerHTML=''; state.categories.forEach(c=>{ const o=document.createElement('option'); o.value=c.id; o.textContent=c.name; parentSel.appendChild(o); }); }

  // bind admin buttons
  q('#add-cat')?.addEventListener('click', ()=>{ const name=(q('#new-cat')||{}).value.trim(); if(!name) return alert('Category name required'); const id = name.toLowerCase().replace(/\s+/g,'-') + '_' + Math.random().toString(36).slice(2,5); state.categories.push({ id, name, subs: [] }); save(state); renderAdmin(); alert('Category added'); });
  q('#add-sub')?.addEventListener('click', ()=>{ const parent=(q('#cat-for-sub')||{}).value; const sub=(q('#new-sub')||{}).value.trim(); if(!parent || !sub) return alert('Select parent and enter sub name'); const cat = state.categories.find(c=> c.id===parent); if(!cat) return; if(!cat.subs) cat.subs=[]; if(cat.subs.includes(sub)) return alert('Sub already exists'); cat.subs.push(sub); save(state); renderAdmin(); alert('Subcategory added'); });

  qa('.del-cat').forEach(b=> b.addEventListener('click', (e)=>{ const id = e.target.dataset.id; if(!confirm('Delete category and its subs?')) return; state.categories = state.categories.filter(c=> c.id!==id); // also remove series in that category
    state.series = state.series.filter(s=> s.categoryId !== id); save(state); renderAdmin(); renderHome(); }));

  q('#add-episode-row')?.addEventListener('click', ()=> addEpisodeRow());
  q('#save-series')?.addEventListener('click', ()=> saveSeries());
  q('#export-json')?.addEventListener('click', ()=>{ const data = JSON.stringify(state, null, 2); const blob = new Blob([data], {type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'mkstream_export.json'; a.click(); URL.revokeObjectURL(url); });
  q('#import-json')?.addEventListener('change', (e)=>{ const file = e.target.files[0]; if(!file) return; const r = new FileReader(); r.onload = ()=>{ try{ const obj = JSON.parse(r.result); state = obj; save(state); alert('Imported'); location.reload(); }catch(err){ alert('Invalid JSON'); } }; r.readAsText(file); });

  q('#save-ads')?.addEventListener('click', ()=>{ state.site.ads.header = (q('#ads-header')||{}).value || ''; state.site.ads.player = (q('#ads-player')||{}).value || ''; try{ const gs = (q('#global-servers')||{}).value || ''; state.globalServers = gs ? JSON.parse(gs) : []; }catch(e){ return alert('Invalid global servers JSON'); } save(state); alert('Ads & global servers saved'); });

  q('#save-seo')?.addEventListener('click', ()=>{ state.site.name = (q('#site-name')||{}).value || state.site.name; state.site.logo = (q('#site-logo')||{}).value || state.site.logo; state.site.colors.header = (q('#site-color-header')||{}).value || state.site.colors.header; state.site.colors.bg = (q('#site-color-bg')||{}).value || state.site.colors.bg; state.site.colors.accent = (q('#site-color-accent')||{}).value || state.site.colors.accent; state.site.seo.title = (q('#seo-title')||{}).value || state.site.seo.title; state.site.seo.description = (q('#seo-desc')||{}).value || state.site.seo.description; save(state); applyTheme(); applySEO(); alert('Site settings saved'); });

  q('#reset-site')?.addEventListener('click', ()=>{ if(confirm('Clear all data (this cannot be undone)?')){ localStorage.removeItem(STORAGE_KEY); state = JSON.parse(JSON.stringify(DEFAULT)); save(state); alert('Reset done'); location.reload(); } });

  renderSeriesList();
}

// add episode row to admin with server and subtitle controls
function addEpisodeRow(data){
  const container = q('#episode-rows'); if(!container) return;
  const row = document.createElement('div'); row.className = 'episode-row';
  const number = data && data.number ? data.number : '';
  const title = data && data.title ? data.title : '';
  const epThumb = data && data.thumbnail ? data.thumbnail : '';
  row.innerHTML = `
    <div class="row-top">
      <input class="input ep-number" placeholder="Episode number" value="${esc(number)}">
      <input class="input ep-title" placeholder="Episode title" value="${esc(title)}">
      <input class="input ep-thumb" placeholder="Episode thumbnail URL (optional)" value="${esc(epThumb)}">
      <button class="btn ep-remove">Remove</button>
    </div>
    <div class="servers"><strong>Servers</strong></div>
    <div class="subs"><strong>Subtitles</strong></div>
    <div style="display:flex;gap:8px;margin-top:6px;">
      <button class="btn add-server-inline" type="button">+ Add server</button>
      <button class="btn add-sub-inline" type="button">+ Add subtitle</button>
    </div>
  `;
  container.appendChild(row);

  // helper to add server entry
  const serversWrap = row.querySelector('.servers');
  const subtitlesWrap = row.querySelector('.subs');
  function addServerEntry(srv){
    const div = document.createElement('div'); div.className='server-entry';
    const name = document.createElement('input'); name.className='input server-name'; name.placeholder='Server name'; name.value = srv && srv.name ? srv.name : '';
    const url = document.createElement('input'); url.className='input server-url'; url.placeholder='Video URL or embed code'; url.value = srv && srv.url ? srv.url : '';
    const quality = document.createElement('input'); quality.className='input server-quality'; quality.placeholder='quality (optional e.g. 720)'; quality.style.maxWidth='120px'; quality.value = srv && srv.quality ? srv.quality : '';
    const ver = document.createElement('input'); ver.className='input server-version'; ver.placeholder='version (original/dubbed)'; ver.style.maxWidth='140px'; ver.value = srv && srv.version ? srv.version : 'original';
    const del = document.createElement('button'); del.className='btn'; del.textContent='Remove'; del.addEventListener('click', ()=> div.remove());
    div.appendChild(name); div.appendChild(url); div.appendChild(quality); div.appendChild(ver); div.appendChild(del); serversWrap.appendChild(div);
  }
  function addSubtitleEntry(st){
    const div = document.createElement('div'); div.className='sub-entry';
    const lang = document.createElement('input'); lang.className='input subtitle-lang'; lang.placeholder='Language (e.g., English)'; lang.value = st && st.lang ? st.lang : '';
    const surl = document.createElement('input'); surl.className='input subtitle-url'; surl.placeholder='Subtitle file URL (.vtt/.srt)'; surl.value = st && st.url ? st.url : '';
    const del = document.createElement('button'); del.className='btn'; del.textContent='Remove'; del.addEventListener('click', ()=> div.remove());
    div.appendChild(lang); div.appendChild(surl); div.appendChild(del); subtitlesWrap.appendChild(div);
  }

  if(data && data.servers && data.servers.length){ data.servers.forEach(s=> addServerEntry(s)); } else addServerEntry();
  if(data && data.subtitles && data.subtitles.length){ data.subtitles.forEach(st=> addSubtitleEntry(st)); }

  row.querySelector('.add-server-inline').addEventListener('click', ()=> addServerEntry());
  row.querySelector('.add-sub-inline').addEventListener('click', ()=> addSubtitleEntry());
  row.querySelector('.ep-remove').addEventListener('click', ()=> row.remove());
}

// populate subcategory select based on selected category in form
function populateSubcategorySelect(){
  const catId = (q('#form-category')||{}).value;
  const subSelect = q('#form-subcategory');
  if(!subSelect) return;
  subSelect.innerHTML = '<option value="">(none)</option>';
  const cat = state.categories.find(c=> c.id === catId);
  if(cat && cat.subs) cat.subs.forEach(s => { const o=document.createElement('option'); o.value = s; o.textContent = s; subSelect.appendChild(o); });
}

// save series from admin form
function saveSeries(){
  const catId = (q('#form-category')||{}).value; if(!catId) return alert('Select category');
  const cat = state.categories.find(c=> c.id === catId);
  const sub = (q('#form-subcategory')||{}).value || '';
  const title = (q('#form-title')||{}).value.trim(); if(!title) return alert('Series title required');
  const commonThumb = (q('#form-common-thumbnail')||{}).value.trim() || '';
  const useCommon = (q('#use-common-thumb')||{}).checked;
  const episodeRows = qa('#episode-rows .episode-row');
  if(episodeRows.length===0) return alert('Add at least one episode row');
  const episodes = [];
  for(const row of episodeRows){
    const num = row.querySelector('.ep-number').value.trim();
    const t = row.querySelector('.ep-title').value.trim();
    const epThumb = row.querySelector('.ep-thumb').value.trim();
    const servers = [];
    qa('.server-entry', row).forEach(se => {
      const name = se.querySelector('.server-name').value.trim();
      const url = se.querySelector('.server-url').value.trim();
      const quality = se.querySelector('.server-quality').value.trim();
      const version = se.querySelector('.server-version').value.trim() || 'original';
      if(url) servers.push({ name: name || 'Server', url, quality: quality || '', version });
    });
    const subs = [];
    qa('.sub-entry', row).forEach(su => {
      const lang = su.querySelector('.subtitle-lang').value.trim();
      const surl = su.querySelector('.subtitle-url').value.trim();
      if(surl) subs.push({ lang: lang || '', url: surl });
    });
    const ep = { id: uid('ep'), number: num || '', title: t || '', thumbnail: epThumb || (useCommon ? commonThumb : ''), servers, subtitles: subs };
    episodes.push(ep);
  }
  const seriesObj = { id: uid('series'), title, categoryId: catId, categoryName: cat.name, subcategory: sub, thumbnail: commonThumb, episodes, views:0, createdAt: Date.now() };
  state.series.unshift(seriesObj);
  save(state);
  alert('Series and episodes saved');
  // reset form
  q('#form-title').value=''; q('#form-common-thumbnail').value=''; q('#episode-rows').innerHTML='';
  renderAdmin(); renderHome();
}

// render series list in admin (with delete/edit)
function renderSeriesList(){
  const list = q('#series-list'); if(!list) return; list.innerHTML='';
  state.series.forEach(s=>{
    const div = document.createElement('div'); div.className='small'; div.innerHTML = `<strong>${esc(s.title)}</strong> (${esc(s.categoryName)}) <button data-id="${s.id}" class="edit-series btn">Edit</button> <button data-id="${s.id}" class="delete-series btn">Delete</button>`;
    list.appendChild(div);
  });
  qa('.delete-series').forEach(b=> b.addEventListener('click', (e)=>{ const id = e.target.dataset.id; if(!confirm('Delete this series?')) return; state.series = state.series.filter(x=> x.id !== id); save(state); renderSeriesList(); renderHome(); alert('Deleted'); }));
  qa('.edit-series').forEach(b=> b.addEventListener('click', (e)=>{ const id = e.target.dataset.id; const s = state.series.find(x=> x.id===id); if(!s) return alert('Not found'); // load into form for editing: simple approach - prefill title, common thumb, episodes rows cleared and filled
    q('#form-title').value = s.title; q('#form-common-thumbnail').value = s.thumbnail || ''; q('#form-category').value = s.categoryId; populateSubcategorySelect(); q('#form-subcategory').value = s.subcategory || '';
    const rows = q('#episode-rows'); rows.innerHTML=''; (s.episodes||[]).forEach(ep=> addEpisodeRow(ep)); // remove original series to replace on save
    state.series = state.series.filter(x=> x.id !== id); save(state); renderSeriesList(); alert('Loaded into editor - save to update'); }));
}

// UI: hamburger, search, sidebar init
function openSidebar(){ const sidebar = q('#sidebar'); if(!sidebar) return; sidebar.classList.add('open'); sidebar.setAttribute('aria-hidden','false'); const ham = q('#hamburger'); if(ham) ham.setAttribute('aria-expanded','true'); }
function closeSidebar(){ const sidebar = q('#sidebar'); if(!sidebar) return; sidebar.classList.remove('open'); sidebar.setAttribute('aria-hidden','true'); const ham = q('#hamburger'); if(ham) ham.setAttribute('aria-expanded','false'); }
function initUI(){
  q('#hamburger')?.addEventListener('click', ()=>{ const sb=q('#sidebar'); if(!sb) return; if(sb.classList.contains('open')) closeSidebar(); else openSidebar(); });
  q('#sidebar-close')?.addEventListener('click', ()=> closeSidebar());
  qa('.side-link').forEach(b=> b.addEventListener('click', ()=> { const link = b.dataset.link; if(link) location.href = link; }));
  q('#search-toggle')?.addEventListener('click', ()=>{ q('#search-overlay')?.classList.remove('hidden'); q('#search-overlay')?.setAttribute('aria-hidden','false'); q('#search-input')?.focus(); });
  q('#search-close')?.addEventListener('click', ()=>{ q('#search-overlay')?.classList.add('hidden'); q('#search-overlay')?.setAttribute('aria-hidden','true'); });
  q('#search-input')?.addEventListener('input', (e)=>{ const v = (e.target.value||'').toLowerCase(); const out = q('#search-results'); out.innerHTML=''; const results = state.series.filter(s=> s.title.toLowerCase().includes(v) || (s.episodes||[]).some(ep=> (ep.title||'').toLowerCase().includes(v))); results.slice(0,50).forEach(r=>{ const d=document.createElement('div'); d.className='small'; d.textContent = r.title; d.addEventListener('click', ()=> location.href=`player.html?series=${encodeURIComponent(r.id)}`); out.appendChild(d); }); });
  q('#admin-login')?.addEventListener('click', ()=>{ const pass = (q('#admin-pass')||{}).value; if(pass === state.site.password){ q('#admin-status').textContent = 'Authenticated'; q('#admin-status').style.color = 'lightgreen'; alert('Logged in'); } else alert('Wrong password'); });
  q('#change-pass-btn')?.addEventListener('click', ()=>{ const oldp=(q('#change-pass-old')||{}).value; const newp=(q('#change-pass-new')||{}).value; if(!oldp||!newp) return alert('Provide old and new password'); if(oldp !== state.site.password) return alert('Old password wrong'); state.site.password = newp; save(state); alert('Password changed'); });
}

// init page based on path
function initPage(){
  renderCategories();
  const path = location.pathname.split('/').pop();
  if(path === '' || path === 'index.html'){ renderHome(); }
  if(path === 'category.html'){ renderCategoryPage(); }
  if(path === 'player.html'){ renderPlayerPage(); }
  if(path === 'admin.html'){ renderAdmin(); }
  initUI();
}

document.addEventListener('DOMContentLoaded', ()=>{ initPage(); });
