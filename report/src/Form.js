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
const MAX_COLS     = 20;
const MAX_READINGS = 10;
const emptyRow = () => ({ name:'', spec:'', tolerance:'', inst:'' });

const STEPS = [
  { id:1, label:'Report',   icon:'bi bi-file-earmark-text-fill' },
  { id:2, label:'Schedule', icon:'bi bi-calendar2-week-fill'    },
];

const READING_COLORS = [
  { header:'#1565c0', fill:'#e8f5e9', border:'#4caf50', text:'#2e7d32' },
  { header:'#e65100', fill:'#fff3e0', border:'#ff9800', text:'#e65100' },
  { header:'#6a1b9a', fill:'#f3e5f5', border:'#ab47bc', text:'#6a1b9a' },
  { header:'#00695c', fill:'#e0f2f1', border:'#26a69a', text:'#00695c' },
  { header:'#c62828', fill:'#ffebee', border:'#ef5350', text:'#c62828' },
  { header:'#1565c0', fill:'#e3f2fd', border:'#42a5f5', text:'#1565c0' },
  { header:'#2e7d32', fill:'#f1f8e9', border:'#66bb6a', text:'#2e7d32' },
  { header:'#bf360c', fill:'#fbe9e7', border:'#ff7043', text:'#bf360c' },
  { header:'#37474f', fill:'#eceff1', border:'#90a4ae', text:'#37474f' },
  { header:'#880e4f', fill:'#fce4ec', border:'#f48fb1', text:'#880e4f' },
];

/* ─────────────────────────────────────────────────────────────
   
───────────────────────────────────────────────────────────── */

const Field = ({ label, value, onChange, options, placeholder, required }) => (
  <div className="wiz-field">
    <label className="wiz-label">{label}{required && <span style={{color:'#e53935'}}> *</span>}</label>
    <select value={value} onChange={e => onChange(e.target.value)} className={`wiz-select${value?' filled':''}`}>
      <option value="">{placeholder || 'Select...'}</option>
      {options.map(o => typeof o === 'string'
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.v} value={o.v}>{o.l}</option>
      )}
    </select>
  </div>
);

const InspItem = ({ row, onUpdate, srNum, isProduct, onRemove, dbItems=[] }) => {
  const [spec, setSpec] = useState(row.spec || '');
  useEffect(() => setSpec(row.spec || ''), [row.spec]);
  const color = isProduct ? '#1976d2' : '#e65100';
  const staticItems = isProduct ? PRODUCT_ITEMS : PROCESS_ITEMS;
  const items = [...new Set([...dbItems.map(i => i.name || i), ...staticItems])];
  const tols = isProduct
    ? TOLERANCES.map(t => ({ v:t, l:`± ${t}` }))
    : PROCESS_TOLERANCES.map(t => ({ v:t, l: t==='MIN'||t==='MAX' ? t : `± ${t}` }));
  const filled = !!(row.name && row.spec && row.inst);
  return (
    <div className={`insp-row${filled?' done':''}`} style={{borderLeftColor: filled?'#4CAF50':color}}>
      <div className="insp-sr" style={{background:color}}>{srNum}</div>
      <div className="insp-fields">
        <select value={row.name} onChange={e=>{
          const val=e.target.value; onUpdate('name',val);
          const match=dbItems.find(i=>(i.name||i)===val);
          if(match&&match.spec)       onUpdate('spec',match.spec);
          if(match&&match.instrument) onUpdate('inst',match.instrument);
          if(match&&match.tolerance)  onUpdate('tolerance',match.tolerance);
        }} className="insp-select">
          <option value="">{isProduct ? 'Product item select karo...' : 'Process item select karo...'}</option>
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
      {onRemove ? <button onClick={onRemove} className="insp-remove">✕</button> : <div style={{width:28}}/>}
    </div>
  );
};

