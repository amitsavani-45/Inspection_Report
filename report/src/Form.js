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
const PRODUCT_ITEMS  = ['APPEARANCE','WIDTH','LENGTH','THICKNESS','DIMENSIONS A','DIMENSIONS B','RADIUS','BLANK PROFILE','DIAMETER','DEPTH','HEIGHT','FLATNESS','STRAIGHTNESS','ROUNDNESS','CHAMFER','THREAD','HOLE DIAMETER','PITCH','SURFACE FINISH','WEIGHT'];
const PROCESS_ITEMS  = ['SHUT HEIGHT','BALANCER PRESSURE','CLUTCH PRESSURE','CUSHION PRESSURE','DIE HEIGHT','STROKE LENGTH','FEED RATE','CUTTING SPEED','SPINDLE SPEED','COOLANT PRESSURE','COOLANT FLOW','CLAMPING FORCE','BLANK HOLDER FORCE','DRAWING FORCE','PRESS TONNAGE','TEMPERATURE','CYCLE TIME','AIR PRESSURE','HYDRAULIC PRESSURE','LUBRICATION PRESSURE'];
const TOLERANCES         = ['0.01','0.02','0.05','0.08','0.1','0.2','0.3','0.5','1.0'];
const PROCESS_TOLERANCES = ['MIN','MAX','0.01','0.05','0.1','0.2','0.5','1.0'];
const INSTRUMENTS        = ['VISUAL','VERNIER','MICROMETER','RADIUS GAUGE','TEMPLATE','DIGITAL','GAUGE','CMM','DIAL INDICATOR','HEIGHT GAUGE'];
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
      {options.map(o => <option key={typeof o==='string'?o:o.v} value={typeof o==='string'?o:o.v}>{typeof o==='string'?o:o.l}</option>)}
    </select>
  </div>
);

