
(function(){
  function loadRecords(){
    let raw = localStorage.getItem('vinyl_records');
    if(!raw){ return []; }
    try{
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    }catch(e){ return []; }
  }

  function daysBetween(d1, d2){
    const t = Math.abs(d2 - d1);
    return Math.floor(t / (1000*60*60*24));
  }
  function parseDate(s){
    if(!s) return null;
    const d = new Date(s);
    if(Number.isNaN(d.getTime())) return null;
    return d;
  }

  const records = loadRecords();
  const today = new Date();

  // KPIs (no avg days)
  const titlesInStock = records.filter(r => Number(r.stockQty||0) > 0).length;
  const totalStock = records.reduce((acc,r)=> acc + Number(r.stockQty||0), 0);
  const totalSold  = records.reduce((acc,r)=> acc + Number(r.soldQty || 0), 0);

  const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = String(val); };
  set('kpiTitles', titlesInStock);
  set('kpiStock', totalStock);
  set('kpiSold', totalSold);

  // Senaste försäljningar
  const soldTbody = document.querySelector('#tblSold tbody');
  const soldFromEl = document.getElementById('soldFrom');
  const soldToEl   = document.getElementById('soldTo');
  const btnFilter  = document.getElementById('btnFilterSold');

  function renderSold(){
    const fromV = parseDate(soldFromEl.value);
    const toV   = parseDate(soldToEl.value);
    const rows = records
      .filter(r => r.soldDate)
      .filter(r => {
        const d = parseDate(r.soldDate);
        if(!d) return false;
        if(fromV && d < fromV) return false;
        if(toV && d > toV) return false;
        return true;
      })
      .sort((a,b)=> (b.soldDate||"").localeCompare(a.soldDate||"")) // nyast först
      .map(r => {
        const tr = document.createElement('tr');
        const price = (r.salePrice ?? r.price) || 0;
        tr.innerHTML = `
          <td>${r.soldDate || ""}</td>
          <td>${r.artist || ""}</td>
          <td>${r.title || ""}</td>
          <td class="right">${price}</td>
        `;
        return tr;
      });
    soldTbody.innerHTML = "";
    rows.forEach(tr => soldTbody.appendChild(tr));
  }
  renderSold();
  btnFilter && btnFilter.addEventListener('click', renderSold);

  // Mest sålda (antal) inom X dagar
  const topBody = document.querySelector('#tblTopSold tbody');
  const topDaysEl = document.getElementById('topDays');
  const topLimitEl= document.getElementById('topLimit');
  const btnBuild  = document.getElementById('btnBuildTop');

  function buildTop(){
    const days = Math.max(1, Number(topDaysEl.value || 90));
    const limit= Math.max(1, Number(topLimitEl.value || 20));
    const since = new Date(Date.now() - days*24*60*60*1000);

    // aggregera per nyckel (artist + titel)
    const map = new Map();
    records.forEach(r => {
      const d = parseDate(r.soldDate);
      if(!d || d < since) return;
      const key = (r.artist||"") + "|||"+(r.title||"");
      const qty = Number(r.soldQty ?? 1);
      const current = map.get(key) || 0;
      map.set(key, current + (qty>0?qty:1));
    });

    // till array + sortera
    const arr = Array.from(map.entries()).map(([key, qty]) => {
      const [artist, title] = key.split("|||");
      return { artist, title, qty };
    }).sort((a,b)=> b.qty - a.qty).slice(0, limit);

    topBody.innerHTML = "";
    arr.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.artist}</td>
        <td>${row.title}</td>
        <td class="right">${row.qty}</td>
      `;
      topBody.appendChild(tr);
    });
  }
  buildTop();
  btnBuild && btnBuild.addEventListener('click', buildTop);

  // Långliggare
  const agingTbody = document.querySelector('#tblAging tbody');
  const agingRows = records
    .filter(r => r.purchaseDate)
    .map(r => {
      const pd = parseDate(r.purchaseDate);
      const d  = pd ? daysBetween(pd, today) : 0;
      return { r, days: d };
    })
    .sort((a,b)=> b.days - a.days)
    .slice(0, 50);

  agingTbody.innerHTML = "";
  agingRows.forEach(({r, days}) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.artist || ""}</td>
      <td>${r.title || ""}</td>
      <td>${r.purchaseDate || ""}</td>
      <td class="right">${days}</td>
    `;
    agingTbody.appendChild(tr);
  });

})();
