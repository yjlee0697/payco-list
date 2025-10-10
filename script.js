
const STATE = { cat: "전체", region: "" };

function norm(s){
  return (s||"").toString().toLowerCase()
    .replace(/[^a-z0-9\u3131-\u318e\uac00-\ud7a3]/g, "").trim();
}


function includesAnyKeyword(row, keywords){
  const haystack = [
    norm(row["위치"] || row["주소"]),
    norm(row["column1"]),
    norm(row["이름"] || row["매장명"] || row["상호명"] || row["name"])
  ].join("|");
  return keywords.some(k => haystack.includes(norm(k)));
}

function matchRegion(row, region){
  if (!region) return true;
  const set = {
    "강남": [
      "강남", "강남구", "논현", "신논현", "역삼", "선릉", "삼성", "청담",
      "압구정", "신사", "대치", "개포", "도곡", "수서", "일원", "세곡",
      "학동", "학여울", "한티", "매봉", "언주", "sinnonhyeon", "sinnonhyun"
    ],
    "가산": [
      "가산", "가산디지털", "가산디지털단지", "금천", "금천구", "철산", "독산",
      "gasan", "gasandigital", "geumcheon", "geumcheongu", "doksan", "cheolsan"
    ]
  }[region] || [region];
  return includesAnyKeyword(row, set);
}

function decorateDistance(d) {
  if (!d) return "";
  const s = (d+"").trim();
  if (/^\d+(\.\d+)?$/.test(s)) return s + "m";
  if (s.includes("분")) return "걸어서 " + s;
  return s;
}

function buildTabs(data){
  const cats = Array.from(new Set(data.map(r => r.category))).sort();
  const tabs = ["전체", ...cats];
  const el = document.getElementById("tabs");
  el.innerHTML = tabs.map((c,i)=>
    `<button class="tab ${i===0?'active':''}" data-cat="${c}">${c}</button>`
  ).join("");
  el.addEventListener("click", (e)=>{
    const t = e.target.closest(".tab"); if(!t) return;
    document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active", x===t));
    STATE.cat = t.dataset.cat;
    render(window.__DATA__);
  });
}

function bindChips(){
  const chips = document.getElementById("chips");
  chips.addEventListener("click", (e)=>{
    const c = e.target.closest(".chip"); if(!c) return;
    document.querySelectorAll(".chip").forEach(x=>x.classList.toggle("active", x===c));
    STATE.region = c.dataset.region || "";
    render(window.__DATA__);
  });
}

function render(data){
  const rows = data.filter(r =>
    (STATE.cat==="전체" || r.category===STATE.cat) &&
    matchRegion(r, STATE.region)
  );
  const list = document.getElementById("list");
  if (rows.length===0){
    list.innerHTML = `<div class="empty">조건에 맞는 결과가 없습니다.</div>`;
  } else {
    list.innerHTML = rows.map(r => {
      const name = r["이름"] || r["매장명"] || r["상호명"] || r["name"] || "상호명 미상";
      const loc  = r["위치"] || r["주소"] || "";
      const dist = decorateDistance(r["distance"] || "");
      const nHref = (r["naver"]||"").trim() || "javascript:void(0)";
      const kHref = (r["kakao"]||"").trim() || "javascript:void(0)";
      return `
        <div class="row">
          <div class="left">
            <div class="name">${name}</div>
            <div class="loc">${loc}</div>
            ${dist ? `<div class="dist">${dist}</div>` : ""}
          </div>
          <div class="right">
            <a class="btn btn-naver" href="${nHref}" target="_blank" rel="noopener" title="네이버 지도">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path fill="#FFFFFF" d="M6 5h4.2l3.8 5.4V5H18v14h-4.2L10 13.6V19H6V5z"/>
              </svg>
            </a>
            <a class="btn btn-kakao" href="${kHref}" target="_blank" rel="noopener" title="카카오 지도">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path fill="#000000" d="M12 4C7.6 4 4 6.9 4 10.4c0 2.2 1.5 4.1 3.7 5.2l-.9 3.3c-.1.4.3.7.6.5l3.6-2c.6.1 1.2.1 1.9.1 4.4 0 8-2.9 8-6.4S16.4 4 12 4z"/>
              </svg>
            </a>
          </div>
        </div>`;
    }).join("");
  }
  document.getElementById("count").textContent = rows.length;
}

async function boot(){
  const res = await fetch("data.json");
  const data = await res.json();
  window.__DATA__ = data;
  buildTabs(data);
  bindChips();
  render(data);

  if (typeof wireModals === 'function') { wireModals(); }
}
document.addEventListener("DOMContentLoaded", boot);


// --- Game (Tinder-like) ---
const game = { region: null, pool: [], index: 0 };

