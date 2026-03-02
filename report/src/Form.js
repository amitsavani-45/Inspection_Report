import React, { useState, useEffect } from 'react';
import './Form.css';
import { getDropdownOptions } from './services/api';

const parseSpecTol = (raw = '') => {
  if (!raw) return { spec: '', tol: '' };
  // number +0.5/-1.0 MM
  let m = raw.match(/^([\d.]+)\s*(\+[\d.]+\s*\/\s*-[\d.]+\s*MM)\s*$/i);
  if (m) return { spec: m[1].trim(), tol: m[2].trim() };
  // number + 0.9 MM
  m = raw.match(/^([\d.]+)\s*(\+\s*[\d.]+\s*MM)\s*$/i);
  if (m) return { spec: m[1].trim(), tol: m[2].trim() };
  // number ± 0.07 MM
  m = raw.match(/^([\d.]+)\s*(±\s*[\d.]+\s*MM)\s*$/i);
  if (m) return { spec: m[1].trim(), tol: m[2].trim() };
  // everything else — full spec, no tolerance
  return { spec: raw.trim(), tol: '' };
};

/* ── DB se inspection items fetch karo ── */
const fetchInspectionItems = async (operation) => {
  try {
    const response = await fetch(`http://localhost:8000/api/inspection-items/?operation=${encodeURIComponent(operation)}`);
    return await response.json();
  } catch (err) {
    console.error('Inspection items fetch failed:', err);
    return { product: [], process: [] };
  }
};

/* ── Constants (static - DB se nahi aate) ── */
const OPERATOR_NAMES = ['ALEX','RAHUL SHARMA','SURESH KUMAR','RAMESH PATEL','DINESH VERMA','MAHESH YADAV','PRAKASH SINGH','VIJAY KUMAR','ANIL GUPTA','RAJU MEHTA','SANJAY JOSHI','DEEPAK NAIR','RAKESH TIWARI','MOHAN DAS','GANESH RAO'];
const PRODUCT_ITEMS  = ['APPEARANCE','WIDTH','LENGTH','THICKNESS','DIMENSIONS A','DIMENSIONS B','RADIUS','BLANK PROFILE','DIAMETER','DEPTH','HEIGHT','FLATNESS','STRAIGHTNESS','ROUNDNESS','CHAMFER','THREAD','HOLE DIAMETER','PITCH','SURFACE FINISH','WEIGHT'];
const PROCESS_ITEMS  = ['SHUT HEIGHT','BALANCER PRESSURE','CLUTCH PRESSURE','CUSHION PRESSURE','DIE HEIGHT','STROKE LENGTH','FEED RATE','CUTTING SPEED','SPINDLE SPEED','COOLANT PRESSURE','COOLANT FLOW','CLAMPING FORCE','BLANK HOLDER FORCE','DRAWING FORCE','PRESS TONNAGE','TEMPERATURE','CYCLE TIME','AIR PRESSURE','HYDRAULIC PRESSURE','LUBRICATION PRESSURE'];
const TOLERANCES         = ['0.01','0.02','0.05','0.08','0.1','0.2','0.3','0.5','1.0'];
const PROCESS_TOLERANCES = ['MIN','MAX','0.01','0.05','0.1','0.2','0.5','1.0'];
const INSTRUMENTS        = ['VISUAL','VERNIER','MICROMETER','RADIUS GAUGE','TEMPLATE','DIGITAL','GAUGE','CMM','DIAL INDICATOR','HEIGHT GAUGE'];
const TIME_TYPE_OPTIONS  = ['SETUP','4HRS','LAST'];
const PENDING_SLOT_TYPES = ['4HRS','LAST'];
const MAX_COLS = 20;
const emptyRow = () => ({ name:'', spec:'', tolerance:'', inst:'' });

const STEPS = [
  { id:1, label:'Report',     icon:'📋' },
  { id:2, label:'Schedule',   icon:'📅' },
];

/* ── Reusable Select Field ── */
const Field = ({ label, value, onChange, options, placeholder, required }) => (
  <div className="wiz-field">
    <label className="wiz-label">{label}{required && <span style={{color:'#e53935'}}> *</span>}</label>
    <select value={value} onChange={e => onChange(e.target.value)} className={`wiz-select${value?' filled':''}`}>
      <option value="">{placeholder || 'Select...'}</option>
      {options.map(o => typeof o==='string'
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.v} value={o.v}>{o.l}</option>
      )}
    </select>
  </div>
);

/* ── Inspection Row ── */
const InspItem = ({ row, onUpdate, srNum, isProduct, onRemove, dbItems=[] }) => {
  const [spec, setSpec] = useState(row.spec || '');
  useEffect(() => setSpec(row.spec || ''), [row.spec]);
  const color  = isProduct ? '#1976d2' : '#e65100';
  const staticItems = isProduct ? PRODUCT_ITEMS : PROCESS_ITEMS;
  const items = [...new Set([...dbItems.map(i=>i.name||i), ...staticItems])];
  const tols   = isProduct
    ? TOLERANCES.map(t => ({ v:t, l:`± ${t}` }))
    : PROCESS_TOLERANCES.map(t => ({ v:t, l: t==='MIN'||t==='MAX' ? t : `± ${t}` }));
  const filled = !!(row.name && row.spec && row.inst);

  return (
    <div className={`insp-row${filled?' done':''}`} style={{borderLeftColor: filled?'#4CAF50':color}}>
      <div className="insp-sr" style={{background:color}}>{srNum}</div>
      <div className="insp-fields">
        <select value={row.name} onChange={e=>{
          const val=e.target.value;
          onUpdate('name',val);
          const match=dbItems.find(i=>(i.name||i)===val);
          if(match&&match.spec) onUpdate('spec',match.spec);
          if(match&&match.instrument) onUpdate('inst',match.instrument);
          if(match&&match.tolerance) onUpdate('tolerance',match.tolerance);
        }} className="insp-select">
          <option value="">{isProduct ? '📦 Product item select karo...' : '⚙️ Process item select karo...'}</option>
          {items.map(i=><option key={i} value={i}>{i}</option>)}
        </select>
        <div className="insp-row-bottom">
          <input className="insp-input" type="text" value={spec} placeholder="Spec"
            onChange={e=>{setSpec(e.target.value);onUpdate('spec',e.target.value);}} />
          <select value={row.tolerance} onChange={e=>onUpdate('tolerance',e.target.value)} className="insp-select-sm">
            <option value="">Tolerance</option>
            {tols.map(t=><option key={t.v} value={t.v}>{t.l}</option>)}
          </select>
          <select value={row.inst} onChange={e=>onUpdate('inst',e.target.value)} className="insp-select-sm">
            <option value="">Instrument</option>
            {INSTRUMENTS.map(i=><option key={i} value={i}>{i}</option>)}
          </select>
        </div>
      </div>
      {onRemove
        ? <button onClick={onRemove} className="insp-remove">✕</button>
        : <div style={{width:28}}/>}
    </div>
  );
};

