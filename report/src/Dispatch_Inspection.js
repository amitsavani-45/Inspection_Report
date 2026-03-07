// ============================================================
//  Dispatch_Inspection.js
//  Pre Dispatch Inspection Report — Portrait A4
//
//  Props:
//    items         → inspection rows (sr_no 1–25)
//    currentReport → report header fields (supplier, customer, etc.)
//    onFilter      → callback({ date, partName, customerName })
//    onEditForm    → callback when Edit button clicked
// ============================================================

import React, { useState, useEffect } from 'react';
import { getDropdownOptions } from './services/api';  // API se dropdown options fetch karne ke liye
import { useNavigate } from 'react-router-dom';
import './Dispatch_Inspection.css';
import atomone from './image/atomone.jpg';  // Company logo

// ── Date format helper: "2024-01-15" → "15/01/2024" ──
const formatDisplay = (dateStr) => {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

const Dispatch_Inspection = ({ items = [], currentReport, onFilter, onEditForm }) => {
  const navigate = useNavigate();

  // Inspection date ko display format mein convert karo
  const displayDate = formatDisplay(currentReport?.inspection_date) || '';

  // ── Print CSS inject karo (sirf print ke waqt buttons hide honge) ──
  useEffect(() => {
    const id = 'di-page-style';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id;
      s.innerHTML = `
        @media print {
          @page { size: A4 portrait; margin: 6mm; }
          body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
          .no-print { display:none !important; }
        }
      `;
      document.head.appendChild(s);
    }
    // Component unmount hone par style remove karo
    return () => { const el = document.getElementById(id); if (el) el.remove(); };
  }, []);

  // ── Filter dropdown states ──
  const [showFilter,     setShowFilter]     = useState(false); // Filter panel open/close
  const [filterDate,     setFilterDate]     = useState('');    // Selected date filter
  const [filterPart,     setFilterPart]     = useState('');    // Selected part filter
  const [filterCustomer, setFilterCustomer] = useState('');    // Selected customer filter

  // ── Database se customers aur part names fetch karo ──
  const [dbOptions, setDbOptions] = useState({ customers: [], part_names: [] });
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    getDropdownOptions()
      .then(data => setDbOptions(data))
      .catch(err => console.error('Filter options fetch failed:', err));
  }, []);

  // ── Inspection rows: sirf sr_no 1–25 wale, sorted ──
  const inspItems = items
    .filter(x => x.sr_no >= 1 && x.sr_no <= 25)
    .sort((a, b) => a.sr_no - b.sr_no);

  // ── Row height calculation (A4 page fit karne ke liye) ──
  // Agar yahan height adjust karni ho toh TOTAL_USABLE badao/ghato
  const TOTAL_ROWS   = 25;    // Kitni rows dikhani hain
  const TOTAL_USABLE = 980;   // Total usable height in px (A4 portrait)
  const HEADER_H     = 56;    // Header table height
  const INFO_H       = 84;    // Info section height (3 rows x 28px)
  const INSP_THEAD_H = 44;    // Inspection table header height (2 rows)
  const REMARKS_H    = 30;    // Supplier remarks row height
  const FOOTER_H     = 36;    // Footer (Inspected/Verified/Approved) height
  const GAPS         = 8;     // Spacing between sections
  const FIXED_H      = HEADER_H + INFO_H + INSP_THEAD_H + REMARKS_H + FOOTER_H + GAPS;
  const inspRowH     = Math.max(16, (TOTAL_USABLE - FIXED_H) / TOTAL_ROWS); // Each row height

  // ── Filter active check (dot indicator ke liye) ──
  const isAnyFilterActive = filterDate || filterPart || filterCustomer;

  // ── Filter Apply button handler ──
  const handleFilterApply = () => {
    if (!isAnyFilterActive) { alert('Please select at least one filter.'); return; }
    if (onFilter) onFilter({ date: filterDate, partName: filterPart, customerName: filterCustomer });
    setShowFilter(false);
  };

  // ── Filter Reset button handler ──
  const handleFilterReset = () => {
    setFilterDate(''); setFilterPart(''); setFilterCustomer('');
    setShowFilter(false);
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-lg text-gray-500">Loading...</div>
    );
  }

  // ============================================================
  //  CELL STYLES
  //  labelCell → grey background, bold uppercase label
  //  valueCell → white background, value display cell
  //
  //  ── Label font size change karna ho → fontSize: '9px' edit karo
  //  ── Value font size change karna ho → valueCell fontSize edit karo
  // ============================================================

  const labelCell = {
    backgroundColor: '#f5f5f5',  // Grey background for labels
    fontWeight: '700',            // Bold text
    fontSize: '8px',             // ← Label font size yahan change karo
    textTransform: 'uppercase',   // UPPERCASE text
    whiteSpace: 'nowrap',         // Text wrap mat karo
    padding: '3px 5px',          // ← Label padding yahan change karo
    border: '1px solid black',
    verticalAlign: 'middle',
    letterSpacing: '0px',
    textAlign: 'left',
  };

  const valueCell = {
    fontSize: '10px',            // ← Value font size yahan change karo
    fontWeight: '500',
    padding: '3px 6px',          // ← Value cell padding yahan change karo
    border: '1px solid black',
    verticalAlign: 'middle',
    textAlign: 'left',
    minWidth: '30px',
  };

  // ============================================================
  //  RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-100 p-5">

      {/* ══════════════════════════════════════════════
           TOP ACTION BAR — Sirf screen par dikhta hai
           Print ke waqt hide ho jata hai (.no-print)
           Buttons: Back | Filter | Edit | Print
          ══════════════════════════════════════════════ */}
      <div className="no-print flex justify-end items-center gap-3 mb-3 flex-wrap">

        {/* Back Button — /selection route par le jaata hai */}
        <button onClick={() => navigate('/selection')}
          className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold px-4 py-2 rounded-md text-sm transition-colors shadow">
          <i className="bi bi-arrow-left-circle-fill"></i> Back
        </button>

        {/* Filter Button + Dropdown Panel */}
        <div className="relative">
          <button onClick={() => setShowFilter(p => !p)}
            className={`flex items-center gap-2 text-white font-bold px-4 py-2 rounded-md text-sm transition-colors shadow ${showFilter ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'}`}>
            <i className="bi bi-funnel-fill"></i>
            Filter {isAnyFilterActive ? '●' : ''}
          </button>

          {/* Filter Dropdown Panel */}
          {showFilter && (
            <>
              {/* Click bahar karne par panel close ho */}
              <div onClick={() => setShowFilter(false)} className="fixed inset-0 z-40" />
              <div className="absolute right-0 top-12 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl p-5 w-80">

                {/* Filter Panel Header */}
                <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-blue-100">
                  <span className="font-bold text-sm text-blue-600">
                    <i className="bi bi-funnel-fill mr-2"></i>Filter Reports
                  </span>
                  <span onClick={() => setShowFilter(false)} className="cursor-pointer text-gray-400 hover:text-gray-600">✕</span>
                </div>

                {/* Date Filter */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    <i className="bi bi-calendar3 mr-1"></i>Date
                  </label>
                  <div className={`relative flex items-center border rounded-md px-3 py-2 cursor-pointer ${filterDate ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}`}>
                    <span className={`text-sm flex-1 ${filterDate ? 'text-blue-600' : 'text-gray-400'}`}>
                      {filterDate ? filterDate.split('-').reverse().join('/') : 'Select Date'}
                    </span>
                    <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full" />
                    <i className="bi bi-calendar3 text-gray-400"></i>
                  </div>
                </div>

                {/* Part Name Filter — DB se options aate hain */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    <i className="bi bi-gear-fill mr-1"></i>Part Name
                  </label>
                  <select value={filterPart} onChange={e => setFilterPart(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md text-sm ${filterPart ? 'border-blue-500' : 'border-gray-300'}`}>
                    <option value="">All Parts</option>
                    {dbOptions.part_names.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* Customer Filter — DB se options aate hain */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    <i className="bi bi-building mr-1"></i>Customer
                  </label>
                  <select value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md text-sm ${filterCustomer ? 'border-blue-500' : 'border-gray-300'}`}>
                    <option value="">All Customers</option>
                    {dbOptions.customers.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Apply / Reset Buttons */}
                <div className="flex gap-2 mt-1">
                  <button onClick={handleFilterApply}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-md text-sm transition-colors">
                    <i className="bi bi-check-circle-fill"></i> Apply
                  </button>
                  <button onClick={handleFilterReset}
                    className="flex-1 flex items-center justify-center gap-2 border border-red-500 text-red-500 hover:bg-red-50 font-bold py-2 rounded-md text-sm transition-colors">
                    <i className="bi bi-arrow-counterclockwise"></i> Reset
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Edit & Print — sirf tab dikhate hain jab report load ho */}
        {currentReport?.customer_name && (
          <>
            {/* Edit Button — form edit mode mein open karta hai */}
            <button onClick={() => { if (onEditForm) onEditForm(); navigate('/form?mode=edit'); }}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-md text-sm transition-colors shadow">
              <i className="bi bi-pencil-square"></i> Edit
            </button>

            {/* Print Button — browser print dialog open karta hai */}
            <button onClick={() => window.print()}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-md text-sm transition-colors shadow">
              <i className="bi bi-printer-fill"></i> Print
            </button>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════
           REPORT CONTAINER
           max-w-3xl = ~768px (A4 portrait width fit)
           ── Width change karni ho → max-w-3xl badlo
          ══════════════════════════════════════════════ */}
      <div className="di-report bg-white max-w-3xl mx-auto shadow-md" style={{ fontFamily: 'Arial, sans-serif' }}>

        {/* ══════════════════════════════════════════
             SECTION 1: HEADER TABLE
             3 cells: Logo | Title | Page No.
             ── Logo size → width:'100px'
             ── Title font → fontSize:'15px'
             ── Page No. cell width → width:'160px'
            ══════════════════════════════════════════ */}
        <table style={{ width:'100%', borderCollapse:'collapse', border:'2px solid black' }}>
          <tbody>
            <tr>
              {/* Logo Cell */}
              <td style={{ width:'110px', borderRight:'2px solid black', padding:'5px 8px', textAlign:'center', verticalAlign:'middle' }}>
                <img src={atomone} alt="ATOM ONE"
                  style={{ display:'block', margin:'0 auto', width:'100px', height:'auto', objectFit:'contain' }} />
              </td>

              {/* Title Cell */}
              <td style={{ textAlign:'center', verticalAlign:'middle', padding:'6px' }}>
                <span style={{ fontSize:'15px', fontWeight:'900', letterSpacing:'0.5px', textTransform:'uppercase' }}>
                  Pre Dispatch Inspection Report
                </span>
              </td>

              {/* Page No. Cell — 2 rows: label + value */}
              <td style={{ width:'160px', borderLeft:'2px solid black', padding:0, verticalAlign:'top' }}>
                <div style={{ borderBottom:'1px solid black', padding:'4px 8px', background:'#f5f5f5' }}>
                  <span style={{ fontSize:'11px', fontWeight:'700' }}>PAGE NO.</span>
                </div>
                <div style={{ padding:'4px 8px' }}>
                  <span style={{ fontSize:'11px', fontWeight:'700' }}>{currentReport?.page_no || '01 OF 01'}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══════════════════════════════════════════
             SECTION 2: INFO TABLE (3 rows)
             Same 12-col grid as inspection table
             Taaki borders perfectly align hon

             12 Columns map:
             Col 1(4%) + Col 2(20%) + Col 3(11%) + Col 4(8%) + Col 5(9%) = 52% LEFT HALF
             Col 6(6%) + Col 7(6%)  + Col 8(8%)                          = 20% VENDOR OBS
             Col 9(6%) + Col 10(6%) + Col 11(8%)                         = 20% CUSTOMER OBS
             Col 12(8%)                                                   =  8% REMARKS

             ── Naya row add karna ho → tbody mein <tr> add karo
             ── Field change karna ho → currentReport?.field_name badlo
            ══════════════════════════════════════════ */}
        {/*
          INFO TABLE — 12-col fixed layout (same as inspection table)
          IMAGE 1 layout:
          Row1: SUPPLIER NAME:[val........] | PART NO:[val] | INSPECTION DATE.:[val] | CUSTOMER NAME:-[val]
          Row2: PART NAME:[val.............] | INVOICE NO.:-[val............] | LOT QTY.:[val]

          Col widths: 4+20+11+8+9 = 52% left | 6+6+8 = 20% vendor | 6+6+8 = 20% cust | 8% remarks
        */}
        <table style={{
          width:'100%',
          borderCollapse:'collapse',
          border:'2px solid black',
          tableLayout:'fixed',
        }}>
          <colgroup>
            <col style={{ width:'4%' }} />
            <col style={{ width:'20%' }} />
            <col style={{ width:'11%' }} />
            <col style={{ width:'8%' }} />
            <col style={{ width:'9%' }} />
            <col style={{ width:'6%' }} />
            <col style={{ width:'6%' }} />
            <col style={{ width:'8%' }} />
            <col style={{ width:'6%' }} />
            <col style={{ width:'6%' }} />
            <col style={{ width:'8%' }} />
            <col style={{ width:'8%' }} />
          </colgroup>

          <tbody>

            {/* ── ROW 1: SUPPLIER NAME | PART NO | INSPECTION DATE | CUSTOMER NAME
                 12 cols total:
                 SUPPLIER NAME label(col1-2) + value(col3-4)   = 4+20+11+8     = 43%
                 PART NO label(col5) + value(col6)             = 9+6            = 15%
                 INSPECTION DATE label(col7) + value(col8)     = 6+8            = 14%
                 CUSTOMER NAME label(col9-10) + value(col11-12)= 6+6+8+8        = 28% */}
            {/* Row1: SUPPLIER NAME(1+2) | PART NO(1+1) | INSPECTION DATE(1+1) | CUSTOMER NAME(1+2) = 12 cols */}
            <tr style={{ height:'24px' }}>
              <td style={{ ...labelCell }} colSpan={1}>SUPPLIER NAME :</td>
              <td style={{ ...valueCell }} colSpan={2}>{currentReport?.supplier_name || ''}</td>
              <td style={{ ...labelCell }} colSpan={1}>PART NO :</td>
              <td style={{ ...valueCell }} colSpan={2}>{currentReport?.part_no || ''}</td>
              <td style={{ ...labelCell }} colSpan={1}>INSPECTION DATE. :</td>
              <td style={{ ...valueCell }} colSpan={2}>{displayDate}</td>
              <td style={{ ...labelCell }} colSpan={1}>CUSTOMER NAME :-</td>
              <td style={{ ...valueCell }} colSpan={2}>{currentReport?.customer_name || ''}</td>
            </tr>

            {/* Row2: PART NAME(1+3) | INVOICE NO(2+1) | LOT QTY(1+2) = 10? no = 12 cols */}
            <tr style={{ height:'24px' }}>
              <td style={{ ...labelCell }} colSpan={1}>PART NAME :</td>
              <td style={{ ...valueCell }} colSpan={4}>{currentReport?.part_name || ''}</td>
              <td style={{ ...labelCell }} colSpan={2}>INVOICE NO. :-</td>
              <td style={{ ...valueCell }} colSpan={2}>{currentReport?.invoice_no || ''}</td>
              <td style={{ ...labelCell }} colSpan={1}>LOT QTY. :</td>
              <td style={{ ...valueCell }} colSpan={2}>{currentReport?.lot_qty || ''}</td>
            </tr>

          </tbody>
        </table>

        {/* ══════════════════════════════════════════
             SECTION 3: INSPECTION TABLE
             Header (2 rows) + 25 data rows + Remarks + Footer
             Same 12-col grid as Info Table above

             ── Row height → inspRowH (upar calculate hota hai)
             ── Column width → colgroup mein badlo (DONO tables mein same rakho!)
             ── New column → colgroup + thead + tbody teeno mein add karo
             ── OK color → #1a7c1a (green), NG color → #c0392b (red)
            ══════════════════════════════════════════ */}
        <table style={{
          width:'100%',
          borderCollapse:'collapse',
          border:'2px solid black',
          tableLayout:'fixed',
          height:`${INSP_THEAD_H + TOTAL_ROWS * inspRowH}px`,
        }}>
          {/* Colgroup — INFO TABLE ke saath exact match */}
          <colgroup>
            <col style={{ width:'4%' }} />   {/* SR. No. */}
            <col style={{ width:'20%' }} />  {/* Inspection Items */}
            <col style={{ width:'11%' }} />  {/* Dimensions/Spec */}
            <col style={{ width:'8%' }} />   {/* Tolerance */}
            <col style={{ width:'9%' }} />   {/* Inspection Method */}
            <col style={{ width:'6%' }} />   {/* Vendor Obs 1 */}
            <col style={{ width:'6%' }} />   {/* Vendor Obs 2 */}
            <col style={{ width:'8%' }} />   {/* Vendor Judgement */}
            <col style={{ width:'6%' }} />   {/* Customer Obs 1 */}
            <col style={{ width:'6%' }} />   {/* Customer Obs 2 */}
            <col style={{ width:'8%' }} />   {/* Customer Judgement */}
            <col style={{ width:'8%' }} />   {/* Remarks */}
          </colgroup>

          {/* ── Table Header — 2 rows ──
               Row 1: Main column headers
               Row 2: Sub-headers (1, 2, Judgement) under VENDOR/CUSTOMER OBS
               ── Header text change → yahan edit karo ── */}
          <thead>
            <tr style={{ height:'22px', background:'#f5f5f5' }}>
              <th rowSpan={2} style={thStyle}>SR.<br/>No.</th>
              <th rowSpan={2} style={thStyle}>INSPECTION ITEMS</th>
              <th rowSpan={2} style={thStyle}>DIMENSIONS/<br/>SPEC</th>
              <th rowSpan={2} style={thStyle}>TOLERANCE</th>
              <th rowSpan={2} style={thStyle}>INSPECTION<br/>METHOD</th>
              <th colSpan={3} style={thStyle}>VENDOR OBSERVATIONS</th>
              <th colSpan={3} style={thStyle}>CUSTOMER OBSERVATION</th>
              <th rowSpan={2} style={thStyle}>REMARKS</th>
            </tr>
            <tr style={{ height:'22px', background:'#f5f5f5' }}>
              <th style={thStyle}>1</th>
              <th style={thStyle}>2</th>
              <th style={thStyle}>Judgement</th>
              <th style={thStyle}>1</th>
              <th style={thStyle}>2</th>
              <th style={thStyle}>Judgement</th>
            </tr>
          </thead>

          <tbody>
            {/* ── 25 Data Rows ──
                 Empty row → blank dikhegi (sr_no bhi nahi aayega)
                 Judgement: OK=green, NG=red
                 ── Row count change → TOTAL_ROWS upar edit karo ── */}
            {Array.from({ length: TOTAL_ROWS }, (_, i) => {
              const row  = inspItems[i] || null;
              const srNo = row?.item?.trim() ? (i + 1) : '';  // SR No. sirf filled rows pe
              return (
                <tr key={i} style={{ height:`${inspRowH}px`, background:'#fff' }}>
                  <td style={tdStyle}>{srNo}</td>
                  <td style={{ ...tdStyle, textAlign:'left', paddingLeft:'5px', fontWeight: row?.item ? '600' : '400' }}>
                    {row?.item || ''}
                  </td>
                  <td style={tdStyle}>{row?.spec        || ''}</td>
                  <td style={tdStyle}>{row?.tolerance   || ''}</td>
                  <td style={tdStyle}>{row?.method      || ''}</td>
                  <td style={tdStyle}>{row?.vendor_obs1 || ''}</td>
                  <td style={tdStyle}>{row?.vendor_obs2 || ''}</td>
                  {/* Vendor Judgement: OK=green, NG=red */}
                  <td style={{ ...tdStyle, fontWeight:'700',
                    color: row?.vendor_judge === 'OK' ? '#1a7c1a'
                         : row?.vendor_judge === 'NG' ? '#c0392b' : 'inherit' }}>
                    {row?.vendor_judge || ''}
                  </td>
                  <td style={tdStyle}>{row?.cust_obs1 || ''}</td>
                  <td style={tdStyle}>{row?.cust_obs2 || ''}</td>
                  {/* Customer Judgement: OK=green, NG=red */}
                  <td style={{ ...tdStyle, fontWeight:'700',
                    color: row?.cust_judge === 'OK' ? '#1a7c1a'
                         : row?.cust_judge === 'NG' ? '#c0392b' : 'inherit' }}>
                    {row?.cust_judge || ''}
                  </td>
                  <td style={{ ...tdStyle, textAlign:'left', paddingLeft:'4px' }}>
                    {row?.remarks || ''}
                  </td>
                </tr>
              );
            })}

            {/* ── Supplier Remarks Row ──
                 25 rows ke baad full-width row
                 borderTop:2px → thodi moti separator line
                 ── Text change → "Supplier Remarks:" yahan edit karo ── */}
            <tr>
              <td colSpan={12} style={{
                border: '1px solid black',
                borderTop: '2px solid black',
                padding: '5px 12px',
                background: '#fff',
                height: '30px',
                verticalAlign: 'middle',
              }}>
                <span style={{ fontWeight:'700', fontSize:'11px' }}>Supplier Remarks: </span>
                <span style={{ fontSize:'11px' }}>{currentReport?.supplier_remarks || ''}</span>
              </td>
            </tr>

            {/* ── Footer Row: Inspected By | Verified By | Approved By ──
                 Underline signature fields
                 ── Naya field add → array mein object add karo ── */}
            <tr>
              <td colSpan={12} style={{
                border: '1px solid black',
                padding: '5px 16px',
                background: '#fff',
                height: '36px',
                verticalAlign: 'middle',
              }}>
                <div style={{ display:'flex', alignItems:'flex-end', width:'100%', gap:'30px' }}>
                  {[
                    { label: 'Inspected By :-', val: currentReport?.inspected_by },
                    { label: 'Verified By :-',  val: currentReport?.verified_by  },
                    { label: 'Approved By :-',  val: currentReport?.approved_by  },
                  ].map(({ label, val }, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'flex-end', gap:'5px', flex:1 }}>
                      <span style={{ fontWeight:'700', fontSize:'11px', whiteSpace:'nowrap' }}>{label}</span>
                      {/* Underline signature line */}
                      <span style={{
                        flex: 1,
                        borderBottom: '1px solid black',
                        fontSize: '11px',
                        paddingBottom: '1px',
                        display: 'block',
                        minWidth: '50px',
                      }}>
                        {val || ''}
                      </span>
                    </div>
                  ))}
                </div>
              </td>
            </tr>

          </tbody>
        </table>
        {/* ── Report end ── */}

      </div>
    </div>
  );
};

// ============================================================
//  SHARED STYLES — component ke bahar (re-render avoid karne ke liye)
//
//  thStyle → Inspection table HEADER cell (grey bg, bold)
//  tdStyle → Inspection table DATA cell (white bg)
//
//  ── Header font size → thStyle fontSize
//  ── Data font size   → tdStyle fontSize
//  ── Cell padding     → padding field
// ============================================================

const thStyle = {
  border: '1px solid black',
  background: '#f5f5f5',
  fontSize: '10px',       // ← Inspection header font size yahan change karo
  fontWeight: '700',
  padding: '2px 3px',
  textAlign: 'center',
  verticalAlign: 'middle',
  lineHeight: '1.3',
};

const tdStyle = {
  border: '1px solid black',
  fontSize: '10px',       // ← Inspection data font size yahan change karo
  textAlign: 'center',
  verticalAlign: 'middle',
  padding: '1px 2px',
  background: '#fff',
};

export default Dispatch_Inspection;