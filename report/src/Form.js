import React, { useState, useEffect } from 'react';
import './Form.css';
import { getDropdownOptions } from './services/api';

const parseSpecTol = (raw = '') => {
  if (!raw) return { spec: '', tol: '' };
  let m = raw.match(/^([\d.]+)\s*(\+[\d.]+\s*\/\s*-[\d.]+\s*MM)\s*$/i);
  if (m) return { spec: m[1].trim(), tol: m[2].trim() };
  m = raw.match(/^([\d.]+)\s*(\+\s*[\d.]+\s*MM)\s*$/i);
  if (m) return { spec: m[1].trim(), tol: m[2].trim() };
  m = raw.match(/^([\d.]+)\s*(±\s*[\d.]+\s*MM)\s*$/i);
  if (m) return { spec: m[1].trim(), tol: m[2].trim() };
  return { spec: raw.trim(), tol: '' };
};

const fetchInspectionItems = async (operation) => {
  try {
    const response = await fetch(`http://localhost:8000/api/inspection-items/?operation=${encodeURIComponent(operation)}`);
    return await response.json();
  } catch (err) {
    console.error('Inspection items fetch failed:', err);
    return { product: [], process: [] };
  }
};

const OPERATOR_NAMES = ['ALEX','RAHUL SHARMA','SURESH KUMAR','RAMESH PATEL','DINESH VERMA','MAHESH YADAV','PRAKASH SINGH','VIJAY KUMAR','ANIL GUPTA','RAJU MEHTA','SANJAY JOSHI','DEEPAK NAIR','RAKESH TIWARI','MOHAN DAS','GANESH RAO'];
const MAX_COLS = 20;
const emptyRow = () => ({ name:'', spec:'', tolerance:'', inst:'' });

const STEPS = [
  { id:1, label:'Report',     icon:'📋' },
  { id:2, label:'Schedule',   icon:'📅' },
];

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

