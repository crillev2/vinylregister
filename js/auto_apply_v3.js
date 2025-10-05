// vinylregister auto-apply v3.1 (stabil)
// - Robust EAN-gömning (MutationObserver + retries)
// - Toppmeny (Register/Rapport)
// - Markerar manuella fält
// - Lägger till Inköpsdatum
// - Quick search ovanför #registerTable
// - Demo-data via ?demo=1
(function(){
  "use strict";

  function onReady(fn){
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  function createEl(tag, attrs={}, html=""){
    const el = document.createElement(tag);
    for (const [k,v] of Object.entries(attrs)){
      if (k === "class") el.className = v;
      else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
      else el.setAttribute(k, v);
    }
    if (html) el.innerHTML = html;
    return el;
  }

  // Säkerställ CSS för .col-ean (om patch_v1.css saknas)
  function ensureColEanStyle(){
    if (document.getElementById("vr-col-ean-style")) return;
    const style = createEl("style", { id: "vr-col-ean-style" });
    style.textContent = ".col-ean{display:none !important;}";
    document.head.appendChild(style);
  }

  // Enkel toppmeny
  function ensureTopNav(){
    if (document.querySelector(".vr-nav")) return;
    const nav = createEl("nav", { class:"vr-nav no-print" });
    const btnReg = createEl("button", { class:"vr-btn", type:"button" }, "Register");
    const btnRap = createEl("button", { class:"vr-btn", type:"button" }, "Rapport");
    btnReg.addEventListener("click", ()=> location.href = "index.html#register");
    btnRap.addEventListener("click", ()=> location.href = "rapport.html");
    nav.append(btnReg, btnRap);
    document.body.firstChild ? document.body.insertBefore(nav, document.body.firstChild)
                             : document.body.appendChild(nav);
  }

  // Markera manuella fält
  function addManualFieldStyling(){
    ["salePrice","notes","note","customNote","customPrice"].forEach(id=>{
      const el = document.getElementById(id);
      if (el && !el.classList.contains("manual-field")) el.classList.add("manual-field");
    });
  }

  // Lägg till Inköpsdatum om det saknas
  function ensurePurchaseDateField(){
    if (document.getElementById("purchaseDate")) return;
    const grid = document.querySelector(".metadata-grid") || document.querySelector("form") || document.body;
    const label = createEl("label", { class:"field" });
    const span  = createEl("span", {}, "Inköpsdatum");
    const input = createEl("input", { type:"date", id:"purchaseDate", class:"manual-field" });
    label.append(span, input);
    grid.appendChild(label);
  }

  // Göm EAN-kolumn – via data-col="ean" eller rubriktext
  function hideEANColumn(){
    ensureColEanStyle();

    const tables = document.querySelectorAll("table");
    tables.forEach(tbl=>{
      const thead = tbl.tHead;
      if (!thead || !thead.rows.length) return;

      let eanIndex = -1;
      const headers = Array.from(thead.rows[0].cells);

      headers.forEach((th, idx)=>{
        const dataMatch = th.getAttribute("data-col") === "ean";
        const text = (th.textContent || "").trim().toLowerCase();
        const txtMatch = (text === "ean") || text.includes("ean-kod") || text.includes("streckkod");
        if (eanIndex === -1 && (dataMatch || txtMatch)) eanIndex = idx;
      });
      if (eanIndex === -1) return;

      // Header
      const th = thead.rows[0].cells[eanIndex];
      if (th) th.classList.add("col-ean");

      // Body-celler
      Array.from(tbl.tBodies).forEach(tbody=>{
        Array.from(tbody.rows).forEach(tr=>{
          const cell = tr.cells[eanIndex];
          if (cell) cell.classList.add("col-ean");
        });
      });
    });
  }

  // Kör på sena/dynamiska renderingar
  function startTableObserver(){
    if (!("MutationObserver" in window)) return;
    const observer = new MutationObserver(()=>{
      clearTimeout(startTableObserver._timer);
      startTableObserver._timer = setTimeout(hideEANColumn, 60);
    });
    observer.observe(document.body, { childList:true, subtree:true });
  }

  // Quick search ovanför registertabellen
  function ensureQuickSearch(){
    const table = document.querySelector("#registerTable");
    if (!table) return;
    if (document.getElementById("quickSearch")) return;

    const box = createEl("input", {
      id: "quickSearch",
      type: "search",
      placeholder: "Sök artist/titel/EAN…",
      class: "manual-field",
      style: "margin:8px 0;"
    });
    table.parentNode.insertBefore(box, table);

    box.addEventListener("input", function(){
      const q = this.value.toLowerCase();
      table.querySelectorAll("tbody tr").forEach(tr=>{
        tr.style.display = tr.textContent.toLowerCase().includes(q) ? "" : "none";
      });
    });
  }

  // Demodata via ?demo=1
  function installDemoDataIfRequested(){
    const params = new URLSearchParams(location.search);
    if (!params.has("demo")) return;
    const demo = [
      { id:"1", artist:"Deep Purple", title:"Burn", stockQty:2, soldQty:1, price:120, salePrice:100, purchaseDate:"2025-06-01", soldDate:"2025-09-01", ean:"123" },
      { id:"2", artist:"Led Zeppelin", title:"IV",    stockQty:1, soldQty:0, price:180, purchaseDate:"2025-04-10", ean:"456" },
      { id:"3", artist:"Dire Straits", title:"Sultans of Swing", stockQty:3, soldQty:2, price:150, purchaseDate:"2025-03-15", soldDate:"2025-09-10", ean:"789" }
    ];
    try { localStorage.setItem("vinyl_records", JSON.stringify(demo)); } catch(e){}
  }

  onReady(function(){
    try{
      ensureTopNav();
      addManualFieldStyling();
      ensurePurchaseDateField();
      installDemoDataIfRequested();

      // Kör direkt
      hideEANColumn();
      ensureQuickSearch();

      // Extra retries för mobil/långsam render
      let retries = 10;
      const retry = setInterval(()=>{
        hideEANColumn();
        ensureQuickSearch();
        if (--retries <= 0) clearInterval(retry);
      }, 250);

      startTableObserver();

      // Nödknapp i konsolen vid behov
      window.hideEANColumn = hideEANColumn;
    }catch(e){
      console.error("auto_apply_v3.1 error:", e);
    }
  });
})();
