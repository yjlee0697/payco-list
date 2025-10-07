
const STATE = { cat: "전체", region: "" };

function norm(s){
  return (s||"").toString().toLowerCase()
    .replace(/[^a-z0-9\u3131-\u318e\uac00-\ud7a3]/g, "").trim();
}

const REGION_KEYWORDS = {
  "강남": [
    "강남","강남구","논현","신논현","역삼","선릉","삼성","청담",
    "압구정","신사","대치","개포","도곡","수서","일원","세곡",
    "학동","학여울","한티","매봉","언주","sinnonhyeon","sinnonhyun"
  ],
  "가산": [
    "가산","가산디지털","가산디지털단지","금천","금천구","철산","독산",
    "gasan","gasandigital","geumcheon","geumcheongu","doksan","cheolsan"
  ]
};

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
  const set = REGION_KEYWORDS[region] || [region];
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
}
document.addEventListener("DOMContentLoaded", boot);