/* ══════════════════════════════════════
   MAIN FORM — WIZARD
══════════════════════════════════════ */
const Form = ({ onSubmit, onCancel, initialData={}, items=[] }) => {
  const [step, setStep] = useState(1);
  const [dbOptions, setDbOptions] = useState({ customers: [], part_names: [], part_numbers: [], operations: [] });
  const [optionsLoading, setOptionsLoading] = useState(true);

  useEffect(() => {
    getDropdownOptions().then(data => {
        setDbOptions(data);
        setOptionsLoading(false);
        if (data.part_numbers && data.part_numbers.length === 1) {
          setHeader(p => ({...p, partNumber: data.part_numbers[0]}));
        }
      }).catch(err => {
        console.error('Dropdown options fetch failed:', err);
        setOptionsLoading(false);
      });
  }, []);

  const [header, setHeader] = useState({
    customerName:  initialData.customer_name  || '',
    partName:      initialData.part_name      || '',
    operationName: initialData.operation_name || '',
    partNumber:    initialData.part_number    || '',
  });
  const step1Done = !!(header.customerName && header.partName && header.operationName && header.partNumber);

  const existingProducts  = items.filter(i=>i.sr_no<=10);
  const existingProcesses = items.filter(i=>i.sr_no>=11);
  const [productRows, setProductRows] = useState(
    existingProducts.length>0 ? existingProducts.map(r=>({name:r.item||'',spec:r.spec||'',tolerance:r.tolerance?.replace('± ','')||'',inst:r.inst||''})) : [emptyRow()]
  );
  const [processRows, setProcessRows] = useState(
    existingProcesses.length>0 ? existingProcesses.map(r=>({name:r.item||'',spec:r.spec||'',tolerance:r.tolerance||'',inst:r.inst||''})) : [emptyRow()]
  );

  useEffect(() => {
    if (!header.operationName) return;
    fetchInspectionItems(header.operationName).then(data => {
      if (data.product?.length) setProductRows([...data.product.map(item => ({name: item.name || '', spec: item.spec || '', tolerance: item.tolerance || '', inst: item.instrument || ''})), emptyRow()]);
      else setProductRows([emptyRow()]);
      
      if (data.process?.length) setProcessRows([...data.process.map(item => ({name: item.name || '', spec: item.spec || '', tolerance: item.tolerance || '', inst: item.instrument || ''})), emptyRow()]);
      else setProcessRows([emptyRow()]);
    });
  }, [header.operationName]);

  const filledProducts  = productRows.filter(r=>r.name&&r.spec&&r.inst);
  const filledProcesses = processRows.filter(r=>r.name&&r.spec&&r.inst);

  const [schedDate, setSchedDate] = useState(initialData.date||new Date().toISOString().split('T')[0]);
  const [operatorName, setOperatorName] = useState(initialData.schedule_entries?.[0]?.operator||'');
  const [mcNo, setMcNo] = useState(initialData.schedule_entries?.[0]?.machine_no||'');
  
  const today = new Date().toISOString().split('T')[0];
  const [slots, setSlots] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [schedModal, setSchedModal] = useState(null);
  const [modalActiveSlot, setModalActiveSlot] = useState(null);
  const [modalSlotType, setModalSlotType] = useState('');
  const [updateSlotId, setUpdateSlotId] = useState(null);

  const toggleRows  = (id) => setSlots(p=>p.map(s=>s.id===id?{...s,singleRow:!s.singleRow}:s));
  const setVal = (slotId,row,idx,val) => setSlots(p=>p.map(s=>s.id===slotId?{...s,[row==='up'?'upVals':'downVals']:s[row==='up'?'upVals':'downVals'].map((v,i)=>i===idx?val:v)}:s));

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

  const isSetupFilled = slots.length > 0 && slots.some(s => s.upVals.some(v=>v&&v.trim()) || s.downVals.some(v=>v&&v.trim()));
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
        return {sr_no:i+1, item:r.name, spec:parsed.spec||r.spec, tolerance:r.tolerance?`± ${r.tolerance}`:parsed.tol, inst:r.inst};
      }),
      ...filledProcesses.map((r,i)=>{
        const parsed = parseSpecTol(r.spec);
        return {sr_no:11+i, item:r.name, spec:parsed.spec||r.spec, tolerance:r.tolerance?r.tolerance:parsed.tol, inst:r.inst};
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

  const progress = ((step-1)/1)*100;

  return (
    <div className="wiz-wrap">
      <div className="wiz-topbar">
        <button onClick={onCancel} className="wiz-back-btn">← Back</button>
        <span className="wiz-topbar-title">📋 Inspection Form</span>
        <div style={{width:60}} />
      </div>

      <div className="wiz-progress-wrap">
        <div className="wiz-progress-track"><div className="wiz-progress-fill" style={{width:`${progress}%`}} /></div>
        <div className="wiz-steps-row">
          {STEPS.map((s, idx)=>(
            <div key={s.id} className={`wiz-step-dot${step===s.id?' active':''}${step > s.id || (idx===0&&step1Done) ?' done':''}`} onClick={()=>{ if(s.id<step || step1Done) setStep(s.id); }}>
              <div className="wiz-dot-circle">{step > s.id || (idx===0&&step1Done) ? '✓' : s.icon}</div>
              <div className="wiz-dot-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="wiz-body">
        {step===1 && (
          <>
            <div className="wiz-card">
              <div className="wiz-card-title">📋 Report Information</div>
              <div className="wiz-grid-2">
                <Field label="Customer" value={header.customerName} onChange={v=>setHeader(p=>({...p,customerName:v}))} options={dbOptions.customers} placeholder={optionsLoading ? 'Loading...' : 'Select customer...'} required />
                <Field label="Part Name" value={header.partName} onChange={v=>setHeader(p=>({...p,partName:v}))} options={dbOptions.part_names} placeholder={optionsLoading ? 'Loading...' : 'Select part...'} required />
                <Field label="Operation" value={header.operationName} onChange={v=>setHeader(p=>({...p,operationName:v}))} options={dbOptions.operations} placeholder={optionsLoading ? 'Loading...' : 'Select operation...'} required />
                {header.customerName && header.partName && header.operationName ? (dbOptions.part_numbers.length === 1 ? <div style={{display:'flex',flexDirection:'column',gap:4}}><label className="wiz-label">Part Number <span style={{color:'#e53935'}}>*</span></label><div style={{padding:'10px 14px',border:'1px solid #ccc',borderRadius:4,background:'#f5f5f5',fontWeight:600,color:'#333'}}>{header.partNumber}</div></div> : <Field label="Part Number" value={header.partNumber} onChange={v=>setHeader(p=>({...p,partNumber:v}))} options={dbOptions.part_numbers} placeholder="Select number..." required />) : null}
              </div>
            </div>
            {step1Done && (
              <div className="wiz-card" style={{marginTop:16}}>
                <div className="wiz-card-title">🔍 Inspection Items</div>
                <CombinedTable productRows={filledProducts} processRows={filledProcesses} />
              </div>
            )}
          </>
        )}

        {step===2 && (
          <div className="wiz-card">
            <div className="wiz-card-title">📅 Schedule</div>
            <div className="wiz-grid-3" style={{marginBottom:24}}>
              <div className="wiz-field">
                <label className="wiz-label">Date <span style={{color:'#e53935'}}>*</span></label>
                <div className="date-box">
                  <span style={{fontWeight:600}}>{schedDate?schedDate.split('-').reverse().join('/'):'DD/MM/YYYY'}</span><span>📅</span>
                  <input type="date" value={schedDate} onChange={e=>setSchedDate(e.target.value)} className="date-input-hidden" />
                </div>
              </div>
              <Field label="Operator" required value={operatorName} onChange={setOperatorName} options={OPERATOR_NAMES} placeholder="Select operator..." />
              <Field label="M/C No" required value={mcNo} onChange={setMcNo} options={Array.from({length:23},(_,i)=>String(i+1))} placeholder="Select machine..." />
            </div>

            {/* ── SQUARE CORPORATE ACTION BUTTONS ── */}
            <div style={{display:'flex', gap:16, marginBottom:24, flexWrap:'wrap'}}>
              <button onClick={()=>setSchedModal(schedModal==='add'?null:'add')}
                style={{
                  flex:1, minWidth:130, padding:'16px', borderRadius:'4px', 
                  border:schedModal==='add'?'2px solid #0f172a':'1px solid #cbd5e1',
                  background: schedModal==='add'?'#1e3a8a':'#f8fafc', /* Navy Blue */
                  color: schedModal==='add'?'#fff':'#334155',
                  fontWeight:800, fontSize:'14px', letterSpacing:'0.5px', textTransform:'uppercase', cursor:'pointer',
                  boxShadow: schedModal==='add'?'0 4px 6px rgba(0,0,0,0.2)':'0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s ease'
                }}>
                New Add
              </button>
              
              <button onClick={()=>{ if(slots.filter(s=>s.upVals.some(v=>v&&v.trim())||s.downVals.some(v=>v&&v.trim())).length===0){alert('Pehle kuch fill karo');return;} setSchedModal(schedModal==='update'?null:'update'); setUpdateSlotId(null); }}
                style={{
                  flex:1, minWidth:130, padding:'16px', borderRadius:'4px', 
                  border:schedModal==='update'?'2px solid #0f172a':'1px solid #cbd5e1',
                  background: schedModal==='update'?'#334155':'#f8fafc', /* Dark Slate */
                  color: schedModal==='update'?'#fff':'#334155',
                  fontWeight:800, fontSize:'14px', letterSpacing:'0.5px', textTransform:'uppercase', cursor:'pointer',
                  boxShadow: schedModal==='update'?'0 4px 6px rgba(0,0,0,0.2)':'0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s ease'
                }}>
                Update
              </button>
              
              <button onClick={()=>{ if(slots.filter(s=>s.upVals.some(v=>v&&v.trim())||s.downVals.some(v=>v&&v.trim())).length===0){alert('Koi data nahi hai abhi');return;} setSchedModal(schedModal==='view'?null:'view'); }}
                style={{
                  flex:1, minWidth:130, padding:'16px', borderRadius:'4px', 
                  border:schedModal==='view'?'2px solid #0f172a':'1px solid #cbd5e1',
                  background: schedModal==='view'?'#065f46':'#f8fafc', /* Forest Green */
                  color: schedModal==='view'?'#fff':'#334155',
                  fontWeight:800, fontSize:'14px', letterSpacing:'0.5px', textTransform:'uppercase', cursor:'pointer',
                  boxShadow: schedModal==='view'?'0 4px 6px rgba(0,0,0,0.2)':'0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s ease'
                }}>
                View All
              </button>
            </div>

            {/* ── EXPANDABLE SECTIONS ── */}
            {schedModal && (
              <div style={{position:'relative', background:'#fff', border:'1px solid #e2e8f0', borderRadius:'6px', padding:'24px', marginBottom:16, boxShadow:'0 4px 12px rgba(0,0,0,0.05)'}}>

                {/* Sleek Top-Right Close Icon */}
                <button onClick={()=>{setSchedModal(null);setModalActiveSlot(null);setModalSlotType('');}}
                  style={{position:'absolute', top:12, right:12, background:'transparent', border:'none', fontSize:22, color:'#64748b', cursor:'pointer', width:32, height:32, borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s ease'}}
                  onMouseOver={(e)=>{e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.color='#0f172a';}}
                  onMouseOut={(e)=>{e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#64748b';}}>
                  ✕
                </button>

                {/* ── NEW ADD ── */}
                {schedModal==='add' && (
                  <>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20, paddingRight:30}}>
                      {/* BIG SQUARE SLOT BUTTONS */}
                      <div style={{display:'flex',gap:16,width:'100%',flexWrap:'wrap'}}>
                        {[
                          {label:'SETUP', sub:'SETUP'},
                          {label:'4HRS',  sub:'4HRS'},
                          {label:'LAST',  sub:'LAST'},
                        ].map(btn => {
                          const isActive = modalSlotType === btn.sub;
                          return (
                            <button
                              key={btn.sub}
                              onClick={()=>{
                                setModalSlotType(btn.sub);
                                const newSlot={ id:nextId, type: btn.sub==='4HRS'?'4HRS':btn.sub, subType:btn.sub, singleRow:true, date:today, upVals:Array(MAX_COLS).fill(''), downVals:Array(MAX_COLS).fill('') };
                                setNextId(p=>p+1);
                                setModalActiveSlot(newSlot);
                              }}
                              style={{
                                flex:1, minWidth:110, height: '80px', // Tall square-ish look
                                padding:'16px', borderRadius:'4px',
                                border: isActive ? `2px solid #0f172a` : `1px solid #cbd5e1`,
                                background: isActive ? '#0f172a' : '#fff', /* Dark active background */
                                color: isActive ? '#fff' : '#475569',
                                fontWeight:800, fontSize:'16px', letterSpacing:'1px', cursor:'pointer',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                boxShadow: isActive ? `0 6px 16px rgba(15,23,42,0.25)` : '0 2px 4px rgba(0,0,0,0.02)',
                                transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                                transition:'all 0.15s ease',
                              }}>
                              {btn.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {modalActiveSlot && (
                      <div style={{borderTop:'1px solid #e2e8f0', paddingTop:'20px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16, background:'#f8fafc', padding:'12px 16px', borderRadius:'4px', border:'1px solid #e2e8f0'}}>
                          <span style={{fontWeight:800,fontSize:'16px',color:'#0f172a'}}>{modalActiveSlot.subType||modalActiveSlot.type}</span>
                          <button onClick={()=>setModalActiveSlot(p=>({...p,singleRow:!p.singleRow}))}
                            style={{padding:'4px 12px',borderRadius:'4px',fontSize:'12px',fontWeight:700,cursor:'pointer', background:'#e2e8f0',color:'#334155',border:'none'}}>
                            {modalActiveSlot.singleRow?'1 ROW':'2 ROWS'}
                          </button>
                          <div style={{marginLeft:'auto',display:'flex',gap:10}}>
                            <button onClick={()=>{
                                setSlots(prev=>{ const newSlot = modalActiveSlot; const li = [...prev].map(x=>x.type).lastIndexOf(newSlot.type); const at = li>=0 ? li+1 : prev.length; const n = [...prev]; n.splice(at,0,newSlot); return n; });
                                setModalActiveSlot(null); setModalSlotType(''); setSchedModal(null);
                              }}
                              style={{padding:'8px 16px',borderRadius:'4px',border:'none', background:'#059669',color:'#fff',fontWeight:800,fontSize:'13px',letterSpacing:'0.5px',cursor:'pointer'}}>
                              SAVE ENTRY
                            </button>
                            <button onClick={()=>{
                                setSlots(prev=>{ const newSlot = modalActiveSlot; const li = [...prev].map(x=>x.type).lastIndexOf(newSlot.type); const at = li>=0 ? li+1 : prev.length; const n = [...prev]; n.splice(at,0,newSlot); return n; });
                                const t=modalSlotType; const newSlot={id:nextId,type:(t==='4HRS'||t==='2HRS')?'4HRS':t,subType:t,singleRow:true,date:today,upVals:Array(MAX_COLS).fill(''),downVals:Array(MAX_COLS).fill('')};
                                setNextId(p=>p+1); setModalActiveSlot(newSlot);
                              }}
                              style={{padding:'8px 16px',borderRadius:'4px',border:'1px solid #cbd5e1', background:'#fff',color:'#0f172a',fontWeight:800,fontSize:'13px',letterSpacing:'0.5px',cursor:'pointer'}}>
                              ADD ANOTHER
                            </button>
                          </div>
                        </div>

                        <div style={{overflowX:'auto', border:'1px solid #e2e8f0', borderRadius:'4px'}}>
                          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                            <thead>
                              <tr style={{background:'#f8fafc'}}>
                                <th style={{padding:'10px 12px',textAlign:'left',fontWeight:800,color:'#334155',borderBottom:'1px solid #e2e8f0'}}>Column</th>
                                <th style={{padding:'10px 12px',textAlign:'center',fontWeight:800,color:'#64748b',borderBottom:'1px solid #e2e8f0',minWidth:80}}>Spec</th>
                                <th style={{padding:'10px 12px',textAlign:'center',fontWeight:800,color:'#64748b',borderBottom:'1px solid #e2e8f0',minWidth:80}}>Tol.</th>
                                <th style={{padding:'10px 12px',textAlign:'center',fontWeight:800,color:'#64748b',borderBottom:'1px solid #e2e8f0',minWidth:80}}>Inst.</th>
                                <th style={{padding:'10px 12px',textAlign:'center',fontWeight:800,color:'#1d4ed8',borderBottom:'1px solid #e2e8f0',minWidth:90}}>Reading 1</th>
                                {!modalActiveSlot.singleRow && <th style={{padding:'10px 12px',textAlign:'center',fontWeight:800,color:'#c2410c',borderBottom:'1px solid #e2e8f0',minWidth:90}}>Reading 2</th>}
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
                                    <td style={{padding:'8px 12px',fontWeight:700,color:'#334155'}}>{label}</td>
                                    <td style={{padding:'8px',textAlign:'center',color:'#64748b',fontSize:12}}>{spec||'—'}</td>
                                    <td style={{padding:'8px',textAlign:'center',color:'#c2410c',fontSize:12,fontWeight:700}}>{tolerance||'—'}</td>
                                    <td style={{padding:'8px',textAlign:'center',color:'#1d4ed8',fontSize:12}}>{inst||'—'}</td>
                                    <td style={{padding:'6px 8px',textAlign:'center'}}>
                                      <input type="text" value={uv} placeholder="—" onChange={e=>setModalActiveSlot(p=>({...p,upVals:p.upVals.map((v,i)=>i===idx?e.target.value:v)}))}
                                        style={{width:'80px',textAlign:'center',padding:'8px', border:`1px solid ${isNgUp?'#ef4444':uv?'#22c55e':'#cbd5e1'}`, borderRadius:'4px',fontSize:13,fontWeight:uv?700:500, background:isNgUp?'#fef2f2':uv?'#f0fdf4':'#fff', color:isNgUp?'#b91c1c':uv?'#15803d':'#334155',outline:'none'}}/>
                                    </td>
                                    {!modalActiveSlot.singleRow && (
                                      <td style={{padding:'6px 8px',textAlign:'center'}}>
                                        <input type="text" value={dv} placeholder="—" onChange={e=>setModalActiveSlot(p=>({...p,downVals:p.downVals.map((v,i)=>i===idx?e.target.value:v)}))}
                                          style={{width:'80px',textAlign:'center',padding:'8px', border:`1px solid ${isNgDn?'#ef4444':dv?'#f59e0b':'#cbd5e1'}`, borderRadius:'4px',fontSize:13,fontWeight:dv?700:500, background:isNgDn?'#fef2f2':dv?'#fffbeb':'#fff', color:isNgDn?'#b91c1c':dv?'#b45309':'#334155',outline:'none'}}/>
                                      </td>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ── UPDATE ── */}
                {schedModal==='update' && (
                  <>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20, paddingRight:30}}>
                      <select value={updateSlotId ? String(updateSlotId) : ''} onChange={e=>{ if(!e.target.value){setUpdateSlotId(null);return;} setUpdateSlotId(Number(e.target.value)); }}
                        style={{flex:1,padding:'14px 16px',borderRadius:'4px',border:'1px solid #cbd5e1', background:'#f8fafc',fontWeight:700,fontSize:14,cursor:'pointer',color:'#0f172a',outline:'none',boxShadow:'0 1px 2px rgba(0,0,0,0.05)'}}>
                        <option value="">-- SELECT ENTRY TO EDIT --</option>
                        {(()=>{
                          const typeCount={}; slots.forEach(s=>{typeCount[s.type]=(typeCount[s.type]||0)+1;});
                          const typeIdx={}; const sortedSlots = getSortedSlotsForDropdown();
                          return sortedSlots.map(s=>{
                            typeIdx[s.type]=(typeIdx[s.type]||0)+1;
                            const label=typeCount[s.type]>1 ? `${s.subType||s.type} #${typeIdx[s.type]}` : (s.subType||s.type);
                            const cnt=s.upVals.filter(v=>v&&v.trim()).length+s.downVals.filter(v=>v&&v.trim()).length;
                            return <option key={s.id} value={String(s.id)}>{label}{cnt>0?` ✓ (${cnt} filled)`:' (Empty)'}</option>;
                          });
                        })()}
                      </select>
                    </div>

                    {updateSlotId && (()=>{
                      const s=slots.find(x=>x.id===updateSlotId); if(!s) return null;
                      return (
                        <div style={{borderTop:'1px solid #e2e8f0', paddingTop:'20px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16, background:'#f8fafc',padding:'12px 16px',borderRadius:'4px', border:'1px solid #e2e8f0'}}>
                            <span style={{fontWeight:800,fontSize:16,color:'#0f172a'}}>{s.subType||s.type} EDIT</span>
                            <button onClick={()=>toggleRows(s.id)} style={{padding:'4px 12px',borderRadius:'4px',fontSize:'12px',fontWeight:700,cursor:'pointer', background:'#e2e8f0',color:'#334155',border:'none'}}>
                              {s.singleRow?'1 ROW':'2 ROWS'}
                            </button>
                            <button onClick={()=>{setSchedModal(null);setUpdateSlotId(null);}} style={{marginLeft:'auto',padding:'8px 16px',borderRadius:'4px',border:'none', background:'#334155',color:'#fff',fontWeight:800,fontSize:13,letterSpacing:'0.5px',cursor:'pointer'}}>
                              DONE EDITING
                            </button>
                          </div>
                          <div style={{overflowX:'auto', border:'1px solid #e2e8f0', borderRadius:'4px'}}>
                            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                              <thead>
                                <tr style={{background:'#f8fafc'}}>
                                  <th style={{padding:'10px 12px',textAlign:'left',fontWeight:800,color:'#334155',borderBottom:'1px solid #e2e8f0'}}>Column</th>
                                  <th style={{padding:'10px 12px',textAlign:'center',fontWeight:800,color:'#64748b',borderBottom:'1px solid #e2e8f0'}}>Spec</th>
                                  <th style={{padding:'10px 12px',textAlign:'center',fontWeight:800,color:'#1d4ed8',borderBottom:'1px solid #e2e8f0'}}>Reading 1</th>
                                  {!s.singleRow && <th style={{padding:'10px 12px',textAlign:'center',fontWeight:800,color:'#c2410c',borderBottom:'1px solid #e2e8f0'}}>Reading 2</th>}
                                </tr>
                              </thead>
                              <tbody>
                                {colLabels.map(({idx,label,spec})=>{
                                  const uv=s.upVals[idx]||''; const dv=s.downVals[idx]||'';
                                  const isNgUp=uv.toUpperCase()==='NG'; const isNgDn=dv.toUpperCase()==='NG';
                                  return (
                                    <tr key={idx} style={{borderBottom:'1px solid #f1f5f9'}}>
                                      <td style={{padding:'8px 12px',fontWeight:700,color:'#334155'}}>{label}</td>
                                      <td style={{padding:'8px',textAlign:'center',color:'#64748b',fontSize:12}}>{spec||'—'}</td>
                                      <td style={{padding:'6px 8px',textAlign:'center'}}>
                                        <input type="text" value={uv} placeholder="—" onChange={e=>setVal(s.id,'up',idx,e.target.value)}
                                          style={{width:'80px',textAlign:'center',padding:'8px', border:`1px solid ${isNgUp?'#ef4444':uv?'#22c55e':'#cbd5e1'}`, borderRadius:'4px',fontSize:13,fontWeight:uv?700:500, background:isNgUp?'#fef2f2':uv?'#f0fdf4':'#fff', color:isNgUp?'#b91c1c':uv?'#15803d':'#334155',outline:'none'}}/>
                                      </td>
                                      {!s.singleRow && (
                                        <td style={{padding:'6px 8px',textAlign:'center'}}>
                                          <input type="text" value={dv} placeholder="—" onChange={e=>setVal(s.id,'down',idx,e.target.value)}
                                            style={{width:'80px',textAlign:'center',padding:'8px', border:`1px solid ${isNgDn?'#ef4444':dv?'#f59e0b':'#cbd5e1'}`, borderRadius:'4px',fontSize:13,fontWeight:dv?700:500, background:isNgDn?'#fef2f2':dv?'#fffbeb':'#fff', color:isNgDn?'#b91c1c':dv?'#b45309':'#334155',outline:'none'}}/>
                                        </td>
                                      )}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}

                {/* ── VIEW ── */}
                {schedModal==='view' && (
                  <div>
                    <div style={{fontWeight:800,fontSize:16,marginBottom:20,color:'#0f172a', textTransform:'uppercase'}}>All Completed Entries</div>
                    {slots.filter(s=>s.upVals.some(v=>v&&v.trim())||s.downVals.some(v=>v&&v.trim())).map(s=>{
                      return (
                        <div key={s.id} style={{marginBottom:24,border:'1px solid #e2e8f0',borderRadius:'4px',overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
                          <div style={{background:'#f8fafc',padding:'12px 16px',color:'#0f172a',fontWeight:800,fontSize:14,borderBottom:'1px solid #e2e8f0'}}>{s.subType||s.type}</div>
                          <div style={{overflowX:'auto'}}>
                            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                              <thead>
                                <tr style={{background:'#fff'}}>
                                  <th style={{padding:'10px 16px',textAlign:'left',fontWeight:800,color:'#64748b',borderBottom:'1px solid #e2e8f0'}}>Column</th>
                                  <th style={{padding:'10px 16px',textAlign:'center',fontWeight:800,color:'#1d4ed8',borderBottom:'1px solid #e2e8f0'}}>Reading 1</th>
                                  {!s.singleRow && <th style={{padding:'10px 16px',textAlign:'center',fontWeight:800,color:'#c2410c',borderBottom:'1px solid #e2e8f0'}}>Reading 2</th>}
                                </tr>
                              </thead>
                              <tbody>
                                {colLabels.map(({idx,label})=>{
                                  const uv=s.upVals[idx]||'—'; const dv=s.downVals[idx]||'—';
                                  return (
                                    <tr key={idx} style={{borderBottom:'1px solid #f1f5f9'}}>
                                      <td style={{padding:'8px 16px',fontWeight:700,color:'#334155'}}>{label}</td>
                                      <td style={{padding:'8px 16px',textAlign:'center',color:uv==='NG'?'#ef4444':uv!=='—'?'#16a34a':'#94a3b8',fontWeight:uv!=='—'?800:500}}>{uv}</td>
                                      {!s.singleRow && <td style={{padding:'8px 16px',textAlign:'center',color:dv==='NG'?'#ef4444':dv!=='—'?'#ea580c':'#94a3b8',fontWeight:dv!=='—'?800:500}}>{dv}</td>}
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
        )}
      </div>

      <div className="wiz-footer">
        {step>1 ? <button onClick={()=>setStep(s=>s-1)} className="wiz-btn-back">← Back</button> : <button onClick={onCancel} className="wiz-btn-back">Cancel</button>}
        {step<2 ? <button onClick={()=>setStep(s=>s+1)} disabled={step===1&&!step1Done} className={`wiz-btn-next${(step===1&&!step1Done)?' disabled':''}`}>Next →</button> : <button onClick={handleSubmit} className="wiz-btn-save">✅ Save</button>}
      </div>
    </div>
  );
};

export default Form;