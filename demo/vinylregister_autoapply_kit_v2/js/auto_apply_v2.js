
// vinylregister auto-apply patch v2
// Applies steps 2–5 and 8 at runtime with minimal manual edits.
// Include this file after your own scripts on index.html:
//   <script src="js/auto_apply_v2.js"></script>
(function(){
  function onReady(fn){ if(document.readyState!=="loading") fn(); else document.addEventListener("DOMContentLoaded", fn); }

  function createEl(tag, attrs={}, html=""){
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{
      if(k==="class") el.className = v;
      else if(k==="style" && typeof v==="object"){ Object.assign(el.style, v); }
      else el.setAttribute(k, v);
    });
    if(html) el.innerHTML = html;
    return el;
  }

  function ensureTopNav(){
    if(document.querySelector(".vr-nav")) return;
    const nav = createEl("nav", {class:"vr-nav no-print"});
    const btnReg = createEl("button", {class:"vr-btn", type:"button"}); btnReg.textContent = "Register";
    const btnRap = createEl("button", {class:"vr-btn", type:"button"}); btnRap.textContent = "Rapport";
    btnReg.addEventListener("click", ()=>{ location.href = "index.html#register"; });
    btnRap.addEventListener("click", ()=>{ location.href = "rapport.html"; });
    nav.appendChild(btnReg); nav.appendChild(btnRap);
    // Insert at top of body
    const body = document.body;
    if(body.firstChild) body.insertBefore(nav, body.firstChild);
    else body.appendChild(nav);
  }

  function addManualFieldStyling(){
    // Step 3 in quick guide: add 'manual-field' class to manual inputs if they exist
    const ids = ["salePrice","notes","note","customNote","customPrice"]; // common guesses
    ids.forEach(id=>{
      const el = document.getElementById(id);
      if(el && !el.classList.contains("manual-field")) el.classList.add("manual-field");
    });
  }

  function ensurePurchaseDateField(){
    // Step 4: add Inköpsdatum if it doesn't exist
    if(document.getElementById("purchaseDate")) return;

    // Prefer metadata grid, else form, else body
    const grid = document.querySelector(".metadata-grid") || document.querySelector("form") || document.body;
    const label = createEl("label", {class:"field"});
    const span  = createEl("span", {}, "Inköpsdatum");
    const input = createEl("input", {type:"date", id:"purchaseDate", class:"manual-field"});
    label.appendChild(span); label.appendChild(input);

    // If metadata-grid has 2 columns, appending is fine.
    grid.appendChild(label);
  }

  function hideEANColumn(){
    // Step 5: hide EAN in register view by adding CSS class/inline style to th/td
    const tables = document.querySelectorAll("table");
    tables.forEach(tbl=>{
      const thead = tbl.tHead;
      if(!thead || !thead.rows.length) return;
      let eanIndex = -1;
      // find header whose text includes "ean"
      const cells = Array.from(thead.rows[0].cells);
      cells.forEach((th, idx)=>{
        const txt = (th.textContent || "").trim().toLowerCase();
        if(eanIndex === -1 && (txt === "ean" || txt.includes("ean-kod") || txt.includes("streckkod"))) {
          eanIndex = idx;
        }
        // also if developer pre-tagged with data-col="ean"
        if(eanIndex === -1 && th.getAttribute("data-col")==="ean"){ eanIndex = idx; }
      });
      if(eanIndex === -1) return;

      function hideCell(cell){
        cell.classList.add("col-ean");
        // Fallback inline style if CSS is missing
        cell.style.display = "none";
      }

      hideCell(thead.rows[0].cells[eanIndex]);
      // hide all body cells in that column
      const rows = tbl.tBodies.length ? tbl.tBodies[0].rows : [];
      Array.from(rows).forEach(tr=>{
        if(tr.cells.length > eanIndex) hideCell(tr.cells[eanIndex]);
      });
    });
  }

  function installDemoDataIfRequested(){
    // Step 8: If URL has ?demo=1, seed localStorage with sample records for rapport.html
    const params = new URLSearchParams(location.search);
    if(!params.has("demo")) return;
    const demo = [
      { id:"1", artist:"Deep Purple", title:"Burn", stockQty:2, soldQty:1, price:120, salePrice:100, purchaseDate:"2025-06-01", soldDate:"2025-09-01", ean:"123" },
      { id:"2", artist:"Led Zeppelin", title:"IV", stockQty:1, soldQty:0, price:180, purchaseDate:"2025-04-10", ean:"456" },
      { id:"3", artist:"Dire Straits", title:"Sultans of Swing", stockQty:3, soldQty:2, price:150, purchaseDate:"2025-03-15", soldDate:"2025-09-10", ean:"789" }
    ];
    try{
      localStorage.setItem("vinyl_records", JSON.stringify(demo));
      console.log("[vinylregister] Demo-data installerat i localStorage (vinyl_records).");
      // mild notice
      if(!document.querySelector("#vr-demo-notice")){
        const div = createEl("div", {id:"vr-demo-notice", style:{position:"fixed", bottom:"12px", right:"12px", background:"#eef7ff", border:"1px solid #bcd", padding:"8px 12px", borderRadius:"8px", zIndex:"99999"}},
          "Demo-data laddad (vinyl_records). Öppna Rapport för att testa.");
        document.body.appendChild(div);
        setTimeout(()=> div.remove(), 5000);
      }
    }catch(e){
      console.warn("Kunde inte skriva demo-data:", e);
    }
  }

  onReady(function(){
    try{
      ensureTopNav();           // Quick guide step 2
      addManualFieldStyling();  // Quick guide step 3
      ensurePurchaseDateField();// Quick guide step 4
      hideEANColumn();          // Quick guide step 5
      installDemoDataIfRequested(); // Quick guide step 8
    }catch(e){
      console.error("auto_apply_v2 error:", e);
    }
  });
})();
