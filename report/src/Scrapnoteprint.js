// ============================================================
//  Scrap_Note.js
//  Scrap Note Report — Landscape A4
//  DOC.NO. AOT-F-QC-04
//  Architecture: Matches Inspection.js exactly
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDropdownOptions } from './services/api';
import './Scrapnoteprint.css';
import atomone from './image/atomone.jpg';

// ── Date format helper: "2024-01-15" → "15/01/2024" ──
const formatDisplay = (dateStr) => {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

// ── Minimum rows to always show ──
const MIN_ROWS = 20;

const Scrapnoteprint = ({ items = [], currentReport, onFilter, onEditForm }) => {
  const navigate = useNavigate();

  // ── Filter states ──
  const [showFilter, setShowFilter] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [filterPart, setFilterPart] = useState('');
  const [dbOptions,  setDbOptions]  = useState({ part_names: [] });

  useEffect(() => {
    getDropdownOptions()
      .then(data => setDbOptions(data))
      .catch(err => console.error('Filter options fetch failed:', err));
  }, []);

  // Sort and get items
  const scrapItems = items
    .filter(x => x.sr_no >= 1)
    .sort((a, b) => a.sr_no - b.sr_no);

  const TOTAL_ROWS = Math.max(MIN_ROWS, scrapItems.length);

  // ── Dynamic row height: usable height minus header/thead/footer divided by rows ──
  const HEADER_H  = 64;   // header table height
  const THEAD_H   = 30;   // table header row
  const FOOTER_H  = 46;   // footer div height
  const GAPS      = 12;   // gaps between sections
  const PAGE_H_PX = 762;  // A4 landscape usable height px (210mm @96dpi minus margins)
  const rowH = Math.max(26, Math.floor((PAGE_H_PX - HEADER_H - THEAD_H - FOOTER_H - GAPS) / TOTAL_ROWS));

  const isAnyFilterActive = filterDate || filterPart;

  const handleFilterApply = () => {
    if (!isAnyFilterActive) { alert('Please select at least one filter.'); return; }
    if (onFilter) onFilter({ date: filterDate, partName: filterPart });
    setShowFilter(false);
  };

  const handleFilterReset = () => {
    setFilterDate('');
    setFilterPart('');
    setShowFilter(false);
  };

  // ══════════════════════════════════════
  // PRINT FUNCTION — New Window Approach
  // Matches Inspection.js exactly
  // ══════════════════════════════════════
  const handlePrint = () => {
    const reportEl = document.getElementById('scrapnote-print-area');
    if (!reportEl) return;

    const printWindow = window.open('', '_blank', 'width=1200,height=800');

    // Collect all stylesheets from current page
    const styles = Array.from(document.styleSheets).map(sheet => {
      try {
        return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
      } catch (e) { return ''; }
    }).join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>Scrap Note</title>
          <style>
            /* ── FORCE A4 LANDSCAPE ── */
            @page {
              size: A4 landscape;
              margin: 6mm;
            }

            * { margin: 0; padding: 0; box-sizing: border-box; }

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
            .sn-report {
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

            .sn-container {
              padding: 0 !important;
              background: white !important;
            }

            .no-print { display: none !important; }

            table { width: 100%; border-collapse: collapse; }
            td, th { border: 1px solid black; text-align: center; vertical-align: middle; overflow: hidden; }

            .sn-header-table { border: 2px solid black; flex: 0 0 auto; }
            .sn-logo-cell { width: 120px; padding: 6px; text-align: center; border-right: 2px solid black; }
            .sn-logo-image { max-width: 100%; max-height: 42px; object-fit: contain; }
            .sn-title-cell { font-weight: bold; font-size: 16px; padding: 0 12px; letter-spacing: 2px; text-transform: uppercase; }
            .sn-doc-info-cell { width: 220px; padding: 0; border-left: 2px solid black; }
            .sn-doc-info-cell table { border: none; }
            .sn-doc-info-cell table td { border: none; border-bottom: 1px solid black; padding: 0 6px; font-size: 8.5px; height: 21px; text-align: left; }
            .sn-doc-info-cell table tr:last-child td { border-bottom: none; }
            .sn-doc-label { font-weight: bold; width: 80px; border-right: 1px solid black !important; font-size: 8.5px; background-color: #c0c0c0; }
            .sn-doc-value { font-size: 10px; font-weight: 600; }

            .sn-scrap-table { border: 2px solid black; table-layout: fixed; flex: 1 1 auto; }
            .sn-scrap-table th { background: #f5f5f5; font-weight: bold; font-size: 9px; padding: 2px 3px; height: 26px; }
            .sn-scrap-table td { font-size: 9px; padding: 2px 3px; overflow: hidden; height: 26px; }
            .sn-scrap-table tbody tr:nth-child(even) td { background: #fafafa; }

            .sn-footer { flex: 0 0 auto; display: flex; justify-content: space-between; align-items: flex-end; padding: 4px 10px 6px; margin-top: auto; }
            .sn-signature-field { display: flex; align-items: flex-end; gap: 8px; min-width: 280px; }
            .sn-signature-field label { font-size: 10px; font-weight: bold; white-space: nowrap; padding-bottom: 2px; }
            .sn-signature-field input { font-size: 10px; border: none; border-bottom: 1.5px solid black; min-width: 200px; flex: 1; background: transparent; outline: none; }
          </style>
        </head>
        <body>
          ${reportEl.outerHTML}
          <script>
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

  return (
    <div className="sn-container">

      {/* ── Top Bar ── */}
      <div className="no-print" style={{
        display: 'flex', justifyContent: 'flex-end',
        alignItems: 'center', gap: '12px', marginBottom: '10px'
      }}>

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          style={{ background: '#607d8b', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="bi bi-arrow-left-circle-fill"></i> Back
        </button>

        {/* Filter */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowFilter(p => !p)}
            style={{ background: showFilter ? '#1565c0' : '#1976d2', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="bi bi-funnel-fill"></i> Filter {isAnyFilterActive ? '●' : ''}
          </button>

          {showFilter && (
            <>
              <div onClick={() => setShowFilter(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
              <div style={{ position: 'absolute', right: 0, top: '46px', zIndex: 999, background: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', padding: '20px', minWidth: '300px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '16px', color: '#1976d2', borderBottom: '2px solid #e3f2fd', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <span><i className="bi bi-funnel-fill" style={{ marginRight: 6 }}></i>Filter Reports</span>
                  <span onClick={() => setShowFilter(false)} style={{ cursor: 'pointer', color: '#999' }}>✕</span>
                </div>

                {[
                  {
                    label: <><i className="bi bi-calendar3" style={{ marginRight: 5 }}></i>Date</>,
                    content: (
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: `1px solid ${filterDate ? '#1976d2' : '#ccc'}`, borderRadius: '6px', padding: '7px 10px', background: filterDate ? '#e3f2fd' : '#fff', cursor: 'pointer' }}>
                        <span style={{ fontSize: '13px', flex: 1, color: filterDate ? '#1976d2' : '#999' }}>{filterDate ? filterDate.split('-').reverse().join('/') : 'Select Date'}</span>
                        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', top: 0, left: 0 }} />
                        <i className="bi bi-calendar3"></i>
                      </div>
                    )
                  },
                  {
                    label: <><i className="bi bi-gear-fill" style={{ marginRight: 5 }}></i>Part Name</>,
                    content: (
                      <select value={filterPart} onChange={e => setFilterPart(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: `1px solid ${filterPart ? '#1976d2' : '#ccc'}`, borderRadius: '6px', fontSize: '13px' }}>
                        <option value="">All Parts</option>
                        {dbOptions.part_names.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    )
                  },
                ].map(({ label, content }, i) => (
                  <div key={i} style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#555', display: 'block', marginBottom: '5px', textTransform: 'uppercase' }}>{label}</label>
                    {content}
                  </div>
                ))}

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button onClick={handleFilterApply} style={{ flex: 1, background: '#1976d2', color: '#fff', border: 'none', padding: '9px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <i className="bi bi-check-circle-fill"></i> Apply
                  </button>
                  <button onClick={handleFilterReset} style={{ flex: 1, background: '#fff', color: '#e53935', border: '1px solid #e53935', padding: '9px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
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
          style={{ background: '#ff9800', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="bi bi-pencil-square"></i> Edit
        </button>

        {/* Print */}
        <button
          onClick={handlePrint}
          style={{ background: '#4CAF50', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="bi bi-printer-fill"></i> Print
        </button>
      </div>

      {/* ── Report Area — id lagaya print ke liye ── */}
      <div className="sn-report" id="scrapnote-print-area">

        {/* ── HEADER ── */}
        <table className="sn-header-table">
          <tbody>
            <tr>
              <td className="sn-logo-cell">
                <img src={atomone} alt="ATOM ONE" className="sn-logo-image" />
              </td>
              <td className="sn-title-cell">SCRAP NOTE</td>
              <td className="sn-doc-info-cell">
                <table>
                  <tbody>
                    <tr>
                      <td className="sn-doc-label">DOC.NO.</td>
                      <td className="sn-doc-value">{currentReport?.doc_no || 'AOT-F-QC-04'}</td>
                    </tr>
                    <tr>
                      <td className="sn-doc-label">REV.NO.</td>
                      <td className="sn-doc-value">{currentReport?.rev_no || '00'}</td>
                    </tr>
                    <tr>
                      <td className="sn-doc-label">DATE</td>
                      <td className="sn-doc-value">{formatDisplay(currentReport?.doc_date) || '01.01.2019'}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── SCRAP TABLE ── */}
        <table className="sn-scrap-table">
          <colgroup>
            <col style={{ width: '7%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '29%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '7%' }} />
          </colgroup>

          <thead>
            <tr>
              <th>DATE</th>
              <th>PART NAME</th>
              <th>MODEL</th>
              <th>DEFECT</th>
              <th>PROCESS</th>
              <th>QTY</th>
              <th style={{ whiteSpace: 'normal', lineHeight: '1.2' }}>QA HEAD<br />SIGN</th>
              <th style={{ whiteSpace: 'normal', lineHeight: '1.2' }}>PLANT HEAD<br />SIGN</th>
              <th style={{ whiteSpace: 'normal', lineHeight: '1.2', wordBreak: 'break-word' }}>REMARKS</th>
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: TOTAL_ROWS }, (_, i) => {
              const row = scrapItems[i] || null;
              return (
                <tr key={i} style={{ height: `${rowH}px` }}>
                  <td>{row?.date ? formatDisplay(row.date) : ''}</td>
                  <td style={{ textAlign: 'left', paddingLeft: '6px', fontWeight: row?.part_name ? '600' : '400' }}>
                    {row?.part_name || ''}
                  </td>
                  <td>{row?.model || ''}</td>
                  <td style={{ textAlign: 'left', paddingLeft: '6px' }}>{row?.defect || ''}</td>
                  <td style={{ textAlign: 'left', paddingLeft: '6px' }}>{row?.process || ''}</td>
                  <td>{row?.qty || ''}</td>
                  <td>{row?.qa_head_sign || ''}</td>
                  <td>{row?.plant_head_sign || ''}</td>
                  <td style={{ textAlign: 'left', paddingLeft: '4px' }}>{row?.remarks || ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ── FOOTER ── */}
        <div className="sn-footer">
          <div className="sn-signature-field">
            <label>PREPARED BY:</label>
            <input type="text" readOnly value={currentReport?.prepared_by || ''} />
          </div>
          <div className="sn-signature-field">
            <label>APPROVED BY:</label>
            <input type="text" readOnly value={currentReport?.approved_by || ''} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Scrapnoteprint;