/* ── Combined Inspection Preview Table ── */
const CombinedTable = ({ productRows, processRows }) => {
  const allRows = [
    ...productRows.map((r,i) => ({...r, category:'PRODUCT', catColor:'#1976d2', sr:i+1})),
    ...processRows.map((r,i) => ({...r, category:'PROCESS', catColor:'#e65100', sr:productRows.length+i+1})),
  ];
  if(allRows.length===0) return (
    <div style={{textAlign:'center',color:'#aaa',padding:'40px 0',fontSize:13}}>
      Koi items nahi mili. Pehle Step 1 mein Operation select karo.
    </div>
  );
  return (
    <div style={{overflowX:'auto',marginTop:8}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
        <thead>
          <tr style={{background:'#f0f4ff',borderBottom:'2px solid #c5cae9'}}>
            <th style={{padding:'10px 8px',textAlign:'center',fontWeight:700,color:'#333',width:36}}>SR</th>
            <th style={{padding:'10px 8px',textAlign:'center',fontWeight:700,color:'#333',width:80}}>Category</th>
            <th style={{padding:'10px 8px',textAlign:'left',fontWeight:700,color:'#333'}}>Item</th>
            <th style={{padding:'10px 8px',textAlign:'center',fontWeight:700,color:'#333'}}>Spec</th>
            <th style={{padding:'10px 8px',textAlign:'center',fontWeight:700,color:'#333'}}>Tolerance</th>
            <th style={{padding:'10px 8px',textAlign:'center',fontWeight:700,color:'#333'}}>Instrument</th>
          </tr>
        </thead>
        <tbody>
          {allRows.map((row,i)=>{
            const {spec:s, tol:t} = parseSpecTol(row.spec);
            const dispSpec = s||row.spec;
            const dispTol  = row.tolerance ? `± ${row.tolerance}` : (t||'—');
            const isProduct = row.category==='PRODUCT';
            return (
              <tr key={i} style={{borderBottom:'1px solid #eee',background:i%2===0?'#fff':'#fafafa'}}>
                <td style={{padding:'9px 8px',textAlign:'center',fontWeight:700,color:row.catColor}}>{row.sr}</td>
                <td style={{padding:'9px 8px',textAlign:'center'}}>
                  <span style={{
                    background: isProduct?'#e3f2fd':'#fff3e0',
                    color: row.catColor,
                    border:`1px solid ${row.catColor}`,
                    borderRadius:4,padding:'2px 7px',fontSize:10,fontWeight:700,
                    whiteSpace:'nowrap'
                  }}>{row.category}</span>
                </td>
                <td style={{padding:'9px 8px',fontWeight:600,color:'#222'}}>{row.name}</td>
                <td style={{padding:'9px 8px',textAlign:'center',color:'#555'}}>{dispSpec}</td>
                <td style={{padding:'9px 8px',textAlign:'center',color:'#555'}}>{dispTol}</td>
                <td style={{padding:'9px 8px',textAlign:'center',color:'#555'}}>{row.inst}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/* ── Slot Value Entry — Direct Table ── */
const SlotValueEntry = ({ slot, colLabels, setVal }) => {
  if (colLabels.length===0) return (
    <div style={{padding:'20px',textAlign:'center',color:'#aaa',fontSize:13}}>
      Pehle Step 2 mein inspection items add karo
    </div>
  );
  return (
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
        <thead>
          <tr style={{background:'#f5f5f5'}}>
            <th style={{padding:'8px 12px',textAlign:'left',fontWeight:700,color:'#333',borderBottom:'2px solid #e0e0e0'}}>Column</th>
            <th style={{padding:'8px 12px',textAlign:'center',fontWeight:700,color:'#1565c0',borderBottom:'2px solid #e0e0e0',minWidth:90}}>Reading 1</th>
            {!slot.singleRow && <th style={{padding:'8px 12px',textAlign:'center',fontWeight:700,color:'#e65100',borderBottom:'2px solid #e0e0e0',minWidth:90}}>Reading 2</th>}
          </tr>
        </thead>
        <tbody>
          {colLabels.map(({idx,label})=>{
            const uv = slot.upVals[idx]||'';
            const dv = slot.downVals[idx]||'';
            const isNgUp = uv.toUpperCase()==='NG';
            const isNgDn = dv.toUpperCase()==='NG';
            return (
              <tr key={idx} style={{borderBottom:'1px solid #f0f0f0',background:idx%2===0?'#fff':'#fafafa'}}>
                <td style={{padding:'6px 12px',fontWeight:600,color:'#333'}}>{label}</td>
                <td style={{padding:'4px 8px',textAlign:'center'}}>
                  <input
                    type="text"
                    value={uv}
                    placeholder="—"
                    onChange={e=>setVal(slot.id,'up',idx,e.target.value)}
                    style={{
                      width:'80px',textAlign:'center',padding:'5px 8px',
                      border:`1px solid ${isNgUp?'#e53935':uv?'#4caf50':'#ddd'}`,
                      borderRadius:6,fontSize:13,fontWeight:uv?700:400,
                      background:isNgUp?'#ffebee':uv?'#e8f5e9':'#fff',
                      color:isNgUp?'#e53935':uv?'#2e7d32':'#999',
                      outline:'none'
                    }}
                  />
                </td>
                {!slot.singleRow && (
                  <td style={{padding:'4px 8px',textAlign:'center'}}>
                    <input
                      type="text"
                      value={dv}
                      placeholder="—"
                      onChange={e=>setVal(slot.id,'down',idx,e.target.value)}
                      style={{
                        width:'80px',textAlign:'center',padding:'5px 8px',
                        border:`1px solid ${isNgDn?'#e53935':dv?'#ff9800':'#ddd'}`,
                        borderRadius:6,fontSize:13,fontWeight:dv?700:400,
                        background:isNgDn?'#ffebee':dv?'#fff3e0':'#fff',
                        color:isNgDn?'#e53935':dv?'#e65100':'#999',
                        outline:'none'
                      }}
                    />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/* ══════════════════════════════════════
   MAIN FORM — WIZARD
══════════════════════════════════════ */
const Form = ({ onSubmit, onCancel, initialData={}, items=[] }) => {
  const [step, setStep] = useState(1);

  /* ── DB se dropdown options ── */
  const [dbOptions, setDbOptions] = useState({
    customers: [],
    part_names: [],
    part_numbers: [],
    operations: [],
  });
  const [optionsLoading, setOptionsLoading] = useState(true);

  useEffect(() => {
    getDropdownOptions()
      .then(data => {
        setDbOptions(data);
        setOptionsLoading(false);
        if (data.part_numbers && data.part_numbers.length === 1) {
          setHeader(p => ({...p, partNumber: data.part_numbers[0]}));
        }
      })
      .catch(err => {
        console.error('Dropdown options fetch failed:', err);
        setOptionsLoading(false);
      });
  }, []);

  /* Step 1 */
  const [header, setHeader] = useState({
    customerName:  initialData.customer_name  || '',
    partName:      initialData.part_name      || '',
    operationName: initialData.operation_name || '',
    partNumber:    initialData.part_number    || '',
  });
  const step1Done = !!(header.customerName && header.partName && header.operationName && header.partNumber);

  /* Step 2 */
  const existingProducts  = items.filter(i=>i.sr_no<=10);
  const existingProcesses = items.filter(i=>i.sr_no>=11);
  const [productRows, setProductRows] = useState(
    existingProducts.length>0
      ? existingProducts.map(r=>({name:r.item||'',spec:r.spec||'',tolerance:r.tolerance?.replace('± ','')||'',inst:r.inst||''}))
      : [emptyRow()]
  );
  const [processRows, setProcessRows] = useState(
    existingProcesses.length>0
      ? existingProcesses.map(r=>({name:r.item||'',spec:r.spec||'',tolerance:r.tolerance||'',inst:r.inst||''}))
      : [emptyRow()]
  );

  const [inspType, setInspType] = useState('');

  /* ── Operation select hone par DB se items auto-load karo ── */
  useEffect(() => {
    if (!header.operationName) return;
    fetchInspectionItems(header.operationName).then(data => {
      if (data.product && data.product.length > 0) {
        setProductRows([
          ...data.product.map(item => ({
            name: item.name || '',
            spec: item.spec || '',
            tolerance: item.tolerance || '',
            inst: item.instrument || '',
          })),
          emptyRow()
        ]);
        setInspType('product');
      } else {
        setProductRows([emptyRow()]);
      }
      if (data.process && data.process.length > 0) {
        setProcessRows([
          ...data.process.map(item => ({
            name: item.name || '',
            spec: item.spec || '',
            tolerance: item.tolerance || '',
            inst: item.instrument || '',
          })),
          emptyRow()
        ]);
        if (data.product && data.product.length === 0) setInspType('process');
      } else {
        setProcessRows([emptyRow()]);
      }
    });
  }, [header.operationName]);

  const filledProducts  = productRows.filter(r=>r.name&&r.spec&&r.inst);
  const filledProcesses = processRows.filter(r=>r.name&&r.spec&&r.inst);
  const step2Done = filledProducts.length>0 || filledProcesses.length>0;

  /* Step 3 */
  const [schedDate,    setSchedDate]   = useState(initialData.date||new Date().toISOString().split('T')[0]);
  const existingEntries = initialData.schedule_entries||[];
  const firstEntry = existingEntries[0]||{};
  const [operatorName, setOperatorName] = useState(firstEntry.operator||'');
  const [mcNo,         setMcNo]         = useState(firstEntry.machine_no||'');
  const [schedExpanded, setSchedExpanded] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const makeSlot = (id,type,subType='',slotDate='') => ({id,type,subType,singleRow:true,date:slotDate||today,upVals:Array(MAX_COLS).fill(''),downVals:Array(MAX_COLS).fill('')});
  const buildInitialSlots = () => {
    if (!existingEntries.length) return [];
    const map={};
    existingEntries.forEach(e=>{
      const k=e.slot_index??0;
      if (!map[k]) map[k]={id:k+1,type:e.time_type||'SETUP',singleRow:true,date:e.date||today,upVals:Array(MAX_COLS).fill(''),downVals:Array(MAX_COLS).fill('')};
      const vals=Array(MAX_COLS).fill('');
      for(let i=0;i<MAX_COLS;i++) vals[i]=e[`value_${i+1}`]||'';
      if (e.row_order===0){map[k].upVals=vals;}
      else{map[k].downVals=vals;map[k].singleRow=false;}
    });
    const r=Object.values(map).sort((a,b)=>a.id-b.id);
    return r.length?r:[];
  };
  const initSlots = buildInitialSlots();
  const [slots,        setSlots]        = useState(initSlots);
  const [nextId,       setNextId]       = useState(initSlots.length+1);
  const [activeSlotId, setActiveSlotId] = useState(initSlots[0]?.id??1);
  const [schedModal,     setSchedModal]     = useState(null);
  const [modalActiveSlot, setModalActiveSlot] = useState(null);
  const [modalSlotType,  setModalSlotType]  = useState('');
  const [modalSubType,   setModalSubType]   = useState('');
  const [updateSlotId,   setUpdateSlotId]   = useState(null);

  const toggleRows  = (id) => setSlots(p=>p.map(s=>s.id===id?{...s,singleRow:!s.singleRow}:s));
  const setVal = (slotId,row,idx,val) =>
    setSlots(p=>p.map(s=>s.id===slotId
      ?{...s,[row==='up'?'upVals':'downVals']:s[row==='up'?'upVals':'downVals'].map((v,i)=>i===idx?val:v)}:s));

  const colLabels = [
    ...filledProducts.map((r,i) => {
      const {spec:s, tol:t} = parseSpecTol(r.spec);
      return { idx: i, label: `${i+1}. ${r.name}`, spec: s || r.spec || '—', tolerance: r.tolerance ? `± ${r.tolerance}` : (t || '—'), inst: r.inst || '—' };
    }),
    ...filledProcesses.map((r,i) => {
      const {spec:s, tol:t} = parseSpecTol(r.spec);
      return { idx: filledProducts.length+i, label: `${filledProducts.length+i+1}. ${r.name}`, spec: s || r.spec || '—', tolerance: r.tolerance ? r.tolerance : (t || '—'), inst: r.inst || '—' };
    }),
  ].slice(0,MAX_COLS);

  const isSetupFilled = slots.length > 0 && slots.some(s =>
    s.upVals.some(v=>v&&v.trim()) || s.downVals.some(v=>v&&v.trim())
  );

  const TYPE_ORDER = ['SETUP', '4HRS', 'LAST'];
  const getSortedSlotsForDropdown = () => {
    return [...slots].sort((a, b) => {
      const ai = TYPE_ORDER.indexOf(a.type);
      const bi = TYPE_ORDER.indexOf(b.type);
      if (ai !== bi) return ai - bi;
      return a.id - b.id; 
    });
  };

  const handleSubmit = () => {
    if (!step1Done){alert('Step 1 pura karo');return;}
    const allItems=[
      ...filledProducts.map((r,i) =>{
        const parsed = parseSpecTol(r.spec);
        const cleanSpec = parsed.spec || r.spec;
        const tol = r.tolerance ? `± ${r.tolerance}` : parsed.tol;
        return {sr_no:i+1, item:r.name, spec:cleanSpec, tolerance:tol, inst:r.inst};
      }),
      ...filledProcesses.map((r,i)=>{
        const parsed = parseSpecTol(r.spec);
        const cleanSpec = parsed.spec || r.spec;
        const tol = r.tolerance ? r.tolerance : parsed.tol;
        return {sr_no:11+i, item:r.name, spec:cleanSpec, tolerance:tol, inst:r.inst};
      }),
    ];
    const scheduleEntries=[];
    slots.forEach((slot,si)=>{
      const eUp={time_type:slot.type,row_order:0,slot_index:si,operator:operatorName,machine_no:mcNo,date:slot.date||schedDate};
      slot.upVals.forEach((v,i)=>{eUp[`value_${i+1}`]=v||'';});
      scheduleEntries.push(eUp);
      if(!slot.singleRow){
        const eDown={time_type:slot.type,row_order:1,slot_index:si,operator:operatorName,machine_no:mcNo,date:slot.date||schedDate};
        slot.downVals.forEach((v,i)=>{eDown[`value_${i+1}`]=v||'';});
        scheduleEntries.push(eDown);
      }
    });
    onSubmit({partName:header.partName,partNumber:header.partNumber,operationName:header.operationName,customerName:header.customerName,scheduleDate:schedDate,operatorName,mcNo,items:allItems,schedule_entries:scheduleEntries});
  };

  const stepDone = [false, step1Done, isSetupFilled];
  const progress = ((step-1)/1)*100;

  return (
    <div className="wiz-wrap">

      {/* ── Top Bar ── */}
      <div className="wiz-topbar">
        <button onClick={onCancel} className="wiz-back-btn">← Back</button>
        <span className="wiz-topbar-title">📋 Inspection Form</span>
        <div style={{width:60}} />
      </div>

      {/* ── Progress Bar ── */}
      <div className="wiz-progress-wrap">
        <div className="wiz-progress-inner">
          <div className="wiz-progress-track">
            <div className="wiz-progress-fill" style={{width:`${progress}%`}} />
          </div>
          <div className="wiz-steps-row">
            {STEPS.map(s=>(
              <div key={s.id} className={`wiz-step-dot${step===s.id?' active':''}${stepDone[s.id]?' done':''}`}
                onClick={()=>{ if(s.id<step || stepDone[s.id-1] || s.id===1) setStep(s.id); }}>
                <div className="wiz-dot-circle">
                  {stepDone[s.id] ? '✓' : s.icon}
                </div>
                <div className="wiz-dot-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Step Content ── */}
      <div className="wiz-body">

        {/* ════ STEP 1 ════ */}
        {step===1 && (
          <>
          <div className="wiz-card">
            <div className="wiz-card-title">📋 Report Information</div>
            <div className="wiz-grid-2">
              <Field label="Customer" value={header.customerName} onChange={v=>setHeader(p=>({...p,customerName:v}))} options={dbOptions.customers} placeholder={optionsLoading ? 'Loading...' : 'Select customer...'} required />
              <Field label="Part Name" value={header.partName} onChange={v=>setHeader(p=>({...p,partName:v}))} options={dbOptions.part_names} placeholder={optionsLoading ? 'Loading...' : 'Select part...'} required />
              <Field label="Operation" value={header.operationName} onChange={v=>setHeader(p=>({...p,operationName:v}))} options={dbOptions.operations} placeholder={optionsLoading ? 'Loading...' : 'Select operation...'} required />
              {header.customerName && header.partName && header.operationName
                ? (dbOptions.part_numbers.length === 1
                    ? <div style={{display:'flex',flexDirection:'column',gap:4}}>
                        <label className="wiz-label">Part Number <span style={{color:'#e53935'}}>*</span></label>
                        <div style={{padding:'10px 14px',border:'1px solid #ccc',borderRadius:6,background:'#f5f5f5',fontWeight:600,color:'#333'}}>{header.partNumber}</div>
                      </div>
                    : <Field label="Part Number" value={header.partNumber} onChange={v=>setHeader(p=>({...p,partNumber:v}))} options={dbOptions.part_numbers} placeholder="Select number..." required />
                  )
                : null
              }
            </div>
          </div>
          {step1Done && (
            <div className="wiz-card" style={{marginTop:16}}>
              <div className="wiz-card-title">🔍 Inspection Items</div>
              <CombinedTable
                productRows={filledProducts}
                processRows={filledProcesses}
              />
            </div>
          )}
          </>
        )}

        {/* ════ STEP 2 - Schedule ════ */}
        {step===2 && (
          <div className="wiz-card">
            <div className="wiz-card-title">📅 Schedule</div>

            {/* Basic info */}
            <div className="wiz-grid-3" style={{marginBottom:20}}>
              <div className="wiz-field">
                <label className="wiz-label">Date <span style={{color:'#e53935'}}>*</span></label>
                <div className="date-box">
                  <span>{schedDate?schedDate.split('-').reverse().join('/'):'DD/MM/YYYY'}</span>
                  <span>📅</span>
                  <input type="date" value={schedDate} onChange={e=>setSchedDate(e.target.value)} className="date-input-hidden" />
                </div>
              </div>
              <Field label="Operator" required value={operatorName} onChange={setOperatorName} options={OPERATOR_NAMES} placeholder="Select operator..." />
              <Field label="M/C No" required value={mcNo} onChange={setMcNo} options={Array.from({length:23},(_,i)=>String(i+1))} placeholder="Select machine..." />
            </div>

            {/* ── 3 MODERN UI BUTTONS ── */}
            <div style={{display:'flex', gap:14, marginBottom:24, flexWrap:'wrap'}}>
              <button onClick={()=>setSchedModal(schedModal==='add'?null:'add')}
                style={{
                  flex:1, minWidth:120, padding:'14px 10px', borderRadius:12, 
                  border:schedModal==='add'?'2px solid #2563eb':'1px solid #cbd5e1',
                  background: schedModal==='add'?'#eff6ff':'#fff', 
                  color: schedModal==='add'?'#1d4ed8':'#475569',
                  fontWeight:800, fontSize:15, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  boxShadow: schedModal==='add'?'0 4px 12px rgba(37,99,235,0.2)':'0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease', transform: schedModal==='add' ? 'translateY(-2px)' : 'none'
                }}>
                <span style={{fontSize:20}}>➕</span> New Add
              </button>
              
              <button onClick={()=>{ if(slots.filter(s=>s.upVals.some(v=>v&&v.trim())||s.downVals.some(v=>v&&v.trim())).length===0){alert('Pehle kuch fill karo');return;} setSchedModal(schedModal==='update'?null:'update'); setUpdateSlotId(null); }}
                style={{
                  flex:1, minWidth:120, padding:'14px 10px', borderRadius:12, 
                  border:schedModal==='update'?'2px solid #7c3aed':'1px solid #cbd5e1',
                  background: schedModal==='update'?'#f5f3ff':'#fff', 
                  color: schedModal==='update'?'#6d28d9':'#475569',
                  fontWeight:800, fontSize:15, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  boxShadow: schedModal==='update'?'0 4px 12px rgba(124,58,237,0.2)':'0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease', transform: schedModal==='update' ? 'translateY(-2px)' : 'none'
                }}>
                <span style={{fontSize:20}}>✏️</span> Update
              </button>
              
              <button onClick={()=>{ if(slots.filter(s=>s.upVals.some(v=>v&&v.trim())||s.downVals.some(v=>v&&v.trim())).length===0){alert('Koi data nahi hai abhi');return;} setSchedModal(schedModal==='view'?null:'view'); }}
                style={{
                  flex:1, minWidth:120, padding:'14px 10px', borderRadius:12, 
                  border:schedModal==='view'?'2px solid #059669':'1px solid #cbd5e1',
                  background: schedModal==='view'?'#ecfdf5':'#fff', 
                  color: schedModal==='view'?'#047857':'#475569',
                  fontWeight:800, fontSize:15, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  boxShadow: schedModal==='view'?'0 4px 12px rgba(5,150,105,0.2)':'0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease', transform: schedModal==='view' ? 'translateY(-2px)' : 'none'
                }}>
                <span style={{fontSize:20}}>👁️</span> View
              </button>
            </div>

            {/* ── NEW ADD — inline expand ── */}
            {schedModal==='add' && (
              <div style={{position:'relative', background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, padding:'24px', marginBottom:16, boxShadow:'0 10px 25px -5px rgba(0,0,0,0.05)'}}>

                {/* Sleek Top-Right Close Icon */}
                <button onClick={()=>{setSchedModal(null);setModalActiveSlot(null);setModalSlotType('');}}
                  style={{position:'absolute', top:12, right:12, background:'transparent', border:'none', fontSize:20, color:'#94a3b8', cursor:'pointer', width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s ease'}}
                  onMouseOver={(e)=>{e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.color='#334155';}}
                  onMouseOut={(e)=>{e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#94a3b8';}}>
                  ✕
                </button>

                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14, paddingRight:30}}>
                  {/* ── 3 PREMIUM SLEEK BUTTONS (Without Icons) ── */}
                  <div style={{display:'flex',gap:12,width:'100%',flexWrap:'wrap'}}>
                    {[
                      {label:'SETUP', sub:'SETUP', activeBg:'#2563eb', inactiveBg:'#f8fafc'},
                      {label:'4HRS',  sub:'4HRS',  activeBg:'#7c3aed', inactiveBg:'#f8fafc'},
                      {label:'LAST',  sub:'LAST',  activeBg:'#e11d48', inactiveBg:'#f8fafc'},
                    ].map(btn => {
                      const isActive = modalSlotType === btn.sub;
                      return (
                        <button
                          key={btn.sub}
                          onClick={()=>{
                            setModalSlotType(btn.sub);
                            const newSlot={
                              id:nextId,
                              type: btn.sub==='4HRS'?'4HRS':btn.sub,
                              subType:btn.sub,
                              singleRow:true,
                              date:today,
                              upVals:Array(MAX_COLS).fill(''),
                              downVals:Array(MAX_COLS).fill('')
                            };
                            setNextId(p=>p+1);
                            setModalActiveSlot(newSlot);
                          }}
                          style={{
                            flex:1, minWidth:100,
                            padding:'16px 12px',
                            borderRadius:'12px',
                            border: isActive ? `2px solid ${btn.activeBg}` : `1px solid #cbd5e1`,
                            background: isActive ? btn.activeBg : btn.inactiveBg,
                            color: isActive ? '#fff' : '#475569',
                            fontWeight:700,
                            fontSize:'15px',
                            letterSpacing: '0.5px',
                            cursor:'pointer',
                            boxShadow: isActive ? `0 6px 16px ${btn.activeBg}40` : '0 2px 4px rgba(0,0,0,0.02)',
                            transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                            transition:'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}>
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {modalActiveSlot && (
                  <>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,
                      background: modalActiveSlot.type==='SETUP'?'#2563eb':modalActiveSlot.type==='4HRS'?'#7c3aed':'#e11d48',
                      padding:'10px 14px',borderRadius:8,flexWrap:'wrap'}}>
                      <span style={{fontWeight:800,fontSize:15,color:'#fff'}}>{modalActiveSlot.subType||modalActiveSlot.type}</span>
                      <button onClick={()=>setModalActiveSlot(p=>({...p,singleRow:!p.singleRow}))}
                        style={{padding:'3px 10px',borderRadius:6,fontSize:11,fontWeight:700,cursor:'pointer',
                          background:'rgba(255,255,255,0.2)',color:'#fff',border:'1px solid rgba(255,255,255,0.4)'}}>
                        {modalActiveSlot.singleRow?'1 Row':'2 Rows'}
                      </button>
                      <div style={{marginLeft:'auto',display:'flex',gap:6}}>
                        <button onClick={()=>{
                            setSlots(prev=>{
                              const newSlot = modalActiveSlot;
                              const li = [...prev].map(x=>x.type).lastIndexOf(newSlot.type);
                              const at = li>=0 ? li+1 : prev.length;
                              const n = [...prev]; n.splice(at,0,newSlot); return n;
                            });
                            setModalActiveSlot(null);
                            setModalSlotType('');
                            setSchedModal(null);
                          }}
                          style={{padding:'4px 14px',borderRadius:6,border:'none',
                            background:'rgba(255,255,255,0.25)',color:'#fff',fontWeight:800,fontSize:12,cursor:'pointer'}}>
                          ✅ Save
                        </button>
                        <button onClick={()=>{
                            setSlots(prev=>{
                              const newSlot = modalActiveSlot;
                              const li = [...prev].map(x=>x.type).lastIndexOf(newSlot.type);
                              const at = li>=0 ? li+1 : prev.length;
                              const n = [...prev]; n.splice(at,0,newSlot); return n;
                            });
                            const t=modalSlotType;
                            const newSlot={id:nextId,type:(t==='4HRS'||t==='2HRS')?'4HRS':t,subType:t,singleRow:true,date:today,upVals:Array(MAX_COLS).fill(''),downVals:Array(MAX_COLS).fill('')};
                            setNextId(p=>p+1);
                            setModalActiveSlot(newSlot);
                          }}
                          style={{padding:'4px 14px',borderRadius:6,border:'none',
                            background:'rgba(255,255,255,0.25)',color:'#fff',fontWeight:800,fontSize:12,cursor:'pointer'}}>
                          ➕ Add
                        </button>
                      </div>
                    </div>

                    <div style={{overflowX:'auto'}}>
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                        <thead>
                          <tr style={{background:'#f8fafc'}}>
                            <th style={{padding:'8px 12px',textAlign:'left',fontWeight:700,color:'#333',borderBottom:'1px solid #e2e8f0'}}>Column</th>
                            <th style={{padding:'8px 12px',textAlign:'center',fontWeight:700,color:'#555',borderBottom:'1px solid #e2e8f0',minWidth:80}}>Spec</th>
                            <th style={{padding:'8px 12px',textAlign:'center',fontWeight:700,color:'#555',borderBottom:'1px solid #e2e8f0',minWidth:80}}>Tolerance</th>
                            <th style={{padding:'8px 12px',textAlign:'center',fontWeight:700,color:'#555',borderBottom:'1px solid #e2e8f0',minWidth:80}}>Instrument</th>
                            <th style={{padding:'8px 12px',textAlign:'center',fontWeight:700,color:'#1565c0',borderBottom:'1px solid #e2e8f0',minWidth:90}}>Reading 1</th>
                            {!modalActiveSlot.singleRow && <th style={{padding:'8px 12px',textAlign:'center',fontWeight:700,color:'#e65100',borderBottom:'1px solid #e2e8f0',minWidth:90}}>Reading 2</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {colLabels.map(({idx,label,spec,tolerance,inst})=>{
                            const uv=modalActiveSlot.upVals[idx]||'';
                            const dv=modalActiveSlot.downVals[idx]||'';
                            const isNgUp=uv.toUpperCase()==='NG';
                            const isNgDn=dv.toUpperCase()==='NG';
                            return (
                              <tr key={idx} style={{borderBottom:'1px solid #f1f5f9'}}>
                                <td style={{padding:'6px 12px',fontWeight:600,color:'#333'}}>{label}</td>
                                <td style={{padding:'6px 8px',textAlign:'center',color:'#555',fontSize:12}}>{spec||'—'}</td>
                                <td style={{padding:'6px 8px',textAlign:'center',color:'#e65100',fontSize:12,fontWeight:600}}>{tolerance||'—'}</td>
                                <td style={{padding:'6px 8px',textAlign:'center',color:'#1565c0',fontSize:12}}>{inst||'—'}</td>
                                <td style={{padding:'4px 8px',textAlign:'center'}}>
                                  <input type="text" value={uv} placeholder="—"
                                    onChange={e=>setModalActiveSlot(p=>({...p,upVals:p.upVals.map((v,i)=>i===idx?e.target.value:v)}))}
                                    style={{width:'80px',textAlign:'center',padding:'5px 8px',
                                      border:`1px solid ${isNgUp?'#e53935':uv?'#4caf50':'#cbd5e1'}`,
                                      borderRadius:6,fontSize:13,fontWeight:uv?700:400,
                                      background:isNgUp?'#ffebee':uv?'#e8f5e9':'#fff',
                                      color:isNgUp?'#e53935':uv?'#2e7d32':'#333',outline:'none'}}/>
                                </td>
                                {!modalActiveSlot.singleRow && (
                                  <td style={{padding:'4px 8px',textAlign:'center'}}>
                                    <input type="text" value={dv} placeholder="—"
                                      onChange={e=>setModalActiveSlot(p=>({...p,downVals:p.downVals.map((v,i)=>i===idx?e.target.value:v)}))}
                                      style={{width:'80px',textAlign:'center',padding:'5px 8px',
                                        border:`1px solid ${isNgDn?'#e53935':dv?'#ff9800':'#cbd5e1'}`,
                                        borderRadius:6,fontSize:13,fontWeight:dv?700:400,
                                        background:isNgDn?'#ffebee':dv?'#fff3e0':'#fff',
                                        color:isNgDn?'#e53935':dv?'#e65100':'#333',outline:'none'}}/>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── UPDATE — inline expand ── */}
            {schedModal==='update' && (
              <div style={{position:'relative', background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, padding:'24px', marginBottom:16, boxShadow:'0 10px 25px -5px rgba(0,0,0,0.05)'}}>

                <button onClick={()=>{setSchedModal(null);setUpdateSlotId(null);}}
                  style={{position:'absolute', top:12, right:12, background:'transparent', border:'none', fontSize:20, color:'#94a3b8', cursor:'pointer', width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s ease'}}
                  onMouseOver={(e)=>{e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.color='#334155';}}
                  onMouseOut={(e)=>{e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#94a3b8';}}>
                  ✕
                </button>

                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14, paddingRight:30}}>
                  <select
                    value={updateSlotId ? String(updateSlotId) : ''}
                    onChange={e=>{
                      if(!e.target.value){setUpdateSlotId(null);return;}
                      setUpdateSlotId(Number(e.target.value));
                    }}
                    style={{flex:1,padding:'12px 14px',borderRadius:8,border:'1px solid #cbd5e1',
                      background:'#f8fafc',fontWeight:600,fontSize:14,cursor:'pointer',color:'#334155',outline:'none'}}>
                    <option value="">-- Select Saved Slot to Edit --</option>
                    {(()=>{
                      const typeCount={};
                      slots.forEach(s=>{typeCount[s.type]=(typeCount[s.type]||0)+1;});
                      const typeIdx={};
                      const sortedSlots = getSortedSlotsForDropdown();
                      return sortedSlots.map(s=>{
                        typeIdx[s.type]=(typeIdx[s.type]||0)+1;
                        const label=typeCount[s.type]>1
                          ? `${s.subType||s.type} #${typeIdx[s.type]}`
                          : (s.subType||s.type);
                        const cnt=s.upVals.filter(v=>v&&v.trim()).length+s.downVals.filter(v=>v&&v.trim()).length;
                        return (
                          <option key={s.id} value={String(s.id)}>
                            {label}{cnt>0?` ✓ ${cnt} filled`:' (Empty)'}
                          </option>
                        );
                      });
                    })()}
                  </select>
                </div>

                {updateSlotId && (()=>{
                  const s=slots.find(x=>x.id===updateSlotId);
                  if(!s) return null;
                  const cfg={SETUP:'#2563eb','4HRS':'#7c3aed',LAST:'#e11d48'};
                  const color=cfg[s.type]||'#333';
                  return (
                    <>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,
                        background:color,padding:'10px 14px',borderRadius:8,flexWrap:'wrap'}}>
                        <span style={{fontWeight:800,fontSize:15,color:'#fff'}}>{s.subType||s.type}</span>
                        <button onClick={()=>toggleRows(s.id)}
                          style={{padding:'3px 10px',borderRadius:6,fontSize:11,fontWeight:700,cursor:'pointer',
                            background:'rgba(255,255,255,0.2)',color:'#fff',border:'1px solid rgba(255,255,255,0.4)'}}>
                          {s.singleRow?'1 Row':'2 Rows'}
                        </button>
                        <button onClick={()=>{setSchedModal(null);setUpdateSlotId(null);}}
                          style={{marginLeft:'auto',padding:'4px 14px',borderRadius:6,border:'none',
                            background:'rgba(255,255,255,0.25)',color:'#fff',fontWeight:800,fontSize:12,cursor:'pointer'}}>
                          ✅ Done
                        </button>
                      </div>
                      <div style={{overflowX:'auto'}}>
                        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                          <thead>
                            <tr style={{background:'#f8fafc'}}>
                              <th style={{padding:'8px 12px',textAlign:'left',fontWeight:700,color:'#333',borderBottom:'1px solid #e2e8f0'}}>Column</th>
                              <th style={{padding:'8px 12px',textAlign:'center',fontWeight:700,color:'#555',borderBottom:'1px solid #e2e8f0',minWidth:80}}>Spec</th>
                              <th style={{padding:'8px 12px',textAlign:'center',fontWeight:700,color:'#555',borderBottom:'1px solid #e2e8f0',minWidth:80}}>Tolerance</th>
                              <th style={{padding:'8px 12px',textAlign:'center',fontWeight:700,color:'#555',borderBottom:'1px solid #e2e8f0',minWidth:80}}>Instrument</th>
                              <th style={{padding:'8px 12px',textAlign:'center',fontWeight:700,color:'#1565c0',borderBottom:'1px solid #e2e8f0',minWidth:90}}>Reading 1</th>
                              {!s.singleRow && <th style={{padding:'8px 12px',textAlign:'center',fontWeight:700,color:'#e65100',borderBottom:'1px solid #e2e8f0',minWidth:90}}>Reading 2</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {colLabels.map(({idx,label,spec,tolerance,inst})=>{
                              const uv=s.upVals[idx]||'';
                              const dv=s.downVals[idx]||'';
                              const isNgUp=uv.toUpperCase()==='NG';
                              const isNgDn=dv.toUpperCase()==='NG';
                              return (
                                <tr key={idx} style={{borderBottom:'1px solid #f1f5f9'}}>
                                  <td style={{padding:'6px 12px',fontWeight:600,color:'#333'}}>{label}</td>
                                  <td style={{padding:'6px 8px',textAlign:'center',color:'#555',fontSize:12}}>{spec||'—'}</td>
                                  <td style={{padding:'6px 8px',textAlign:'center',color:'#e65100',fontSize:12,fontWeight:600}}>{tolerance||'—'}</td>
                                  <td style={{padding:'6px 8px',textAlign:'center',color:'#1565c0',fontSize:12}}>{inst||'—'}</td>
                                  <td style={{padding:'4px 8px',textAlign:'center'}}>
                                    <input type="text" value={uv} placeholder="—"
                                      onChange={e=>setVal(s.id,'up',idx,e.target.value)}
                                      style={{width:'80px',textAlign:'center',padding:'5px 8px',
                                        border:`1px solid ${isNgUp?'#e53935':uv?'#4caf50':'#cbd5e1'}`,
                                        borderRadius:6,fontSize:13,fontWeight:uv?700:400,
                                        background:isNgUp?'#ffebee':uv?'#e8f5e9':'#fff',
                                        color:isNgUp?'#e53935':uv?'#2e7d32':'#333',outline:'none'}}/>
                                  </td>
                                  {!s.singleRow && (
                                    <td style={{padding:'4px 8px',textAlign:'center'}}>
                                      <input type="text" value={dv} placeholder="—"
                                        onChange={e=>setVal(s.id,'down',idx,e.target.value)}
                                        style={{width:'80px',textAlign:'center',padding:'5px 8px',
                                          border:`1px solid ${isNgDn?'#e53935':dv?'#ff9800':'#cbd5e1'}`,
                                          borderRadius:6,fontSize:13,fontWeight:dv?700:400,
                                          background:isNgDn?'#ffebee':dv?'#fff3e0':'#fff',
                                          color:isNgDn?'#e53935':dv?'#e65100':'#333',outline:'none'}}/>
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* ── VIEW — inline expand ── */}
            {schedModal==='view' && (
              <div style={{position:'relative', background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, padding:'24px', marginBottom:16, boxShadow:'0 10px 25px -5px rgba(0,0,0,0.05)'}}>
                
                <button onClick={()=>setSchedModal(null)}
                  style={{position:'absolute', top:12, right:12, background:'transparent', border:'none', fontSize:20, color:'#94a3b8', cursor:'pointer', width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s ease'}}
                  onMouseOver={(e)=>{e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.color='#334155';}}
                  onMouseOut={(e)=>{e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#94a3b8';}}>
                  ✕
                </button>

                <div style={{fontWeight:800,fontSize:16,marginBottom:14,color:'#334155', paddingRight:30}}>All Completed Entries</div>
                {slots.filter(s=>s.upVals.some(v=>v&&v.trim())||s.downVals.some(v=>v&&v.trim())).map(s=>{
                  const cfg={SETUP:'#2563eb','4HRS':'#7c3aed',LAST:'#e11d48'};
                  const color=cfg[s.type]||'#333';
                  return (
                    <div key={s.id} style={{marginBottom:16,border:`1px solid ${color}33`,borderRadius:10,overflow:'hidden'}}>
                      <div style={{background:color,padding:'8px 14px',color:'#fff',fontWeight:800,fontSize:14}}>{s.subType||s.type}</div>
                      <div style={{overflowX:'auto'}}>
                        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                          <thead>
                            <tr style={{background:'#f8fafc'}}>
                              <th style={{padding:'7px 12px',textAlign:'left',fontWeight:700,color:'#333',borderBottom:'1px solid #e2e8f0'}}>Column</th>
                              <th style={{padding:'7px 12px',textAlign:'center',fontWeight:700,color:'#1565c0',borderBottom:'1px solid #e2e8f0'}}>Reading 1</th>
                              {!s.singleRow && <th style={{padding:'7px 12px',textAlign:'center',fontWeight:700,color:'#e65100',borderBottom:'1px solid #e2e8f0'}}>Reading 2</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {colLabels.map(({idx,label})=>{
                              const uv=s.upVals[idx]||'—';
                              const dv=s.downVals[idx]||'—';
                              return (
                                <tr key={idx} style={{borderBottom:'1px solid #f1f5f9'}}>
                                  <td style={{padding:'6px 12px',fontWeight:600,color:'#333'}}>{label}</td>
                                  <td style={{padding:'6px 12px',textAlign:'center',color:uv==='NG'?'#e53935':uv!=='—'?'#2e7d32':'#aaa',fontWeight:uv!=='—'?700:400}}>{uv}</td>
                                  {!s.singleRow && <td style={{padding:'6px 12px',textAlign:'center',color:dv==='NG'?'#e53935':dv!=='—'?'#e65100':'#aaa',fontWeight:dv!=='—'?700:400}}>{dv}</td>}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}
      </div>

      {/* ── Bottom Nav ── */}
      <div className="wiz-footer">
        {step>1
          ? <button onClick={()=>setStep(s=>s-1)} className="wiz-btn-back">← Back</button>
          : <button onClick={onCancel} className="wiz-btn-back">Cancel</button>
        }
        {step<2
          ? <button onClick={()=>setStep(s=>s+1)}
              disabled={step===1&&!step1Done}
              className={`wiz-btn-next${(step===1&&!step1Done)?' disabled':''}`}>
              Next →
            </button>
          : <button onClick={handleSubmit} className="wiz-btn-save">✅ Save</button>
        }
      </div>

    </div>
  );
};

export default Form;