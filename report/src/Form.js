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
const MAX_COLS = 14;
const emptyRow = () => ({ name:'', spec:'', tolerance:'', inst:'' });

/* ── Step Header ── */
const StepHeader = ({ num, title, subtitle, color, done, onClick, isOpen }) => (
  <div onClick={onClick} style={{
    display:'flex', alignItems:'center', gap:12, padding:'14px 18px',
    cursor:'pointer', borderLeft:`4px solid ${done ? '#4CAF50' : color}`,
    background: isOpen ? '#fafafa' : 'white', userSelect:'none',
  }}>
    <div style={{
      width:30, height:30, borderRadius:'50%', flexShrink:0,
      background: done ? '#4CAF50' : color,
      color:'white', fontWeight:700, fontSize:13,
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      {done ? '✓' : num}
    </div>
    <div style={{ flex:1 }}>
      <div style={{ fontWeight:700, fontSize:14, color:'#222' }}>{title}</div>
      <div style={{ fontSize:11, color:'#888', marginTop:2 }}>{subtitle}</div>
    </div>
    <span style={{ fontSize:11, color:'#aaa' }}>{isOpen ? '▲' : '▼'}</span>
  </div>
);

/* ── Select Field ── */
const Field = ({ label, value, onChange, options, placeholder, required }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
    <label style={{ fontSize:12, fontWeight:600, color:'#555' }}>
      {label}{required && <span style={{ color:'#e53935' }}> *</span>}
    </label>
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      padding:'9px 12px', border:`1.5px solid ${value ? '#4CAF50' : '#ddd'}`,
      borderRadius:6, fontSize:13, background:'white', color: value ? '#222' : '#999',
      outline:'none', cursor:'pointer',
    }}>
      <option value="">{placeholder || 'Select...'}</option>
      {options.map(o => typeof o === 'string'
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.v} value={o.v}>{o.l}</option>
      )}
    </select>
  </div>
);