const REGION_KEYWORDS = {
  "강남": ["강남","강남구","논현","신논현","역삼","선릉","삼성","청담","압구정","신사","대치","개포","도곡","수서","일원","세곡","학동","학여울","한티","매봉","언주","sinnonhyeon","sinnonhyun"],
  "가산": ["가산","가산디지털","가산디지털단지","금천","금천구","철산","독산","gasan","gasandigital","geumcheon","geumcheongu","doksan","cheolsan"]
};

function includesAnyKeyword(row, keywords){
  const haystack = [
    norm(row["위치"] || row["주소"]),
    norm(row["column1"]),
    norm(row["이름"] || row["매장명"] || row["상호명"] || row["name"])
  ].join("|");
  return keywords.some(k => haystack.includes(norm(k)));
}

function matchRegionInGame(row, region){
  if (!region) return true;
  const set = {
    "강남": [
      "강남", "강남구", "논현", "신논현", "역삼", "선릉", "삼성", "청담",
      "압구정", "신사", "대치", "개포", "도곡", "수서", "일원", "세곡",
      "학동", "학여울", "한티", "매봉", "언주", "sinnonhyeon", "sinnonhyun"
    ],
    "가산": [
      "가산", "가산디지털", "가산디지털단지", "금천", "금천구", "철산", "독산",
      "gasan", "gasandigital", "geumcheon", "geumcheongu", "doksan", "cheolsan"
    ]
  }[region] || [region];
  return includesAnyKeyword(row, set);
}

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

function openRegionModal(){
  const bd = document.getElementById('regionBackdrop');
  if (bd) show(bd);
}
function closeRegionModal(){
  const bd = document.getElementById('regionBackdrop');
  if (bd) bd.style.display = 'none';
}
function openOverlay(){
  const el = document.getElementById('overlay');
  if (el) el.style.display = 'flex';
}
function closeOverlay(){
  const el = document.getElementById('overlay');
  if (el) el.style.display = 'none';
  const stack = document.getElementById('stack');
  if (stack) stack.innerHTML = '';
  game.index = 0; game.pool = [];
}

function startGame(){
  const data = (window.__DATA__||[]).filter(r => matchRegionInGame(r, game.region));
  if (data.length===0){ alert('해당 지역 데이터가 없습니다.'); return; }
  game.pool = shuffle(data.slice());
  game.index = 0;
  closeRegionModal();
  openOverlay();
  buildStack();
}

function buildStack(){
  const stack = document.getElementById('stack');
  if (!stack) return;
  stack.innerHTML = '';
  const topN = Math.min(3, game.pool.length - game.index);
  for (let i=0;i<topN;i++){
    const row = game.pool[game.index + i];
    const card = createCard(row, i);
    stack.appendChild(card);
  }
}

function createCard(row, depth){
  const name = row["이름"] || row["매장명"] || row["상호명"] || row["name"] || "상호명 미상";
  const loc  = row["위치"] || row["주소"] || "";
  const dist = decorateDistance(row["distance"] || "");
  const nHref = (row["naver"]||"").trim() || "#";
  const kHref = (row["kakao"]||"").trim() || "#";

  const el = document.createElement('div');
  el.className = 'card';
  el.style.transform = `translateY(${depth*6}px) scale(${1 - depth*0.02})`;
  el.style.opacity = `${1 - depth*0.025}`;
  el.innerHTML = `
    <div class="badge">#${game.index+depth+1} · ${row.category||'분류없음'}</div>
    <div class="meta">
      <div class="title">${name}</div>
      <div class="loc">${loc}</div>
      ${dist ? `<div class="dist">${dist}</div>` : ''}
    </div>
    <div class="links">
      <a class="bigbtn" href="${nHref}" target="_blank" rel="noopener" title="네이버로 보기" aria-label="네이버로 보기">
        <svg viewBox="0 0 24 24"><path fill="#03C75A" d="M6 5h4.2l3.8 5.4V5H18v14h-4.2L10 13.6V19H6V5z"/></svg>
        <span>네이버</span>
      </a>
      <a class="bigbtn" href="${kHref}" target="_blank" rel="noopener" title="카카오로 보기" aria-label="카카오로 보기">
        <svg viewBox="0 0 24 24"><path fill="#000000" d="M12 4C7.6 4 4 6.9 4 10.4c0 2.2 1.5 4.1 3.7 5.2l-.9 3.3c-.1.4.3.7.6.5l3.6-2c.6.1 1.2.1 1.9.1 4.4 0 8-2.9 8-6.4S16.4 4 12 4z"/></svg>
        <span>카카오</span>
      </a>
    </div>
    <div class="actions">
      <button class="fab" data-action="no" title="No (오른쪽 스와이프)">➡️</button>
      <button class="fab" data-action="yes" title="Yes (왼쪽 스와이프)">⬅️</button>
    </div>
    <div class="hint">YES</div>
    <div class="hint no">NO</div>
  `;

  makeDraggable(el, row);
  const yesBtn = el.querySelector('[data-action="yes"]');
  const noBtn  = el.querySelector('[data-action="no"]');
  if (yesBtn) yesBtn.addEventListener('click', ()=>handleYes(el, row));
  if (noBtn)  noBtn.addEventListener('click', ()=>handleNo(el, row));
  return el;
}

