// ============================================================
//  RedBin_Attendance.js
//  Red Bin Attendance Sheet — Landscape A4
//  DOC.NO. AOT-F-QC-05
//  Logic: Days change automatically based on selected month/year
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RedBinAttendance.css';
import atomone from './image/atomone.jpg';

// ── Date format helper ──
const formatDisplay = (dateStr) => {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

// ── Get days in a month (handles leap year too) ──
const getDaysInMonth = (month, year) => {
  // month: 1-12, year: full year e.g. 2024
  return new Date(year, month, 0).getDate();
};

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

// ── Minimum employee rows ──
const MIN_ROWS = 12;

const RedBinAttendance = ({ items = [], currentReport, onFilter, onEditForm }) => {
  const navigate = useNavigate();

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1); // 1-12
  const [selectedYear,  setSelectedYear]  = useState(today.getFullYear());
  const [remarks,       setRemarks]       = useState(currentReport?.remarks || '');

  // ── Compute days in selected month ──
  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const dayColumns  = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // ── Employee rows ──
  const empItems = items
    .filter(x => x.sr_no >= 1)
    .sort((a, b) => a.sr_no - b.sr_no);
  const TOTAL_ROWS = Math.max(MIN_ROWS, empItems.length);

  // ── Row height calc: A4 landscape usable ──
  const HEADER_H = 64;
  const THEAD_H  = 32;
  const LEGEND_H = 32;
  const FOOTER_H = 52;
  const GAPS     = 10;
  const PAGE_H_PX = 762;
  const rowH = Math.max(28, Math.floor((PAGE_H_PX - HEADER_H - THEAD_H - LEGEND_H - FOOTER_H - GAPS) / TOTAL_ROWS));

  // ── Year options (current ±5) ──
  const yearOptions = Array.from({ length: 11 }, (_, i) => today.getFullYear() - 5 + i);

  // ══════════════════════════════════════
  // PRINT — New Window
  // ══════════════════════════════════════
  const handlePrint = () => {
    const reportEl = document.getElementById('redbin-print-area');
    if (!reportEl) return;
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    const styles = Array.from(document.styleSheets).map(sheet => {
      try { return Array.from(sheet.cssRules).map(r => r.cssText).join('\n'); }
      catch (e) { return ''; }
    }).join('\n');

    printWindow.document.write(`
      <!DOCTYPE html><html>
      <head>
        <meta charset="utf-8"/>
        <title>Red Bin Attendance Sheet</title>
        <style>
          @page { size: A4 landscape; margin: 6mm; }
          * { margin:0; padding:0; box-sizing:border-box; }
          html, body { width:297mm; height:210mm; overflow:hidden; background:white;
            -webkit-print-color-adjust:exact; print-color-adjust:exact; }
          ${styles}
          .rb-report {
            display:flex !important; flex-direction:column !important;
            width:285mm !important; height:198mm !important;
            padding:0 !important; margin:0 auto !important;
            gap:2px !important; box-shadow:none !important;
            overflow:hidden !important; background:white !important;
          }
          .rb-container { padding:0 !important; background:white !important; }
          .no-print { display:none !important; }
          table { width:100%; border-collapse:collapse; }
          td, th { border:1px solid black; text-align:center; vertical-align:middle; overflow:hidden; }
          .rb-header-table { border:2px solid black; flex:0 0 auto; }
          .rb-logo-cell { width:110px; padding:4px 6px; border-right:2px solid black; text-align:center; }
          .rb-logo-image { max-width:100%; max-height:40px; object-fit:contain; }
          .rb-title-cell { font-weight:bold; font-size:15px; letter-spacing:1.5px; text-transform:uppercase; }
          .rb-doc-info-cell { width:200px; padding:0; border-left:2px solid black; }
          .rb-doc-info-cell table { border:none; }
          .rb-doc-info-cell table td { border:none; border-bottom:1px solid black; padding:0 6px; font-size:8px; height:20px; text-align:left; }
          .rb-doc-info-cell table tr:last-child td { border-bottom:none; }
          .rb-doc-label { font-weight:bold; width:60px; border-right:1px solid black !important; background:#c0c0c0; font-size:8px; }
          .rb-doc-value { font-size:9px; font-weight:600; }
          .rb-att-table { border:2px solid black; table-layout:fixed; flex:1 1 auto; }
          .rb-att-table th { background:#f5f5f5; font-weight:bold; font-size:7.5px; padding:1px 1px; height:26px; white-space:normal; word-break:break-word; line-height:1.1; }
          .rb-att-table td { font-size:8px; padding:0 1px; overflow:hidden; height:26px; }
          .rb-att-table tbody tr:nth-child(even) td { background:#fafafa; }
          .rb-legend { border:2px solid black; flex:0 0 auto; display:flex; align-items:center; justify-content:space-between; padding:4px 20px; font-size:9px; font-weight:bold; }
          .rb-footer { flex:0 0 auto; border:2px solid black; display:flex; align-items:stretch; }
          .rb-remarks-label { width:130px; border-right:1px solid black; padding:6px 10px; font-size:10px; font-weight:bold; display:flex; align-items:center; }
          .rb-remarks-value { flex:1; padding:6px 10px; font-size:10px; }
        </style>
      </head>
      <body>
        ${reportEl.outerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); setTimeout(function() { window.close(); }, 500); }, 300);
          };
        </script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="rb-container">

      {/* ── Top Bar ── */}
      <div className="no-print" style={{
        display:'flex', justifyContent:'flex-end',
        alignItems:'center', gap:'12px', marginBottom:'10px'
      }}>

        {/* Month / Year Selector */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#fff', padding:'6px 14px', borderRadius:'8px', boxShadow:'0 1px 4px rgba(0,0,0,0.12)' }}>
          <i className="bi bi-calendar3" style={{ color:'#1976d2', fontSize:'16px' }}></i>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            style={{ border:'1px solid #ccc', borderRadius:'5px', padding:'4px 8px', fontSize:'13px', fontWeight:'600', color:'#1976d2', cursor:'pointer' }}
          >
            {MONTH_NAMES.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            style={{ border:'1px solid #ccc', borderRadius:'5px', padding:'4px 8px', fontSize:'13px', fontWeight:'600', color:'#1976d2', cursor:'pointer' }}
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span style={{ fontSize:'12px', color:'#666', fontWeight:'600' }}>
            ({daysInMonth} days)
          </span>
        </div>

        {/* Back */}
        <button onClick={() => navigate(-1)} style={{ background:'#607d8b', color:'#fff', border:'none', padding:'8px 20px', borderRadius:'6px', fontWeight:'bold', cursor:'pointer', fontSize:'14px', display:'flex', alignItems:'center', gap:'6px' }}>
          <i className="bi bi-arrow-left-circle-fill"></i> Back
        </button>

        {/* Edit */}
        <button onClick={() => { if (onEditForm) onEditForm(currentReport); }} style={{ background:'#ff9800', color:'#fff', border:'none', padding:'8px 20px', borderRadius:'6px', fontWeight:'bold', cursor:'pointer', fontSize:'14px', display:'flex', alignItems:'center', gap:'6px' }}>
          <i className="bi bi-pencil-square"></i> Edit
        </button>

        {/* Print */}
        <button onClick={handlePrint} style={{ background:'#4CAF50', color:'#fff', border:'none', padding:'8px 20px', borderRadius:'6px', fontWeight:'bold', cursor:'pointer', fontSize:'14px', display:'flex', alignItems:'center', gap:'6px' }}>
          <i className="bi bi-printer-fill"></i> Print
        </button>
      </div>

      {/* ── Report Area ── */}
      <div className="rb-report" id="redbin-print-area">

        {/* HEADER */}
        <table className="rb-header-table">
          <tbody>
            <tr>
              <td className="rb-logo-cell">
                <img src={atomone} alt="ATOM ONE" className="rb-logo-image" />
              </td>
              <td className="rb-title-cell">RED BIN ATTENDANCE SHEET</td>
              <td className="rb-doc-info-cell">
                <table>
                  <tbody>
                    <tr>
                      <td className="rb-doc-label">Doc.no.</td>
                      <td className="rb-doc-value">{currentReport?.doc_no || 'AOT-F-QC-05'}</td>
                    </tr>
                    <tr>
                      <td className="rb-doc-label">Rev.no.</td>
                      <td className="rb-doc-value">{currentReport?.rev_no || '00'}</td>
                    </tr>
                    <tr>
                      <td className="rb-doc-label">Date</td>
                      <td className="rb-doc-value">{formatDisplay(currentReport?.doc_date) || '14.10.2024'}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ATTENDANCE TABLE */}
        <table className="rb-att-table">
          <colgroup>
            <col style={{ width: '3%' }} />   {/* Sr.No. */}
            <col style={{ width: '8%' }} />   {/* Name */}
            <col style={{ width: '7%' }} />   {/* Designation */}
            {dayColumns.map(d => (
              <col key={d} style={{ width: `${(82 / daysInMonth).toFixed(2)}%` }} />
            ))}
          </colgroup>

          <thead>
            <tr style={{ height: `${THEAD_H}px` }}>
              <th>Sr.No.</th>
              <th>Name</th>
              <th>DESIGNATION</th>
              {dayColumns.map(d => (
                <th key={d}>{d}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: TOTAL_ROWS }, (_, i) => {
              const row = empItems[i] || null;
              return (
                <tr key={i} style={{ height: `${rowH}px` }}>
                  <td style={{ fontWeight: '600', fontSize: '10px' }}>{i + 1}</td>
                  <td style={{ textAlign: 'left', paddingLeft: '6px', fontWeight: row?.name ? '600' : '400', fontSize: '10px' }}>
                    {row?.name || ''}
                  </td>
                  <td style={{ fontSize: '9px' }}>{row?.designation || ''}</td>
                  {dayColumns.map(d => (
                    <td key={d} style={{ fontSize: '9px' }}>
                      {row?.[`day_${d}`] || ''}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* LEGEND ROW */}
        <div className="rb-legend">
          <span>P &nbsp;: &nbsp;Present</span>
          <span>A &nbsp;: &nbsp;Absent</span>
          <span>Month &nbsp;: &nbsp;<strong>{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</strong></span>
        </div>

        {/* FOOTER — Remarks */}
        <div className="rb-footer">
          <div className="rb-remarks-label">Remarks</div>
          <div className="rb-remarks-value">{currentReport?.remarks || remarks}</div>
        </div>

      </div>
    </div>
  );
};

export default RedBinAttendance;