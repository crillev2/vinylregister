
(function(){
  function loadRecords(){
    let raw = localStorage.getItem('vinyl_records');
    if(!raw){
      console.warn('No localStorage key "vinyl_records" found.');
      return [];
    }
    try{
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    }catch(e){
      console.error('Failed to parse vinyl_records JSON', e);
      return [];
    }
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

  // KPI: titles with stock > 0
  const titlesInStock = records.filter(r => Number(r.stockQty||0) > 0).length;
  const totalStock = records.reduce((acc,r)=> acc + Number(r.stockQty||0), 0);
  const totalSold  = records.reduce((acc,r)=> acc + Number(r.soldQty || 0), 0);

  // Avg days in stock (per record), using purchaseDate
  const ages = records
    .filter(r => r.purchaseDate)
    .map(r => {
      const pd = parseDate(r.purchaseDate);
      return pd ? daysBetween(pd, today) : null;
    })
    .filter(x => typeof x === 'number');
  const avgDays = ages.length ? Math.round(ages.reduce((a,b)=>a+b,0) / ages.length) : 0;

  document.getElementById('kpiTitles').textContent = titlesInStock.toString();
  document.getElementById('kpiStock').textContent  = totalStock.toString();
  document.getElementById('kpiSold').textContent   = totalSold.toString();
  document.getElementById('kpiAvgDays').textContent= avgDays.toString();

  // Sold table (uses r.soldDate and r.salePrice)
  const soldTbody = document.querySelector('#tblSold tbody');
  const soldFromEl = document.getElementById('soldFrom');
  const soldToEl   = document.getElementById('soldTo');
  const btnFilter  = document.getElementById('btnFilterSold');

  function renderSold(){
    const fromV = parseDate(soldFromEl.value);
    const toV   = parseDate(soldToEl.value);
    const rows = records
      .filter(r => r.soldDate) // expect YYYY-MM-DD
      .filter(r => {
        const d = parseDate(r.soldDate);
        if(!d) return false;
        if(fromV && d < fromV) return false;
        if(toV && d > toV) return false;
        return true;
      })
      .sort((a,b)=> (a.soldDate||"").localeCompare(b.soldDate||""))
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
  btnFilter.addEventListener('click', renderSold);

  // Aging table (longest days in stock)
  // uses purchaseDate
  const agingTbody = document.querySelector('#tblAging tbody');
  const agingRows = records
    .filter(r => r.purchaseDate)
    .map(r => {
      const pd = parseDate(r.purchaseDate);
      const d  = pd ? daysBetween(pd, today) : 0;
      return { r, days: d };
    })
    .sort((a,b)=> b.days - a.days)  // longest first
    .slice(0, 50);                  // cap list

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