function handleYes(card, row){ swipeOut(card, -1); showResult(row); }
function handleNo(card, row){ swipeOut(card, +1); }

function swipeOut(card, direction){
  const stack = document.getElementById('stack');
  card.style.transition = 'transform .3s ease, opacity .3s ease';
  card.style.transform = `translate(${direction*700}px, -40px) rotate(${direction*18}deg)`;
  card.style.opacity = '0';
  setTimeout(()=>{
    card.remove();
    game.index++;
    if (game.index >= game.pool.length){
      closeOverlay();
      alert('추천이 끝났습니다 🎉');
      return;
    }
    Array.from(stack.children).forEach((el, idx)=>{
      el.style.transition = 'transform .2s ease, opacity .2s ease';
      el.style.transform = `translateY(${idx*6}px) scale(${1 - idx*0.02})`;
      el.style.opacity = `${1 - idx*0.1}`;
    });
    const need = 3 - stack.children.length;
    for (let i=0;i<need;i++){
      const nextRow = game.pool[game.index + stack.children.length];
      if (!nextRow) break;
      stack.appendChild(createCard(nextRow, stack.children.length));
    }
  }, 310);
}

function getPoint(e){
  if (e.touches && e.touches[0]) return {x:e.touches[0].clientX, y:e.touches[0].clientY};
  return {x:e.clientX, y:e.clientY};
}

function makeDraggable(card, row){
  let startX=0, startY=0, dx=0, dy=0, dragging=false;
  function onDown(e){ dragging=true; const p=getPoint(e); startX=p.x; startY=p.y; card.setPointerCapture && card.setPointerCapture(e.pointerId||0); }
  function onMove(e){
    if (!dragging) return;
    const p=getPoint(e); dx=p.x-startX; dy=p.y-startY;
    const rot=dx/15;
    card.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
    const h1=card.querySelector('.hint'); const h2=card.querySelector('.hint.no');
    if (h1) h1.style.opacity = dx<-40 ? '1':'0';
    if (h2) h2.style.opacity = dx> 40 ? '1':'0';
  }
  function onUp(){
    if (!dragging) return;
    dragging=false;
    const threshold=80;
    if (dx < -threshold) handleYes(card, row);
    else if (dx > threshold) handleNo(card, row);
    else {
      card.style.transition='transform .2s ease'; card.style.transform=''; setTimeout(()=>card.style.transition='',210);
      const h1=card.querySelector('.hint'); const h2=card.querySelector('.hint.no');
      if (h1) h1.style.opacity='0'; if (h2) h2.style.opacity='0';
    }
    dx=dy=0;
  }
  card.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}


function showResult(row){
  const bd = document.getElementById('resultBackdrop'); if(!bd) return;
  const body = document.getElementById('resultBody');
  const links= document.getElementById('resultLinks');

  let name = row["이름"] || row["매장명"] || row["상호명"] || row["name"] || "상호명 미상";
  let loc  = row["위치"] || row["주소"] || "";
  let dist = (row["distance"] || "").toString().trim();

  // Fallback from the top visible card if address/time missing
  if (!loc || !dist){
    const topCard = document.querySelector('#stack .card.active') || document.querySelector('#stack .card:last-child') || document.querySelector('#stack .card');
    if (topCard){
      if (!loc){
        const locEl = topCard.querySelector('.loc, .address, .addr, .location');
        if (locEl) loc = (locEl.textContent||'').trim();
      }
      if (!dist){
        const distEl = topCard.querySelector('.dist, .eta, .mins, .time, .distance');
        if (distEl) dist = (distEl.textContent||'').trim();
      }
      if (!name){
        const titleEl = topCard.querySelector('.title, .name, h3, h2');
        if (titleEl) name = (titleEl.textContent||'').trim();
      }
    }
  }

  // Normalize distance label
  if (dist){
    const hasMinutes = /분/.test(dist) || /\d+\s*min/i.test(dist);
    const num = (dist.match(/\d+/)||[])[0];
    if (num && !/걸어서/.test(dist)) dist = (hasMinutes? '걸어서 ' : '') + num + '분';
  }

  // Render body
  body.innerHTML = `
    <div class="title">${name}</div>
    <div class="loc">${loc}</div>
    ${dist ? `<div class="dist">${dist}</div>` : ''}
  `;

  // Links: prefer provided hrefs; else build from name+loc
  let nHref = (row["naver"]||"").trim();
  let kHref = (row["kakao"]||"").trim();
  if (!nHref || !kHref){
    const q = encodeURIComponent((name? name+' ' : '') + (loc||''));
    if (!nHref) nHref = "https://map.naver.com/v5/search/" + q;
    if (!kHref) kHref = "https://map.kakao.com/?q=" + q;
  }

  // Text-only brand buttons
  links.innerHTML = `
    <a class="bigbtn naver" href="${nHref}" target="_blank" rel="noopener"><span>네이버 지도</span></a>
    <a class="bigbtn kakao" href="${kHref}" target="_blank" rel="noopener"><span>카카오맵</span></a>
  `;

  bd.style.display = 'flex';
}

