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

const Inspection = ({ items=[], currentReport, onFilter, onEditForm }) => {
  const navigate = useNavigate();

  const displayDate = '01/01/2026';

  const [showFilter,     setShowFilter]     = useState(false);
  const [filterDate,     setFilterDate]     = useState('');
  const [filterPart,     setFilterPart]     = useState('');
  const [filterOp,       setFilterOp]       = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');

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

  const buildScheduleRows = () => {
    const empty20 = () => Array(20).fill('');
    const grouped = {};
    let srCounter = 1;
    scheduleEntries.forEach(entry => {
      const groupKey = `${entry.operator||''}__${entry.machine_no||''}__${entry.date||''}`;
      if (!grouped[groupKey]) {
        grouped[groupKey] = { sr: srCounter++, date: formatDisplay(entry.date)||'', operator: entry.operator||'', mcNo: entry.machine_no||'', rawEntries: [] };
      }
      grouped[groupKey].rawEntries.push(entry);
    });

    if (Object.keys(grouped).length === 0) {
      return [{ sr:1, date:'', operator:'', mcNo:'', slots:[
        {time:'SETUP', row_order:0, values:empty20()},
        {time:'4HRS',  row_order:0, values:empty20()},
        {time:'LAST',  row_order:0, values:empty20()},
      ]}];
    }

    return Object.values(grouped).map(grp => {
      const sorted = [...grp.rawEntries].sort((a,b) => {
        const si = (a.slot_index??0)-(b.slot_index??0);
        if (si!==0) return si;
        return (a.row_order??0)-(b.row_order??0);
      });
      const slotMap = {};
      sorted.forEach(e => {
        const si = e.slot_index??0;
        if (!slotMap[si]) slotMap[si] = { time_type: e.time_type||'SETUP', readings: [] };
        const vals = empty20();
        for(let i=0;i<20;i++) vals[i]=e[`value_${i+1}`]||'';
        slotMap[si].readings[e.row_order??0] = vals;
      });
      const timeOrder = { SETUP:0,'4HRS':1,'2HRS':1,LAST:2 };
      const slots = Object.entries(slotMap)
        .sort((a,b)=>{ const ta=timeOrder[a[1].time_type]??9,tb=timeOrder[b[1].time_type]??9; return ta!==tb?ta-tb:Number(a[0])-Number(b[0]); })
        .flatMap(([slotKey,s])=>{ if(!s.readings[0])s.readings[0]=empty20(); return s.readings.map((vals,ri)=>({time:s.time_type,slotKey,row_order:ri,values:vals||empty20()})).filter((row,ri)=>ri===0||row.values.some(v=>v!=='')); });
      return { sr:grp.sr, date:grp.date, operator:grp.operator, mcNo:grp.mcNo, slots };
    });
  };

  const scheduleRows       = buildScheduleRows();
  const totalSchedHtmlRows = scheduleRows.reduce((sum,s)=>sum+s.slots.length,0);

  const TOTAL_USABLE  = 572;
  const SCHED_THEAD   = 22;
  const SCHED_ROW_H   = 26;
  const SCHED_H       = SCHED_THEAD + totalSchedHtmlRows * SCHED_ROW_H;
  const INSP_THEAD    = 26;
  const inspAvailable = TOTAL_USABLE - SCHED_H - INSP_THEAD;
  const inspRowH      = Math.max(18, inspAvailable/10);
  const inspTotalH    = INSP_THEAD + 10*inspRowH;

  const colPct = `${(75/Math.max(totalFilledCols,1)).toFixed(2)}%`;

  // ══════════════════════════════════════
  // PRINT FUNCTION — New Window Approach
  // 100% Guaranteed A4 Landscape
  // ══════════════════════════════════════
  const handlePrint = () => {
    const reportEl = document.getElementById('inspection-print-area');
    if (!reportEl) return;

    const printWindow = window.open('', '_blank', 'width=1200,height=800');

    // Collect all stylesheets from current page
    const styles = Array.from(document.styleSheets).map(sheet => {
      try {
        return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
      } catch(e) { return ''; }
    }).join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>Setup & Patrol Inspection Report</title>
          <style>
            /* ── FORCE A4 LANDSCAPE ── */
            @page {
              size: A4 landscape;
              margin: 6mm;
            }

            * { margin:0; padding:0; box-sizing:border-box; }

            html, body {
              width: 297mm;
              height: 210mm;
              overflow: hidden;
              background: white;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            /* ── Paste all existing styles ── */
            ${styles}

            /* ── Override for print ── */
            .inspection-report {
              display: flex !important;
              flex-direction: column !important;
              width: 285mm !important;
              height: 198mm !important;
              padding: 0 !important;
              margin: 0 auto !important;
              gap: 2px !important;
              box-shadow: none !important;
              overflow: hidden !important;
              background: white !important;
            }

            .inspection-container {
              padding: 0 !important;
              background: white !important;
            }

            .no-print { display: none !important; }

            table { width:100%; border-collapse:collapse; }
            td, th { border:1px solid black; text-align:center; vertical-align:middle; overflow:hidden; }

            .header-table { border:2px solid black; flex:0 0 auto; }
            .logo-cell { width:120px; padding:6px; text-align:center; border-right:2px solid black; }
            .logo-image { max-width:100%; max-height:42px; object-fit:contain; }
            .title-cell { font-weight:bold; font-size:13px; padding:0 12px; letter-spacing:0.5px; }
            .doc-info-cell { width:220px; padding:0; border-left:2px solid black; }
            .doc-info-cell table { border:none; }
            .doc-info-cell table td { border:none; border-bottom:1px solid black; padding:0 6px; font-size:8.5px; height:21px; text-align:left; }
            .doc-info-cell table tr:last-child td { border-bottom:none; }
            .doc-label { font-weight:bold; width:95px; border-right:1px solid black !important; font-size:8.5px; }
            .doc-value { font-size:10px; font-weight:600; }

            .fleet-info-table { border:2px solid black; flex:0 0 auto; }
            .fleet-info-table td { padding:0 8px; height:26px; font-size:9.5px; }
            .field-label { background:#f5f5f5; font-size:8.5px; font-weight:bold; text-transform:uppercase; width:13%; }
            .field-input { width:37%; font-size:10.5px; font-weight:600; text-align:left; padding-left:10px; }

            .inspection-table { border:2px solid black; table-layout:fixed; flex:1 1 auto; }
            .inspection-table th { background:#f5f5f5; font-weight:bold; font-size:9px; padding:1px 3px; }
            .inspection-table td { font-size:9px; padding:0 3px; overflow:hidden; }
            .inspection-table tbody tr:nth-child(even) td { background:#fafafa; }

            .schedule-wrapper { flex:0 0 auto; }
            .schedule-table { border:2px solid black; table-layout:fixed; width:100%; border-collapse:collapse; }
            .schedule-table thead tr { height:22px; }
            .schedule-table th { background:#f5f5f5; font-weight:bold; font-size:8px; padding:1px 2px; height:22px; white-space:normal; word-break:break-word; line-height:1.1; }
            .schedule-table td { font-size:8.5px; padding:0 2px; overflow:hidden; }

            .footer { flex:0 0 auto; display:flex; justify-content:space-between; align-items:flex-end; padding:4px 10px 6px; margin-top:auto; }
            .signature-field { display:flex; align-items:flex-end; gap:8px; min-width:280px; }
            .signature-field label { font-size:10px; font-weight:bold; white-space:nowrap; padding-bottom:2px; }
            .signature-field input { font-size:10px; border:none; border-bottom:1.5px solid black; min-width:200px; flex:1; background:transparent; outline:none; }
          </style>
        </head>
        <body>
          ${reportEl.outerHTML}
          <script>
            // Wait for images to load then print
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              }, 300);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

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

  return (
    <div className="inspection-container">

      {/* ── Top Bar ── */}
      <div className="no-print" style={{display:'flex',justifyContent:'flex-end',alignItems:'center',gap:'12px',marginBottom:'10px'}}>

        <button onClick={()=>navigate('/selection')} style={{background:'#607d8b',color:'#fff',border:'none',padding:'8px 20px',borderRadius:'6px',fontWeight:'bold',cursor:'pointer',fontSize:'14px',display:'flex',alignItems:'center',gap:'6px'}}>
          <i className="bi bi-arrow-left-circle-fill"></i> Back
        </button>

        <div style={{position:'relative'}}>
          <button onClick={()=>setShowFilter(p=>!p)} style={{background:showFilter?'#1565c0':'#1976d2',color:'#fff',border:'none',padding:'8px 20px',borderRadius:'6px',fontWeight:'bold',cursor:'pointer',fontSize:'14px',display:'flex',alignItems:'center',gap:'6px'}}>
            <i className="bi bi-funnel-fill"></i> Filter {isAnyFilterActive?'●':''}
          </button>
          {showFilter&&(
            <>
              <div onClick={()=>setShowFilter(false)} style={{position:'fixed',inset:0,zIndex:998}}/>
              <div style={{position:'absolute',right:0,top:'46px',zIndex:999,background:'#fff',border:'1px solid #e0e0e0',borderRadius:'12px',boxShadow:'0 8px 32px rgba(0,0,0,0.18)',padding:'20px',minWidth:'320px'}}>
                <div style={{fontWeight:'bold',fontSize:'14px',marginBottom:'16px',color:'#1976d2',borderBottom:'2px solid #e3f2fd',paddingBottom:'10px',display:'flex',justifyContent:'space-between'}}>
                  <span><i className="bi bi-funnel-fill" style={{marginRight:6}}></i>Filter Reports</span>
                  <span onClick={()=>setShowFilter(false)} style={{cursor:'pointer',color:'#999'}}>✕</span>
                </div>
                {[
                  {label:<><i className="bi bi-calendar3" style={{marginRight:5}}></i>Date</>, content:(
                    <div style={{position:'relative',display:'flex',alignItems:'center',border:`1px solid ${filterDate?'#1976d2':'#ccc'}`,borderRadius:'6px',padding:'7px 10px',background:filterDate?'#e3f2fd':'#fff',cursor:'pointer'}}>
                      <span style={{fontSize:'13px',flex:1,color:filterDate?'#1976d2':'#999'}}>{filterDate?filterDate.split('-').reverse().join('/'):'Select Date'}</span>
                      <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} style={{position:'absolute',opacity:0,width:'100%',height:'100%',cursor:'pointer',top:0,left:0}}/><i className="bi bi-calendar3"></i>
                    </div>
                  )},
                  {label:<><i className="bi bi-gear-fill" style={{marginRight:5}}></i>Part Name</>, content:(
                    <select value={filterPart} onChange={e=>setFilterPart(e.target.value)} style={{width:'100%',padding:'7px 10px',border:`1px solid ${filterPart?'#1976d2':'#ccc'}`,borderRadius:'6px',fontSize:'13px'}}>
                      <option value="">All Parts</option>
                      {dbOptions.part_names.map(p=><option key={p} value={p}>{p}</option>)}
                    </select>
                  )},
                  {label:<><i className="bi bi-tools" style={{marginRight:5}}></i>Operation</>, content:(
                    <select value={filterOp} onChange={e=>setFilterOp(e.target.value)} style={{width:'100%',padding:'7px 10px',border:`1px solid ${filterOp?'#1976d2':'#ccc'}`,borderRadius:'6px',fontSize:'13px'}}>
                      <option value="">All Operations</option>
                      {dbOptions.operations.map(op=><option key={op} value={op}>{op}</option>)}
                    </select>
                  )},
                  {label:<><i className="bi bi-building" style={{marginRight:5}}></i>Customer</>, content:(
                    <select value={filterCustomer} onChange={e=>setFilterCustomer(e.target.value)} style={{width:'100%',padding:'7px 10px',border:`1px solid ${filterCustomer?'#1976d2':'#ccc'}`,borderRadius:'6px',fontSize:'13px'}}>
                      <option value="">All Customers</option>
                      {dbOptions.customers.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  )},
                ].map(({label,content},i)=>(
                  <div key={i} style={{marginBottom:'14px'}}>
                    <label style={{fontSize:'11px',fontWeight:'700',color:'#555',display:'block',marginBottom:'5px',textTransform:'uppercase'}}>{label}</label>
                    {content}
                  </div>
                ))}
                <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
                  <button onClick={handleFilterApply} style={{flex:1,background:'#1976d2',color:'#fff',border:'none',padding:'9px',borderRadius:'6px',fontWeight:'bold',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}><i className="bi bi-check-circle-fill"></i> Apply</button>
                  <button onClick={handleFilterReset} style={{flex:1,background:'#fff',color:'#e53935',border:'1px solid #e53935',padding:'9px',borderRadius:'6px',fontWeight:'bold',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}><i className="bi bi-arrow-counterclockwise"></i> Reset</button>
                </div>
              </div>
            </>
          )}
        </div>

        {currentReport?.customer_name && (
          <>
            <button onClick={()=>{ if(onEditForm) onEditForm(); navigate('/form?mode=edit'); }} style={{background:'#ff9800',color:'#fff',border:'none',padding:'8px 20px',borderRadius:'6px',fontWeight:'bold',cursor:'pointer',fontSize:'14px',display:'flex',alignItems:'center',gap:'6px'}}>
              <i className="bi bi-pencil-square"></i> Edit
            </button>
            <button onClick={handlePrint} style={{background:'#4CAF50',color:'#fff',border:'none',padding:'8px 20px',borderRadius:'6px',fontWeight:'bold',cursor:'pointer',fontSize:'14px',display:'flex',alignItems:'center',gap:'6px'}}>
              <i className="bi bi-printer-fill"></i> Print
            </button>
          </>
        )}
      </div>

      {/* ── Report Area — id lagaya print ke liye ── */}
      <div className="inspection-report" id="inspection-print-area">

        {/* HEADER */}
        <table className="header-table">
          <tbody><tr>
            <td className="logo-cell"><img src={atomone} alt="ATOM ONE" className="logo-image"/></td>
            <td className="title-cell">SETUP &amp; PATROL INSPECTION REPORT</td>
            <td className="doc-info-cell">
              <table><tbody>
                <tr><td className="doc-label">DOC NO:</td>     <td className="doc-value">{currentReport?.doc_no||'KGTL-QCL-01'}</td></tr>
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
              <td className="field-label">CUSTOMER NAME</td><td className="field-input">{currentReport?.customer_name||''}</td>
              <td className="field-label">PART NAME</td>    <td className="field-input">{currentReport?.part_name||''}</td>
            </tr>
            <tr>
              <td className="field-label">OPERATION NAME</td><td className="field-input">{currentReport?.operation_name||''}</td>
              <td className="field-label">PART NUMBER</td>   <td className="field-input">{currentReport?.part_number||''}</td>
            </tr>
          </tbody>
        </table>

        {/* INSPECTION */}
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

        {/* SCHEDULE */}
        <div className="schedule-wrapper">
          <table className="schedule-table">
            <colgroup>
              <col style={{width:'2%'}}/>
              <col style={{width:'7%'}}/>
              <col style={{width:'8%'}}/>
              <col style={{width:'4%'}}/>
              <col style={{width:'3.5%'}}/>
              {Array.from({length:totalFilledCols},(_,i)=><col key={i} style={{width:colPct}}/>)}
              <col style={{width:'2.5%'}}/>
              <col style={{width:'7.5%'}}/>
              <col style={{width:'7.5%'}}/>
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
              {scheduleRows.map((si,rowIdx)=>{
                const totalTimeRows = si.slots.length;
                const timeSpans = si.slots.map((row,idx)=>{
                  const prev = si.slots[idx-1];
                  if (!prev||prev.slotKey!==row.slotKey){
                    let count=0;
                    for(let j=idx;j<si.slots.length&&si.slots[j].slotKey===row.slotKey;j++) count++;
                    return count;
                  }
                  return 0;
                });
                return (
                  <React.Fragment key={rowIdx}>
                    {si.slots.map((row,timeIdx)=>{
                      const span = timeSpans[timeIdx];
                      return (
                        <tr key={`${rowIdx}-${timeIdx}`} style={{height:`${SCHED_ROW_H}px`}}>
                          {timeIdx===0&&<td rowSpan={totalTimeRows} style={{textAlign:'center',fontWeight:'bold',verticalAlign:'middle',fontSize:'10px'}}>{si.sr}</td>}
                          {timeIdx===0&&<td rowSpan={totalTimeRows} style={{textAlign:'center',fontSize:'8px',verticalAlign:'middle',whiteSpace:'normal',lineHeight:'1.2'}}>{si.date||''}</td>}
                          {timeIdx===0&&<td rowSpan={totalTimeRows} style={{textAlign:'center',fontSize:'8px',verticalAlign:'middle',whiteSpace:'normal',lineHeight:'1.2'}}>{si.operator||''}</td>}
                          {timeIdx===0&&<td rowSpan={totalTimeRows} style={{textAlign:'center',fontSize:'9px',verticalAlign:'middle'}}>{si.mcNo||''}</td>}
                          {span>0&&<td rowSpan={span} style={{textAlign:'center',fontWeight:'bold',fontSize:'8.5px',verticalAlign:'middle'}}>{row.time}</td>}
                          {Array.from({length:totalFilledCols},(_,ci)=>{
                            const val=row.values[ci]||'';
                            return <td key={ci} style={{textAlign:'center',fontSize:'9px',fontWeight:val?'600':'normal'}}>{val}</td>;
                          })}
                          {timeIdx===0&&<td rowSpan={totalTimeRows} style={{verticalAlign:'middle'}}></td>}
                          {timeIdx===0&&<td rowSpan={totalTimeRows} style={{verticalAlign:'middle'}}></td>}
                          {timeIdx===0&&<td rowSpan={totalTimeRows} style={{verticalAlign:'middle'}}></td>}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
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