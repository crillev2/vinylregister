(function(){
  const KEY='vinyl_records';
  const $=(s,r=document)=>r.querySelector(s);
  const n=v=>Number(v||0)||0;
  let editingId=null;

  // Badge som bekräftar att JS laddats
  (function(){ const b=document.createElement('div'); b.className='js-ok'; b.textContent='JS laddat ✅'; document.addEventListener('DOMContentLoaded',()=>document.body.appendChild(b)); })();

  function setBadge(msg){ const b=$('#badge'); if(b) b.textContent=msg; }
  function storageOK(){ try{ localStorage.setItem('__vr_min__','1'); localStorage.removeItem('__vr_min__'); return true; } catch(e){ return false; } }
  function load(){ try{ const raw=localStorage.getItem(KEY); const a=raw?JSON.parse(raw):[]; return Array.isArray(a)?a:[]; }catch(_){ return []; } }
  function save(a){ try{ localStorage.setItem(KEY, JSON.stringify(a)); } catch(_){ alert('Kan inte spara till localStorage (privat läge?)'); } }
  function daysBetween(a,b){ a=new Date(a); b=new Date(b); if(isNaN(a)||isNaN(b)) return ''; return Math.floor((b-a)/86400000); }
  function listKeysInfo(){
    const out=[]; try{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); const v=localStorage.getItem(k)||''; out.push(k+'('+v.length+')'); } }catch(_){}
    return out.join(' · ');
  }
  function hideEANColumn(tbl){
    if(!tbl || !tbl.tHead || !tbl.tHead.rows.length) return;
    const idx = Array.from(tbl.tHead.rows[0].cells).findIndex(th => th.getAttribute('data-col')==='ean' || (th.textContent||'').trim().toLowerCase()==='ean');
    if(idx<0) return;
    tbl.tHead.rows[0].cells[idx].classList.add('col-ean');
    Array.from(tbl.tBodies).forEach(tbody=> Array.from(tbody.rows).forEach(tr=> tr.cells[idx] && tr.cells[idx].classList.add('col-ean')));
  }

  function render(){
    const ok=storageOK();
    const list=load();

    // säkerställ id och spara tillbaka
    let changed=false;
    for (let i=0;i<list.length;i++){
      if (!list[i].id){
        list[i].id = (crypto&&crypto.randomUUID)?crypto.randomUUID():String(Date.now()+Math.random());
        changed=true;
      }
    }
    if (changed) save(list);

    setBadge(`Minimal • ${list.length} poster • ${ok?'✅ lagring':'⚠️ ingen lagring'}`);
    const ki=$('#keysInfo'); if(ki) ki.textContent = 'Nycklar: ' + (listKeysInfo() || '—');

    const tb=$('#registerTable tbody'); if(!tb) return;
    tb.innerHTML='';
    const today = new Date();
    list.forEach(rec=>{
      const tr=document.createElement('tr');
      const margin=(n(rec.paidPrice)&&n(rec.purchasePrice))?(n(rec.paidPrice)-n(rec.purchasePrice)):'';
      const dgl=rec.purchaseDate?daysBetween(rec.purchaseDate,today):'';
      tr.innerHTML = `
        <td>${rec.artist||''}</td>
        <td>${rec.title||''}</td>
        <td>${rec.year||''}</td>
        <td>${rec.format||''}</td>
        <td class="col-ean">${rec.ean||''}</td>
        <td class="right">${dgl}</td>
        <td class="right">${rec.purchasePrice||''}</td>
        <td class="right">${rec.paidPrice||''}</td>
        <td class="right">${margin}</td>
        <td class="right">
          <button class="btn" data-act="edit" data-id="${rec.id}">Redigera</button>
          <button class="btn danger" data-act="del" data-id="${rec.id}">Ta bort</button>
        </td>`;
      tb.appendChild(tr);
    });
    hideEANColumn($('#registerTable'));
  }

  function buildFromForm(){
    const g=id=>($('#'+id)&&$('#'+id).value)||'';
    return {
      id: editingId || ((crypto&&crypto.randomUUID)?crypto.randomUUID():String(Date.now())),
      artist: g('artist').trim(),
      title:  g('album').trim(),
      year:   g('year'),
      format: g('format'),
      ean:    g('ean'),
      purchaseDate: g('purchaseDate'),
      purchasePrice: n(g('purchasePrice')),
      askPrice:      n(g('askPrice')),
      paidPrice:     n(g('paidPrice')),
      stockQty:      n(g('stockQty')) || 1,
      thumbUrl: ''
    };
  }
  function clearForm(){
    ['artist','album','year','format','ean','purchaseDate','purchasePrice','askPrice','paidPrice','stockQty'].forEach(id=>{
      const el=$('#'+id); if(!el) return;
      el.value = (id==='stockQty')?1:'';
    });
    const eh=$('#editHint'); if(eh) eh.style.display='none';
    editingId=null;
  }

  function hookSave(){
    if (!storageOK()){ alert('Kan inte spara (privat läge?)'); return; }
    const rec = buildFromForm();
    const list = load();
    const idx = list.findIndex(r=> r.id===rec.id);
    if (idx>=0) list[idx]=rec; else list.push(rec);
    save(list); render(); clearForm();
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const btnSave=$('#btnSave');
    const btnSaveTop=$('#btnSaveTop');
    if (btnSave) btnSave.addEventListener('click', hookSave);
    if (btnSaveTop) btnSaveTop.addEventListener('click', hookSave);

    const btnClear=$('#btnClear'); if(btnClear) btnClear.addEventListener('click', clearForm);
    const btnAddTest=$('#btnAddTest'); if(btnAddTest) btnAddTest.addEventListener('click', ()=>{
      const list=load();
      list.push({
        id:(crypto&&crypto.randomUUID)?crypto.randomUUID():String(Date.now()+Math.random()),
        artist:'Testartist', title:'Testalbum', year:'1979', format:'LP',
        ean:String(Math.floor(1000000000000 + Math.random()*8999999999999)),
        purchaseDate:new Date().toISOString().slice(0,10),
        purchasePrice:50, askPrice:100, paidPrice:0, stockQty:1, thumbUrl:''
      });
      save(list); render();
    });
    const btnExport=$('#btnExport'); if(btnExport) btnExport.addEventListener('click', ()=>{
      const blob=new Blob([localStorage.getItem(KEY)||'[]'], {type:'application/json'});
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='vinyl_records.json'; a.click();
    });
    const btnImport=$('#btnImport'); if(btnImport) btnImport.addEventListener('click', ()=>{
      const input=document.createElement('input'); input.type='file'; input.accept='application/json';
      input.onchange = async (e)=>{
        const file=e.target.files[0]; if(!file) return;
        const text=await file.text();
        try{ const arr=JSON.parse(text); if(!Array.isArray(arr)) throw new Error('Inte en array'); save(arr); render(); }
        catch(err){ alert('Ogiltig JSON: '+err.message); }
      };
      input.click();
    });
    const btnReset=$('#btnReset'); if(btnReset) btnReset.addEventListener('click', ()=>{
      if (!confirm('Nollställa endast "vinyl_records"?')) return;
      save([]); render();
    });
    const qs=$('#quickSearch'); if(qs) qs.addEventListener('input', function(){
      const q=this.value.toLowerCase();
      const tb=$('#registerTable tbody');
      if (!tb) return;
      tb.querySelectorAll('tr').forEach(tr=>{
        tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
    document.addEventListener('click', (e)=>{
      const btn=e.target.closest('button[data-act]'); if(!btn) return;
      const id=btn.getAttribute('data-id'); const act=btn.getAttribute('data-act');
      const list=load();
      const idx=list.findIndex(r=> r.id===id);
      if (idx<0) return;

      if (act==='del'){
        if (!confirm('Ta bort denna post?')) return;
        list.splice(idx,1); save(list); render(); return;
      }
      if (act==='edit'){
        const rec=list[idx];
        const S=(id,v)=>{ const el=$('#'+id); if(el) el.value=v||''; };
        S('artist',rec.artist); S('album',rec.title); S('year',rec.year); S('format',rec.format);
        S('ean',rec.ean); S('purchaseDate',rec.purchaseDate); S('purchasePrice',rec.purchasePrice);
        S('askPrice',rec.askPrice); S('paidPrice',rec.paidPrice); S('stockQty',rec.stockQty||1);
        editingId = rec.id;
        const eh=$('#editHint'); if(eh) eh.style.display='inline-block';
        window.scrollTo({top:0, behavior:'smooth'});
      }
    }, true);

    render();
  });
})();