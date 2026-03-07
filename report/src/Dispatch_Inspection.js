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

// ── Shared class strings ──
const TH = 'border border-black font-bold text-center align-middle leading-tight';
const TH_STYLE = { backgroundColor: '#c0c0c0' };
const TD = 'border border-black text-center align-middle bg-white px-0.5 py-px';

// ── Minimum rows to always show ──
const MIN_ROWS = 15;

const Dispatch_Inspection = ({ items = [], currentReport, onFilter, onEditForm }) => {
  const navigate = useNavigate();
  const displayDate = formatDisplay(currentReport?.inspection_date) || '';

  // 👇 YAHAN SE USE-EFFECT WALA PRINT CSS INJECT CODE HATA DIYA GAYA HAI 👇

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

  // Sort and get items
  const inspItems = items
    .filter(x => x.sr_no >= 1)
    .sort((a, b) => a.sr_no - b.sr_no);

  // Total rows = max of MIN_ROWS or actual data count
  const TOTAL_ROWS = Math.max(MIN_ROWS, inspItems.length);

  // ... (Baaki ka code same rahega) ...

  // Row height is auto - CSS flex handles the table height filling

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
      <div
        className="di-report bg-white mx-auto shadow-md"
        style={{
          fontFamily: 'Arial, sans-serif',
          width: '210mm',
          boxSizing: 'border-box',
        }}
      >

        {/* ── SECTION 1: HEADER ── */}
        <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ height: '64px' }}>
              <td className="border-r-2 border-black text-center align-middle" style={{ width: '140px', padding: '6px' }}>
                <img src={atomone} alt="ATOM ONE" className="block mx-auto object-contain" style={{ width: '120px', height: 'auto' }} />
              </td>
              <td className="text-center align-middle" style={{ padding: '6px' }}>
                <span className="uppercase font-black tracking-wide" style={{ fontSize: '20px' }}>
                  Pre Dispatch Inspection Report
                </span>
              </td>
              <td className="border-l-2 border-black align-top p-0" style={{ width: '150px' }}>
                <div className="border-b border-black px-3 py-2" style={{ backgroundColor: '#ffffff' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>PAGE NO.</span>
                </div>
                <div className="px-3 py-2">
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{currentReport?.page_no || '01 OF 01'}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── SECTION 2: INFO TABLE ──
             Same 12-col colgroup as inspection table → borders align perfectly
             ROW 1: SUPPLIER NAME(C1-C3) | PART NO(C4-C6) | INSPECTION DATE(C7-C9) | CUSTOMER NAME(C10-C12)
             ROW 2: PART NAME label(C1-C2) | value(C3-C5) | INVOICE NO(C6-C8) | LOT QTY(C9-C11) | empty(C12)
        ── */}
        <table
          className="w-full border border-black border-t-0"
          style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}
        >
          <colgroup>
            <col style={{ width: '4%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '9%' }} />
          </colgroup>
          <tbody>

            {/* ── INFO ROW 1 ── */}
            <tr style={{ height: '18px' }}>
              <td colSpan={3} className="border border-black bg-white"
                style={{ fontSize: '9.5px', padding: '3px 5px', textAlign: 'left' }}>
                <span style={{ fontWeight: 'bold' }}>SUPPLIER NAME : </span>
                <span style={{ fontSize: '11px' }}>{currentReport?.supplier_name || ''}</span>
              </td>
              <td colSpan={3} className="border border-black bg-white"
                style={{ fontSize: '9.5px', padding: '3px 5px', textAlign: 'left' }}>
                <span style={{ fontWeight: 'bold' }}>PART NO : </span>
                <span style={{ fontSize: '11px' }}>{currentReport?.part_no || ''}</span>
              </td>
              <td colSpan={3} className="border border-black bg-white"
                style={{ fontSize: '9.5px', padding: '3px 5px', textAlign: 'left' }}>
                <span style={{ fontWeight: 'bold' }}>INSPECTION DATE : </span>
                <span style={{ fontSize: '11px' }}>{displayDate}</span>
              </td>
              <td colSpan={3} className="border border-black bg-white"
                style={{ fontSize: '9.5px', padding: '3px 5px', textAlign: 'left' }}>
                <span style={{ fontWeight: 'bold' }}>CUSTOMER NAME : </span>
                <span style={{ fontSize: '11px' }}>{currentReport?.customer_name || ''}</span>
              </td>
            </tr>

            {/* ── INFO ROW 2 ── */}
            <tr style={{ height: '18px' }}>
              <td colSpan={2} className="border border-black bg-white"
                style={{ fontSize: '9.5px', padding: '4px 7px', fontWeight: 'bold', textAlign: 'left' }}>
                PART NAME :
              </td>
              <td colSpan={3} className="border border-black bg-white"
                style={{ fontSize: '10.5px', padding: '3px 5px', textAlign: 'left' }}>
                {currentReport?.part_name || ''}
              </td>
              <td colSpan={3} className="border border-black bg-white"
                style={{ fontSize: '9.5px', padding: '3px 5px', textAlign: 'left' }}>
                <span style={{ fontWeight: 'bold' }}>INVOICE NO : </span>
                <span style={{ fontSize: '11px' }}>{currentReport?.invoice_no || ''}</span>
              </td>
              <td colSpan={3} className="border border-black bg-white"
                style={{ fontSize: '9.5px', padding: '3px 5px', textAlign: 'left' }}>
                <span style={{ fontWeight: 'bold' }}>LOT QTY : </span>
                <span style={{ fontSize: '11px' }}>{currentReport?.lot_qty || ''}</span>
              </td>
              <td colSpan={1} className="border border-black bg-white" />
            </tr>

          </tbody>
        </table>

        {/* ── SECTION 3: INSPECTION TABLE ── */}
        <table
          className="di-insp-table w-full border border-black border-t-0"
          style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%' }}
        >
          <colgroup>
            <col style={{ width: '4%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '9%' }} />
          </colgroup>

          <thead>
            <tr style={{ height: '18px' }}>
              <th rowSpan={2} className={TH} style={{ ...TH_STYLE, fontSize: '9px', padding: '2px 1px', wordBreak: 'break-word', lineHeight: '1.2' }}>SR.<br />No.</th>
              <th rowSpan={2} className={TH} style={{ ...TH_STYLE, fontSize: '9px', padding: '2px 1px', wordBreak: 'break-word', lineHeight: '1.2' }}>INSPECTION ITEMS</th>
              <th rowSpan={2} className={TH} style={{ ...TH_STYLE, fontSize: '9px', padding: '2px 1px', wordBreak: 'break-word', lineHeight: '1.2' }}>DIMENSIONS/<br />SPEC</th>
              <th rowSpan={2} className={TH} style={{ ...TH_STYLE, fontSize: '9px', padding: '2px 1px', wordBreak: 'break-word', lineHeight: '1.2' }}>TOLERANCE</th>
              <th rowSpan={2} className={TH} style={{ ...TH_STYLE, fontSize: '9px', padding: '2px 1px', wordBreak: 'break-word', lineHeight: '1.2' }}>INSPECTION<br />METHOD</th>
              <th colSpan={3} className={TH} style={{ ...TH_STYLE, fontSize: '9px', padding: '2px 1px', wordBreak: 'break-word', lineHeight: '1.2' }}>VENDOR OBSERVATIONS</th>
              <th colSpan={3} className={TH} style={{ ...TH_STYLE, fontSize: '9px', padding: '2px 1px', wordBreak: 'break-word', lineHeight: '1.2' }}>CUSTOMER OBSERVATION</th>
              <th rowSpan={2} className={TH} style={{ ...TH_STYLE, fontSize: '9px', padding: '2px 1px', wordBreak: 'break-word', lineHeight: '1.2' }}>REMARKS</th>
            </tr>
            <tr style={{ height: '18px' }}>
              <th className={TH} style={{ ...TH_STYLE, fontSize: '9px', padding: '2px 1px', wordBreak: 'break-word', lineHeight: '1.2' }}>1</th>
              <th className={TH} style={{ ...TH_STYLE, fontSize: '9px', padding: '2px 1px', wordBreak: 'break-word', lineHeight: '1.2' }}>2</th>
              <th className={TH} style={{ ...TH_STYLE, fontSize: '9px', padding: '2px 1px', wordBreak: 'break-word', lineHeight: '1.2' }}>Judgement</th>
              <th className={TH} style={{ ...TH_STYLE, fontSize: '9px', padding: '2px 1px', wordBreak: 'break-word', lineHeight: '1.2' }}>1</th>
              <th className={TH} style={{ ...TH_STYLE, fontSize: '9px', padding: '2px 1px', wordBreak: 'break-word', lineHeight: '1.2' }}>2</th>
              <th className={TH} style={{ ...TH_STYLE, fontSize: '9px', padding: '2px 1px', wordBreak: 'break-word', lineHeight: '1.2' }}>Judgement</th>
            </tr>
          </thead>

          <tbody>

            {/* ── DATA ROWS: min 15, auto-grows with data ── */}
            {Array.from({ length: TOTAL_ROWS }, (_, i) => {
              const row  = inspItems[i] || null;
              const srNo = row?.item?.trim() ? (i + 1) : '';
              return (
                <tr key={i} style={{ height: `${Math.max(20, Math.floor(754 / TOTAL_ROWS))}px` }}>
                  <td className={TD} style={{ fontSize: '10px' }}>{srNo}</td>
                  <td className={`${TD} !text-left !pl-1.5`}
                    style={{ fontSize: '10px', fontWeight: row?.item ? '600' : '400' }}>
                    {row?.item || ''}
                  </td>
                  <td className={TD} style={{ fontSize: '10px' }}>{row?.spec        || ''}</td>
                  <td className={TD} style={{ fontSize: '10px' }}>{row?.tolerance   || ''}</td>
                  <td className={TD} style={{ fontSize: '10px' }}>{row?.method      || ''}</td>
                  <td className={TD} style={{ fontSize: '10px' }}>{row?.vendor_obs1 || ''}</td>
                  <td className={TD} style={{ fontSize: '10px' }}>{row?.vendor_obs2 || ''}</td>
                  <td className={`${TD} font-bold`}
                    style={{
                      fontSize: '10px',
                      color: row?.vendor_judge === 'OK' ? '#1a7c1a'
                           : row?.vendor_judge === 'NG' ? '#c0392b' : 'inherit',
                    }}>
                    {row?.vendor_judge || ''}
                  </td>
                  <td className={TD} style={{ fontSize: '10px' }}>{row?.cust_obs1 || ''}</td>
                  <td className={TD} style={{ fontSize: '10px' }}>{row?.cust_obs2 || ''}</td>
                  <td className={`${TD} font-bold`}
                    style={{
                      fontSize: '10px',
                      color: row?.cust_judge === 'OK' ? '#1a7c1a'
                           : row?.cust_judge === 'NG' ? '#c0392b' : 'inherit',
                    }}>
                    {row?.cust_judge || ''}
                  </td>
                  <td className={`${TD} !text-left !pl-1`} style={{ fontSize: '10px' }}>
                    {row?.remarks || ''}
                  </td>
                </tr>
              );
            })}

          </tbody>
        </table>

        {/* ── FOOTER TABLE — separate from inspection table ── */}
        <table
          className="w-full border border-black border-t-0"
          style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}
        >
          <tbody>

            {/* ── SUPPLIER REMARKS — full width ── */}
            <tr>
              <td colSpan={2}
                className="border border-black bg-white px-3"
                style={{ height: '36px', verticalAlign: 'middle', textAlign: 'left' }}>
                <span style={{ fontWeight: 'bold', fontSize: '11px' }}>Supplier Remarks: </span>
                <span style={{ fontSize: '11px' }}>{currentReport?.supplier_remarks || ''}</span>
              </td>
            </tr>

            {/* ── INSPECTED BY | VERIFIED BY — side by side ── */}
            <tr>
              <td
                className="border border-black bg-white px-3"
                style={{ height: '36px', verticalAlign: 'middle', textAlign: 'left', width: '50%' }}>
                <span style={{ fontWeight: 'bold', fontSize: '11px' }}>Inspected By:- </span>
                <span style={{ fontSize: '11px' }}>{currentReport?.inspected_by || ''}</span>
              </td>
              <td
                className=" border-black bg-white px-3"
                style={{ height: '36px', verticalAlign: 'middle', textAlign: 'left', width: '50%' }}>
                <span style={{ fontWeight: 'bold', fontSize: '11px' }}>Verified By :- </span>
                <span style={{ fontSize: '11px' }}>{currentReport?.verified_by || ''}</span>
              </td>
            </tr>

            {/* ── APPROVED BY — full width ── */}
            <tr>
              <td colSpan={2}
                className="border border-black bg-white px-3"
                style={{ height: '36px', verticalAlign: 'middle', textAlign: 'left' }}>
                <span style={{ fontWeight: 'bold', fontSize: '11px' }}>Approved By:- </span>
                <span style={{ fontSize: '11px' }}>{currentReport?.approved_by || ''}</span>
              </td>
            </tr>

          </tbody>
        </table>

      </div>
    </div>
  );
};

export default Dispatch_Inspection;