/* ── Inspection Item Row ── */
const ItemRow = ({ row, onUpdate, srNum, isProduct, onRemove }) => {
  const [localSpec, setLocalSpec] = useState(row.spec || '');
  React.useEffect(() => setLocalSpec(row.spec || ''), [row.spec]);
  const color = isProduct ? '#1976d2' : '#e65100';
  const items = isProduct ? PRODUCT_ITEMS : PROCESS_ITEMS;
  const tols  = isProduct
    ? TOLERANCES.map(t => ({ v:t, l:`± ${t}` }))
    : PROCESS_TOLERANCES.map(t => ({ v:t, l: t==='MIN'||t==='MAX' ? t : `± ${t}` }));
  const filled = row.name && row.spec && row.tolerance && row.inst;

  return (
    <div style={{
      display:'grid', gridTemplateColumns:'36px 2fr 1fr 1fr 1fr 30px',
      gap:8, alignItems:'center', padding:'8px 10px',
      background:'white', border:`1px solid ${filled ? '#c8e6c9' : '#e0e0e0'}`,
      borderRadius:6, marginBottom:6,
    }}>
      <span style={{ background:color, color:'white', fontSize:11, fontWeight:700, borderRadius:4, padding:'3px 5px', textAlign:'center' }}>
        {srNum}
      </span>
      <select value={row.name} onChange={e => onUpdate('name', e.target.value)}
        style={{ padding:'7px 8px', border:'1px solid #ddd', borderRadius:4, fontSize:12, width:'100%', outline:'none' }}>
        <option value="">Item select karo...</option>
        {items.map(i => <option key={i} value={i}>{i}</option>)}
      </select>
      <input type="text" value={localSpec} placeholder="Spec"
        onChange={e => setLocalSpec(e.target.value)}
        onBlur={() => onUpdate('spec', localSpec)}
        style={{ padding:'7px 8px', border:'1px solid #ddd', borderRadius:4, fontSize:12, width:'100%', outline:'none' }} />
      <select value={row.tolerance} onChange={e => onUpdate('tolerance', e.target.value)}
        style={{ padding:'7px 8px', border:'1px solid #ddd', borderRadius:4, fontSize:12, width:'100%', outline:'none' }}>
        <option value="">Tolerance</option>
        {tols.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
      </select>
      <select value={row.inst} onChange={e => onUpdate('inst', e.target.value)}
        style={{ padding:'7px 8px', border:'1px solid #ddd', borderRadius:4, fontSize:12, width:'100%', outline:'none' }}>
        <option value="">Instrument</option>
        {INSTRUMENTS.map(i => <option key={i} value={i}>{i}</option>)}
      </select>
      {onRemove
        ? <button onClick={onRemove} style={{ background:'none', border:'none', color:'#e53935', cursor:'pointer', fontSize:16, fontWeight:700, padding:0 }}>✕</button>
        : <div />}
    </div>
  );
};

/* ── Slot Value Entry — inline grid ── */
const SlotValueEntry = ({ slot, colLabels, setVal }) => {
  if (colLabels.length === 0) {
    return <div style={{ padding:'12px', color:'#aaa', fontSize:12, fontStyle:'italic' }}>Pehle Section 2 mein inspection items add karo.</div>;
  }
  return (
    <div style={{ padding:'12px 14px', overflowX:'auto' }}>
      <div style={{ display:'grid', gridTemplateColumns:`140px repeat(${colLabels.length}, minmax(70px,1fr))`, gap:5, minWidth: 140 + colLabels.length * 75 }}>
        {/* Header */}
        <div style={{ fontSize:10, fontWeight:700, color:'#aaa', textTransform:'uppercase', padding:'4px 0' }}>Column</div>
        {colLabels.map(({ idx, label }) => (
          <div key={idx} style={{ fontSize:10, fontWeight:700, color:'#888', textAlign:'center', padding:'4px 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {label.split('. ')[1] || label}
          </div>
        ))}

        {/* UP / Value row */}
        <div style={{ display:'flex', alignItems:'center', padding:'6px 10px', background: slot.singleRow ? '#f3e5f5' : '#e3f2fd', borderRadius:5, fontSize:12, fontWeight:700, color: slot.singleRow ? '#7b1fa2' : '#1565c0' }}>
          {slot.singleRow ? '📝 Value' : '⬆ UP'}
        </div>
        {colLabels.map(({ idx }) => {
          const v = slot.upVals[idx] || '';
          return (
            <input key={idx} type="text" value={v}
              onChange={e => setVal(slot.id, 'up', idx, e.target.value)}
              placeholder="—"
              style={{
                padding:'6px 6px', border:`1.5px solid ${v ? '#4CAF50' : '#e0e0e0'}`,
                borderRadius:5, fontSize:12, textAlign:'center', width:'100%', outline:'none',
                background: v ? (v==='NG' ? '#ffebee' : '#f1f8e9') : 'white',
                color: v ? (v==='NG' ? '#c62828' : '#2e7d32') : '#333', fontWeight: v ? 700 : 400,
              }} />
          );
        })}

        {/* DOWN row */}
        {!slot.singleRow && (
          <>
            <div style={{ display:'flex', alignItems:'center', padding:'6px 10px', background:'#fff3e0', borderRadius:5, fontSize:12, fontWeight:700, color:'#e65100' }}>
              ⬇ DOWN
            </div>
            {colLabels.map(({ idx }) => {
              const v = slot.downVals[idx] || '';
              return (
                <input key={idx} type="text" value={v}
                  onChange={e => setVal(slot.id, 'down', idx, e.target.value)}
                  placeholder="—"
                  style={{
                    padding:'6px 6px', border:`1.5px solid ${v ? '#ff9800' : '#e0e0e0'}`,
                    borderRadius:5, fontSize:12, textAlign:'center', width:'100%', outline:'none',
                    background: v ? (v==='NG' ? '#ffebee' : '#fff8e1') : 'white',
                    color: v ? (v==='NG' ? '#c62828' : '#e65100') : '#333', fontWeight: v ? 700 : 400,
                  }} />
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   MAIN FORM
════════════════════════════════════════ */
const Form = ({ onSubmit, onCancel, initialData = {}, items = [] }) => {

  const [openStep, setOpenStep] = useState(1);
  const toggleStep = (n) => setOpenStep(p => p === n ? 0 : n);

  /* ── Step 1 ── */
  const [header, setHeader] = useState({
    partName:      initialData.part_name      || '',
    partNumber:    initialData.part_number    || '',
    operationName: initialData.operation_name || '',
    customerName:  initialData.customer_name  || '',
  });
  const reportDone = !!(header.partName && header.partNumber && header.operationName && header.customerName);

  /* ── Step 2 ── */
  const existingProducts  = items.filter(i => i.sr_no <= 10);
  const existingProcesses = items.filter(i => i.sr_no >= 11);

  const [productRows, setProductRows] = useState(
    existingProducts.length > 0
      ? existingProducts.map(r => ({ name:r.item||'', spec:r.spec||'', tolerance:r.tolerance?.replace('± ','')||'', inst:r.inst||'' }))
      : [emptyRow()]
  );
  const [processRows, setProcessRows] = useState(
    existingProcesses.length > 0
      ? existingProcesses.map(r => ({ name:r.item||'', spec:r.spec||'', tolerance:r.tolerance||'', inst:r.inst||'' }))
      : [emptyRow()]
  );

  const updateRow = (setter, rows, i, field, val) => {
    const updated = [...rows];
    updated[i] = { ...updated[i], [field]: val };
    const last = updated[updated.length - 1];
    if (last.name && last.spec && last.tolerance && last.inst && updated.length < 10) {
      updated.push(emptyRow());
    }
    setter(updated);
  };

  const removeRow = (setter, rows, i) => {
    const updated = rows.filter((_,j) => j !== i);
    setter(updated.length ? updated : [emptyRow()]);
  };

  const filledProducts  = productRows.filter(r => r.name && r.spec && r.tolerance && r.inst);
  const filledProcesses = processRows.filter(r => r.name && r.spec && r.tolerance && r.inst);
  const inspDone = filledProducts.length > 0 || filledProcesses.length > 0;

  /* ── Step 3 ── */
  const [schedDate,    setSchedDate]    = useState(initialData.date || new Date().toISOString().split('T')[0]);
  const existingEntries = initialData.schedule_entries || [];
  const firstEntry = existingEntries[0] || {};
  const [operatorName, setOperatorName] = useState(firstEntry.operator || '');
  const [mcNo,         setMcNo]         = useState(firstEntry.machine_no || '');
  const [schedExpanded, setSchedExpanded] = useState(false);

  const makeSlot = (id, type) => ({ id, type, singleRow: true, upVals: Array(MAX_COLS).fill(''), downVals: Array(MAX_COLS).fill('') });

  const buildInitialSlots = () => {
    if (!existingEntries.length) return [makeSlot(1,'SETUP')];
    const map = {};
    existingEntries.forEach(e => {
      const k = e.slot_index ?? 0;
      if (!map[k]) map[k] = { id:k+1, type:e.time_type||'SETUP', singleRow:true, upVals:Array(MAX_COLS).fill(''), downVals:Array(MAX_COLS).fill('') };
      const vals = Array(MAX_COLS).fill('');
      for (let i=0;i<MAX_COLS;i++) vals[i] = e[`value_${i+1}`]||'';
      if (e.row_order === 0) { map[k].upVals = vals; }
      else { map[k].downVals = vals; map[k].singleRow = false; }
    });
    const r = Object.values(map).sort((a,b) => a.id-b.id);
    return r.length ? r : [makeSlot(1,'SETUP')];
  };

  const initSlots = buildInitialSlots();
  const [slots,        setSlots]        = useState(initSlots);
  const [nextId,       setNextId]       = useState(initSlots.length + 1);
  const [activeSlotId, setActiveSlotId] = useState(initSlots[0]?.id ?? 1);

  const addSlot = (type) => {
    const s = makeSlot(nextId, type);
    setSlots(prev => {
      if (type === 'SETUP') {
        const li = prev.map(x=>x.type).lastIndexOf('SETUP');
        const at = li >= 0 ? li+1 : 0;
        const n = [...prev]; n.splice(at,0,s); return n;
      }
      return [...prev, s];
    });
    setNextId(p=>p+1);
    setActiveSlotId(s.id);
  };

  const removeSlot = (id) => {
    setSlots(p => p.filter(s=>s.id!==id));
    if (activeSlotId === id) setActiveSlotId(null);
  };

  const toggleRows = (id) => setSlots(p => p.map(s => s.id===id ? {...s,singleRow:!s.singleRow} : s));

  const setVal = (slotId, row, idx, val) =>
    setSlots(p => p.map(s =>
      s.id===slotId
        ? { ...s, [row==='up'?'upVals':'downVals']: s[row==='up'?'upVals':'downVals'].map((v,i) => i===idx ? val : v) }
        : s
    ));

  const colLabels = [
    ...filledProducts.map((r,i)  => ({ idx:i,                      label:`${i+1}. ${r.name}` })),
    ...filledProcesses.map((r,i) => ({ idx:filledProducts.length+i, label:`${11+i}. ${r.name}` })),
  ].slice(0, MAX_COLS);

  const activeSlot    = slots.find(s => s.id === activeSlotId) || null;
  const setupSlot     = slots.find(s => s.type === 'SETUP');
  const isSetupFilled = setupSlot
    ? setupSlot.upVals.filter(v=>v&&v.trim()).length + setupSlot.downVals.filter(v=>v&&v.trim()).length > 0
    : false;

  const slotTypes    = slots.map(s => s.type);
  const pendingTypes = PENDING_SLOT_TYPES.filter(t => !slotTypes.includes(t));
  const addedTypes   = PENDING_SLOT_TYPES.filter(t => slotTypes.includes(t));

  /* ── Submit ── */
  const handleSubmit = () => {
    if (!reportDone) { alert('Report Information puri bharo'); return; }
    const allItems = [
      ...filledProducts.map((r,i)  => ({ sr_no:i+1,   item:r.name, spec:r.spec, tolerance:`± ${r.tolerance}`, inst:r.inst })),
      ...filledProcesses.map((r,i) => ({ sr_no:11+i,  item:r.name, spec:r.spec, tolerance:r.tolerance,        inst:r.inst })),
    ];
    const scheduleEntries = [];
    slots.forEach((slot, si) => {
      if (slot.singleRow) {
        const e = { time_type:slot.type, row_order:0, slot_index:si, operator:operatorName, machine_no:mcNo, date:schedDate };
        slot.upVals.forEach((v,i) => { e[`value_${i+1}`] = v||''; });
        scheduleEntries.push(e);
      } else {
        ['upVals','downVals'].forEach((key,ri) => {
          const e = { time_type:slot.type, row_order:ri, slot_index:si, operator:operatorName, machine_no:mcNo, date:schedDate };
          slot[key].forEach((v,i) => { e[`value_${i+1}`] = v||''; });
          scheduleEntries.push(e);
        });
      }
    });
    onSubmit({ partName:header.partName, partNumber:header.partNumber, operationName:header.operationName, customerName:header.customerName, scheduleDate:schedDate, operatorName, mcNo, items:allItems, schedule_entries:scheduleEntries });
  };

  /* ─────── RENDER ─────── */
  return (
    <div className="form-wrap">
      <div className="form-topbar">
        <span className="form-topbar-title">📋 Inspection Form</span>
        <button className="btn-cancel-top" onClick={onCancel}>✕ Cancel</button>
      </div>

      <div className="form-body">

        {/* ── STEP 1 ── */}
        <div className="acc-card">
          <StepHeader num="1" title="Report Information" color="#4CAF50" done={reportDone}
            subtitle={reportDone ? `${header.partName} · ${header.operationName} · ${header.customerName}` : 'Part, operation, customer select karo'}
            onClick={() => toggleStep(1)} isOpen={openStep === 1} />
          {openStep === 1 && (
            <div style={{ padding:'16px', borderTop:'1px solid #eee' }}>
              <div className="grid-2" style={{ gap:14 }}>
                <Field label="Part Name" required value={header.partName} onChange={v=>setHeader(p=>({...p,partName:v}))} options={PART_NAMES} placeholder="Part Name select karo" />
                <Field label="Part Number" required value={header.partNumber} onChange={v=>setHeader(p=>({...p,partNumber:v}))} options={PART_NUMBERS} placeholder="Part Number select karo" />
                <Field label="Operation Name" required value={header.operationName} onChange={v=>setHeader(p=>({...p,operationName:v}))} options={OPERATIONS} placeholder="Operation select karo" />
                <Field label="Customer Name" required value={header.customerName} onChange={v=>setHeader(p=>({...p,customerName:v}))} options={CUSTOMER_NAMES} placeholder="Customer select karo" />
              </div>
              {reportDone && (
                <button onClick={() => toggleStep(2)} style={{ marginTop:14, padding:'9px 22px', background:'#4CAF50', color:'white', border:'none', borderRadius:6, fontWeight:700, fontSize:13, cursor:'pointer' }}>
                  Aage → Inspection
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── STEP 2 ── */}
        <div className="acc-card">
          <StepHeader num="2" title="Inspection Items" color="#1976d2" done={inspDone}
            subtitle={inspDone ? `${filledProducts.length} product · ${filledProcesses.length} process items` : 'Product aur process items add karo'}
            onClick={() => toggleStep(2)} isOpen={openStep === 2} />
          {openStep === 2 && (
            <div style={{ padding:'16px', borderTop:'1px solid #eee' }}>

              {/* Product Items */}
              <div style={{ marginBottom:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <span style={{ fontWeight:700, fontSize:13, color:'#1976d2' }}>📦 Product Items</span>
                  <span style={{ fontSize:11, color:'#888' }}>(max 10)</span>
                  {filledProducts.length > 0 && <span style={{ background:'#e3f2fd', color:'#1976d2', border:'1px solid #90caf9', borderRadius:10, padding:'2px 10px', fontSize:11, fontWeight:700 }}>{filledProducts.length} items</span>}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'36px 2fr 1fr 1fr 1fr 30px', gap:8, padding:'0 10px 4px' }}>
                  {['SR','Item Name','Spec','Tolerance','Instrument',''].map((h,i) => (
                    <div key={i} style={{ fontSize:10, fontWeight:700, color:'#aaa', textTransform:'uppercase' }}>{h}</div>
                  ))}
                </div>
                {productRows.map((row, i) => (
                  <ItemRow key={i} row={row} srNum={i+1} isProduct={true}
                    onUpdate={(f,v) => updateRow(setProductRows, productRows, i, f, v)}
                    onRemove={productRows.length > 1 && row.name ? () => removeRow(setProductRows, productRows, i) : null} />
                ))}
              </div>

              {/* Process Items */}
              <div style={{ marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <span style={{ fontWeight:700, fontSize:13, color:'#e65100' }}>⚙️ Process Items</span>
                  <span style={{ fontSize:11, color:'#888' }}>(max 10)</span>
                  {filledProcesses.length > 0 && <span style={{ background:'#fff3e0', color:'#e65100', border:'1px solid #ffcc80', borderRadius:10, padding:'2px 10px', fontSize:11, fontWeight:700 }}>{filledProcesses.length} items</span>}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'36px 2fr 1fr 1fr 1fr 30px', gap:8, padding:'0 10px 4px' }}>
                  {['SR','Item Name','Spec','Tolerance','Instrument',''].map((h,i) => (
                    <div key={i} style={{ fontSize:10, fontWeight:700, color:'#aaa', textTransform:'uppercase' }}>{h}</div>
                  ))}
                </div>
                {processRows.map((row, i) => (
                  <ItemRow key={i} row={row} srNum={filledProducts.length + i + 1} isProduct={false}
                    onUpdate={(f,v) => updateRow(setProcessRows, processRows, i, f, v)}
                    onRemove={processRows.length > 1 && row.name ? () => removeRow(setProcessRows, processRows, i) : null} />
                ))}
              </div>

              {inspDone && (
                <button onClick={() => toggleStep(3)} style={{ padding:'9px 22px', background:'#1976d2', color:'white', border:'none', borderRadius:6, fontWeight:700, fontSize:13, cursor:'pointer' }}>
                  Aage → Schedule
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── STEP 3 ── */}
        <div className="acc-card">
          <StepHeader num="3" title="Schedule Information" color="#7b1fa2" done={isSetupFilled}
            subtitle={isSetupFilled ? `SETUP done · ${operatorName||'—'} · M/C ${mcNo||'—'}` : 'Date, operator, time slots fill karo'}
            onClick={() => toggleStep(3)} isOpen={openStep === 3} />
          {openStep === 3 && (
            <div style={{ padding:'16px', borderTop:'1px solid #eee' }}>

              {/* Date / Operator / MC */}
              <div className="grid-3" style={{ marginBottom:18, gap:14 }}>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:'#555' }}>Date <span style={{ color:'#e53935' }}>*</span></label>
                  <div style={{ position:'relative', border:`1.5px solid ${schedDate?'#4CAF50':'#ddd'}`, borderRadius:6, padding:'8px 12px', display:'flex', alignItems:'center', gap:8, background:'white', cursor:'pointer' }}>
                    <span style={{ flex:1, fontSize:13 }}>{schedDate ? schedDate.split('-').reverse().join('/') : 'DD/MM/YYYY'}</span>
                    <span>📅</span>
                    <input type="date" value={schedDate} onChange={e=>setSchedDate(e.target.value)} style={{ position:'absolute', opacity:0, inset:0, cursor:'pointer', width:'100%' }} />
                  </div>
                </div>
                <Field label="Operator Name" required value={operatorName} onChange={setOperatorName} options={OPERATOR_NAMES} placeholder="Operator select karo" />
                <Field label="M/C No" required value={mcNo} onChange={setMcNo} options={Array.from({length:23},(_,i)=>String(i+1))} placeholder="Machine select karo" />
              </div>

              {/* SETUP done banner */}
              {isSetupFilled && (
                <div style={{ background:'#e8f5e9', border:'1.5px solid #4CAF50', borderRadius:8, padding:'12px 16px', marginBottom:14 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                      <span style={{ background:'#2e7d32', color:'white', fontWeight:700, fontSize:12, borderRadius:6, padding:'4px 12px' }}>✅ SETUP — Data Save Ho Gaya!</span>
                      <span style={{ fontSize:11, color:'#2e7d32', fontWeight:600 }}>
                        {setupSlot.upVals.filter(v=>v&&v.trim()).length + setupSlot.downVals.filter(v=>v&&v.trim()).length} values stored
                      </span>
                    </div>
                    <button onClick={() => setSchedExpanded(p=>!p)} style={{
                      background: schedExpanded ? '#f3e5f5' : '#7b1fa2', color: schedExpanded ? '#7b1fa2' : 'white',
                      border:'1.5px solid #7b1fa2', borderRadius:6, padding:'6px 14px', fontSize:12, fontWeight:700, cursor:'pointer',
                    }}>
                      {schedExpanded ? '▲ Collapse' : '✏️ Edit / Add Slots'}
                    </button>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginTop:10, paddingTop:10, borderTop:'1px solid #c8e6c9' }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'#555' }}>Slots:</span>
                    {addedTypes.map(t => <span key={t} style={{ background:'#e8f5e9', border:'1px solid #4CAF50', color:'#2e7d32', borderRadius:12, padding:'3px 10px', fontSize:11, fontWeight:700 }}>✓ {t}</span>)}
                    {pendingTypes.map(t => <span key={t} style={{ background:'#fff8e1', border:'1.5px solid #ffb300', color:'#e65100', borderRadius:12, padding:'3px 10px', fontSize:11, fontWeight:700 }}>⏳ {t} Pending</span>)}
                  </div>
                </div>
              )}

              {/* Slot editing area */}
              {(!isSetupFilled || schedExpanded) && (
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>
                    Time Slots
                  </div>

                  {/* Slot tabs */}
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14, alignItems:'center' }}>
                    {slots.map((slot, i) => {
                      const isActive = slot.id === activeSlotId;
                      const filled = slot.upVals.filter(v=>v&&v.trim()).length + slot.downVals.filter(v=>v&&v.trim()).length;
                      return (
                        <button key={slot.id} onClick={() => setActiveSlotId(slot.id)} style={{
                          padding:'7px 14px', borderRadius:20,
                          border:`2px solid ${isActive ? '#7b1fa2' : filled > 0 ? '#4CAF50' : '#ddd'}`,
                          background: isActive ? '#7b1fa2' : filled > 0 ? '#e8f5e9' : 'white',
                          color: isActive ? 'white' : filled > 0 ? '#2e7d32' : '#555',
                          fontWeight:700, fontSize:12, cursor:'pointer',
                          display:'flex', alignItems:'center', gap:6,
                        }}>
                          {i+1}. {slot.type}
                          {filled > 0 && !isActive && <span style={{ fontSize:10 }}>✓{filled}</span>}
                          {isActive && (
                            <button onClick={e=>{ e.stopPropagation(); toggleRows(slot.id); }} style={{
                              background:'rgba(255,255,255,0.25)', border:'1px solid rgba(255,255,255,0.5)',
                              borderRadius:10, padding:'1px 7px', fontSize:10, color:'white', cursor:'pointer', fontWeight:700,
                            }}>
                              {slot.singleRow ? '1L' : '2L'}
                            </button>
                          )}
                          {slots.length > 1 && (
                            <span onClick={e=>{ e.stopPropagation(); removeSlot(slot.id); }} style={{ color: isActive ? 'rgba(255,255,255,0.7)':'#ccc', fontSize:14, fontWeight:700, cursor:'pointer', lineHeight:1 }}>×</span>
                          )}
                        </button>
                      );
                    })}

                    <select value="" onChange={e=>{ const t=e.target.value; if(!t) return; addSlot(t); }} style={{
                      padding:'7px 12px', borderRadius:20,
                      border:'2px dashed #7b1fa2', background:'#faf0ff',
                      color:'#7b1fa2', fontWeight:700, fontSize:12, cursor:'pointer', outline:'none',
                    }}>
                      <option value="">+ Slot add karo</option>
                      {TIME_TYPE_OPTIONS.map(t => (
                        <option key={t} value={t} disabled={t!=='SETUP' && !isSetupFilled}>
                          {t}{t!=='SETUP' && !isSetupFilled ? ' 🔒' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Active slot header + value entry */}
                  {activeSlot && (
                    <div style={{ border:'1px solid #e0e0e0', borderRadius:8, overflow:'hidden', marginBottom:14 }}>
                      <div style={{ background:'#7b1fa2', color:'white', padding:'10px 14px', fontWeight:700, fontSize:13, display:'flex', alignItems:'center', gap:10 }}>
                        <span>✏️ Slot {slots.findIndex(s=>s.id===activeSlotId)+1} — {activeSlot.type}</span>
                        <span style={{ fontSize:11, opacity:0.8 }}>{activeSlot.singleRow ? '(1 line)' : '(UP + DOWN)'}</span>
                        <button onClick={() => toggleRows(activeSlot.id)} style={{
                          marginLeft:'auto', background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.4)',
                          borderRadius:5, padding:'3px 10px', color:'white', fontSize:11, fontWeight:700, cursor:'pointer',
                        }}>
                          {activeSlot.singleRow ? '2 Lines mein badlo' : '1 Line mein badlo'}
                        </button>
                      </div>
                      <SlotValueEntry slot={activeSlot} colLabels={colLabels} setVal={setVal} />
                    </div>
                  )}

                  {/* Preview */}
                  {colLabels.length > 0 && slots.length > 0 && (
                    <div style={{ overflowX:'auto', marginTop:8 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#888', textTransform:'uppercase', marginBottom:6 }}>Schedule Preview</div>
                      <table className="mini-table">
                        <thead>
                          <tr>
                            <th>#</th><th>Time</th><th>Row</th>
                            {colLabels.map(({idx,label}) => <th key={idx}>{label.split('. ')[0]}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {slots.flatMap((slot, si) => {
                            const rows = slot.singleRow ? ['upVals'] : ['upVals','downVals'];
                            return rows.map((rk, ri) => (
                              <tr key={`${slot.id}-${rk}`} style={{ background: slot.id===activeSlotId ? '#fdf6ff' : 'white' }}>
                                <td style={{ fontWeight:700, color:'#7b1fa2' }}>{ri===0 ? si+1 : ''}</td>
                                <td style={{ fontWeight:700 }}>{ri===0 ? slot.type : ''}</td>
                                <td style={{ color: slot.singleRow ? '#7b1fa2' : ri===0 ? '#1565c0':'#e65100', fontWeight:600, fontSize:11 }}>
                                  {slot.singleRow ? 'VAL' : ri===0 ? 'UP':'DOWN'}
                                </td>
                                {colLabels.map(({idx}) => {
                                  const v = slot[rk][idx];
                                  return <td key={idx} style={{ color:v?(v==='NG'?'#c62828':'#2e7d32'):'#ccc', fontWeight:v?700:400, background:v?(v==='NG'?'#ffebee':'#f1f8e9'):'transparent' }}>{v||'—'}</td>;
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