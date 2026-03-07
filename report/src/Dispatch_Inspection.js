// ============================================================
//  Dispatch_Inspection.js
//  Pre Dispatch Inspection Report — Portrait A4
// ============================================================

import React, { useState, useEffect } from 'react';
import { getDropdownOptions } from './services/api';
import { useNavigate } from 'react-router-dom';
import './Dispatch_Inspection.css';
import atomone from './image/atomone.jpg';

// ── Date format helper: "2024-01-15" → "15/01/2024" ──
const formatDisplay = (dateStr) => {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

// ── Shared Tailwind class strings (inspection table only) ──
const TH = 'border border-black bg-gray-300 font-bold text-center align-middle leading-tight px-0.5 py-0.5';
const TD = 'border border-black text-center align-middle bg-white px-0.5 py-px';

const Dispatch_Inspection = ({ items = [], currentReport, onFilter, onEditForm }) => {
  const navigate = useNavigate();

  const displayDate = formatDisplay(currentReport?.inspection_date) || '';

  // ── Print CSS inject ──
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

  useEffect(() => {
    getDropdownOptions()
      .then(data => setDbOptions(data))
      .catch(err => console.error('Filter options fetch failed:', err));
  }, []);

  const inspItems = items
    .filter(x => x.sr_no >= 1 && x.sr_no <= 25)
    .sort((a, b) => a.sr_no - b.sr_no);

  // ── Row height calc (A4 fit) ──
  const TOTAL_ROWS   = 25;
  const TOTAL_USABLE = 980;
  const HEADER_H     = 56;
  const INFO_H       = 56;
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

  return (
    <div className="min-h-screen bg-gray-100 p-5">

      {/* ══════════════════════════════════════
           TOP BAR (no-print)
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

        {/* Edit + Print */}
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

        {/* ── SECTION 1: HEADER — Logo | Title | Page No ── */}
        <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td className="border-r-2 border-black p-1.5 text-center align-middle" style={{ width: '110px' }}>
                <img src={atomone} alt="ATOM ONE" className="block mx-auto object-contain" style={{ width: '100px', height: 'auto' }} />
              </td>
              <td className="text-center align-middle p-1.5">
                <span className="uppercase font-black tracking-wide" style={{ fontSize: '15px' }}>
                  Pre Dispatch Inspection Report
                </span>
              </td>
              <td className="border-l-2 border-black align-top p-0" style={{ width: '160px' }}>
                <div className="border-b border-black px-2 py-1 bg-gray-100">
                  <span className="text-xs font-bold">PAGE NO.</span>
                </div>
                <div className="px-2 py-1">
                  <span className="text-xs font-bold">{currentReport?.page_no || '01 OF 01'}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── SECTION 2: INFO TABLE ──
             Inline bold labels + values (like Image 2).
             Colgroup matches inspection table exactly → vertical borders align.
             ROW 1: SUPPLIER NAME(C1-C4) | PART NO(C5) | INSPECTION DATE(C6-C8) | CUSTOMER NAME(C9-C12)
             ROW 2: PART NAME label(C1-C2) | PART NAME value(C3-C5) | INVOICE NO(C6-C8) | LOT QTY(C9-C11) | empty(C12)
        ── */}
        <table
          className="w-full border-2 border-black border-t-0"
          style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}
        >
          <colgroup>
            <col style={{ width: '4%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
          </colgroup>
          <tbody>

            {/* ── INFO ROW 1 ──
                 C1–C4  : SUPPLIER NAME
                 C5–C6  : PART NO
                 C7–C9  : INSPECTION DATE
                 C10–C12: CUSTOMER NAME (3 cols = enough space)
            ── */}
            <tr style={{ height: '22px' }}>

              {/* SUPPLIER NAME : value  →  C1–C4 */}
              <td
                colSpan={4}
                className="border border-black bg-white"
                style={{ fontSize: '8px', padding: '2px 5px', textAlign: 'left' }}
              >
                <span style={{ fontWeight: 'bold' }}>SUPPLIER NAME : </span>
                <span style={{ fontSize: '9px' }}>{currentReport?.supplier_name || ''}</span>
              </td>

              {/* PART NO : value  →  C5–C6 */}
              <td
                colSpan={2}
                className="border border-black bg-white"
                style={{ fontSize: '8px', padding: '2px 5px', textAlign: 'left' }}
              >
                <span style={{ fontWeight: 'bold' }}>PART NO : </span>
                <span style={{ fontSize: '9px' }}>{currentReport?.part_no || ''}</span>
              </td>

              {/* INSPECTION DATE. : value  →  C7–C9 */}
              <td
                colSpan={3}
                className="border border-black bg-white"
                style={{ fontSize: '8px', padding: '2px 5px', textAlign: 'left' }}
              >
                <span style={{ fontWeight: 'bold' }}>INSPECTION DATE. : </span>
                <span style={{ fontSize: '9px' }}>{displayDate}</span>
              </td>

              {/* CUSTOMER NAME :- value  →  C10–C12 */}
              <td
                colSpan={3}
                className="border border-black bg-white"
                style={{ fontSize: '8px', padding: '2px 5px', textAlign: 'left' }}
              >
                <span style={{ fontWeight: 'bold' }}>CUSTOMER NAME :- </span>
                <span style={{ fontSize: '9px' }}>{currentReport?.customer_name || ''}</span>
              </td>
            </tr>

            {/* ── INFO ROW 2 ──
                 C1–C5  : PART NAME label + value (same width as SUPPLIER NAME above)
                 C6–C8  : INVOICE NO (above VENDOR)
                 C9–C11 : LOT QTY   (above CUSTOMER)
                 C12    : empty      (above REMARKS)
            ── */}
            <tr style={{ height: '22px' }}>

              {/* PART NAME : label  →  C1–C2 */}
              <td
                colSpan={2}
                className="border border-black bg-white"
                style={{ fontSize: '8px', padding: '2px 5px', fontWeight: 'bold', textAlign: 'left' }}
              >
                PART NAME :
              </td>

              {/* part_name value  →  C3–C5 */}
              <td
                colSpan={3}
                className="border border-black bg-white"
                style={{ fontSize: '9px', padding: '2px 5px', textAlign: 'left' }}
              >
                {currentReport?.part_name || ''}
              </td>

              {/* INVOICE NO.:- value  →  C6–C8 (above VENDOR OBSERVATIONS) */}
              <td
                colSpan={3}
                className="border border-black bg-white"
                style={{ fontSize: '8px', padding: '2px 5px', textAlign: 'left' }}
              >
                <span style={{ fontWeight: 'bold' }}>INVOICE NO.:- </span>
                <span style={{ fontSize: '9px' }}>{currentReport?.invoice_no || ''}</span>
              </td>

              {/* LOT QTY. : value  →  C9–C11 (above CUSTOMER OBSERVATION) */}
              <td
                colSpan={3}
                className="border border-black bg-white"
                style={{ fontSize: '8px', padding: '2px 5px', textAlign: 'left' }}
              >
                <span style={{ fontWeight: 'bold' }}>LOT QTY. : </span>
                <span style={{ fontSize: '9px' }}>{currentReport?.lot_qty || ''}</span>
              </td>

              {/* empty  →  C12 (above REMARKS) */}
              <td
                colSpan={1}
                className="border border-black bg-white"
              />
            </tr>

          </tbody>
        </table>

        {/* ── SECTION 3: INSPECTION TABLE ── */}
        <table
          className="w-full border-2 border-black border-t-0"
          style={{
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
            height: `${INSP_THEAD_H + TOTAL_ROWS * inspRowH}px`,
          }}
        >
          <colgroup>
            <col style={{ width: '4%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
          </colgroup>

          <thead>
            <tr style={{ height: '22px' }} className="bg-gray-100">
              <th rowSpan={2} className={TH} style={{ fontSize: '10px' }}>SR.<br />No.</th>
              <th rowSpan={2} className={TH} style={{ fontSize: '10px' }}>INSPECTION ITEMS</th>
              <th rowSpan={2} className={TH} style={{ fontSize: '10px' }}>DIMENSIONS/<br />SPEC</th>
              <th rowSpan={2} className={TH} style={{ fontSize: '10px' }}>TOLERANCE</th>
              <th rowSpan={2} className={TH} style={{ fontSize: '10px' }}>INSPECTION<br />METHOD</th>
              <th colSpan={3} className={TH} style={{ fontSize: '10px' }}>VENDOR OBSERVATIONS</th>
              <th colSpan={3} className={TH} style={{ fontSize: '10px' }}>CUSTOMER OBSERVATION</th>
              <th rowSpan={2} className={TH} style={{ fontSize: '10px' }}>REMARKS</th>
            </tr>
            <tr style={{ height: '22px' }} className="bg-gray-100">
              <th className={TH} style={{ fontSize: '10px' }}>1</th>
              <th className={TH} style={{ fontSize: '10px' }}>2</th>
              <th className={TH} style={{ fontSize: '10px' }}>Judgement</th>
              <th className={TH} style={{ fontSize: '10px' }}>1</th>
              <th className={TH} style={{ fontSize: '10px' }}>2</th>
              <th className={TH} style={{ fontSize: '10px' }}>Judgement</th>
            </tr>
          </thead>

          <tbody>
            {/* 25 data rows */}
            {Array.from({ length: TOTAL_ROWS }, (_, i) => {
              const row  = inspItems[i] || null;
              const srNo = row?.item?.trim() ? (i + 1) : '';
              return (
                <tr key={i} className="bg-white" style={{ height: `${inspRowH}px` }}>
                  <td className={TD} style={{ fontSize: '10px' }}>{srNo}</td>
                  <td className={`${TD} !text-left !pl-1.5`} style={{ fontSize: '10px', fontWeight: row?.item ? '600' : '400' }}>
                    {row?.item || ''}
                  </td>
                  <td className={TD} style={{ fontSize: '10px' }}>{row?.spec        || ''}</td>
                  <td className={TD} style={{ fontSize: '10px' }}>{row?.tolerance   || ''}</td>
                  <td className={TD} style={{ fontSize: '10px' }}>{row?.method      || ''}</td>
                  <td className={TD} style={{ fontSize: '10px' }}>{row?.vendor_obs1 || ''}</td>
                  <td className={TD} style={{ fontSize: '10px' }}>{row?.vendor_obs2 || ''}</td>
                  {/* Vendor Judgement: OK=green, NG=red */}
                  <td
                    className={`${TD} font-bold`}
                    style={{
                      fontSize: '10px',
                      color: row?.vendor_judge === 'OK' ? '#1a7c1a'
                           : row?.vendor_judge === 'NG' ? '#c0392b' : 'inherit',
                    }}
                  >
                    {row?.vendor_judge || ''}
                  </td>
                  <td className={TD} style={{ fontSize: '10px' }}>{row?.cust_obs1 || ''}</td>
                  <td className={TD} style={{ fontSize: '10px' }}>{row?.cust_obs2 || ''}</td>
                  {/* Customer Judgement: OK=green, NG=red */}
                  <td
                    className={`${TD} font-bold`}
                    style={{
                      fontSize: '10px',
                      color: row?.cust_judge === 'OK' ? '#1a7c1a'
                           : row?.cust_judge === 'NG' ? '#c0392b' : 'inherit',
                    }}
                  >
                    {row?.cust_judge || ''}
                  </td>
                  <td className={`${TD} !text-left !pl-1`} style={{ fontSize: '10px' }}>
                    {row?.remarks || ''}
                  </td>
                </tr>
              );
            })}

            {/* Supplier Remarks row */}
            <tr>
              <td
                colSpan={12}
                className="border border-black border-t-2 bg-white align-middle px-3"
                style={{ height: '30px' }}
              >
                <span className="font-bold" style={{ fontSize: '11px' }}>Supplier Remarks: </span>
                <span style={{ fontSize: '11px' }}>{currentReport?.supplier_remarks || ''}</span>
              </td>
            </tr>

            {/* Footer: Inspected By | Verified By | Approved By */}
            <tr>
              <td
                colSpan={12}
                className="border border-black bg-white align-middle px-4"
                style={{ height: '36px' }}
              >
                <div className="flex items-end w-full gap-8">
                  {[
                    { label: 'Inspected By :-', val: currentReport?.inspected_by },
                    { label: 'Verified By :-',  val: currentReport?.verified_by  },
                    { label: 'Approved By :-',  val: currentReport?.approved_by  },
                  ].map(({ label, val }, idx) => (
                    <div key={idx} className="flex items-end gap-1 flex-1">
                      <span className="font-bold whitespace-nowrap" style={{ fontSize: '11px' }}>{label}</span>
                      <span className="flex-1 border-b border-black block min-w-12 pb-px" style={{ fontSize: '11px' }}>
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

export default Dispatch_Inspection;