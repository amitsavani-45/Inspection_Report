import React, { useState, useEffect } from 'react';
import { getDropdownOptions } from './services/api';
import { useNavigate } from 'react-router-dom';
import './Inspection.css';
import atomone from './image/atomone.jpg';


const formatDisplay = (dateStr) => {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

const Inspection = ({ items=[], currentReport, onFilter, onNewForm, onEditForm }) => {
  const navigate = useNavigate();

  if (currentReport?.date) {
    localStorage.setItem('headerDate', currentReport.date);
  }
  const displayDate = formatDisplay(localStorage.getItem('headerDate')) || '';

  const [showFilter,     setShowFilter]     = useState(false);
  const [filterDate,     setFilterDate]     = useState('');
  const [filterPart,     setFilterPart]     = useState('');
  const [filterOp,       setFilterOp]       = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');

  // DB se dropdown options
  const [dbOptions, setDbOptions] = useState({ customers: [], part_names: [], operations: [] });
  useEffect(() => {
    getDropdownOptions()
      .then(data => setDbOptions(data))
      .catch(err => console.error('Filter options fetch failed:', err));
  }, []);

  const scheduleEntries = currentReport?.schedule_entries || [];
  const productItems    = items.filter(x=>x.sr_no>=1 &&x.sr_no<=10).sort((a,b)=>a.sr_no-b.sr_no);
  const processItems    = items.filter(x=>x.sr_no>=11&&x.sr_no<=20).sort((a,b)=>a.sr_no-b.sr_no);
  const productCount    = productItems.filter(x=>x.item&&x.item.trim()!=='').length;
  const totalRows       = 10;
  const totalFilledCols = Math.min(productCount + processItems.filter(x=>x.item&&x.item.trim()!=='').length, 20);

  // ── Build schedule rows for report ──
  const buildScheduleRows = () => {
    const empty20 = () => Array(20).fill('');

    // Group entries by sr number
    const grouped = {};
    scheduleEntries.forEach(entry => {
      const sr = entry.sr || 1;
      if (!grouped[sr]) {
        grouped[sr] = {
          sr,
          date: formatDisplay(entry.date) || '',
          operator: entry.operator || '',
          mcNo: entry.machine_no || '',
          rawEntries: []
        };
      }
      grouped[sr].rawEntries.push(entry);
    });

    // Agar koi bhi entry nahi hai toh default empty row show karo
    if (Object.keys(grouped).length === 0) {
      return [{
        sr:1, date:'', operator:'', mcNo:'',
        slots:[
          {time:'SETUP', row_order:0, values:empty20()},
          {time:'4HRS',  row_order:0, values:empty20()},
          {time:'LAST',  row_order:0, values:empty20()},
        ]
      }];
    }

    return Object.values(grouped).map(grp => {
      // slot_index aur row_order se sort karo
      const sorted = [...grp.rawEntries].sort((a,b) => {
        const si = (a.slot_index??0) - (b.slot_index??0);
        if (si!==0) return si;
        return (a.row_order??0) - (b.row_order??0);
      });

      // slotMap: slot_index → {time_type, up, down}
      const slotMap = {};
      sorted.forEach(e => {
        const si = e.slot_index ?? 0;
        if (!slotMap[si]) slotMap[si] = { time_type: e.time_type, up: null, down: null };
        const vals = empty20();
        for(let i=0; i<20; i++) vals[i] = e[`value_${i+1}`] || '';
        if (e.row_order === 0) slotMap[si].up   = vals;
        else                   slotMap[si].down  = vals;
      });

      // slot_index order se slots banao
      const slots = Object.entries(slotMap)
        .sort((a,b) => Number(a[0]) - Number(b[0]))
        .flatMap(([, s]) => {
          const rows = [{time: s.time_type, row_order:0, values: s.up || empty20()}];
          // down row sirf tab dikhao jab actual data ho
          if (s.down !== null && s.down.some(v => v !== ''))
            rows.push({time: s.time_type, row_order:1, values: s.down});
          return rows;
        });

      return { sr: grp.sr, date: grp.date, operator: grp.operator, mcNo: grp.mcNo, slots };
    });
  };

  const scheduleRows       = buildScheduleRows();
  const totalSchedHtmlRows = scheduleRows.reduce((sum,s)=>sum+s.slots.length, 0);

  // ── Print layout heights (A4 landscape 6mm margin = 749px usable) ──
  // Total usable = 749px
  // Fixed sections: header=67, fleet=60, footer=40, gaps(5×2)=10 → used=177
  // Remaining for insp+schedule = 749 - 177 = 572px
  const TOTAL_USABLE   = 572;
  const SCHED_THEAD    = 22;                                         // schedule header
  const SCHED_ROW_H    = 26;                                         // each schedule row (fixed)
  const SCHED_H        = SCHED_THEAD + totalSchedHtmlRows * SCHED_ROW_H;
  const INSP_THEAD     = 26;                                         // inspection header
  const inspAvailable  = TOTAL_USABLE - SCHED_H - INSP_THEAD;       // space left for 10 rows
  const inspRowH       = Math.max(18, inspAvailable / 10);           // stretch rows to fill — min 18px
  const inspTotalH     = INSP_THEAD + 10 * inspRowH;

  // ── Filter ──
  const isAnyFilterActive = filterDate||filterPart||filterOp||filterCustomer;
  const handleFilterApply = () => {
    if (!isAnyFilterActive){ alert('Please select at least one filter.'); return; }
    if (onFilter) onFilter({date:filterDate,partName:filterPart,operation:filterOp,customerName:filterCustomer});
    setShowFilter(false);
  };
  const handleFilterReset = () => {
    setFilterDate(''); setFilterPart(''); setFilterOp(''); setFilterCustomer('');
    localStorage.removeItem('headerDate');
    setShowFilter(false);
  };

  const colPct = `${(75/Math.max(totalFilledCols,1)).toFixed(2)}%`;

  return (
    <div className="inspection-container">

      {/* ── Top Bar (no-print) ── */}
      <div className="no-print" style={{display:'flex',justifyContent:'flex-end',alignItems:'center',gap:'12px',marginBottom:'10px'}}>
        <div style={{position:'relative'}}>
          <button onClick={()=>setShowFilter(p=>!p)} style={{background:showFilter?'#1565c0':'#1976d2',color:'#fff',border:'none',padding:'8px 20px',borderRadius:'6px',fontWeight:'bold',cursor:'pointer',fontSize:'14px'}}>
            🔍 Filter {isAnyFilterActive?'●':''}
          </button>
          {showFilter&&(
            <>
              <div onClick={()=>setShowFilter(false)} style={{position:'fixed',inset:0,zIndex:998}}/>
              <div style={{position:'absolute',right:0,top:'46px',zIndex:999,background:'#fff',border:'1px solid #e0e0e0',borderRadius:'12px',boxShadow:'0 8px 32px rgba(0,0,0,0.18)',padding:'20px',minWidth:'320px'}}>
                <div style={{fontWeight:'bold',fontSize:'14px',marginBottom:'16px',color:'#1976d2',borderBottom:'2px solid #e3f2fd',paddingBottom:'10px',display:'flex',justifyContent:'space-between'}}>
                  <span>🔍 Filter Reports</span>
                  <span onClick={()=>setShowFilter(false)} style={{cursor:'pointer',color:'#999'}}>✕</span>
                </div>
                {[
                  {label:'📅 Date', content:(
                    <div style={{position:'relative',display:'flex',alignItems:'center',border:`1px solid ${filterDate?'#1976d2':'#ccc'}`,borderRadius:'6px',padding:'7px 10px',background:filterDate?'#e3f2fd':'#fff',cursor:'pointer'}}>
                      <span style={{fontSize:'13px',flex:1,color:filterDate?'#1976d2':'#999'}}>{filterDate?filterDate.split('-').reverse().join('/'):'Select Date'}</span>
                      <input type="date"  value={filterDate} onChange={e=>setFilterDate(e.target.value)} style={{position:'absolute',opacity:0,width:'100%',height:'100%',cursor:'pointer',top:0,left:0}}/>📅
                    </div>
                  )},
                  {label:'🔩 Part Name', content:(
                    <select value={filterPart} onChange={e=>setFilterPart(e.target.value)} style={{width:'100%',padding:'7px 10px',border:`1px solid ${filterPart?'#1976d2':'#ccc'}`,borderRadius:'6px',fontSize:'13px'}}>
                      <option value="">All Parts</option>
                      {dbOptions.part_names.map(p=><option key={p} value={p}>{p}</option>)}
                    </select>
                  )},
                  {label:'⚙️ Operation', content:(
                    <select value={filterOp} onChange={e=>setFilterOp(e.target.value)} style={{width:'100%',padding:'7px 10px',border:`1px solid ${filterOp?'#1976d2':'#ccc'}`,borderRadius:'6px',fontSize:'13px'}}>
                      <option value="">All Operations</option>
                      {dbOptions.operations.map(op=><option key={op} value={op}>{op}</option>)}
                    </select>
                  )},
                  {label:'🏭 Customer', content:(
                    <select value={filterCustomer} onChange={e=>setFilterCustomer(e.target.value)} style={{width:'100%',padding:'7px 10px',border:`1px solid ${filterCustomer?'#1976d2':'#ccc'}`,borderRadius:'6px',fontSize:'13px'}}>
                      <option value="">All Customers</option>
                      {dbOptions.customers.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  )},
                ].map(({label,content})=>(
                  <div key={label} style={{marginBottom:'14px'}}>
                    <label style={{fontSize:'11px',fontWeight:'700',color:'#555',display:'block',marginBottom:'5px',textTransform:'uppercase'}}>{label}</label>
                    {content}
                  </div>
                ))}
                <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
                  <button onClick={handleFilterApply} style={{flex:1,background:'#1976d2',color:'#fff',border:'none',padding:'9px',borderRadius:'6px',fontWeight:'bold',cursor:'pointer'}}>✅ Apply</button>
                  <button onClick={handleFilterReset}  style={{flex:1,background:'#fff',color:'#e53935',border:'1px solid #e53935',padding:'9px',borderRadius:'6px',fontWeight:'bold',cursor:'pointer'}}>🔄 Reset</button>
                </div>
              </div>
            </>
          )}
        </div>
        <button onClick={()=>{ if(onEditForm) onEditForm(); navigate('/form?mode=edit'); }} style={{background:'#ff9800',color:'#fff',border:'none',padding:'8px 20px',borderRadius:'6px',fontWeight:'bold',cursor:'pointer',fontSize:'14px'}}>✏️ Edit</button>
        <button onClick={()=>{ if(onNewForm) onNewForm(); navigate('/form?mode=new'); }} style={{background:'#4CAF50',color:'#fff',border:'none',padding:'8px 20px',borderRadius:'6px',fontWeight:'bold',cursor:'pointer',fontSize:'14px'}}>📋 New Form</button>
      </div>

      {/* ── Print Report ── */}
      <div className="inspection-report">

        {/* HEADER */}
        <table className="header-table">
          <tbody><tr>
            <td className="logo-cell"><img src={atomone} alt="ATOM ONE" className="logo-image"/></td>
            <td className="title-cell">SETUP &amp; PATROL INSPECTION REPORT</td>
            <td className="doc-info-cell">
              <table><tbody>
                <tr><td className="doc-label">DOC NO:</td>    <td className="doc-value">{currentReport?.doc_no||'KGTL-QCL-01'}</td></tr>
                <tr><td className="doc-label">REVISION NO:</td><td className="doc-value">{currentReport?.revision_no||'01'}</td></tr>
                <tr><td className="doc-label">DATE:</td>       <td className="doc-value">{displayDate||'DD/MM/YYYY'}</td></tr>
              </tbody></table>
            </td>
          </tr></tbody>
        </table>

        {/* FLEET INFO */}
        <table className="fleet-info-table">
          <tbody>
            <tr>
              <td className="field-label">CUSTOMER NAME</td>   <td className="field-input">{currentReport?.customer_name||''}</td>
              <td className="field-label">PART NAME</td><td className="field-input">{currentReport?.part_name||''}</td>
            </tr>
            <tr>
              <td className="field-label">OPERATION NAME</td>  <td className="field-input">{currentReport?.operation_name||''}</td>
              <td className="field-label">PART NUMBER</td>  <td className="field-input">{currentReport?.part_number||''}</td>
            </tr>
          </tbody>
        </table>

        {/* INSPECTION  */}
        <table className="inspection-table" style={{height:`${inspTotalH}px`}}>
          <thead>
            <tr style={{height:`${INSP_THEAD}px`}}>
              <th>SR. NO.</th><th>INSP. ITEM (PRODUCT)</th><th>SPEC.</th><th>TOLERANCE</th><th>INST.</th>
              <th>SR. NO.</th><th>INSP. ITEM (PROCESS)</th><th>SPEC.</th><th>TOLERANCE</th><th>INST.</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({length:totalRows},(_,i)=>{
              const product = productItems[i]||null;
              const process = processItems[i]||null;
              const pSR = product?.item?.trim() ? (i+1) : '';
              const rSR = process?.item?.trim()  ? (productCount+i+1) : '';
              return (
                <tr key={i} style={{height:`${inspRowH}px`}}>
                  <td>{pSR}</td>
                  <td style={{textAlign:'center',paddingLeft:'5px',fontWeight:'600'}}>{product?.item||''}</td>
                  <td>{product?.spec||''}</td><td>{product?.tolerance||''}</td><td>{product?.inst||''}</td>
                  <td>{rSR}</td>
                  <td style={{textAlign:'center',paddingLeft:'5px',fontWeight:'600'}}>{process?.item||''}</td>
                  <td>{process?.spec||''}</td><td>{process?.tolerance||''}</td><td>{process?.inst||''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* SCHEDULE — each row 26px fixed */}
        <div className="schedule-wrapper">
          <table className="schedule-table">
            <colgroup>
              <col style={{width:'2%'}}/>   {/* SR */}
              <col style={{width:'7%'}}/>   {/* DATE */}
              <col style={{width:'8%'}}/>   {/* OPERATOR */}
              <col style={{width:'4%'}}/>   {/* M/C NO */}
              <col style={{width:'3.5%'}}/> {/* TIME */}
              {Array.from({length:totalFilledCols},(_,i)=><col key={i} style={{width:colPct}}/>)}
              <col style={{width:'2.5%'}}/> {/* JDG */}
              <col style={{width:'7.5%'}}/> {/* SIGN INSPECTED */}
              <col style={{width:'7.5%'}}/> {/* SIGN VERIFIED */}
            </colgroup>
            <thead>
              <tr style={{height:`${SCHED_THEAD}px`}}>
                <th>SR</th><th>DATE</th><th>OPERATOR</th><th>M/C NO</th><th>TIME</th>
                {Array.from({length:totalFilledCols},(_,i)=><th key={i}>{i+1}</th>)}
                <th>JDG</th>
                <th style={{whiteSpace:'normal',lineHeight:'1.2'}}>SIGN (INSPECTED BY)</th>
                <th style={{whiteSpace:'normal',lineHeight:'1.2'}}>SIGN (VERIFIED BY)</th>
              </tr>
            </thead>
            <tbody>
              {scheduleRows.map((si, rowIdx)=>{
                const totalTimeRows = si.slots.length;
                const timeSpans = si.slots.map((row,idx)=>{
                  if (row.row_order===0){
                    const next = si.slots[idx+1];
                    if (next && next.row_order===1 && next.time===row.time) return 2;
                    return 1;
                  }
                  return 0;
                });
                return (
                  <React.Fragment key={rowIdx}>
                    {si.slots.map((row,timeIdx)=>{
                      const span = timeSpans[timeIdx];
                      return (
                        <tr key={`${rowIdx}-${timeIdx}`} style={{height:`${SCHED_ROW_H}px`}}>
                          {timeIdx===0 && <td rowSpan={totalTimeRows} style={{textAlign:'center',fontWeight:'bold',verticalAlign:'middle',fontSize:'10px'}}>{si.sr}</td>}
                          {timeIdx===0 && <td rowSpan={totalTimeRows} style={{textAlign:'center',fontSize:'8px',verticalAlign:'middle',whiteSpace:'normal',lineHeight:'1.2'}}>{si.date||''}</td>}
                          {timeIdx===0 && <td rowSpan={totalTimeRows} style={{textAlign:'center',fontSize:'8px',verticalAlign:'middle',whiteSpace:'normal',lineHeight:'1.2'}}>{si.operator||''}</td>}
                          {timeIdx===0 && <td rowSpan={totalTimeRows} style={{textAlign:'center',fontSize:'9px',verticalAlign:'middle'}}>{si.mcNo||''}</td>}
                          {span>0 && (
                            <td rowSpan={span} style={{textAlign:'center',fontWeight:'bold',fontSize:'8.5px',verticalAlign:'middle'}}>
                              {row.time}
                            </td>
                          )}
                          {Array.from({length:totalFilledCols},(_,ci)=>{
                            const val=row.values[ci]||'';
                            return <td key={ci} style={{textAlign:'center',fontSize:'9px',fontWeight:val?'600':'normal'}}>{val}</td>;
                          })}
                          {timeIdx===0 && <td rowSpan={totalTimeRows} style={{verticalAlign:'middle'}}></td>}
                          {timeIdx===0 && <td rowSpan={totalTimeRows} style={{verticalAlign:'middle'}}></td>}
                          {timeIdx===0 && <td rowSpan={totalTimeRows} style={{verticalAlign:'middle'}}></td>}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* FOOTER  */}
        <div className="footer">
          <div className="signature-field">
            <label>PREPARED BY:</label>
            <input type="text" readOnly value={currentReport?.prepared_by||''}/>
          </div>
          <div className="signature-field">
            <label>APPROVED BY:</label>
            <input type="text" readOnly value={currentReport?.approved_by||''}/>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Inspection;