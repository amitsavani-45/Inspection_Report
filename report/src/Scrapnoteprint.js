// ============================================================
//  Scrap_Note.js
//  Scrap Note Report — Landscape A4
//  DOC.NO. AOT-F-QC-04
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import atomone from './image/atomone.jpg';

// ── Inject print styles once ──
const PRINT_STYLE = `
  @media print {
    body * { visibility: hidden; }
    .sn-report, .sn-report * { visibility: visible; }
    .no-print { display: none !important; }
    @page { size: A4 landscape; margin: 8mm; }
    .sn-report {
      position: absolute; top: 0; left: 0;
      width: 100% !important;
      box-shadow: none !important;
      margin: 0 !important; padding: 0 !important;
    }
    .sn-insp-table tr { page-break-inside: avoid; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  }
`;
if (typeof document !== 'undefined' && !document.getElementById('sn-print-style')) {
  const styleTag = document.createElement('style');
  styleTag.id = 'sn-print-style';
  styleTag.textContent = PRINT_STYLE;
  document.head.appendChild(styleTag);
}

// ── Date format helper: "2024-01-15" → "15/01/2024" ──
const formatDisplay = (dateStr) => {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

// ── Shared class strings ──
const TH = 'border border-black font-bold text-center align-middle leading-tight';
const TH_STYLE = { backgroundColor: '#ffffff' };
const TD = 'border border-black text-center align-middle bg-white px-0.5 py-px';

// ── Minimum rows to always show ──
const MIN_ROWS = 25;

const Scrapnoteprint = ({ items = [], currentReport, onFilter, onEditForm }) => {
  const navigate = useNavigate();

  // ── Filter states ──
  const [showFilter,     setShowFilter]     = useState(false);
  const [filterDate,     setFilterDate]     = useState('');
  const [filterPart,     setFilterPart]     = useState('');
  const [dbOptions,      setDbOptions]      = useState({ part_names: [] });

  // Sort and get items
  const scrapItems = items
    .filter(x => x.sr_no >= 1)
    .sort((a, b) => a.sr_no - b.sr_no);

  const TOTAL_ROWS = Math.max(MIN_ROWS, scrapItems.length);

  const isAnyFilterActive = filterDate || filterPart;

  const handleFilterApply = () => {
    if (!isAnyFilterActive) { alert('Please select at least one filter.'); return; }
    if (onFilter) onFilter({ date: filterDate, partName: filterPart });
    setShowFilter(false);
  };

  const handleFilterReset = () => {
    setFilterDate(''); setFilterPart('');
    setShowFilter(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-5">

      {/* ══════════════════════════════════════
           TOP BAR (no-print)
          ══════════════════════════════════════ */}
      <div className="no-print" style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '10px'
      }}>

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          style={{
            background: '#607d8b', color: '#fff', border: 'none',
            padding: '8px 20px', borderRadius: '6px', fontWeight: 'bold',
            cursor: 'pointer', fontSize: '14px',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
          <i className="bi bi-arrow-left-circle-fill"></i> Back
        </button>

        {/* Filter */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowFilter(p => !p)}
            style={{
              background: showFilter ? '#1565c0' : '#1976d2',
              color: '#fff', border: 'none',
              padding: '8px 20px', borderRadius: '6px', fontWeight: 'bold',
              cursor: 'pointer', fontSize: '14px',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
            <i className="bi bi-funnel-fill"></i>
            Filter {isAnyFilterActive ? '●' : ''}
          </button>

          {showFilter && (
            <>
              <div onClick={() => setShowFilter(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
              <div style={{
                position: 'absolute', right: 0, top: '46px', zIndex: 50,
                background: '#fff', border: '1px solid #e0e0e0',
                borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                padding: '20px', minWidth: '300px'
              }}>
                <div style={{
                  fontWeight: 'bold', fontSize: '14px', marginBottom: '16px',
                  color: '#1976d2', borderBottom: '2px solid #e3f2fd',
                  paddingBottom: '10px', display: 'flex', justifyContent: 'space-between'
                }}>
                  <span><i className="bi bi-funnel-fill" style={{ marginRight: 6 }}></i>Filter Reports</span>
                  <span onClick={() => setShowFilter(false)} style={{ cursor: 'pointer', color: '#999' }}>✕</span>
                </div>

                {/* Date */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#555', display: 'block', marginBottom: '5px', textTransform: 'uppercase' }}>
                    <i className="bi bi-calendar3" style={{ marginRight: 5 }}></i>Date
                  </label>
                  <div style={{
                    position: 'relative', display: 'flex', alignItems: 'center',
                    border: `1px solid ${filterDate ? '#1976d2' : '#ccc'}`,
                    borderRadius: '6px', padding: '7px 10px',
                    background: filterDate ? '#e3f2fd' : '#fff', cursor: 'pointer'
                  }}>
                    <span style={{ fontSize: '13px', flex: 1, color: filterDate ? '#1976d2' : '#999' }}>
                      {filterDate ? filterDate.split('-').reverse().join('/') : 'Select Date'}
                    </span>
                    <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                      style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', top: 0, left: 0 }} />
                    <i className="bi bi-calendar3"></i>
                  </div>
                </div>

                {/* Part Name */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#555', display: 'block', marginBottom: '5px', textTransform: 'uppercase' }}>
                    <i className="bi bi-gear-fill" style={{ marginRight: 5 }}></i>Part Name
                  </label>
                  <select value={filterPart} onChange={e => setFilterPart(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', border: `1px solid ${filterPart ? '#1976d2' : '#ccc'}`, borderRadius: '6px', fontSize: '13px' }}>
                    <option value="">All Parts</option>
                    {dbOptions.part_names.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* Apply / Reset */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button onClick={handleFilterApply}
                    style={{ flex: 1, background: '#1976d2', color: '#fff', border: 'none', padding: '9px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <i className="bi bi-check-circle-fill"></i> Apply
                  </button>
                  <button onClick={handleFilterReset}
                    style={{ flex: 1, background: '#fff', color: '#e53935', border: '1px solid #e53935', padding: '9px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <i className="bi bi-arrow-counterclockwise"></i> Reset
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Edit */}
        <button
          onClick={() => { if (onEditForm) onEditForm(currentReport); }}
          style={{
            background: '#ff9800', color: '#fff', border: 'none',
            padding: '8px 20px', borderRadius: '6px', fontWeight: 'bold',
            cursor: 'pointer', fontSize: '14px',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
          <i className="bi bi-pencil-square"></i> Edit
        </button>

        {/* Print */}
        <button
          onClick={() => window.print()}
          style={{
            background: '#4CAF50', color: '#fff', border: 'none',
            padding: '8px 20px', borderRadius: '6px', fontWeight: 'bold',
            cursor: 'pointer', fontSize: '14px',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
          <i className="bi bi-printer-fill"></i> Print
        </button>
      </div>

      {/* ══════════════════════════════════════
           REPORT — A4 Landscape
          ══════════════════════════════════════ */}
      <div
        className="sn-report bg-white mx-auto shadow-md"
        style={{
          fontFamily: 'Arial, sans-serif',
          width: '297mm',
          boxSizing: 'border-box',
        }}
      >

        {/* ── SECTION 1: HEADER ── */}
        <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ height: '52px' }}>
              {/* Logo */}
              <td
                className="border-r-2 border-black text-center align-middle"
                style={{ width: '110px', padding: '4px 6px' }}
              >
                <img
                  src={atomone}
                  alt="ATOM ONE"
                  className="block mx-auto object-contain"
                  style={{ width: '90px', height: 'auto' }}
                />
              </td>

              {/* Title */}
              <td className="text-center align-middle" style={{ padding: '4px' }}>
                <span
                  className="uppercase font-black tracking-wide"
                  style={{ fontSize: '22px', fontWeight: 'bold', letterSpacing: '2px' }}
                >
                  SCRAP NOTE
                </span>
              </td>

              {/* Doc Info */}
              <td
                className="border-l-2 border-black align-top p-0"
                style={{ width: '200px' }}
              >
                <table style={{ borderCollapse: 'collapse', width: '100%', height: '100%' }}>
                  <tbody>
                    <tr>
                      <td className="border-b border-black px-3 py-1" style={{ fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>DOC.NO.</td>
                      <td className="border-b border-black px-3 py-1" style={{ fontSize: '10px' }}>
                        {currentReport?.doc_no || 'AOT-F-QC-04'}
                      </td>
                    </tr>
                    <tr>
                      <td className="border-b border-black px-3 py-1" style={{ fontSize: '10px', fontWeight: 'bold' }}>REV.NO.</td>
                      <td className="border-b border-black px-3 py-1" style={{ fontSize: '10px' }}>
                        {currentReport?.rev_no || '00'}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1" style={{ fontSize: '10px', fontWeight: 'bold' }}>DATE</td>
                      <td className="px-3 py-1" style={{ fontSize: '10px' }}>
                        {formatDisplay(currentReport?.doc_date) || '01.01.2019'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── SECTION 2: SCRAP TABLE ── */}
        <table
          className="sn-insp-table w-full border border-black border-t-0"
          style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%' }}
        >
          <colgroup>
            <col style={{ width: '6%' }} />   {/* DATE */}
            <col style={{ width: '16%' }} />  {/* PART NAME */}
            <col style={{ width: '8%' }} />   {/* MODEL */}
            <col style={{ width: '10%' }} />  {/* DEFECT */}
            <col style={{ width: '32%' }} />  {/* PROCESS */}
            <col style={{ width: '6%' }} />   {/* QTY */}
            <col style={{ width: '9%' }} />   {/* QA HEAD SIGN */}
            <col style={{ width: '9%' }} />   {/* PLANT HEAD SIGN */}
            <col style={{ width: '4%' }} />   {/* REMARKS */}
          </colgroup>

          <thead>
            <tr style={{ height: '28px' }}>
              <th className={TH} style={{ ...TH_STYLE, fontSize: '10px', padding: '3px 2px', wordBreak: 'break-word' }}>DATE</th>
              <th className={TH} style={{ ...TH_STYLE, fontSize: '10px', padding: '3px 2px', wordBreak: 'break-word' }}>Part Name</th>
              <th className={TH} style={{ ...TH_STYLE, fontSize: '10px', padding: '3px 2px', wordBreak: 'break-word' }}>Model</th>
              <th className={TH} style={{ ...TH_STYLE, fontSize: '10px', padding: '3px 2px', wordBreak: 'break-word' }}>DEFECT</th>
              <th className={TH} style={{ ...TH_STYLE, fontSize: '10px', padding: '3px 2px', wordBreak: 'break-word' }}>PROCESS</th>
              <th className={TH} style={{ ...TH_STYLE, fontSize: '10px', padding: '3px 2px', wordBreak: 'break-word' }}>QTY</th>
              <th className={TH} style={{ ...TH_STYLE, fontSize: '10px', padding: '3px 2px', wordBreak: 'break-word' }}>QA HEAD SIGN</th>
              <th className={TH} style={{ ...TH_STYLE, fontSize: '10px', padding: '3px 2px', wordBreak: 'break-word' }}>PLANT HEAD SIGN</th>
              <th className={TH} style={{ ...TH_STYLE, fontSize: '10px', padding: '3px 2px', wordBreak: 'break-word' }}>REMARKS</th>
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: TOTAL_ROWS }, (_, i) => {
              const row = scrapItems[i] || null;
              return (
                <tr key={i} style={{ height: '22px' }}>
                  <td className={TD} style={{ fontSize: '10px' }}>
                    {row?.date ? formatDisplay(row.date) : ''}
                  </td>
                  <td className={`${TD} !text-left !pl-1.5`} style={{ fontSize: '10px' }}>
                    {row?.part_name || ''}
                  </td>
                  <td className={TD} style={{ fontSize: '10px' }}>
                    {row?.model || ''}
                  </td>
                  <td className={`${TD} !text-left !pl-1.5`} style={{ fontSize: '10px' }}>
                    {row?.defect || ''}
                  </td>
                  <td className={`${TD} !text-left !pl-1.5`} style={{ fontSize: '10px' }}>
                    {row?.process || ''}
                  </td>
                  <td className={TD} style={{ fontSize: '10px' }}>
                    {row?.qty || ''}
                  </td>
                  <td className={TD} style={{ fontSize: '10px' }}>
                    {row?.qa_head_sign || ''}
                  </td>
                  <td className={TD} style={{ fontSize: '10px' }}>
                    {row?.plant_head_sign || ''}
                  </td>
                  <td className={`${TD} !text-left !pl-1`} style={{ fontSize: '10px' }}>
                    {row?.remarks || ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ── FOOTER ── */}
        <table
          className="w-full border border-black border-t-0"
          style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}
        >
          <tbody>
            <tr>
              <td
                className="border border-black bg-white px-6"
                style={{ height: '36px', verticalAlign: 'middle', textAlign: 'left', width: '50%' }}
              >
                <span style={{ fontWeight: 'bold', fontSize: '11px' }}>PREPARED BY: </span>
                <span style={{ fontSize: '11px' }}>{currentReport?.prepared_by || ''}</span>
              </td>
              <td
                className="border border-black bg-white px-6"
                style={{ height: '36px', verticalAlign: 'middle', textAlign: 'left', width: '50%' }}
              >
                <span style={{ fontWeight: 'bold', fontSize: '11px' }}>APPROVED BY: </span>
                <span style={{ fontSize: '11px' }}>{currentReport?.approved_by || ''}</span>
              </td>
            </tr>
          </tbody>
        </table>

      </div>
    </div>
  );
};

export default Scrapnoteprint;