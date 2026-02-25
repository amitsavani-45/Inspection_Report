import React, { useState } from 'react';
import './Form.css';

/* ── Constants ── */
const PART_NAMES     = ['INLET PIPE','OUTLET PIPE','BRACKET','COVER PLATE','BASE PLATE','FLANGE','HOUSING','SHAFT','GEAR','PULLEY','BUSHING','SPRING','WASHER','GASKET','CONNECTOR'];
const PART_NUMBERS   = ['68P00-S310050','68P00-S310051','68P00-S310052','68P01-S310050','68P01-S310051','72A00-S410010','72A00-S410011','85B00-S210030','85B00-S210031','91C00-S110020'];
const OPERATIONS     = ['BLANKING','TURNING','MILLING','DRILLING','GRINDING','BORING','REAMING','THREADING','BROACHING','HOBBING','STAMPING','FORMING','BENDING','WELDING','ASSEMBLY','HEAT TREATMENT','SURFACE COATING','DEBURRING','POLISHING','FINAL INSPECTION'];
const CUSTOMER_NAMES = ['FIG','ATOM ONE','TATA MOTORS','MAHINDRA','MARUTI SUZUKI','HONDA','HYUNDAI','BAJAJ','TVS','HERO MOTOCORP','ASHOK LEYLAND','FORCE MOTORS','EICHER','PIAGGIO','YAMAHA'];
const OPERATOR_NAMES = ['ALEX','RAHUL SHARMA','SURESH KUMAR','RAMESH PATEL','DINESH VERMA','MAHESH YADAV','PRAKASH SINGH','VIJAY KUMAR','ANIL GUPTA','RAJU MEHTA','SANJAY JOSHI','DEEPAK NAIR','RAKESH TIWARI','MOHAN DAS','GANESH RAO'];
const PRODUCT_ITEMS  = ['APPEARANCE','WIDTH','LENGTH','THICKNESS','DIMENSIONS A','DIMENSIONS B','RADIUS','BLANK PROFILE','DIAMETER','DEPTH','HEIGHT','FLATNESS','STRAIGHTNESS','ROUNDNESS','CHAMFER','THREAD','HOLE DIAMETER','PITCH','SURFACE FINISH','WEIGHT'];
const PROCESS_ITEMS  = ['SHUT HEIGHT','BALANCER PRESSURE','CLUTCH PRESSURE','CUSHION PRESSURE','DIE HEIGHT','STROKE LENGTH','FEED RATE','CUTTING SPEED','SPINDLE SPEED','COOLANT PRESSURE','COOLANT FLOW','CLAMPING FORCE','BLANK HOLDER FORCE','DRAWING FORCE','PRESS TONNAGE','TEMPERATURE','CYCLE TIME','AIR PRESSURE','HYDRAULIC PRESSURE','LUBRICATION PRESSURE'];
const TOLERANCES         = ['0.01','0.02','0.05','0.08','0.1','0.2','0.3','0.5','1.0'];
const PROCESS_TOLERANCES = ['MIN','MAX','0.01','0.05','0.1','0.2','0.5','1.0'];
const INSTRUMENTS        = ['VISUAL','VERNIER','MICROMETER','RADIUS GAUGE','TEMPLATE','DIGITAL','GAUGE','CMM','DIAL INDICATOR','HEIGHT GAUGE'];
const TIME_TYPE_OPTIONS  = ['SETUP','2HRS','4HRS','LAST'];
const PENDING_SLOT_TYPES = ['2HRS','4HRS','LAST'];
const VAL_OPTIONS        = ['ok','done','NG','n/a'];
const MAX_COLS = 14;
const emptyRow = () => ({ name:'', spec:'', tolerance:'', inst:'' });

// Default rows: SETUP=1, others=2 (user can toggle)
const defaultSingleRow = (type) => true; // sabka default 1 line, user toggle karke 2 lines kare

/* ══════════════════════════════════════════════════════════════════════════
   SingleValEntry — SETUP ke liye single line value entry
   ══════════════════════════════════════════════════════════════════════════ */
