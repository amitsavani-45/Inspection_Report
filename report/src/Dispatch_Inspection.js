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
    return () => { const el = document.getElementById(id); if (el) el.remove(); };
  }, []);

  // ── Filter states ──
  const [showFilter,     setShowFilter]     = useState(false);
  const [filterDate,     setFilterDate]     = useState('');
  const [filterPart,     setFilterPart]     = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [dbOptions,      setDbOptions]      = useState({ customers: [], part_names: [] });
  const [loading,        setLoading]        = useState(false);

  // ── DB se dropdown options fetch karo ──
  useEffect(() => {
    getDropdownOptions()
      .then(data => setDbOptions(data))
      .catch(err => console.error('Filter options fetch failed:', err));
  }, []);

  // ── Inspection rows: sirf sr_no 1–25 wale, sorted ──
  const inspItems = items
    .filter(x => x.sr_no >= 1 && x.sr_no <= 25)
    .sort((a, b) => a.sr_no - b.sr_no);

  // ── Row height auto-calculate (A4 mein fit karne ke liye) ──
  // agar rows badi/choti karni ho → TOTAL_USABLE badao/ghato
  const TOTAL_ROWS   = 25;
  const TOTAL_USABLE = 980;
  const HEADER_H     = 56;
  const INFO_H       = 56;   // 2 rows × 28px
  const INSP_THEAD_H = 44;
  const REMARKS_H    = 30;
  const FOOTER_H     = 36;
  const GAPS         = 8;
  const FIXED_H      = HEADER_H + INFO_H + INSP_THEAD_H + REMARKS_H + FOOTER_H + GAPS;
  const inspRowH     = Math.max(16, (TOTAL_USABLE - FIXED_H) / TOTAL_ROWS);

  const isAnyFilterActive = filterDate || filterPart || filterCustomer;

  const handleFilterApply = () => {
    if (!isAnyFilterActive) { alert('Please select at least one filter.'); return; }
    if (onFilter) onFilter({ date: filterDate, partName: filterPart, customerName: filterCustomer });
    setShowFilter(false);
  };

  const handleFilterReset = () => {
    setFilterDate(''); setFilterPart(''); setFilterCustomer('');
    setShowFilter(false);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen text-lg text-gray-500">Loading...</div>
  );

  // ============================================================
  //  CELL STYLES
  //  labelCell → grey bg, bold, left-aligned label
  //  valueCell → white bg, value cell
  //
  //  Label font size change → labelCell fontSize
  //  Value font size change → valueCell fontSize
  // ============================================================
  const labelCell = {
    backgroundColor: '#f5f5f5',
    fontWeight: '700',
    fontSize: '8.5px',        // ← label font size — chota rakhna zaroori hai taaki fit ho
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    padding: '3px px',
    border: '1px solid black',
    verticalAlign: 'middle',
    textAlign: 'left',        // ← labels LEFT aligned
    letterSpacing: '0px',
  };

  const valueCell = {
    fontSize: '10px',
    fontWeight: '500',
    padding: '3px 6px',
    border: '1px solid black',
    verticalAlign: 'middle',
    textAlign: 'left',
  };

  return (
    <div className="min-h-screen bg-gray-100 p-5">

      {/* ══════════════════════════════════════
           TOP BAR (no-print)
           Back | Filter | Edit | Print
          ══════════════════════════════════════ */}
      <div className="no-print flex justify-end items-center gap-3 mb-3 flex-wrap">

        {/* Back */}
        <button onClick={() => navigate('/selection')}
          className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold px-4 py-2 rounded-md text-sm transition-colors shadow">
          <i className="bi bi-arrow-left-circle-fill"></i> Back
        </button>

        {/* Filter */}
        <div className="relative">
          <button onClick={() => setShowFilter(p => !p)}
            className={`flex items-center gap-2 text-white font-bold px-4 py-2 rounded-md text-sm transition-colors shadow ${showFilter ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'}`}>
            <i className="bi bi-funnel-fill"></i>
            Filter {isAnyFilterActive ? '●' : ''}
          </button>

          {showFilter && (
            <>
              <div onClick={() => setShowFilter(false)} className="fixed inset-0 z-40" />
              <div className="absolute right-0 top-12 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl p-5 w-80">
                <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-blue-100">
                  <span className="font-bold text-sm text-blue-600">
                    <i className="bi bi-funnel-fill mr-2"></i>Filter Reports
                  </span>
                  <span onClick={() => setShowFilter(false)} className="cursor-pointer text-gray-400 hover:text-gray-600">✕</span>
                </div>

                {/* Date */}
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

                {/* Part Name */}
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

                {/* Customer */}
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

                {/* Apply / Reset */}
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

        {/* Edit + Print — sirf jab report load ho */}
        {currentReport?.customer_name && (
          <>
            <button onClick={() => { if (onEditForm) onEditForm(); navigate('/form?mode=edit'); }}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-md text-sm transition-colors shadow">
              <i className="bi bi-pencil-square"></i> Edit
            </button>
            <button onClick={() => window.print()}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-md text-sm transition-colors shadow">
              <i className="bi bi-printer-fill"></i> Print
            </button>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════
           REPORT — A4 Portrait
          ══════════════════════════════════════ */}
      <div className="di-report bg-white max-w-3xl mx-auto shadow-md" style={{ fontFamily: 'Arial, sans-serif' }}>

        {/* ──────────────────────────────────────
             SECTION 1: HEADER
             Logo | Title | Page No.
            ────────────────────────────────────── */}
        <table style={{ width:'100%', borderCollapse:'collapse', border:'2px solid black' }}>
          <tbody>
            <tr>
              {/* Logo */}
              <td style={{ width:'110px', borderRight:'2px solid black', padding:'5px 8px', textAlign:'center', verticalAlign:'middle' }}>
                <img src={atomone} alt="ATOM ONE"
                  style={{ display:'block', margin:'0 auto', width:'100px', height:'auto', objectFit:'contain' }} />
              </td>
              {/* Title */}
              <td style={{ textAlign:'center', verticalAlign:'middle', padding:'6px' }}>
                <span style={{ fontSize:'15px', fontWeight:'900', letterSpacing:'0.5px', textTransform:'uppercase' }}>
                  Pre Dispatch Inspection Report
                </span>
              </td>
              {/* Page No. */}
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

        {/* ──────────────────────────────────────
             SECTION 2: INFO TABLE
             Same 12-col colgroup as inspection table
             Taaki borders perfectly align hon

             12 col widths:
             C1=4%  C2=20%  C3=11%  C4=8%  C5=9%    → total 52% (left half)
             C6=6%  C7=6%   C8=8%                   → total 20% (VENDOR OBS)
             C9=6%  C10=6%  C11=8%                  → total 20% (CUSTOMER OBS)
             C12=8%                                 → 8%  (REMARKS)

             ROW 1 colspan plan (total must = 12):
               SUPPLIER NAME label → colSpan=2  (C1+C2 = 4+20 = 24%) — poora label dikhega
               SUPPLIER NAME value → colSpan=2  (C3+C4 = 11+8 = 19%)
               PART NO label       → colSpan=1  (C5 = 9%)
               PART NO value       → colSpan=1  (C6 = 6%)
               INSPECTION DATE lbl → colSpan=2  (C7+C8 = 6+8 = 14%) — poora label dikhega
               INSPECTION DATE val → colSpan=1  (C9 = 6%)  [2+2+1+1+2+1 = 9 cols so far]
               CUSTOMER NAME label → colSpan=2  (C10+C11 = 6+8 = 14%)
               CUSTOMER NAME value → colSpan=1  (C12 = 8%)
               TOTAL = 2+2+1+1+2+1+2+1 = 12 ✓

             ROW 2 colspan plan (total must = 12):
               PART NAME label → colSpan=2  (C1+C2 = 24%)
               PART NAME value → colSpan=3  (C3+C4+C5 = 11+8+9 = 28%)
               INVOICE NO lbl  → colSpan=2  (C6+C7 = 6+6 = 12%) — VENDOR OBS ke neeche
               INVOICE NO val  → colSpan=1  (C8 = 8%)
               LOT QTY label   → colSpan=2  (C9+C10 = 6+6 = 12%) — CUSTOMER OBS ke neeche
               LOT QTY value   → colSpan=2  (C11+C12 = 8+8 = 16%)
               TOTAL = 2+3+2+1+2+2 = 12 ✓

             ── Field change karna ho → currentReport?.fieldname badlo
             ── Row add karna ho → <tr> add karo is table ke tbody mein
            ────────────────────────────────────── */}
        <table style={{
          width:'100%',
          borderCollapse:'collapse',
          border:'2px solid black',
          tableLayout:'fixed',   // inspection table ke saath align karega
        }}>
          <colgroup>
            <col style={{ width:'4%' }} />   {/* C1  */}
            <col style={{ width:'20%' }} />  {/* C2  */}
            <col style={{ width:'11%' }} />  {/* C3  */}
            <col style={{ width:'8%' }} />   {/* C4  */}
            <col style={{ width:'9%' }} />   {/* C5  */}
            <col style={{ width:'6%' }} />   {/* C6  — VENDOR OBS start */}
            <col style={{ width:'6%' }} />   {/* C7  */}
            <col style={{ width:'8%' }} />   {/* C8  — VENDOR OBS end */}
            <col style={{ width:'6%' }} />   {/* C9  — CUSTOMER OBS start */}
            <col style={{ width:'6%' }} />   {/* C10 */}
            <col style={{ width:'8%' }} />   {/* C11 — CUSTOMER OBS end */}
            <col style={{ width:'8%' }} />   {/* C12 — REMARKS */}
          </colgroup>

          <tbody>
            {/* ── ROW 1: SUPPLIER NAME | PART NO | INSPECTION DATE | CUSTOMER NAME ──
                 colspan: label=2, val=2 | label=1, val=1 | label=2, val=1 | label=2, val=1
                 = 2+2+1+1+2+1+2+1 = 12 ✓  */}
            <tr style={{ height:'26px' }}>
              <td style={{ ...labelCell }} colSpan={2}>SUPPLIER NAME :</td>
              <td style={{ ...valueCell }} colSpan={2}>{currentReport?.supplier_name || ''}</td>

              <td style={{ ...labelCell }} colSpan={1}>PART NO :</td>
              <td style={{ ...valueCell }} colSpan={1}>{currentReport?.part_no || ''}</td>

              <td style={{ ...labelCell }} colSpan={2}>INSPECTION DATE. :</td>
              <td style={{ ...valueCell }} colSpan={1}>{displayDate}</td>

              <td style={{ ...labelCell }} colSpan={2}>CUSTOMER NAME :-</td>
              <td style={{ ...valueCell }} colSpan={1}>{currentReport?.customer_name || ''}</td>
            </tr>

            {/* ── ROW 2: PART NAME | INVOICE NO | LOT QTY ──
                 colspan: label=2, val=3 | label=2, val=1 | label=2, val=2
                 = 2+3+2+1+2+2 = 12 ✓
                 INVOICE NO → VENDOR OBS ke neeche align
                 LOT QTY    → CUSTOMER OBS ke neeche align */}
            <tr style={{ height:'26px' }}>
              <td style={{ ...labelCell }} colSpan={2}>PART NAME :</td>
              <td style={{ ...valueCell }} colSpan={3}>{currentReport?.part_name || ''}</td>

              <td style={{ ...labelCell }} colSpan={2}>INVOICE NO. :-</td>
              <td style={{ ...valueCell }} colSpan={1}>{currentReport?.invoice_no || ''}</td>

              <td style={{ ...labelCell }} colSpan={2}>LOT QTY. :</td>
              <td style={{ ...valueCell }} colSpan={2}>{currentReport?.lot_qty || ''}</td>
            </tr>
          </tbody>
        </table>

        {/* ──────────────────────────────────────
             SECTION 3: INSPECTION TABLE
             Same 12-col colgroup as info table
             Header 2 rows + 25 data rows + Remarks + Footer

             ── Row height → inspRowH (upar calculate hota hai)
             ── Col width change → colgroup mein badlo (DONO tables mein same rakho!)
             ── OK = green #1a7c1a, NG = red #c0392b
            ────────────────────────────────────── */}
        <table style={{
          width:'100%',
          borderCollapse:'collapse',
          border:'2px solid black',
          tableLayout:'fixed',
          height:`${INSP_THEAD_H + TOTAL_ROWS * inspRowH}px`,
        }}>
          {/* Colgroup — INFO TABLE ke saath EXACT match (borders align karate hain) */}
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

          {/* Table headers — 2 rows */}
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
            {/* 25 data rows — empty rows blank rahenge */}
            {Array.from({ length: TOTAL_ROWS }, (_, i) => {
              const row  = inspItems[i] || null;
              const srNo = row?.item?.trim() ? (i + 1) : '';
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

            {/* Supplier Remarks row — full width */}
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

            {/* Footer: Inspected By | Verified By | Approved By
                naya signature add karna ho → array mein object add karo */}
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
                      <span style={{ flex:1, borderBottom:'1px solid black', fontSize:'11px', paddingBottom:'1px', display:'block', minWidth:'50px' }}>
                        {val || ''}
                      </span>
                    </div>
                  ))}
                </div>
              </td>
            </tr>

          </tbody>
        </table>

      </div>
    </div>
  );
};

// ============================================================
//  SHARED STYLES — component ke bahar hai (re-render avoid)
//
//  thStyle → inspection table header cells
//  tdStyle → inspection table data cells
//
//  Font size change → fontSize
//  Padding change   → padding
// ============================================================

const thStyle = {
  border: '1px solid black',
  background: '#f5f5f5',
  fontSize: '10px',
  fontWeight: '700',
  padding: '2px 3px',
  textAlign: 'center',
  verticalAlign: 'middle',
  lineHeight: '1.3',
};

const tdStyle = {
  border: '1px solid black',
  fontSize: '10px',
  textAlign: 'center',
  verticalAlign: 'middle',
  padding: '1px 2px',
  background: '#fff',
};

export default Dispatch_Inspection;