function closeResult(){ const bd=document.getElementById('resultBackdrop'); if(bd) bd.style.display='none'; }

// Keyboard support: Left = YES, Right = NO
window.addEventListener('keydown', (e)=>{
  const overlay = document.getElementById('overlay');
  if (overlay && overlay.style.display === 'flex'){
    const topCard = document.querySelector('#stack .card:last-child');
    if (!topCard) return;
    const row = game.pool[game.index];
    if (e.key === 'ArrowLeft') handleYes(topCard, row);
    else if (e.key === 'ArrowRight') handleNo(topCard, row);
  }
});

function wireModals(){
  const openBtn = document.getElementById('openGame');
  const closeRegionBtn = document.getElementById('closeRegion');
  const startBtn = document.getElementById('startGame');
  const closeOverlayBtn = document.getElementById('closeOverlayBtn');
  const resultClose = document.getElementById('resultClose');

  if (openBtn) openBtn.addEventListener('click', openRegionModal);
  if (closeRegionBtn) closeRegionBtn.addEventListener('click', closeRegionModal);
  if (closeOverlayBtn) closeOverlayBtn.addEventListener('click', closeOverlay);
  if (resultClose) resultClose.addEventListener('click', closeResult);

  let selected = null;
  document.querySelectorAll('#regionModal .radio').forEach(el=>{
    el.addEventListener('click', ()=>{
      document.querySelectorAll('#regionModal .radio').forEach(x=>x.classList.remove('active'));
      el.classList.add('active');
      selected = el.getAttribute('data-region');
      game.region = selected;
      if (startBtn) startBtn.disabled = false;
    });
  });
  if (startBtn) startBtn.addEventListener('click', startGame);
}



// === FIX: Wire "추천 게임" button to open the region modal, safely ===
(function(){
  function show(el){ if(el) el.style.display = 'flex'; syncModalOpenClass(); }
  function hide(el){ if(el) el.style.display = 'none'; syncModalOpenClass(); }

  
// === 공통: 모달 열림 상태 동기화 (플로팅 버튼 숨김 제어) ===
function syncModalOpenClass(){
  const ids = ['regionBackdrop','overlay','resultBackdrop'];
  const anyOpen = ids.some(id=>{
    const el = document.getElementById(id);
    return el && getComputedStyle(el).display !== 'none';
  });
  document.body.classList.toggle('modal-open', anyOpen);
}
function wireGameOpen(){
    var btnOpen = document.getElementById('openGame');
    var region  = document.getElementById('regionBackdrop');
    var closeR  = document.getElementById('closeRegion');
    var start   = document.getElementById('startGame');
    var overlay = document.getElementById('overlay');
    var closeO  = document.getElementById('closeOverlayBtn');
    var resultB = document.getElementById('resultBackdrop');
    var closeRB = document.getElementById('resultClose');

    if (btnOpen && region){
      btnOpen.addEventListener('click', function(){ show(region); });
    }
    if (closeR && region){
      closeR.addEventListener('click', function(){ hide(region); });
    }
    if (closeO && overlay){
      closeO.addEventListener('click', function(){ hide(overlay); });
    }
    if (closeRB && resultB){
      closeRB.addEventListener('click', function(){ hide(resultB); });
    }

    // Enable start button after selecting a region
    var selected = null;
    document.querySelectorAll('#regionModal .radio').forEach(function(el){
      el.addEventListener('click', function(){
        document.querySelectorAll('#regionModal .radio').forEach(function(x){ x.classList.remove('active'); });
        el.classList.add('active');
        selected = el.getAttribute('data-region');
        if (start) start.disabled = false;
        // Persist selection for game logic that may exist elsewhere
        window.__GAME_SELECTED_REGION__ = selected;
      });
    });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', wireGameOpen);
  } else {
    wireGameOpen();
  }
})();