const CombinedTable = ({ productRows, processRows }) => {
  const allRows = [
    ...productRows.map((r,i) => ({...r, category:'PRODUCT', catColor:'#1976d2', sr:i+1})),
    ...processRows.map((r,i) => ({...r, category:'PROCESS', catColor:'#e65100', sr:productRows.length+i+1})),
  ];
  if (allRows.length===0) return (
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
            const isProduct = row.category==='PRODUCT';
            return (
              <tr key={i} style={{borderBottom:'1px solid #eee',background:i%2===0?'#fff':'#fafafa'}}>
                <td style={{padding:'9px 8px',textAlign:'center',fontWeight:700,color:row.catColor}}>{row.sr}</td>
                <td style={{padding:'9px 8px',textAlign:'center'}}>
                  <span style={{background:isProduct?'#e3f2fd':'#fff3e0',color:row.catColor,
                    border:`1px solid ${row.catColor}`,borderRadius:4,padding:'2px 7px',
                    fontSize:10,fontWeight:700,whiteSpace:'nowrap'}}>{row.category}</span>
                </td>
                <td style={{padding:'9px 8px',fontWeight:600,color:'#222'}}>{row.name}</td>
                <td style={{padding:'9px 8px',textAlign:'center',color:'#555'}}>{s||row.spec}</td>
                <td style={{padding:'9px 8px',textAlign:'center',color:'#555'}}>{row.tolerance?`± ${row.tolerance}`:(t||'—')}</td>
                <td style={{padding:'9px 8px',textAlign:'center',color:'#555'}}>{row.inst}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/* ── ReadingTable: outside Form so it never remounts on state change ── */
const ReadingTable = ({ slot, isModal, colLabels, onAddReading, onRemoveReading, onSetVal, onSaveAndClose, onDone }) => {
  const typeColor = slot.type==='SETUP'?'#2563eb':slot.type==='4HRS'?'#7c3aed':'#e11d48';
  const inputStyle = (val, ri) => {
    const c  = READING_COLORS[ri % READING_COLORS.length];
    const ng = val.toUpperCase() === 'NG';
    return {
      width:'76px', textAlign:'center', padding:'5px 6px',
      border:`1px solid ${ng?'#e53935':val?c.border:'#cbd5e1'}`,
      borderRadius:6, fontSize:13, fontWeight:val?700:400,
      background:ng?'#ffebee':val?c.fill:'#fff',
      color:ng?'#e53935':val?c.text:'#999', outline:'none',
    };
  };
  return (
    <>
      {/* Header bar */}
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,
        background:typeColor,padding:'10px 14px',borderRadius:8,flexWrap:'wrap'}}>
        <span style={{fontWeight:800,fontSize:15,color:'#fff'}}>{slot.subType||slot.type}</span>
        <span style={{background:'rgba(255,255,255,0.2)',color:'#fff',borderRadius:20,
          padding:'2px 12px',fontSize:12,fontWeight:700}}>
          {slot.readingCount} Reading{slot.readingCount>1?'s':''}
        </span>
        <div style={{marginLeft:'auto',display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
          {slot.readingCount>1 && (
            <button onClick={()=>onRemoveReading(isModal, slot.id)}
              style={{padding:'4px 12px',borderRadius:6,border:'1px solid rgba(255,255,255,0.5)',
                background:'rgba(255,255,255,0.15)',color:'#fff',fontWeight:700,fontSize:12,cursor:'pointer'}}>
              − Reading
            </button>
          )}
          {slot.readingCount<MAX_READINGS && (
            <button onClick={()=>onAddReading(isModal, slot.id)}
              style={{padding:'4px 14px',borderRadius:6,border:'2px solid #fff',
                background:'rgba(255,255,255,0.2)',color:'#fff',fontWeight:800,fontSize:12,
                cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
              <i className="bi bi-plus-lg"></i> + Reading
            </button>
          )}
          {isModal && (
            <button onClick={()=>onSaveAndClose(slot)}
              style={{padding:'6px 18px',borderRadius:8,border:'2px solid #fff',
                background:'#16a34a',color:'#fff',fontWeight:800,fontSize:13,
                cursor:'pointer',boxShadow:'0 2px 8px rgba(0,0,0,0.2)',
                display:'flex',alignItems:'center',gap:6}}>
              <i className="bi bi-check-circle-fill"></i> Save & Close
            </button>
          )}
          {!isModal && (
            <button onClick={onDone}
              style={{padding:'4px 14px',borderRadius:6,border:'none',
                background:'rgba(255,255,255,0.25)',color:'#fff',fontWeight:800,fontSize:12,cursor:'pointer'}}>
              <i className="bi bi-check-lg" style={{marginRight:4}}></i>Done
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead>
            <tr style={{background:'#f8fafc'}}>
              <th style={{padding:'8px 12px',textAlign:'left',fontWeight:700,color:'#333',
                borderBottom:'2px solid #e2e8f0',minWidth:130,position:'sticky',left:0,background:'#f8fafc',zIndex:1}}>Column</th>
              <th style={{padding:'8px 8px',textAlign:'center',fontWeight:700,color:'#555',
                borderBottom:'2px solid #e2e8f0',minWidth:80}}>Spec</th>
              <th style={{padding:'8px 8px',textAlign:'center',fontWeight:700,color:'#e65100',
                borderBottom:'2px solid #e2e8f0',minWidth:80}}>Tolerance</th>
              <th style={{padding:'8px 8px',textAlign:'center',fontWeight:700,color:'#555',
                borderBottom:'2px solid #e2e8f0',minWidth:80}}>Instrument</th>
              {Array.from({length:slot.readingCount},(_,ri)=>{
                const c=READING_COLORS[ri%READING_COLORS.length];
                return (
                  <th key={ri} style={{padding:'8px 8px',textAlign:'center',fontWeight:700,
                    color:c.header,borderBottom:`2px solid ${c.border}`,minWidth:90,background:`${c.fill}88`}}>
                    Reading {ri+1}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {colLabels.map(({idx,label,spec,tolerance,inst})=>(
              <tr key={idx} style={{borderBottom:'1px solid #f1f5f9',background:idx%2===0?'#fff':'#fafafa'}}>
                <td style={{padding:'6px 12px',fontWeight:600,color:'#333',
                  position:'sticky',left:0,background:idx%2===0?'#fff':'#fafafa',zIndex:1}}>{label}</td>
                <td style={{padding:'6px 8px',textAlign:'center',color:'#555',fontSize:12}}>{spec||'—'}</td>
                <td style={{padding:'6px 8px',textAlign:'center',color:'#e65100',fontSize:12,fontWeight:600}}>{tolerance||'—'}</td>
                <td style={{padding:'6px 8px',textAlign:'center',color:'#1565c0',fontSize:12}}>{inst||'—'}</td>
                {Array.from({length:slot.readingCount},(_,ri)=>{
                  const val=(slot.readings[ri]||[])[idx]||'';
                  return (
                    <td key={ri} style={{padding:'4px 6px',textAlign:'center'}}>
                      <input
                        type="text"
                        value={val}
                        placeholder="—"
                        onChange={e=>onSetVal(isModal, slot.id, ri, idx, e.target.value)}
                        style={inputStyle(val,ri)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

/* ── LockedSlotCard: outside Form ── */
const LockedSlotCard = ({ slot, colLabels }) => {
  const typeColor = slot.type==='SETUP'?'#2563eb':slot.type==='4HRS'?'#7c3aed':'#e11d48';
  const filledTime = slot.savedAt
    ? new Date(slot.savedAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Kolkata'})
    : null;
  return (
    <div style={{marginBottom:14,border:`1.5px solid ${typeColor}44`,borderRadius:10,
      overflow:'hidden',boxShadow:`0 2px 12px ${typeColor}18`}}>
      <div style={{background:typeColor,padding:'9px 14px',color:'#fff',fontWeight:800,fontSize:14,
        display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:6}}>
        <span style={{display:'flex',alignItems:'center',gap:8}}>
          <i className="bi bi-lock-fill" style={{fontSize:13,opacity:0.9}}></i>
          {slot.subType||slot.type}
        </span>
        <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
          <span style={{fontSize:12,background:'rgba(255,255,255,0.2)',padding:'2px 10px',borderRadius:20}}>
            {slot.readingCount} Reading{slot.readingCount>1?'s':''}
          </span>
          {filledTime && (
            <span style={{fontSize:12,background:'rgba(255,255,255,0.2)',padding:'2px 10px',borderRadius:20}}>
              <i className="bi bi-clock-fill" style={{marginRight:4}}></i>{filledTime}
            </span>
          )}
          <span style={{fontSize:12,background:'#16a34a',padding:'3px 12px',borderRadius:20,
            fontWeight:700,display:'flex',alignItems:'center',gap:5}}>
            <i className="bi bi-check-circle-fill"></i> Saved
          </span>
        </div>
      </div>
      <div style={{overflowX:'auto',background:'#fafbff'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead>
            <tr style={{background:'#f0f4ff'}}>
              <th style={{padding:'7px 12px',textAlign:'left',fontWeight:700,color:'#333',
                borderBottom:'1px solid #e2e8f0',minWidth:130,position:'sticky',left:0,background:'#f0f4ff',zIndex:1}}>Column</th>
              <th style={{padding:'7px 8px',textAlign:'center',fontWeight:700,color:'#555',borderBottom:'1px solid #e2e8f0',minWidth:80}}>Spec</th>
              <th style={{padding:'7px 8px',textAlign:'center',fontWeight:700,color:'#e65100',borderBottom:'1px solid #e2e8f0',minWidth:80}}>Tolerance</th>
              <th style={{padding:'7px 8px',textAlign:'center',fontWeight:700,color:'#555',borderBottom:'1px solid #e2e8f0',minWidth:80}}>Instrument</th>
              {Array.from({length:slot.readingCount},(_,ri)=>{
                const c=READING_COLORS[ri%READING_COLORS.length];
                return (
                  <th key={ri} style={{padding:'7px 8px',textAlign:'center',fontWeight:700,
                    color:c.header,borderBottom:`2px solid ${c.border}`,minWidth:85,background:`${c.fill}88`}}>
                    Reading {ri+1}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {colLabels.map(({idx,label,spec,tolerance,inst})=>(
              <tr key={idx} style={{borderBottom:'1px solid #f1f5f9',background:idx%2===0?'#fff':'#fafafa'}}>
                <td style={{padding:'6px 12px',fontWeight:600,color:'#444',
                  position:'sticky',left:0,background:idx%2===0?'#fff':'#fafafa',zIndex:1}}>{label}</td>
                <td style={{padding:'6px 8px',textAlign:'center',color:'#555',fontSize:12}}>{spec||'—'}</td>
                <td style={{padding:'6px 8px',textAlign:'center',color:'#e65100',fontSize:12,fontWeight:600}}>{tolerance||'—'}</td>
                <td style={{padding:'6px 8px',textAlign:'center',color:'#1565c0',fontSize:12}}>{inst||'—'}</td>
                {Array.from({length:slot.readingCount},(_,ri)=>{
                  const c=READING_COLORS[ri%READING_COLORS.length];
                  const val=(slot.readings[ri]||[])[idx]||'—';
                  return (
                    <td key={ri} style={{padding:'6px 8px',textAlign:'center',
                      color:val==='NG'?'#e53935':val!=='—'?c.text:'#bbb',
                      fontWeight:val!=='—'?700:400,fontSize:13}}>{val}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ── ViewSlotCard: outside Form ── */
const ViewSlotCard = ({ s, colLabels }) => {
  const cfg   = {SETUP:'#2563eb','4HRS':'#7c3aed',LAST:'#e11d48'};
  const color = cfg[s.type]||'#333';
  const filledTime = s.savedAt
    ? new Date(s.savedAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Kolkata'})
    : null;
  return (
    <div style={{marginBottom:16,border:`1px solid ${color}33`,borderRadius:10,overflow:'hidden'}}>
      <div style={{background:color,padding:'8px 14px',color:'#fff',fontWeight:800,fontSize:14,
        display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span>{s.subType||s.type}</span>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={{fontSize:12,background:'rgba(255,255,255,0.2)',padding:'2px 10px',borderRadius:20}}>
            {s.readingCount} Readings
          </span>
          {filledTime&&(
            <span style={{fontSize:12,background:'rgba(255,255,255,0.2)',padding:'2px 10px',borderRadius:20}}>
              <i className="bi bi-clock-fill" style={{marginRight:4}}></i>{filledTime}
            </span>
          )}
        </div>
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead>
            <tr style={{background:'#f8fafc'}}>
              <th style={{padding:'7px 12px',textAlign:'left',fontWeight:700,color:'#333',borderBottom:'1px solid #e2e8f0'}}>Column</th>
              <th style={{padding:'7px 8px',textAlign:'center',fontWeight:700,color:'#555',borderBottom:'1px solid #e2e8f0'}}>Spec</th>
              <th style={{padding:'7px 8px',textAlign:'center',fontWeight:700,color:'#e65100',borderBottom:'1px solid #e2e8f0'}}>Tolerance</th>
              <th style={{padding:'7px 8px',textAlign:'center',fontWeight:700,color:'#555',borderBottom:'1px solid #e2e8f0'}}>Instrument</th>
              {Array.from({length:s.readingCount},(_,ri)=>{
                const c=READING_COLORS[ri%READING_COLORS.length];
                return <th key={ri} style={{padding:'7px 8px',textAlign:'center',fontWeight:700,
                  color:c.header,borderBottom:`2px solid ${c.border}`,minWidth:80,background:`${c.fill}88`}}>
                  Reading {ri+1}
                </th>;
              })}
            </tr>
          </thead>
          <tbody>
            {colLabels.map(({idx,label,spec,tolerance,inst})=>(
              <tr key={idx} style={{borderBottom:'1px solid #f1f5f9'}}>
                <td style={{padding:'6px 12px',fontWeight:600,color:'#333'}}>{label}</td>
                <td style={{padding:'6px 8px',textAlign:'center',color:'#555',fontSize:12}}>{spec||'—'}</td>
                <td style={{padding:'6px 8px',textAlign:'center',color:'#e65100',fontSize:12,fontWeight:600}}>{tolerance||'—'}</td>
                <td style={{padding:'6px 8px',textAlign:'center',color:'#1565c0',fontSize:12}}>{inst||'—'}</td>
                {Array.from({length:s.readingCount},(_,ri)=>{
                  const c=READING_COLORS[ri%READING_COLORS.length];
                  const val=(s.readings[ri]||[])[idx]||'—';
                  return <td key={ri} style={{padding:'6px 8px',textAlign:'center',
                    color:val==='NG'?'#e53935':val!=='—'?c.text:'#aaa',
                    fontWeight:val!=='—'?700:400}}>{val}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   makeSlot helper
═══════════════════════════════════════════════════════════ */
const makeSlot = (id, type, subType='', slotDate='') => ({
  id, type, subType,
  date: slotDate || new Date().toISOString().split('T')[0],
  savedAt: null,
  readingCount: 2,
  readings: [
    Array(MAX_COLS).fill(''),
    Array(MAX_COLS).fill(''),
  ],
});

/* ═══════════════════════════════════════════════════════════
   MAIN Form component
═══════════════════════════════════════════════════════════ */
const Form = ({ onSubmit, onCancel, initialData={}, items=[] }) => {
  const [step, setStep] = useState(1);
  const [dbOptions, setDbOptions]     = useState({ customers:[], part_names:[], part_numbers:[], operations:[] });
  const [optionsLoading, setOptionsLoading] = useState(true);

  useEffect(() => {
    getDropdownOptions()
      .then(data => {
        setDbOptions(data);
        setOptionsLoading(false);
        if (data.part_numbers?.length === 1)
          setHeader(p => ({...p, partNumber: data.part_numbers[0]}));
      })
      .catch(() => setOptionsLoading(false));
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
    existingProducts.length>0
      ? existingProducts.map(r=>({name:r.item||'',spec:r.spec||'',tolerance:r.tolerance?.replace('± ','')||'',inst:r.inst||''}))
      : [emptyRow()]
  );
  const [processRows, setProcessRows] = useState(
    existingProcesses.length>0
      ? existingProcesses.map(r=>({name:r.item||'',spec:r.spec||'',tolerance:r.tolerance||'',inst:r.inst||''}))
      : [emptyRow()]
  );

  useEffect(() => {
    if (!header.operationName) return;
    fetchInspectionItems(header.operationName).then(data => {
      setProductRows(data.product?.length>0
        ? [...data.product.map(i=>({name:i.name||'',spec:i.spec||'',tolerance:i.tolerance||'',inst:i.instrument||''})),emptyRow()]
        : [emptyRow()]);
      setProcessRows(data.process?.length>0
        ? [...data.process.map(i=>({name:i.name||'',spec:i.spec||'',tolerance:i.tolerance||'',inst:i.instrument||''})),emptyRow()]
        : [emptyRow()]);
    });
  }, [header.operationName]);

  const filledProducts  = productRows.filter(r=>r.name&&r.spec&&r.inst);
  const filledProcesses = processRows.filter(r=>r.name&&r.spec&&r.inst);

  const [schedDate, setSchedDate]     = useState(initialData.date||new Date().toISOString().split('T')[0]);
  const existingEntries               = initialData.schedule_entries||[];
  const firstEntry                    = existingEntries[0]||{};
  const [operatorName, setOperatorName] = useState(firstEntry.operator||'');
  const [mcNo, setMcNo]               = useState(firstEntry.machine_no||'');
  const today                         = new Date().toISOString().split('T')[0];

  const buildInitialSlots = () => {
    if (!existingEntries.length) return [];
    const map = {};
    existingEntries.forEach(e => {
      const k = e.slot_index??0;
      if (!map[k]) map[k] = {
        id:k+1, type:e.time_type||'SETUP', subType:e.time_type||'SETUP',
        date:e.date||today, savedAt:e.filled_at?new Date(e.filled_at).getTime():null,
        readingCount:2, readings:[Array(MAX_COLS).fill(''),Array(MAX_COLS).fill('')]
      };
      const vals=Array(MAX_COLS).fill('');
      for(let i=0;i<MAX_COLS;i++) vals[i]=e[`value_${i+1}`]||'';
      const ri=e.row_order||0;
      while(map[k].readings.length<=ri) map[k].readings.push(Array(MAX_COLS).fill(''));
      map[k].readings[ri]=vals;
      map[k].readingCount=Math.max(map[k].readingCount, map[k].readings.length);
    });
    return Object.values(map).sort((a,b)=>a.id-b.id);
  };

  const initSlots = buildInitialSlots();
  const [slots, setSlots]                     = useState(initSlots);
  const [nextId, setNextId]                   = useState(initSlots.length+1);
  const [schedModal, setSchedModal]           = useState(null);
  const [modalActiveSlot, setModalActiveSlot] = useState(null);
  const [modalSlotType, setModalSlotType]     = useState('');
  const [updateSlotId, setUpdateSlotId]       = useState(null);
  const [savedModalSlots, setSavedModalSlots] = useState([]);

  const LS_KEY = `slot_timestamps_${header.partNumber||'default'}`;
  const [slotTimestamps, setSlotTimestamps] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY)||'{}'); } catch { return {}; }
  });
  const saveTimestamp = (type) => {
    const updated = {...slotTimestamps,[type]:Date.now()};
    setSlotTimestamps(updated);
    try { localStorage.setItem(LS_KEY,JSON.stringify(updated)); } catch {}
  };

  /* ── add / remove reading ── */
  const handleAddReading = (isModal, slotId) => {
    if (isModal) {
      setModalActiveSlot(p => {
        if (!p || p.readingCount>=MAX_READINGS) return p;
        return {...p, readingCount:p.readingCount+1, readings:[...p.readings, Array(MAX_COLS).fill('')]};
      });
    } else {
      setSlots(p=>p.map(s=> s.id!==slotId||s.readingCount>=MAX_READINGS ? s
        : {...s, readingCount:s.readingCount+1, readings:[...s.readings,Array(MAX_COLS).fill('')]}
      ));
    }
  };

  const handleRemoveReading = (isModal, slotId) => {
    if (isModal) {
      setModalActiveSlot(p => {
        if (!p || p.readingCount<=1) return p;
        return {...p, readingCount:p.readingCount-1, readings:p.readings.slice(0,-1)};
      });
    } else {
      setSlots(p=>p.map(s=> s.id!==slotId||s.readingCount<=1 ? s
        : {...s, readingCount:s.readingCount-1, readings:s.readings.slice(0,-1)}
      ));
    }
  };

  /* ── set cell value ── */
  const handleSetVal = (isModal, slotId, ri, ci, val) => {
    if (isModal) {
      setModalActiveSlot(p => ({
        ...p,
        readings: p.readings.map((r,rIdx)=> rIdx===ri ? r.map((v,cIdx)=>cIdx===ci?val:v) : r)
      }));
    } else {
      setSlots(p=>p.map(s=> s.id!==slotId ? s : {
        ...s,
        readings: s.readings.map((r,rIdx)=> rIdx===ri ? r.map((v,cIdx)=>cIdx===ci?val:v) : r)
      }));
    }
  };

  /* ── colLabels ── */
  const colLabels = [
    ...filledProducts.map((r,i)=>{
      const {spec:s,tol:t}=parseSpecTol(r.spec);
      return {idx:i,label:`${i+1}. ${r.name}`,spec:s||r.spec||'—',tolerance:r.tolerance?`± ${r.tolerance}`:(t||'—'),inst:r.inst||'—'};
    }),
    ...filledProcesses.map((r,i)=>{
      const {spec:s,tol:t}=parseSpecTol(r.spec);
      return {idx:filledProducts.length+i,label:`${filledProducts.length+i+1}. ${r.name}`,spec:s||r.spec||'—',tolerance:r.tolerance?r.tolerance:(t||'—'),inst:r.inst||'—'};
    }),
  ].slice(0,MAX_COLS);

  const isSetupFilled = slots.some(s=>s.readings.some(r=>r.some(v=>v&&v.trim())));
  const TYPE_ORDER    = ['SETUP','4HRS','LAST'];
  const getSorted     = () => [...slots].sort((a,b)=>{
    const ai=TYPE_ORDER.indexOf(a.type),bi=TYPE_ORDER.indexOf(b.type);
    return ai!==bi?ai-bi:a.id-b.id;
  });

  /* ── Save & show locked card inline (keep modal open) ── */
  const handleSaveAndClose = (slot) => {
    const savedSlot = {...slot, savedAt: Date.now()};
    setSlots(prev => {
      const li = [...prev].map(x=>x.type).lastIndexOf(savedSlot.type);
      const at = li >= 0 ? li+1 : prev.length;
      const n  = [...prev];
      n.splice(at, 0, savedSlot);
      return n;
    });
    saveTimestamp(slot.type);
    setSavedModalSlots(prev => [...prev, savedSlot]);
    setModalActiveSlot(null);
    setModalSlotType('');
  };

  const handleDone = () => { setSchedModal(null); setUpdateSlotId(null); };

  const handleSubmit = () => {
    if (!step1Done)       { alert('Step 1 pura karo'); return; }
    if (!operatorName)    { alert('Operator select karo!'); return; }
    if (!mcNo)            { alert('M/C No select karo!'); return; }
    if (slots.length===0) { alert('Pehle SETUP ki report bharo!'); return; }

    if (modalActiveSlot && modalActiveSlot.readings.some(r=>r.some(v=>v&&v.trim()))) {
      handleSaveAndClose(modalActiveSlot);
    }

    const allItems = [
      ...filledProducts.map((r,i)=>{const p=parseSpecTol(r.spec);return{sr_no:i+1,item:r.name,spec:p.spec||r.spec,tolerance:r.tolerance?`± ${r.tolerance}`:p.tol,inst:r.inst};}),
      ...filledProcesses.map((r,i)=>{const p=parseSpecTol(r.spec);return{sr_no:11+i,item:r.name,spec:p.spec||r.spec,tolerance:r.tolerance?r.tolerance:p.tol,inst:r.inst};}),
    ];
    const scheduleEntries = [];
    slots.forEach((slot,si)=>{
      const filledAt=slot.savedAt?new Date(slot.savedAt).toISOString():new Date().toISOString();
      slot.readings.forEach((readingArr,ri)=>{
        const e={time_type:slot.type,row_order:ri,slot_index:si,operator:operatorName,machine_no:mcNo,date:slot.date||schedDate,filled_at:filledAt};
        readingArr.forEach((v,i)=>{e[`value_${i+1}`]=v||'';});
        scheduleEntries.push(e);
      });
    });
    onSubmit({
      partName:header.partName, partNumber:header.partNumber,
      operationName:header.operationName, customerName:header.customerName,
      scheduleDate:schedDate, operatorName, mcNo,
      items:allItems, schedule_entries:scheduleEntries,
    });
  };

  const stepDone = [false, step1Done, isSetupFilled];
  const progress = ((step-1)/1)*100;

  return (
    <div className="wiz-wrap">
      <div className="wiz-topbar">
        <button onClick={onCancel} className="wiz-back-btn">← Back</button>
        <span className="wiz-topbar-title">
          <i className="bi bi-clipboard2-pulse-fill" style={{marginRight:8,fontSize:18,verticalAlign:'middle'}}></i>
          Inspection Form
        </span>
        <div style={{width:60}} />
      </div>

      <div className="wiz-body">
        <div className="wiz-progress-wrap">
          <div className="wiz-progress-track">
            <div className="wiz-progress-fill" style={{width:`${progress}%`}} />
          </div>
          <div className="wiz-steps-row">
            {STEPS.map(s=>(
              <div key={s.id}
                className={`wiz-step-dot${step===s.id?' active':''}${stepDone[s.id]?' done':''}`}
                onClick={()=>{ if(s.id<step||stepDone[s.id-1]||s.id===1) setStep(s.id); }}>
                <div className="wiz-dot-circle">
                  {stepDone[s.id]?'✓':<i className={s.icon} style={{fontSize:18}}></i>}
                </div>
                <div className="wiz-dot-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ════ STEP 1 ════ */}
        {step===1 && (
          <>
            <div className="wiz-card">
              <div className="wiz-card-title">
                <i className="bi bi-file-earmark-text-fill" style={{marginRight:8,color:'#1976d2'}}></i>
                Report Information
              </div>
              <div className="wiz-grid-2">
                <Field label="Customer"   value={header.customerName}  onChange={v=>setHeader(p=>({...p,customerName:v}))}  options={dbOptions.customers}    placeholder={optionsLoading?'Loading...':'Select customer...'}  required />
                <Field label="Part Name"  value={header.partName}      onChange={v=>setHeader(p=>({...p,partName:v}))}      options={dbOptions.part_names}   placeholder={optionsLoading?'Loading...':'Select part...'}       required />
                <Field label="Operation"  value={header.operationName} onChange={v=>setHeader(p=>({...p,operationName:v}))} options={dbOptions.operations}   placeholder={optionsLoading?'Loading...':'Select operation...'}  required />
                {header.customerName && header.partName && header.operationName
                  ? (dbOptions.part_numbers.length===1
                      ? <div style={{display:'flex',flexDirection:'column',gap:4}}>
                          <label className="wiz-label">Part Number <span style={{color:'#e53935'}}>*</span></label>
                          <div style={{padding:'10px 14px',border:'1px solid #ccc',borderRadius:6,background:'#f5f5f5',fontWeight:600,color:'#333'}}>{header.partNumber}</div>
                        </div>
                      : <Field label="Part Number" value={header.partNumber} onChange={v=>setHeader(p=>({...p,partNumber:v}))} options={dbOptions.part_numbers} placeholder="Select number..." required />
                    )
                  : null}
              </div>
            </div>
            {step1Done && (
              <div className="wiz-card" style={{marginTop:16}}>
                <div className="wiz-card-title">
                  <i className="bi bi-search" style={{marginRight:8,color:'#1976d2'}}></i>
                  Inspection Items
                </div>
                <CombinedTable productRows={filledProducts} processRows={filledProcesses} />
              </div>
            )}
          </>
        )}

        {/* ════ STEP 2 ════ */}
        {step===2 && (
          <div className="wiz-card">
            <div className="wiz-card-title">
              <i className="bi bi-calendar2-week-fill" style={{marginRight:8,color:'#1976d2'}}></i>
              Schedule
            </div>

            <div className="wiz-grid-3" style={{marginBottom:20}}>
              <div className="wiz-field">
                <label className="wiz-label">Date <span style={{color:'#e53935'}}>*</span></label>
                <div className="date-box">
                  <span>{schedDate?schedDate.split('-').reverse().join('/'):'DD/MM/YYYY'}</span>
                  <span><i className="bi bi-calendar3"></i></span>
                  <input type="date" value={schedDate} onChange={e=>setSchedDate(e.target.value)} className="date-input-hidden" />
                </div>
              </div>
              <Field label="Operator" required value={operatorName} onChange={setOperatorName} options={OPERATOR_NAMES} placeholder="Select operator..." />
              <Field label="M/C No"   required value={mcNo}         onChange={setMcNo}         options={Array.from({length:23},(_,i)=>String(i+1))} placeholder="Select machine..." />
            </div>

            {/* 3 action buttons */}
            <div className="sq-btn-row" style={{display:schedModal==='add'?'none':'flex'}}>
              {[
                {key:'add',    label:'New Add', icon:'bi bi-plus-circle-fill', color:'#2563eb',bg:'#eff6ff',shadow:'rgba(37,99,235,0.2)',  active:schedModal==='add',
                  onClick:()=>setSchedModal(schedModal==='add'?null:'add')},
                {key:'update', label:'Update',  icon:'bi bi-pencil-square',    color:'#7c3aed',bg:'#f5f3ff',shadow:'rgba(124,58,237,0.2)', active:schedModal==='update',
                  onClick:()=>{ if(!slots.some(s=>s.readings.some(r=>r.some(v=>v&&v.trim())))){alert('Pehle kuch fill karo');return;} setSchedModal(schedModal==='update'?null:'update'); setUpdateSlotId(null); }},
                {key:'view',   label:'View',    icon:'bi bi-eye-fill',         color:'#059669',bg:'#ecfdf5',shadow:'rgba(5,150,105,0.2)', active:schedModal==='view',
                  onClick:()=>{ if(!slots.some(s=>s.readings.some(r=>r.some(v=>v&&v.trim())))){alert('Koi data nahi hai abhi');return;} setSchedModal(schedModal==='view'?null:'view'); }},
              ].map(btn=>(
                <button key={btn.key} onClick={btn.onClick} className="sq-btn" style={{
                  border:btn.active?`2px solid ${btn.color}`:'1px solid #cbd5e1',
                  background:btn.active?btn.bg:'#fff',
                  boxShadow:btn.active?`0 4px 12px ${btn.shadow}`:'0 1px 3px rgba(0,0,0,0.06)',
                }}>
                  <div className="sq-btn-inner" style={{color:btn.active?btn.color:'#475569'}}>
                    <i className={btn.icon} style={{fontSize:22}}></i>
                    {btn.label}
                  </div>
                </button>
              ))}
            </div>

            {/* ── NEW ADD ── */}
            {schedModal==='add' && (
              <div style={{position:'relative',background:'#f8fafc',borderRadius:12,
                border:'1px solid #e2e8f0',margin:'0 -24px',padding:'16px 48px 16px 24px',marginBottom:16}}>

                {/* Close X */}
                <button
                  onClick={()=>{setSchedModal(null);setModalActiveSlot(null);setModalSlotType('');setSavedModalSlots([]);}}
                  style={{position:'absolute',top:12,right:12,background:'transparent',border:'none',
                    fontSize:20,color:'#94a3b8',cursor:'pointer',width:32,height:32,
                    borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}
                  onMouseOver={e=>{e.currentTarget.style.background='#f1f5f9';e.currentTarget.style.color='#334155';}}
                  onMouseOut={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#94a3b8';}}>✕</button>

                {/* SETUP / 4HRS / LAST buttons */}
                <div className="med-btn-row" style={{width:'100%',marginBottom:14}}>
                  {[
                    {label:'SETUP',sub:'SETUP',activeBg:'#2563eb'},
                    {label:'4HRS', sub:'4HRS', activeBg:'#7c3aed'},
                    {label:'LAST', sub:'LAST', activeBg:'#e11d48'},
                  ].map(btn=>{
                    const isActive     = modalSlotType===btn.sub;
                    const isFilled     = slots.some(s=>s.type===btn.sub&&s.readings.some(r=>r.some(v=>v&&v.trim())));
                    const setupSavedAt = slotTimestamps['SETUP']||slots.find(s=>s.type==='SETUP'&&s.savedAt)?.savedAt||null;
                    const fhrsSavedAt  = slotTimestamps['4HRS'] ||slots.find(s=>s.type==='4HRS' &&s.savedAt)?.savedAt||null;
                    const setupFilled  = slots.some(s=>s.type==='SETUP'&&s.readings.some(r=>r.some(v=>v&&v.trim())));
                    const fhrsFilled   = slots.some(s=>s.type==='4HRS' &&s.readings.some(r=>r.some(v=>v&&v.trim())));
                    const now=Date.now(), FOUR=4*60*60*1000;
                    let isLocked=false, lockMsg='', timeLeft='';
                    if (btn.sub==='4HRS'){
                      if(!setupFilled||!setupSavedAt){isLocked=true;lockMsg='Pehle SETUP ki report bharni hogi!';}
                      else if(now-setupSavedAt<FOUR){isLocked=true;const rem=FOUR-(now-setupSavedAt);timeLeft=`${Math.floor(rem/3600000)}h ${Math.floor((rem%3600000)/60000)}m`;lockMsg=`SETUP ke 4 ghante baad khulega! (${timeLeft})`;}
                    }
                    if (btn.sub==='LAST'){
                      if(!fhrsFilled||!fhrsSavedAt){isLocked=true;lockMsg='Pehle 4HRS ki report bharni hogi!';}
                      else if(now-fhrsSavedAt<FOUR){isLocked=true;const rem=FOUR-(now-fhrsSavedAt);timeLeft=`${Math.floor(rem/3600000)}h ${Math.floor((rem%3600000)/60000)}m`;lockMsg=`4HRS ke 4 ghante baad khulega! (${timeLeft})`;}
                    }
                    return (
                      <button key={btn.sub} className="med-btn"
                        onClick={()=>{
                          if(isLocked){alert(lockMsg);return;}
                          setModalSlotType(btn.sub);
                          // Pehle se saved slots of this type ko locked cards mein dikhao
                          const existingOfType = slots.filter(s => s.type === btn.sub && s.readings.some(r => r.some(v => v && v.trim())));
                          setSavedModalSlots(existingOfType);
                          setModalActiveSlot(makeSlot(nextId, btn.sub, btn.sub));
                          setNextId(p=>p+1);
                        }}
                        title={isLocked?lockMsg:''}
                        style={{
                          border:isActive?`2px solid ${btn.activeBg}`:isFilled?'2px solid #16a34a':isLocked?'1px dashed #cbd5e1':'1px solid #cbd5e1',
                          background:isActive?btn.activeBg:isFilled?'#dcfce7':isLocked?'#f8f8f8':'#f8fafc',
                          color:isActive?'#fff':isFilled?'#15803d':isLocked?'#c0c0c0':'#475569',
                          boxShadow:isActive?`0 4px 12px ${btn.activeBg}40`:'0 1px 3px rgba(0,0,0,0.04)',
                          cursor:isLocked?'not-allowed':'pointer',flexDirection:'column',gap:4,
                        }}>
                        {isFilled&&!isActive&&<span style={{fontSize:13}}>✓</span>}
                        {isLocked&&!isFilled&&<i className="bi bi-lock-fill" style={{fontSize:16}}></i>}
                        <span>{btn.label}</span>
                        {isLocked&&timeLeft&&<span style={{fontSize:9,fontWeight:600,color:'#a0a0a0',lineHeight:1.2}}>{timeLeft} later</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Locked saved cards shown inline */}
                {savedModalSlots.length > 0 && (
                  <div style={{marginBottom: modalActiveSlot ? 16 : 0}}>
                    {savedModalSlots.map((s,i) => (
                      <LockedSlotCard key={i} slot={s} colLabels={colLabels} />
                    ))}
                  </div>
                )}

                {/* Active editable table */}
                {modalActiveSlot && (
                  <ReadingTable
                    slot={modalActiveSlot}
                    isModal={true}
                    colLabels={colLabels}
                    onAddReading={handleAddReading}
                    onRemoveReading={handleRemoveReading}
                    onSetVal={handleSetVal}
                    onSaveAndClose={handleSaveAndClose}
                    onDone={handleDone}
                  />
                )}

                {/* Hint when nothing active but something saved */}
                {!modalActiveSlot && savedModalSlots.length > 0 && (
                  <div style={{textAlign:'center',color:'#64748b',fontSize:13,padding:'14px 0',
                    background:'#f0f4ff',borderRadius:8,border:'1px dashed #c5cae9',marginTop:4}}>
                    <i className="bi bi-plus-circle" style={{marginRight:6,color:'#2563eb'}}></i>
                    Upar se koi aur slot select karo ya ✕ se band karo
                  </div>
                )}
              </div>
            )}

            {/* ── UPDATE ── */}
            {schedModal==='update' && (
              <div style={{position:'relative',background:'#fff',border:'1px solid #e2e8f0',
                borderRadius:16,padding:'24px',marginBottom:16,boxShadow:'0 10px 25px -5px rgba(0,0,0,0.05)'}}>
                <button onClick={()=>{setSchedModal(null);setUpdateSlotId(null);}}
                  style={{position:'absolute',top:12,right:12,background:'transparent',border:'none',
                    fontSize:20,color:'#94a3b8',cursor:'pointer',width:32,height:32,
                    borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}
                  onMouseOver={e=>{e.currentTarget.style.background='#f1f5f9';e.currentTarget.style.color='#334155';}}
                  onMouseOut={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#94a3b8';}}>✕</button>

                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,paddingRight:30}}>
                  <select value={updateSlotId?String(updateSlotId):''} onChange={e=>setUpdateSlotId(e.target.value?Number(e.target.value):null)}
                    style={{flex:1,padding:'12px 14px',borderRadius:8,border:'1px solid #cbd5e1',
                      background:'#f8fafc',fontWeight:600,fontSize:14,cursor:'pointer',color:'#334155',outline:'none'}}>
                    <option value="">-- Select Saved Slot to Edit --</option>
                    {(()=>{
                      const typeCount={};
                      slots.forEach(s=>{typeCount[s.type]=(typeCount[s.type]||0)+1;});
                      const typeIdx={};
                      return getSorted().map(s=>{
                        typeIdx[s.type]=(typeIdx[s.type]||0)+1;
                        const label=typeCount[s.type]>1?`${s.subType||s.type} #${typeIdx[s.type]}`:(s.subType||s.type);
                        const cnt=s.readings.reduce((a,r)=>a+r.filter(v=>v&&v.trim()).length,0);
                        return <option key={s.id} value={String(s.id)}>{label}{cnt>0?` ✓ ${cnt} filled`:' (Empty)'}</option>;
                      });
                    })()}
                  </select>
                </div>
                {updateSlotId && (()=>{
                  const s=slots.find(x=>x.id===updateSlotId);
                  return s ? (
                    <ReadingTable
                      slot={s}
                      isModal={false}
                      colLabels={colLabels}
                      onAddReading={handleAddReading}
                      onRemoveReading={handleRemoveReading}
                      onSetVal={handleSetVal}
                      onSaveAndClose={handleSaveAndClose}
                      onDone={handleDone}
                    />
                  ) : null;
                })()}
              </div>
            )}

            {/* ── VIEW ── */}
            {schedModal==='view' && (
              <div style={{position:'relative',background:'#fff',border:'1px solid #e2e8f0',
                borderRadius:16,padding:'24px',marginBottom:16,boxShadow:'0 10px 25px -5px rgba(0,0,0,0.05)'}}>
                <button onClick={()=>setSchedModal(null)}
                  style={{position:'absolute',top:12,right:12,background:'transparent',border:'none',
                    fontSize:20,color:'#94a3b8',cursor:'pointer',width:32,height:32,
                    borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}
                  onMouseOver={e=>{e.currentTarget.style.background='#f1f5f9';e.currentTarget.style.color='#334155';}}
                  onMouseOut={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#94a3b8';}}>✕</button>

                <div style={{fontWeight:800,fontSize:16,marginBottom:14,color:'#334155',paddingRight:30}}>
                  <i className="bi bi-list-check" style={{marginRight:8,color:'#059669'}}></i>All Completed Entries
                </div>

                {slots
                  .filter(s=>s.readings.some(r=>r.some(v=>v&&v.trim())))
                  .map(s=>(
                    <ViewSlotCard key={s.id} s={s} colLabels={colLabels} />
                  ))
                }
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="wiz-footer">
        {step>1
          ? <button onClick={()=>setStep(s=>s-1)} className="wiz-btn-back">
              <i className="bi-arrow-left-circle-fill" style={{marginRight:6}}></i>Back
            </button>
          : <button onClick={onCancel} className="wiz-btn-back">Cancel</button>
        }
        {step<2
          ? <button onClick={()=>setStep(s=>s+1)} disabled={step===1&&!step1Done} className={`wiz-btn-next${(step===1&&!step1Done)?' disabled':''}`}>
              Next <i className="bi-arrow-right-circle-fill" style={{marginLeft:6}}></i>
            </button>
          : <button onClick={handleSubmit} className="wiz-btn-save">
              <i className="bi bi-check-circle-fill" style={{marginRight:6}}></i>Save
            </button>
        }
      </div>
    </div>
  );
};

export default Form;
