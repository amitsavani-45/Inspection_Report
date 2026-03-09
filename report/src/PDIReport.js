// ============================================================
//  Dispatch_Inspection.js
//  Pre Dispatch Inspection Report — Portrait A4
// ============================================================

import React, { useState, useEffect } from 'react';
import { getDropdownOptions } from './services/api';
import { useNavigate } from 'react-router-dom';
import './PDIReport.css';
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
      <div className="no-print" style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '10px'
      }}>

        {/* Back */}
        <button
          onClick={() => navigate('/pdi-report')}
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
                padding: '20px', minWidth: '320px'
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

                {/* Customer */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#555', display: 'block', marginBottom: '5px', textTransform: 'uppercase' }}>
                    <i className="bi bi-building" style={{ marginRight: 5 }}></i>Customer
                  </label>
                  <select value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', border: `1px solid ${filterCustomer ? '#1976d2' : '#ccc'}`, borderRadius: '6px', fontSize: '13px' }}>
                    <option value="">All Customers</option>
                    {dbOptions.customers.map(c => <option key={c} value={c}>{c}</option>)}
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

        {/* ── Edit: currentReport data PDIForm mein pass karo ── */}
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
                <span className="uppercase font-black tracking-wide" style={{ fontSize: '20px', fontWeight: 'bold' }}>
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

        {/* ── SECTION 2: INFO TABLE ── */}
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
          <tr style={{ height: '18px' }}>
  <td colSpan={5} className="border border-black bg-white"
    style={{ fontSize: '9.5px', padding: '3px 5px', textAlign: 'left' }}>
    <span style={{ fontWeight: 'bold' }}>PART NAME : </span>
    <span style={{ fontSize: '11px' }}>{currentReport?.part_name || ''}</span>
  </td>
  <td colSpan={3} className="border border-black bg-white"
    style={{ fontSize: '9.5px', padding: '3px 5px', textAlign: 'left' }}>
    <span style={{ fontWeight: 'bold' }}>INVOICE NO : </span>
    <span style={{ fontSize: '11px' }}>{currentReport?.invoice_no || ''}</span>
  </td>
  <td colSpan={4} className="border border-black bg-white"
    style={{ fontSize: '9.5px', padding: '3px 5px', textAlign: 'left' }}>
    <span style={{ fontWeight: 'bold' }}>LOT QTY : </span>
    <span style={{ fontSize: '11px' }}>{currentReport?.lot_qty || ''}</span>
  </td>
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
              <th className={TH} style={{ ...TH_STYLE, fontSize: '9px', padding: '2px 1px' }}>1</th>
              <th className={TH} style={{ ...TH_STYLE, fontSize: '9px', padding: '2px 1px' }}>2</th>
              <th className={TH} style={{ ...TH_STYLE, fontSize: '9px', padding: '2px 1px' }}>Judgement</th>
              <th className={TH} style={{ ...TH_STYLE, fontSize: '9px', padding: '2px 1px' }}>1</th>
              <th className={TH} style={{ ...TH_STYLE, fontSize: '9px', padding: '2px 1px' }}>2</th>
              <th className={TH} style={{ ...TH_STYLE, fontSize: '9px', padding: '2px 1px' }}>Judgement</th>
            </tr>
          </thead>

          <tbody>
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

        {/* ── FOOTER TABLE ── */}
        <table
          className="w-full border border-black border-t-0"
          style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}
        >
          <tbody>
            <tr>
              <td colSpan={2} className="border border-black bg-white px-6"
                style={{ height: '36px', verticalAlign: 'middle', textAlign: 'left' }}>
                <span style={{ fontWeight: 'bold', fontSize: '11px' }}>Supplier Remarks:- </span>
                <span style={{ fontSize: '11px' }}>{currentReport?.supplier_remarks || ''}</span>
              </td>
            </tr>
            <tr>
              <td className="border border-black bg-white px-4"
                style={{ height: '36px', verticalAlign: 'middle', textAlign: 'left', width: '50%' }}>
                <span style={{ fontWeight: 'bold', fontSize: '11px' }}>Inspected By:- </span>
                <span style={{ fontSize: '11px' }}>{currentReport?.inspected_by || ''}</span>
              </td>
              <td className="border border-black bg-white px-4"
                style={{ height: '36px', verticalAlign: 'middle', textAlign: 'left', width: '50%' }}>
                <span style={{ fontWeight: 'bold', fontSize: '11px' }}>Verified By :- </span>
                <span style={{ fontSize: '11px' }}>{currentReport?.verified_by || ''}</span>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="border border-black bg-white px-4"
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