const SingleValEntry = ({ slotId, colLabels, vals, setVal }) => {
  const [selIdx, setSelIdx] = useState('');
  const [val,    setValLocal] = useState('');

  const filledIdxs   = new Set(colLabels.filter(({idx}) => vals[idx]).map(({idx}) => idx));
  const availableCols = colLabels.filter(({idx}) => !filledIdxs.has(idx));

  const handleAdd = () => {
    if (selIdx === '') return;
    const idx = parseInt(selIdx);
    if (val.trim()) setVal(slotId, 'up', idx, val.trim());
    setSelIdx(''); setValLocal('');
  };

  const filledEntries = colLabels.filter(({idx}) => vals[idx]);

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:8, alignItems:'flex-end', marginBottom:12 }}>
        <div className="fg">
          <label>Column</label>
          <select value={selIdx} onChange={e => setSelIdx(e.target.value)}>
            <option value="">Select column...</option>
            {availableCols.map(({idx, label}) => (
              <option key={idx} value={idx}>{label}</option>
            ))}
          </select>
        </div>
        <div className="fg">
          <label>Value</label>
          <input type="text" value={val} onChange={e => setValLocal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Value" className="val-input"
            style={{ borderColor: val ? '#7b1fa2' : undefined }} />
        </div>
      </div>
      <button className="add-val-btn" onClick={handleAdd}>+ Add Value</button>

      {filledEntries.length > 0 && (
        <table className="mini-table" style={{ marginTop:10 }}>
          <thead>
            <tr>
              <th>Column</th>
              <th style={{ color:'#7b1fa2' }}>Value</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filledEntries.map(({idx, label}) => {
              const v = vals[idx];
              return (
                <tr key={idx}>
                  <td style={{ fontWeight:600 }}>{label}</td>
                  <td><span style={{ color: v==='NG'?'#c62828':'#2e7d32', fontWeight:700 }}>{v}</span></td>
                  <td>
                    <button className="remove-btn" onClick={() => setVal(slotId,'up',idx,'')}>✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   CombinedValEntry — UP + DOWN values (2HRS, 4HRS, LAST ke liye)
   ══════════════════════════════════════════════════════════════════════════ */
const CombinedValEntry = ({ slotId, colLabels, upVals, downVals, setVal }) => {
  const [selIdx,  setSelIdx]  = useState('');
  const [upVal,   setUpVal]   = useState('');
  const [downVal, setDownVal] = useState('');

  const fullyFilledIdxs = new Set(
    colLabels.filter(({idx}) => upVals[idx] && downVals[idx]).map(({idx}) => idx)
  );
  const availableCols = colLabels.filter(({idx}) => !fullyFilledIdxs.has(idx));

  const handleAdd = () => {
    if (selIdx === '') return;
    const idx = parseInt(selIdx);
    if (upVal.trim())   setVal(slotId, 'up',   idx, upVal.trim());
    if (downVal.trim()) setVal(slotId, 'down', idx, downVal.trim());
    setSelIdx(''); setUpVal(''); setDownVal('');
  };

  const filledEntries = colLabels.filter(({idx}) => upVals[idx] || downVals[idx]);

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:8, alignItems:'flex-end', marginBottom:12 }}>
        <div className="fg">
          <label>Column</label>
          <select value={selIdx} onChange={e => setSelIdx(e.target.value)}>
            <option value="">Select column...</option>
            {availableCols.map(({idx, label}) => (
              <option key={idx} value={idx}>{label}</option>
            ))}
          </select>
        </div>
        <div className="fg">
          <label style={{ color:'#1565c0' }}>⬆ UP Value</label>
          <input type="text" value={upVal} onChange={e => setUpVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="UP value" className="val-input"
            style={{ borderColor: upVal ? '#1565c0' : undefined }} />
        </div>
        <div className="fg">
          <label style={{ color:'#e65100' }}>⬇ DOWN Value</label>
          <input type="text" value={downVal} onChange={e => setDownVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="DOWN value" className="val-input"
            style={{ borderColor: downVal ? '#e65100' : undefined }} />
        </div>
      </div>
      <button className="add-val-btn" onClick={handleAdd}>+ Add Value</button>

      {filledEntries.length > 0 && (
        <table className="mini-table" style={{ marginTop:10 }}>
          <thead>
            <tr>
              <th>Column</th>
              <th style={{ color:'#1565c0' }}>⬆ UP</th>
              <th style={{ color:'#e65100' }}>⬇ DOWN</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filledEntries.map(({idx, label}) => {
              const u = upVals[idx];
              const d = downVals[idx];
              return (
                <tr key={idx}>
                  <td style={{ fontWeight:600 }}>{label}</td>
                  <td>{u ? <span style={{ color: u==='NG'?'#c62828':'#2e7d32', fontWeight:700 }}>{u}</span> : <span style={{ color:'#ccc' }}>—</span>}</td>
                  <td>{d ? <span style={{ color: d==='NG'?'#c62828':'#e65100', fontWeight:700 }}>{d}</span> : <span style={{ color:'#ccc' }}>—</span>}</td>
                  <td>
                    <button className="remove-btn"
                      onClick={() => { setVal(slotId,'up',idx,''); setVal(slotId,'down',idx,''); }}>
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   ItemForm
   ══════════════════════════════════════════════════════════════════════════ */
const ItemForm = ({ row, onUpdate, srNum, isProduct }) => {
  const [localSpec, setLocalSpec] = useState(row.spec || '');
  React.useEffect(() => { setLocalSpec(row.spec || ''); }, [row.spec]);

  const itemList = isProduct ? PRODUCT_ITEMS : PROCESS_ITEMS;
  const tolList  = isProduct
    ? TOLERANCES.map(t => ({ v:t, l:`± ${t}` }))
    : PROCESS_TOLERANCES.map(t => ({ v:t, l: t==='MIN'||t==='MAX' ? t : `± ${t}` }));
  const color = isProduct ? '#1976d2' : '#e65100';

  const SelLocal = ({ value, onChange, options, ph }) => (
    <div className="fg">
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="">{ph || 'Select...'}</option>
        {options.map(o => typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.v} value={o.v}>{o.l}</option>
        )}
      </select>
    </div>
  );

  return (
    <div className="item-row">
      <span className="sr-badge" style={{ background:color }}>SR {srNum}</span>
      <div className="grid-4">
        <SelLocal value={row.name}      onChange={v => onUpdate('name',v)}      options={itemList}    ph="Select Item" />
        <div className="fg">
          <input type="text" value={localSpec} placeholder="Spec"
            onChange={e => setLocalSpec(e.target.value)}
            onBlur={() => onUpdate('spec', localSpec)} />
        </div>
        <SelLocal value={row.tolerance} onChange={v => onUpdate('tolerance',v)} options={tolList}     ph="Tolerance" />
        <SelLocal value={row.inst}      onChange={v => onUpdate('inst',v)}      options={INSTRUMENTS} ph="Instrument" />
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   FORM
   ══════════════════════════════════════════════════════════════════════════ */
const Form = ({ onSubmit, onCancel, initialData = {}, items = [] }) => {

  const [open, setOpen] = useState({ report: true, inspection: false, schedule: false });
  const toggle = (key) => setOpen(p => ({ ...p, [key]: !p[key] }));

  /* ── 1. Report Info ── */
  const [header, setHeader] = useState({
    partName:      initialData.part_name      || '',
    partNumber:    initialData.part_number    || '',
    operationName: initialData.operation_name || '',
    customerName:  initialData.customer_name  || '',
  });

  /* ── 2. Inspection ── */
  const [inspOpen, setInspOpen] = useState({ product: false, process: false });
  const existingProducts  = items.filter(i => i.sr_no <= 10);
  const existingProcesses = items.filter(i => i.sr_no >= 11);

  const [productRows, setProductRows] = useState(
    existingProducts.length > 0
      ? existingProducts.map(r => ({ name: r.item||'', spec: r.spec||'', tolerance: r.tolerance?.replace('± ','')||'', inst: r.inst||'' }))
      : []
  );
  const [processRows, setProcessRows] = useState(
    existingProcesses.length > 0
      ? existingProcesses.map(r => ({ name: r.item||'', spec: r.spec||'', tolerance: r.tolerance||'', inst: r.inst||'' }))
      : []
  );

  const [currProduct, setCurrProduct] = useState(emptyRow());
  const [currProcess, setCurrProcess] = useState(emptyRow());

  const updateCurrProduct = (field, val) => {
    const updated = { ...currProduct, [field]: val };
    setCurrProduct(updated);
    if (updated.name && updated.spec && updated.tolerance && updated.inst && productRows.length < 10) {
      setProductRows(p => [...p, updated]);
      setCurrProduct(emptyRow());
    }
  };
  const updateCurrProcess = (field, val) => {
    const updated = { ...currProcess, [field]: val };
    setCurrProcess(updated);
    if (updated.name && updated.spec && updated.tolerance && updated.inst && processRows.length < 10) {
      setProcessRows(p => [...p, updated]);
      setCurrProcess(emptyRow());
    }
  };

  const removeProduct = (idx) => setProductRows(p => p.filter((_,i) => i !== idx));
  const removeProcess = (idx) => setProcessRows(p => p.filter((_,i) => i !== idx));

  /* ── 3. Schedule ── */
  const [schedDate,    setSchedDate]    = useState(initialData.date || new Date().toISOString().split('T')[0]);
  const existingEntries = initialData.schedule_entries || [];
  const firstEntry = existingEntries[0] || {};
  const [operatorName, setOperatorName] = useState(firstEntry.operator || '');
  const [mcNo,         setMcNo]         = useState(firstEntry.machine_no || '');

  // makeSlot: singleRow default = SETUP ke liye true, baaki false
  const makeSlot = (id, type) => ({
    id, type,
    singleRow: defaultSingleRow(type),  // user toggle kar sakta hai
    upVals:   Array(MAX_COLS).fill(''),
    downVals: Array(MAX_COLS).fill(''),
  });

  const buildInitialSlots = () => {
    if (!existingEntries || existingEntries.length === 0) {
      return [makeSlot(1,'SETUP')];
    }
    const slotMap = {};
    existingEntries.forEach(entry => {
      const key = entry.slot_index ?? 0;
      if (!slotMap[key]) {
        slotMap[key] = {
          id: key+1,
          type: entry.time_type||'SETUP',
          singleRow: true, // default true, neeche row_order=1 milne par false ho jaayega
          upVals:   Array(MAX_COLS).fill(''),
          downVals: Array(MAX_COLS).fill(''),
        };
      }
      const vals = Array(MAX_COLS).fill('');
      for (let i = 0; i < MAX_COLS; i++) vals[i] = entry[`value_${i+1}`] || '';
      if (entry.row_order === 0) {
        slotMap[key].upVals = vals;
      } else {
        // row_order=1 entry exist karti hai — double row hai
        slotMap[key].downVals = vals;
        slotMap[key].singleRow = false;
      }
    });
    const rebuilt = Object.values(slotMap).sort((a,b) => a.id - b.id);
    return rebuilt.length > 0 ? rebuilt : [makeSlot(1,'SETUP')];
  };

  const initialSlots = buildInitialSlots();
  const [slots,        setSlots]        = useState(initialSlots);
  const [nextSlotId,   setNextSlotId]   = useState(initialSlots.length + 1);
  const [activeSlotId, setActiveSlotId] = useState(initialSlots[0]?.id ?? 1);

  // Fresh form pe 2HRS, 4HRS, LAST pending/locked rahenge
  const isNewForm = !existingEntries || existingEntries.length === 0;
  // addedTypes: hamesha empty — 2HRS/4HRS/LAST multiple times add ho sakte hain
  const [addedTypes] = React.useState([]);

  // ✅ Naya slot TYPE ke hisaab se sahi jagah insert karo
  const addSlotOfType = (type) => {
    const newId = nextSlotId;
    const newSlot = makeSlot(newId, type);
    setSlots(prev => {
      if (type === 'SETUP') {
        // SETUP slots ke baad, baaki ke pehle insert karo
        const lastSetupIdx = prev.map(s => s.type).lastIndexOf('SETUP');
        const insertAt = lastSetupIdx >= 0 ? lastSetupIdx + 1 : 0;
        const next = [...prev];
        next.splice(insertAt, 0, newSlot);
        return next;
      }
      // Baaki types end mein add ho
      return [...prev, newSlot];
    });
    setNextSlotId(p => p + 1);
    setActiveSlotId(newId);
  };

  const removeSlot = (id) => {
    setSlots(p => p.filter(s => s.id !== id));
    if (activeSlotId === id) setActiveSlotId(null);
  };

  const updateSlotType = (id, type) =>
    setSlots(p => p.map(s => s.id === id ? { ...s, type } : s));

  // Toggle single/double row for any slot
  const toggleSlotRows = (id) =>
    setSlots(p => p.map(s => s.id === id ? { ...s, singleRow: !s.singleRow } : s));

  const setSlotVal = (slotId, row, idx, val) =>
    setSlots(p => p.map(s =>
      s.id === slotId
        ? { ...s, [row === 'up' ? 'upVals' : 'downVals']: s[row === 'up' ? 'upVals' : 'downVals'].map((v,i) => i===idx ? val : v) }
        : s
    ));

  const allProducts  = productRows;
  const allProcesses = processRows;

  const colLabels = [
    ...allProducts.map((r,i)  => ({ idx: i,                    label: `${i+1}. ${r.name}` })),
    ...allProcesses.map((r,i) => ({ idx: allProducts.length+i, label: `${11+i}. ${r.name}` })),
  ].slice(0, MAX_COLS);

  const activeSlot = slots.find(s => s.id === activeSlotId) || null;

  // Setup fill check (for unlocking pending slots)
  const setupSlot = slots.find(s => s.type === "SETUP");
  const isSetupFilled = setupSlot
    ? (setupSlot.upVals.filter(v => v && v.trim() !== '').length + setupSlot.downVals.filter(v => v && v.trim() !== '').length) > 0
    : false;

  const handleUnlockAndAdd = (type) => {
    addSlotOfType(type);
  };

  /* ── Submit ── */
  const handleSubmit = () => {
    if (!header.partName || !header.partNumber || !header.operationName || !header.customerName) {
      alert('Report Information puri bharo'); return;
    }
    const allItems = [
      ...allProducts.map((r,i)  => ({ sr_no: i+1,   item: r.name, spec: r.spec, tolerance: r.tolerance ? `± ${r.tolerance}` : '', inst: r.inst })),
      ...allProcesses.map((r,i) => ({ sr_no: 11+i, item: r.name, spec: r.spec, tolerance: r.tolerance, inst: r.inst })),
    ];

    const scheduleEntries = [];
    slots.forEach((slot, slotIdx) => {
      if (slot.singleRow) {
        // SETUP: sirf ek row (row_order=0)
        const entry = { time_type: slot.type, row_order: 0, slot_index: slotIdx, operator: operatorName, machine_no: mcNo, date: schedDate };
        slot.upVals.forEach((v,i) => { entry[`value_${i+1}`] = v || ''; });
        scheduleEntries.push(entry);
      } else {
        ['upVals','downVals'].forEach((rowKey, ri) => {
          const entry = { time_type: slot.type, row_order: ri, slot_index: slotIdx, operator: operatorName, machine_no: mcNo, date: schedDate };
          slot[rowKey].forEach((v,i) => { entry[`value_${i+1}`] = v || ''; });
          scheduleEntries.push(entry);
        });
      }
    });

    onSubmit({
      partName: header.partName, partNumber: header.partNumber,
      operationName: header.operationName, customerName: header.customerName,
      scheduleDate: schedDate, operatorName, mcNo,
      items: allItems, schedule_entries: scheduleEntries,
    });
  };

  /* ── Reusable ── */
  const Sel = ({ label, value, onChange, options, ph, style }) => (
    <div className="fg" style={style}>
      {label && <label>{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="">{ph || 'Select...'}</option>
        {options.map(o => typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.v} value={o.v}>{o.l}</option>
        )}
      </select>
    </div>
  );

  const AccHead = ({ sectionKey, num, title, subtitle, color }) => (
    <div className="acc-head" style={{ borderLeft:`4px solid ${color}` }} onClick={() => toggle(sectionKey)}>
      <div>
        <div className="acc-title">
          <span className="acc-num" style={{ background:color }}>{num}</span>
          {title}
        </div>
        <div className="acc-sub">{subtitle}</div>
      </div>
      <span className="acc-arrow">{open[sectionKey] ? '▲' : '▼'}</span>
    </div>
  );

  const SubHead = ({ subKey, label, count, color }) => (
    <div className="sub-head" onClick={() => setInspOpen(p => ({ ...p, [subKey]: !p[subKey] }))}>
      <span style={{ fontWeight:600, fontSize:13, color:'#333' }}>{label}</span>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        {count > 0 && <span className="badge" style={{ background:`${color}18`, color, border:`1px solid ${color}` }}>{count} items</span>}
        <span style={{ color:'#aaa', fontSize:12 }}>{inspOpen[subKey] ? '▲' : '▼'}</span>
      </div>
    </div>
  );

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <div className="form-wrap">
      <div className="form-topbar">
        <span className="form-topbar-title">Inspection Form</span>
        <button className="btn-cancel-top" onClick={onCancel}>✕ Cancel</button>
      </div>

      <div className="form-body">

        {/* 1. REPORT */}
        <div className="acc-card">
          <AccHead sectionKey="report" num="1" title="Report Information" color="#4CAF50"
            subtitle={header.partName ? `${header.partName}  ·  ${header.operationName||'—'}  ·  ${header.customerName||'—'}` : 'Part name, operation, customer...'} />
          {open.report && (
            <div className="acc-body">
              <div className="grid-2">
                <Sel label="Part Name *"      value={header.partName}      onChange={v=>setHeader(p=>({...p,partName:v}))}      options={PART_NAMES}     ph="Select Part Name" />
                <Sel label="Part Number *"    value={header.partNumber}    onChange={v=>setHeader(p=>({...p,partNumber:v}))}    options={PART_NUMBERS}   ph="Select Part Number" />
                <Sel label="Operation Name *" value={header.operationName} onChange={v=>setHeader(p=>({...p,operationName:v}))} options={OPERATIONS}     ph="Select Operation" />
                <Sel label="Customer Name *"  value={header.customerName}  onChange={v=>setHeader(p=>({...p,customerName:v}))}  options={CUSTOMER_NAMES} ph="Select Customer" />
              </div>
            </div>
          )}
        </div>

        {/* 2. INSPECTION */}
        <div className="acc-card">
          <AccHead sectionKey="inspection" num="2" title="Inspection Information" color="#1976d2"
            subtitle={`${allProducts.length} product  ·  ${allProcesses.length} process items`} />
          {open.inspection && (
            <div style={{ borderTop:'1px solid #eee' }}>
              <SubHead subKey="product" label="Product Items" count={allProducts.length} color="#1976d2" />
              {inspOpen.product && (
                <div className="sub-body">
                  {productRows.length > 0 && (
                    <table className="mini-table" style={{ marginBottom:12 }}>
                      <thead><tr><th>SR</th><th>Item</th><th>Spec</th><th>Tolerance</th><th>Inst</th><th></th></tr></thead>
                      <tbody>
                        {productRows.map((r,i) => (
                          <tr key={i}>
                            <td>{i+1}</td><td>{r.name}</td><td>{r.spec}</td>
                            <td>{r.tolerance ? `± ${r.tolerance}` : ''}</td><td>{r.inst}</td>
                            <td><button onClick={()=>removeProduct(i)} className="remove-btn">✕</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {productRows.length < 10 && (
                    <ItemForm row={currProduct} onUpdate={updateCurrProduct} srNum={productRows.length+1} isProduct={true} />
                  )}
                  {productRows.length >= 10 && <div className="full-msg">✅ All 10 product slots filled</div>}
                </div>
              )}

              <SubHead subKey="process" label="Process Items" count={allProcesses.length} color="#e65100" />
              {inspOpen.process && (
                <div className="sub-body">
                  {processRows.length > 0 && (
                    <table className="mini-table" style={{ marginBottom:12 }}>
                      <thead><tr><th>SR</th><th>Item</th><th>Spec</th><th>Tolerance</th><th>Inst</th><th></th></tr></thead>
                      <tbody>
                        {processRows.map((r,i) => (
                          <tr key={i}>
                            <td>{allProducts.length+i+1}</td><td>{r.name}</td><td>{r.spec}</td>
                            <td>{r.tolerance}</td><td>{r.inst}</td>
                            <td><button onClick={()=>removeProcess(i)} className="remove-btn">✕</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {processRows.length < 10 && (
                    <ItemForm row={currProcess} onUpdate={updateCurrProcess} srNum={allProducts.length+processRows.length+1} isProduct={false} />
                  )}
                  {processRows.length >= 10 && <div className="full-msg">✅ All 10 process slots filled</div>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. SCHEDULE */}
        <div className="acc-card">
          <AccHead sectionKey="schedule" num="3" title="Schedule Information" color="#7b1fa2"
            subtitle={operatorName ? `${operatorName}  ·  M/C ${mcNo}  ·  ${schedDate.split('-').reverse().join('/')}` : 'Date, operator, time values...'} />
          {open.schedule && (
            <div className="acc-body">

              <div className="grid-3" style={{ marginBottom:20 }}>
                <div className="fg">
                  <label>Date *</label>
                  <div className="date-box">
                    <span>{schedDate ? schedDate.split('-').reverse().join('/') : 'DD/MM/YYYY'}</span>
                    <span>📅</span>
                    <input type="date" value={schedDate} onChange={e=>setSchedDate(e.target.value)}
                      style={{ position:'absolute', opacity:0, inset:0, cursor:'pointer', width:'100%' }} />
                  </div>
                </div>
                <Sel label="Operator Name *" value={operatorName} onChange={setOperatorName} options={OPERATOR_NAMES} ph="Select Operator" />
                <Sel label="M/C No *"        value={mcNo}         onChange={setMcNo}         options={Array.from({length:23},(_,i)=>String(i+1))} ph="Select" />
              </div>

              {/* Slot Cards */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>
                  Time Slots
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {slots.map((slot, idx) => {
                    const isActive = activeSlotId === slot.id;
                    const single   = slot.singleRow;
                    const filled   = slot.upVals.filter(Boolean).length + (single ? 0 : slot.downVals.filter(Boolean).length);
                    return (
                      <div key={slot.id} onClick={() => setActiveSlotId(slot.id)} style={{
                        display:'flex', alignItems:'center', gap:10,
                        padding:'10px 14px',
                        border: isActive ? '2px solid #7b1fa2' : '1px solid #e0e0e0',
                        borderRadius:8,
                        background: isActive ? '#f3e5f5' : '#fff',
                        cursor:'pointer', transition:'all 0.15s',
                        boxShadow: isActive ? '0 2px 8px rgba(123,31,162,0.15)' : 'none',
                      }}>
                        <span style={{
                          width:24, height:24, borderRadius:'50%', flexShrink:0,
                          background: isActive ? '#7b1fa2' : '#e0e0e0',
                          color: isActive ? '#fff' : '#666',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:11, fontWeight:700,
                        }}>{idx+1}</span>

                        <select value={slot.type}
                          onChange={e => { e.stopPropagation(); updateSlotType(slot.id, e.target.value); }}
                          onClick={e => e.stopPropagation()}
                          style={{
                            border:`1.5px solid ${isActive ? '#7b1fa2' : '#ddd'}`,
                            borderRadius:5, background: isActive ? '#fff' : '#fafafa',
                            fontWeight:700, fontSize:13, padding:'5px 10px',
                            cursor:'pointer', outline:'none', color: isActive ? '#7b1fa2' : '#333', minWidth:80,
                          }}>
                          {TIME_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>

                        {/* ✅ 1/2 Line toggle button */}
                        <button
                          onClick={e => { e.stopPropagation(); toggleSlotRows(slot.id); }}
                          title={single ? '2 lines mein badlo' : '1 line mein badlo'}
                          style={{
                            display:'flex', alignItems:'center', gap:4,
                            border:`1.5px solid ${single ? '#f57f17' : '#1565c0'}`,
                            borderRadius:6, background: single ? '#fff8e1' : '#e3f2fd',
                            color: single ? '#f57f17' : '#1565c0',
                            fontWeight:700, fontSize:11, padding:'3px 9px',
                            cursor:'pointer', flexShrink:0, whiteSpace:'nowrap',
                          }}>
                          {single ? '1️⃣ 1 Line' : '2️⃣ 2 Lines'}
                        </button>

                        <span style={{
                          flex:1, fontSize:11,
                          color: filled > 0 ? '#2e7d32' : '#bbb',
                          fontStyle: filled === 0 ? 'italic' : 'normal',
                        }}>
                          {filled > 0 ? `✓ ${filled} values filled` : 'Empty — click to fill'}
                        </span>

                        {isActive && (
                          <span style={{ fontSize:11, fontWeight:700, color:'#7b1fa2', background:'#e8d5f5', padding:'2px 8px', borderRadius:10 }}>
                            Editing
                          </span>
                        )}

                        {slots.length > 1 && (
                          <button onClick={e => { e.stopPropagation(); removeSlot(slot.id); }} style={{
                            border:'none', background:'none', color:'#bbb',
                            cursor:'pointer', fontSize:16, fontWeight:700, lineHeight:1, padding:'0 2px', flexShrink:0,
                          }} title="Remove slot">×</button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add more buttons — SETUP + pending types (2HRS, 4HRS, LAST) */}
                <div style={{ marginTop:10, display:'flex', flexWrap:'wrap', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:11, color:'#aaa', fontWeight:600, marginRight:2 }}>Add more:</span>

                  {/* Always show + SETUP */}
                  <button onClick={() => addSlotOfType('SETUP')} style={{
                    border:'1.5px dashed #7b1fa2', background:'#faf0ff', color:'#7b1fa2',
                    borderRadius:5, padding:'5px 12px', fontSize:12, fontWeight:700, cursor:'pointer',
                  }}>+ SETUP</button>

                  {/* 2HRS, 4HRS, LAST — show karo, lock/unlock ke saath */}
                  {PENDING_SLOT_TYPES.filter(t => !addedTypes.includes(t)).map(t => (
                    isSetupFilled ? (
                      <button key={t} onClick={() => handleUnlockAndAdd(t)} style={{
                        border:'1.5px dashed #7b1fa2', background:'#faf0ff', color:'#7b1fa2',
                        borderRadius:5, padding:'5px 12px', fontSize:12, fontWeight:700, cursor:'pointer',
                      }}>+ {t}</button>
                    ) : (
                      <span key={t} title="SETUP pehle fill karo" style={{
                        border:'1.5px dashed #ccc', background:'#f5f5f5', color:'#bbb',
                        borderRadius:5, padding:'5px 12px', fontSize:12, fontWeight:700,
                        cursor:'not-allowed', display:'inline-flex', alignItems:'center', gap:4,
                      }}>🔒 {t}</span>
                    )
                  ))}
                </div>
              </div>

              {/* Active Slot Value Entry */}
              {activeSlot && colLabels.length > 0 && (
                <div className="val-entry-box">
                  <div className="val-entry-head">
                    ✏️ Slot {slots.findIndex(s=>s.id===activeSlotId)+1} — {activeSlot.type}
                    {activeSlot.singleRow
                      ? ' — Single Line'
                      : ' — UP & DOWN Values'
                    }
                  </div>
                  <div className="val-row-wrap">
                    {activeSlot.singleRow
                      ? <SingleValEntry
                          slotId={activeSlot.id}
                          colLabels={colLabels}
                          vals={activeSlot.upVals}
                          setVal={setSlotVal}
                        />
                      : <CombinedValEntry
                          slotId={activeSlot.id}
                          colLabels={colLabels}
                          upVals={activeSlot.upVals}
                          downVals={activeSlot.downVals}
                          setVal={setSlotVal}
                        />
                    }
                  </div>
                </div>
              )}

              {activeSlot && colLabels.length === 0 && (
                <div className="info-msg">Pehle Inspection mein items add karo.</div>
              )}
              {!activeSlot && (
                <div className="info-msg">Upar koi slot select karo ya "+ Add" dabao.</div>
              )}

              {/* Schedule Preview */}
              {colLabels.length > 0 && slots.length > 0 && (
                <div style={{ marginTop:20, overflowX:'auto' }}>
                  <div className="preview-label">Schedule Preview</div>
                  <table className="mini-table">
                    <thead>
                      <tr>
                        <th style={{ minWidth:28 }}>#</th>
                        <th style={{ minWidth:52 }}>Time</th>
                        <th style={{ minWidth:44 }}>Row</th>
                        {colLabels.map(({idx,label}) => (
                          <th key={idx} style={{ minWidth:38 }}>{label.split('. ')[0]}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {slots.flatMap((slot, slotIdx) => {
                        const single = slot.singleRow;
                        const rows = single ? ['upVals'] : ['upVals','downVals'];
                        return rows.map((rowKey, ri) => (
                          <tr key={`${slot.id}-${rowKey}`} style={{
                            borderBottom: (single || ri===1) ? '2px solid #ddd' : 'none',
                            background: activeSlotId===slot.id ? '#fdf6ff' : 'white',
                          }}>
                            <td style={{ fontWeight:700, color:'#7b1fa2', fontSize:11 }}>{ri===0 ? slotIdx+1 : ''}</td>
                            <td style={{ fontWeight:700 }}>{ri===0 ? slot.type : ''}</td>
                            <td style={{ color: single ? '#7b1fa2' : (ri===0?'#1565c0':'#e65100'), fontWeight:600, fontSize:11 }}>
                              {single ? 'VAL' : (ri===0?'UP':'DOWN')}
                            </td>
                            {colLabels.map(({idx}) => {
                              const v = slot[rowKey][idx];
                              return (
                                <td key={idx} style={{
                                  color: v ? (v==='NG'?'#c62828':'#2e7d32') : '#ccc',
                                  fontWeight: v ? 700 : 400,
                                  background: v ? (v==='NG'?'#ffebee':'#f1f8e9') : 'transparent',
                                }}>{v||'—'}</td>
                              );
                            })}
                          </tr>
                        ));
                      })}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}
        </div>

      </div>

      <div className="save-bar">
        <button className="btn-cancel" onClick={onCancel}>Cancel</button>
        <button className="btn-save" onClick={handleSubmit}>✅ Save</button>
      </div>
    </div>
  );
};

export default Form;