const CombinedTable = ({ productRows, processRows }) => {
  const allRows = [
    ...productRows.map((r,i) => ({...r, category:'PRODUCT', catColor:'#1976d2', sr:i+1})),
    ...processRows.map((r,i) => ({...r, category:'PROCESS', catColor:'#e65100', sr:productRows.length+i+1})),
  ].filter(r => r.name);
  
  if(allRows.length===0) return <div style={{textAlign:'center',color:'#aaa',padding:'20px 0'}}>Pehle Operation select karein.</div>;

  return (
    <div style={{overflowX:'auto', marginTop:8}}>
      <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
        <thead>
          <tr style={{background:'#f0f4ff', borderBottom:'2px solid #c5cae9'}}>
            <th style={{padding:'10px 8px'}}>SR</th>
            <th style={{padding:'10px 8px'}}>Category</th>
            <th style={{padding:'10px 8px', textAlign:'left'}}>Item</th>
            <th style={{padding:'10px 8px'}}>Spec</th>
            <th style={{padding:'10px 8px'}}>Inst.</th>
          </tr>
        </thead>
        <tbody>
          {allRows.map((row,i)=>(
            <tr key={i} style={{borderBottom:'1px solid #eee'}}>
              <td style={{padding:'9px 8px', textAlign:'center', color:row.catColor}}>{row.sr}</td>
              <td style={{padding:'9px 8px', textAlign:'center'}}><span style={{fontSize:10, fontWeight:700, color:row.catColor}}>{row.category}</span></td>
              <td style={{padding:'9px 8px', fontWeight:600}}>{row.name}</td>
              <td style={{padding:'9px 8px', textAlign:'center'}}>{row.spec} {row.tolerance ? `±${row.tolerance}`:''}</td>
              <td style={{padding:'9px 8px', textAlign:'center'}}>{row.inst}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Form = ({ onSubmit, onCancel, initialData={}, items=[] }) => {
  const [step, setStep] = useState(1);
  const [dbOptions, setDbOptions] = useState({ customers: [], part_names: [], part_numbers: [], operations: [] });
  const [optionsLoading, setOptionsLoading] = useState(true);

  useEffect(() => {
    getDropdownOptions().then(data => { setDbOptions(data); setOptionsLoading(false); }).catch(() => setOptionsLoading(false));
  }, []);

  const [header, setHeader] = useState({ customerName:'', partName:'', operationName:'', partNumber:'' });
  const step1Done = !!(header.customerName && header.partName && header.operationName);

  const [productRows, setProductRows] = useState([emptyRow()]);
  const [processRows, setProcessRows] = useState([emptyRow()]);

  useEffect(() => {
    if (!header.operationName) return;
    fetchInspectionItems(header.operationName).then(data => {
      if (data.product) setProductRows([...data.product, emptyRow()]);
      if (data.process) setProcessRows([...data.process, emptyRow()]);
    });
  }, [header.operationName]);

  const filledProducts = productRows.filter(r=>r.name);
  const filledProcesses = processRows.filter(r=>r.name);
  const colLabels = [...filledProducts, ...filledProcesses].map((r,i)=>({idx:i, label:r.name}));

  const [schedDate, setSchedDate] = useState(new Date().toISOString().split('T')[0]);
  const [operatorName, setOperatorName] = useState('');
  const [mcNo, setMcNo] = useState('');
  const [slots, setSlots] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [schedModal, setSchedModal] = useState(null);
  const [modalActiveSlot, setModalActiveSlot] = useState(null);
  const [updateSlotId, setUpdateSlotId] = useState(null);

  const handleSubmit = () => {
    onSubmit({ ...header, schedDate, operatorName, mcNo, slots });
  };

  return (
    <div className="wiz-wrap">
      <div className="wiz-topbar">
        <button onClick={onCancel} className="wiz-back-btn">← Back</button>
        <span className="wiz-topbar-title">📋 Inspection Form</span>
        <div style={{width:60}} />
      </div>

      <div className="wiz-progress-wrap">
        <div className="wiz-progress-track"><div className="wiz-progress-fill" style={{width:`${((step-1)/1)*100}%`}} /></div>
        <div className="wiz-steps-row">
          {STEPS.map(s=>(
            <div key={s.id} className={`wiz-step-dot${step===s.id?' active':''}`} onClick={()=>setStep(s.id)}>
              <div className="wiz-dot-circle">{s.icon}</div>
              <div className="wiz-dot-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="wiz-body">
        {step===1 && (
          <div className="wiz-card">
            <div className="wiz-card-title">📋 Report Information</div>
            <div className="wiz-grid-2">
              <Field label="Customer" value={header.customerName} onChange={v=>setHeader(p=>({...p,customerName:v}))} options={dbOptions.customers} required />
              <Field label="Part Name" value={header.partName} onChange={v=>setHeader(p=>({...p,partName:v}))} options={dbOptions.part_names} required />
              <Field label="Operation" value={header.operationName} onChange={v=>setHeader(p=>({...p,operationName:v}))} options={dbOptions.operations} required />
              <Field label="Part Number" value={header.partNumber} onChange={v=>setHeader(p=>({...p,partNumber:v}))} options={dbOptions.part_numbers} required />
            </div>
            {step1Done && <CombinedTable productRows={productRows} processRows={processRows} />}
          </div>
        )}

        {step===2 && (
          <div className="wiz-card">
            <div className="wiz-card-title">📅 Schedule</div>
            <div className="wiz-grid-3" style={{marginBottom:20}}>
              <div className="wiz-field">
                <label className="wiz-label">Date *</label>
                <div className="date-box"><span>{schedDate}</span>📅<input type="date" value={schedDate} onChange={e=>setSchedDate(e.target.value)} className="date-input-hidden" /></div>
              </div>
              <Field label="Operator" value={operatorName} onChange={setOperatorName} options={OPERATOR_NAMES} required />
              <Field label="M/C No" value={mcNo} onChange={setMcNo} options={Array.from({length:20},(_,i)=>String(i+1))} required />
            </div>

            {/* ── ACTION BUTTONS WITH BIG ICONS ── */}
            <div className="sched-btn-container">
              <button className="sched-action-btn btn-new" onClick={()=>setSchedModal('add')}>
                <span className="sched-btn-icon">➕</span> New Add
              </button>
              <button className="sched-action-btn btn-upd" onClick={()=>{ if(!slots.length) return alert('No slots'); setSchedModal('update'); }}>
                <span className="sched-btn-icon">📝</span> Update
              </button>
              <button className="sched-action-btn btn-viw" onClick={()=>{ if(!slots.length) return alert('No slots'); setSchedModal('view'); }}>
                <span className="sched-btn-icon">👁️</span> View
              </button>
            </div>

            {/* Modals Logic (Simplified for View) */}
            {schedModal==='add' && (
              <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center'}}>
                <div style={{background:'#fff', padding:20, borderRadius:12, width:'90%', maxWidth:400}}>
                   <h3>Select Slot Type</h3>
                   {['SETUP','4HRS','LAST'].map(t => (
                     <button key={t} style={{display:'block', width:'100%', padding:12, margin:'8px 0'}} onClick={()=>{
                       setSlots([...slots, {id:nextId, type:t, upVals:Array(20).fill(''), downVals:Array(20).fill('')}]);
                       setNextId(nextId+1); setSchedModal(null);
                     }}>{t}</button>
                   ))}
                   <button onClick={()=>setSchedModal(null)} style={{width:'100%', padding:10, background:'#eee', border:'none'}}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="wiz-footer">
        <button onClick={()=>setStep(Math.max(1, step-1))} className="wiz-btn-back">Back</button>
        {step<2 ? <button onClick={()=>setStep(2)} className="wiz-btn-next">Next →</button> : <button onClick={handleSubmit} className="wiz-btn-save">✅ Save</button>}
      </div>
    </div>
  );
};

export default Form;