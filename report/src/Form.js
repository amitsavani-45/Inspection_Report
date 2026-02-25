import React, { useState, useEffect } from 'react';
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

const STEPS = [
  { id:1, label:'Report',     icon:'📋' },
  { id:2, label:'Inspection', icon:'🔍' },
  { id:3, label:'Schedule',   icon:'📅' },
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
const InspItem = ({ row, onUpdate, srNum, isProduct, onRemove }) => {
  const [spec, setSpec] = useState(row.spec || '');
  useEffect(() => setSpec(row.spec || ''), [row.spec]);
  const color  = isProduct ? '#1976d2' : '#e65100';
  const items  = isProduct ? PRODUCT_ITEMS : PROCESS_ITEMS;
  const tols   = isProduct
    ? TOLERANCES.map(t => ({ v:t, l:`± ${t}` }))
    : PROCESS_TOLERANCES.map(t => ({ v:t, l: t==='MIN'||t==='MAX' ? t : `± ${t}` }));
  const filled = !!(row.name && row.spec && row.tolerance && row.inst);

  return (
    <div className={`insp-row${filled?' done':''}`} style={{borderLeftColor: filled?'#4CAF50':color}}>
      <div className="insp-sr" style={{background:color}}>{srNum}</div>
      <div className="insp-fields">
        <select value={row.name} onChange={e=>onUpdate('name',e.target.value)} className="insp-select">
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

/* ── Inspection Preview Table ── */
const PreviewTable = ({ rows, color, startSr, onRemove }) => (
  <>
    {/* Desktop table */}
    <div className="prev-table-wrap">
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
        <thead>
          <tr style={{background:'#f5f5f5',borderBottom:'2px solid #e0e0e0'}}>
            <th className="prev-th" style={{width:40}}>SR</th>
            <th className="prev-th" style={{textAlign:'left'}}>Item</th>
            <th className="prev-th">Spec</th>
            <th className="prev-th">Tolerance</th>
            <th className="prev-th">Inst</th>
            <th style={{width:32}}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row,i)=>(
            <tr key={i} style={{borderBottom:'1px solid #f0f0f0',background:i%2===0?'white':'#fafafa'}}>
              <td className="prev-td" style={{textAlign:'center',fontWeight:700,color}}>{startSr+i}</td>
              <td className="prev-td" style={{fontWeight:600,color:'#222'}}>{row.name}</td>
              <td className="prev-td" style={{textAlign:'center',color:'#555'}}>{row.spec}</td>
              <td className="prev-td" style={{textAlign:'center',color:'#555'}}>± {row.tolerance}</td>
              <td className="prev-td" style={{textAlign:'center',color:'#555'}}>{row.inst}</td>
              <td style={{textAlign:'center',padding:'4px'}}>
                <button onClick={()=>onRemove(i)} style={{background:'none',border:'none',color:'#e53935',cursor:'pointer',fontSize:16,fontWeight:700}}>✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {/* Mobile cards */}
    <div className="prev-cards-wrap">
      {rows.map((row,i)=>(
        <div key={i} className="prev-card">
          <div className="prev-card-sr" style={{background:color}}>{startSr+i}</div>
          <div className="prev-card-info">
            <div className="prev-card-name">{row.name}</div>
            <div className="prev-card-meta">
              <span>{row.spec}</span>
              <span>± {row.tolerance}</span>
              <span>{row.inst}</span>
            </div>
          </div>
          <button onClick={()=>onRemove(i)} className="insp-preview-del">✕</button>
        </div>
      ))}
    </div>
  </>
);

/* ── Slot Value Entry ── */
const SlotValueEntry = ({ slot, colLabels, setVal }) => {
  const [selectedIdx, setSelectedIdx] = React.useState('');
  if (colLabels.length===0) return (
    <div style={{padding:'20px',textAlign:'center',color:'#aaa',fontSize:13}}>
      Pehle Step 2 mein inspection items add karo
    </div>
  );

  const filledIdxs = colLabels.filter(({idx})=>slot.upVals[idx]||slot.downVals[idx]).map(c=>c.idx);
  const unfilledCols = colLabels.filter(({idx})=>!slot.upVals[idx]&&!slot.downVals[idx]);
  const allFilled = unfilledCols.length === 0;
  const handleAdd = () => {
    if (selectedIdx==='') return;
    const next = colLabels.find(({idx})=>idx!==Number(selectedIdx)&&!slot.upVals[idx]&&!slot.downVals[idx]);
    setSelectedIdx(next ? String(next.idx) : '');
  };
  const upVal = selectedIdx!=='' ? slot.upVals[Number(selectedIdx)]||'' : '';
  const dnVal = selectedIdx!=='' ? slot.downVals[Number(selectedIdx)]||'' : '';

  return (
    <div style={{padding:'12px'}}>
      {/* Input area — sirf tab dikhao jab unfilled columns baaki hon */}
      {allFilled && (
        <div style={{padding:'10px 0 6px',textAlign:'center',color:'#4CAF50',fontWeight:700,fontSize:13}}>
          ✅ Saare columns fill ho gaye!
        </div>
      )}
      {!allFilled && <div className="slot-add-row">
        <div className="slot-add-col" style={{flex:2}}>
          <div className="slot-add-label" style={{color:'#7b1fa2'}}>Column</div>
          <select value={selectedIdx} onChange={e=>setSelectedIdx(e.target.value)} className="slot-select">
            <option value="">Select column...</option>
            {colLabels.filter(({idx})=>!slot.upVals[idx]&&!slot.downVals[idx]).map(({idx,label})=>(
              <option key={idx} value={idx}>{label}</option>
            ))}
          </select>
        </div>
        <div className="slot-add-col">
          <div className="slot-add-label" style={{color:'#1565c0'}}>⬆ UP</div>
          <input type="text" value={upVal} placeholder="—" className="slot-input"
            onChange={e=>selectedIdx!==''&&setVal(slot.id,'up',Number(selectedIdx),e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleAdd()} />
        </div>
        {!slot.singleRow && (
          <div className="slot-add-col">
            <div className="slot-add-label" style={{color:'#e65100'}}>⬇ DOWN</div>
            <input type="text" value={dnVal} placeholder="—" className="slot-input"
              onChange={e=>selectedIdx!==''&&setVal(slot.id,'down',Number(selectedIdx),e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleAdd()} />
          </div>
        )}
        <button onClick={handleAdd} className="slot-add-btn">+ Add</button>
      </div>}

      {/* Filled table */}
      {filledIdxs.length>0 && (
        <div className="slot-table-wrap">
          <table className="slot-table">
            <thead>
              <tr>
                <th style={{textAlign:'left'}}>Column</th>
                <th style={{color:'#1565c0'}}>⬆ UP</th>
                {!slot.singleRow && <th style={{color:'#e65100'}}>⬇ DOWN</th>}
                <th style={{width:28}}></th>
              </tr>
            </thead>
            <tbody>
              {filledIdxs.map(idx=>{
                const col=colLabels.find(c=>c.idx===idx);
                const uv=slot.upVals[idx]||'';
                const dv=slot.downVals[idx]||'';
                return (
                  <tr key={idx}>
                    <td>{col?.label}</td>
                    <td className={`sv ${uv==='NG'?'ng':'ok'}`}>{uv||'—'}</td>
                    {!slot.singleRow && <td className={`sv ${dv==='NG'?'ng':'dn'}`}>{dv||'—'}</td>}
                    <td style={{textAlign:'center'}}>
                      <button onClick={()=>{setVal(slot.id,'up',idx,'');setVal(slot.id,'down',idx,'');}}
                        style={{background:'none',border:'none',color:'#e53935',cursor:'pointer',fontSize:13,fontWeight:700}}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════
   MAIN FORM — WIZARD
══════════════════════════════════════ */
const Form = ({ onSubmit, onCancel, initialData={}, items=[] }) => {
  const [step, setStep] = useState(1);

  /* Step 1 */
  const [header, setHeader] = useState({
    partName:      initialData.part_name      || '',
    partNumber:    initialData.part_number    || '',
    operationName: initialData.operation_name || '',
    customerName:  initialData.customer_name  || '',
  });
  const step1Done = !!(header.partName && header.partNumber && header.operationName && header.customerName);

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
  const updateRow = (setter, rows, i, field, val) => {
    setter(prev => {
      const updated = prev.map((r,j)=>j===i?{...r,[field]:val}:r);
      const isLast = i===updated.length-1;
      const cur = updated[i];
      if (isLast&&cur.name&&cur.spec&&cur.tolerance&&cur.inst&&updated.length<10)
        return [...updated,emptyRow()];
      return updated;
    });
  };
  const removeRow = (setter, rows, i) => {
    const updated = rows.filter((_,j)=>j!==i);
    setter(updated.length ? updated : [emptyRow()]);
  };
  const filledProducts  = productRows.filter(r=>r.name&&r.spec&&r.tolerance&&r.inst);
  const filledProcesses = processRows.filter(r=>r.name&&r.spec&&r.tolerance&&r.inst);
  const step2Done = filledProducts.length>0 || filledProcesses.length>0;
  const [inspType, setInspType] = useState(''); // 'product' | 'process'

  /* Step 3 */
  const [schedDate,    setSchedDate]   = useState(initialData.date||new Date().toISOString().split('T')[0]);
  const existingEntries = initialData.schedule_entries||[];
  const firstEntry = existingEntries[0]||{};
  const [operatorName, setOperatorName] = useState(firstEntry.operator||'');
  const [mcNo,         setMcNo]         = useState(firstEntry.machine_no||'');
  const [schedExpanded, setSchedExpanded] = useState(false);

  const makeSlot = (id,type) => ({id,type,singleRow:true,upVals:Array(MAX_COLS).fill(''),downVals:Array(MAX_COLS).fill('')});
  const buildInitialSlots = () => {
    if (!existingEntries.length) return [makeSlot(1,'SETUP')];
    const map={};
    existingEntries.forEach(e=>{
      const k=e.slot_index??0;
      if (!map[k]) map[k]={id:k+1,type:e.time_type||'SETUP',singleRow:true,upVals:Array(MAX_COLS).fill(''),downVals:Array(MAX_COLS).fill('')};
      const vals=Array(MAX_COLS).fill('');
      for(let i=0;i<MAX_COLS;i++) vals[i]=e[`value_${i+1}`]||'';
      if (e.row_order===0){map[k].upVals=vals;}
      else{map[k].downVals=vals;map[k].singleRow=false;}
    });
    const r=Object.values(map).sort((a,b)=>a.id-b.id);
    return r.length?r:[makeSlot(1,'SETUP')];
  };
  const initSlots = buildInitialSlots();
  const [slots,        setSlots]        = useState(initSlots);
  const [nextId,       setNextId]       = useState(initSlots.length+1);
  const [activeSlotId, setActiveSlotId] = useState(initSlots[0]?.id??1);

  const addSlot = (type) => {
    const s=makeSlot(nextId,type);
    setSlots(prev=>{
      if(type==='SETUP'){const li=prev.map(x=>x.type).lastIndexOf('SETUP');const at=li>=0?li+1:0;const n=[...prev];n.splice(at,0,s);return n;}
      return [...prev,s];
    });
    setNextId(p=>p+1); setActiveSlotId(s.id);
  };
  const removeSlot = (id) => {setSlots(p=>p.filter(s=>s.id!==id));if(activeSlotId===id)setActiveSlotId(null);};
  const toggleRows  = (id) => setSlots(p=>p.map(s=>s.id===id?{...s,singleRow:!s.singleRow}:s));
  const setVal = (slotId,row,idx,val) =>
    setSlots(p=>p.map(s=>s.id===slotId
      ?{...s,[row==='up'?'upVals':'downVals']:s[row==='up'?'upVals':'downVals'].map((v,i)=>i===idx?val:v)}:s));

  const colLabels = [
    ...filledProducts.map((r,i)  =>({idx:i,                     label:`${i+1}. ${r.name}`})),
    ...filledProcesses.map((r,i) =>({idx:filledProducts.length+i,label:`${filledProducts.length+i+1}. ${r.name}`})),
  ].slice(0,MAX_COLS);

  const activeSlot    = slots.find(s=>s.id===activeSlotId)||null;
  const setupSlot     = slots.find(s=>s.type==='SETUP');
  const isSetupFilled = setupSlot ? setupSlot.upVals.filter(v=>v&&v.trim()).length+setupSlot.downVals.filter(v=>v&&v.trim()).length>0 : false;
  const slotTypes     = slots.map(s=>s.type);
  const pendingTypes  = PENDING_SLOT_TYPES.filter(t=>!slotTypes.includes(t));
  const addedTypes    = PENDING_SLOT_TYPES.filter(t=>slotTypes.includes(t));

  const handleSubmit = () => {
    if (!step1Done){alert('Step 1 pura karo');return;}
    const allItems=[
      ...filledProducts.map((r,i) =>({sr_no:i+1, item:r.name,spec:r.spec,tolerance:`± ${r.tolerance}`,inst:r.inst})),
      ...filledProcesses.map((r,i)=>({sr_no:11+i,item:r.name,spec:r.spec,tolerance:r.tolerance,inst:r.inst})),
    ];
    const scheduleEntries=[];
    slots.forEach((slot,si)=>{
      if(slot.singleRow){
        const e={time_type:slot.type,row_order:0,slot_index:si,operator:operatorName,machine_no:mcNo,date:schedDate};
        slot.upVals.forEach((v,i)=>{e[`value_${i+1}`]=v||'';});
        scheduleEntries.push(e);
      } else {
        ['upVals','downVals'].forEach((key,ri)=>{
          const e={time_type:slot.type,row_order:ri,slot_index:si,operator:operatorName,machine_no:mcNo,date:schedDate};
          slot[key].forEach((v,i)=>{e[`value_${i+1}`]=v||'';});
          scheduleEntries.push(e);
        });
      }
    });
    onSubmit({partName:header.partName,partNumber:header.partNumber,operationName:header.operationName,customerName:header.customerName,scheduleDate:schedDate,operatorName,mcNo,items:allItems,schedule_entries:scheduleEntries});
  };

  const stepDone = [false, step1Done, step2Done, isSetupFilled];
  const progress = ((step-1)/2)*100;

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

      {/* ── Step Content ── */}
      <div className="wiz-body">

        {/* ════ STEP 1 ════ */}
        {step===1 && (
          <div className="wiz-card">
            <div className="wiz-card-title">📋 Report Information</div>
            <div className="wiz-grid-2">
              <Field label="Part Name" required value={header.partName} onChange={v=>setHeader(p=>({...p,partName:v}))} options={PART_NAMES} placeholder="Select part..." />
              <Field label="Part Number" required value={header.partNumber} onChange={v=>setHeader(p=>({...p,partNumber:v}))} options={PART_NUMBERS} placeholder="Select number..." />
              <Field label="Operation" required value={header.operationName} onChange={v=>setHeader(p=>({...p,operationName:v}))} options={OPERATIONS} placeholder="Select operation..." />
              <Field label="Customer" required value={header.customerName} onChange={v=>setHeader(p=>({...p,customerName:v}))} options={CUSTOMER_NAMES} placeholder="Select customer..." />
            </div>
          </div>
        )}

        {/* ════ STEP 2 ════ */}
        {step===2 && (
          <div className="wiz-card">
            <div className="wiz-card-title">🔍 Inspection Items</div>

            {/* Type dropdown */}
            <div className="wiz-field" style={{marginBottom:16}}>
              <label className="wiz-label">Item Type select karo</label>
              <select value={inspType} onChange={e=>setInspType(e.target.value)}
                className={`wiz-select${inspType?' filled':''}`}>
                <option value="">-- Select Type --</option>
                <option value="product">📦 Product Items{filledProducts.length>0?` (${filledProducts.length} added)`:''}</option>
                <option value="process">⚙️ Process Items{filledProcesses.length>0?` (${filledProcesses.length} added)`:''}</option>
              </select>
            </div>

            {/* Product section */}
            {inspType==='product' && (
              <div>
                {/* New entry row */}
                {filledProducts.length < 10 && (()=>{
                  const lastRow = productRows[productRows.length-1];
                  const lastIdx = productRows.length-1;
                  return (
                    <div style={{marginBottom:14}}>
                      <div style={{fontSize:11,fontWeight:700,color:'#1976d2',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.5px'}}>+ New Product Item</div>
                      <InspItem row={lastRow} srNum={filledProducts.length+1} isProduct={true}
                        onUpdate={(f,v)=>updateRow(setProductRows,productRows,lastIdx,f,v)}
                        onRemove={null} />
                    </div>
                  );
                })()}

                {/* Preview table */}
                {filledProducts.length>0 && (
                  <div className="insp-preview-table">
                    <PreviewTable rows={filledProducts} color="#1976d2" startSr={1}
                      onRemove={i=>removeRow(setProductRows,productRows,productRows.findIndex(r=>r===filledProducts[i]))} />
                  </div>
                )}
              </div>
            )}

            {/* Process section */}
            {inspType==='process' && (
              <div>
                {/* New entry row */}
                {filledProcesses.length < 10 && (()=>{
                  const lastRow = processRows[processRows.length-1];
                  const lastIdx = processRows.length-1;
                  return (
                    <div style={{marginBottom:14}}>
                      <div style={{fontSize:11,fontWeight:700,color:'#e65100',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.5px'}}>+ New Process Item</div>
                      <InspItem row={lastRow} srNum={filledProducts.length+filledProcesses.length+1} isProduct={false}
                        onUpdate={(f,v)=>updateRow(setProcessRows,processRows,lastIdx,f,v)}
                        onRemove={null} />
                    </div>
                  );
                })()}

                {/* Preview table */}
                {filledProcesses.length>0 && (
                  <div className="insp-preview-table">
                    <PreviewTable rows={filledProcesses} color="#e65100" startSr={filledProducts.length+1}
                      onRemove={i=>removeRow(setProcessRows,processRows,processRows.findIndex(r=>r===filledProcesses[i]))} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ════ STEP 3 ════ */}
        {step===3 && (
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

            {/* SETUP done banner — UPAR, always visible when done */}
            {isSetupFilled && (
              <div className="setup-done-banner" style={{marginBottom:16}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:18}}>✅</span>
                    <div>
                      <div style={{fontWeight:700,fontSize:13,color:'#2e7d32'}}>SETUP Complete!</div>
                      <div style={{fontSize:11,color:'#388e3c',marginTop:2}}>
                        {addedTypes.map(t=>(
                          <span key={t} style={{marginRight:8}}>✓ {t}</span>
                        ))}
                        {pendingTypes.map(t=>(
                          <span key={t} style={{color:'#e65100',marginRight:8}}>⏳ {t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button onClick={()=>setSchedExpanded(p=>!p)} className="slot-toggle-btn"
                    style={{background: schedExpanded?'#c8e6c9':'#2e7d32',border:'none',color:'white',padding:'8px 16px',borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer'}}>
                    {schedExpanded ? '▲ Close' : '✏️ Edit / Add Slots'}
                  </button>
                </div>
              </div>
            )}

            {/* Slot section — show always if not setup, else show only when expanded */}
            {(!isSetupFilled || schedExpanded) && (
              <div>
                {/* Slot tabs */}
                <div style={{marginBottom:8}}>
                  <div style={{fontSize:12,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:10}}>Time Slots</div>
                  <div className="slot-tabs">
                    {slots.map((slot,i)=>{
                      const isActive=slot.id===activeSlotId;
                      const cnt=slot.upVals.filter(v=>v&&v.trim()).length+slot.downVals.filter(v=>v&&v.trim()).length;
                      return (
                        <button key={slot.id} onClick={()=>setActiveSlotId(slot.id)}
                          className={`slot-tab${isActive?' active':''}${cnt>0&&!isActive?' filled':''}`}>
                          {slot.type}
                          {cnt>0&&!isActive&&<span className="slot-tab-cnt">✓{cnt}</span>}
                          {isActive&&<button onClick={e=>{e.stopPropagation();toggleRows(slot.id);}} className="slot-tab-toggle">
                            {slot.singleRow?'1L':'2L'}
                          </button>}
                          {slots.length>1&&<span onClick={e=>{e.stopPropagation();removeSlot(slot.id);}} className="slot-tab-remove">×</span>}
                        </button>
                      );
                    })}
                    <select value="" onChange={e=>{if(!e.target.value)return;addSlot(e.target.value);}} className="slot-add-select">
                      <option value="">+ Add Slot</option>
                      {TIME_TYPE_OPTIONS.map(t=>(
                        <option key={t} value={t} disabled={t!=='SETUP'&&!isSetupFilled}>
                          {t}{t!=='SETUP'&&!isSetupFilled?' 🔒':''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Active slot entry */}
                {activeSlot && (
                  <div className="slot-entry-card">
                    <div className="slot-entry-head">
                      <span>✏️ {activeSlot.type} — {activeSlot.singleRow?'Single Row':'UP + DOWN'}</span>
                      <button onClick={()=>toggleRows(activeSlot.id)} className="slot-toggle-btn">
                        {activeSlot.singleRow?'2 Lines':'1 Line'}
                      </button>
                    </div>
                    <SlotValueEntry slot={activeSlot} colLabels={colLabels} setVal={setVal} />
                  </div>
                )}
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
        {step<3
          ? <button onClick={()=>setStep(s=>s+1)}
              disabled={step===1&&!step1Done || step===2&&!step2Done}
              className={`wiz-btn-next${(step===1&&!step1Done)||(step===2&&!step2Done)?' disabled':''}`}>
              Next →
            </button>
          : <button onClick={handleSubmit} className="wiz-btn-save">✅ Save</button>
        }
      </div>

    </div>
  );
};

export default Form;