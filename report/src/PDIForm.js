import React, { useState, useEffect, useRef } from 'react';
import { getDropdownOptions } from './services/api';

// ── Helpers ──
const parseSpecTol = (raw = '') => {
  if (!raw) return { spec: '', tol: '' };
  const s = raw.trim();

  let m = s.match(/^([\d.Φφ]+)\s*(\+[\d.]+\s*\/\s*-[\d.]+\s*MM)\s*$/i);
  if (m) return { spec: m[1].trim(), tol: m[2].trim() };

  m = s.match(/^([\d.Φφ]+)\s*(\+\s*[\d.]+\s*MM)\s*$/i);
  if (m) return { spec: m[1].trim(), tol: m[2].trim() };

  m = s.match(/^([Φφ]?[\d.]+)\s*\+\s*([\d.]+)\s*MM\s*$/i);
  if (m) return { spec: m[1].replace(/[Φφ]/,'').trim(), tol: `+ ${m[2]} MM` };

  m = s.match(/^([\d.]*)\s*[±]\s*([\d.]+)\s*MM\s*$/i);
  if (m) return { spec: m[1].trim(), tol: `± ${m[2]} MM` };

  m = s.match(/^([\d.]+)\s*±\s*([\d.]+)/i);
  if (m) return { spec: m[1].trim(), tol: `± ${m[2]}` };

  m = s.match(/^[Φφ]?([\d.]+)$/);
  if (m) return { spec: m[1], tol: '' };

  m = s.match(/^(\+[\d.]+\s*\/\s*-[\d.]+\s*MM)\s*$/i);
  if (m) return { spec: '', tol: m[1].trim() };

  return { spec: s, tol: '' };
};

const fetchInspectionItems = async (operation) => {
  try {
    const response = await fetch(`http://localhost:8000/api/inspection-items/?operation=${encodeURIComponent(operation)}`);
    return await response.json();
  } catch {
    return { product: [], process: [] };
  }
};

const PRODUCT_ITEMS = ['APPEARANCE','WIDTH','LENGTH','THICKNESS','DIMENSIONS A','DIMENSIONS B','RADIUS','BLANK PROFILE','DIAMETER','DEPTH','HEIGHT','FLATNESS','STRAIGHTNESS','ROUNDNESS','CHAMFER','THREAD','HOLE DIAMETER','PITCH','SURFACE FINISH','WEIGHT'];
const PROCESS_ITEMS = ['SHUT HEIGHT','BALANCER PRESSURE','CLUTCH PRESSURE','CUSHION PRESSURE','DIE HEIGHT','STROKE LENGTH','FEED RATE','CUTTING SPEED','SPINDLE SPEED','COOLANT PRESSURE','COOLANT FLOW','CLAMPING FORCE','BLANK HOLDER FORCE','DRAWING FORCE','PRESS TONNAGE','TEMPERATURE','CYCLE TIME','AIR PRESSURE','HYDRAULIC PRESSURE','LUBRICATION PRESSURE'];
const TOLERANCES = ['0.01','0.02','0.05','0.08','0.1','0.2','0.3','0.5','1.0'];
const PROCESS_TOLERANCES = ['MIN','MAX','0.01','0.05','0.1','0.2','0.5','1.0'];
const INSTRUMENTS = ['VISUAL','VERNIER','MICROMETER','RADIUS GAUGE','TEMPLATE','DIGITAL','GAUGE','CMM','DIAL INDICATOR','HEIGHT GAUGE'];
const STEPS = [
  { id: 1, label: 'Report Info', icon: 'bi bi-file-earmark-text-fill' },
  { id: 2, label: 'Fill Data',   icon: 'bi bi-table' },
];

const emptyRow = () => ({ name: '', spec: '', tolerance: '', inst: '' });
const emptyObs = () => ({ vendor_obs1: '', vendor_obs2: '', vendor_judge: '', cust_obs1: '', cust_obs2: '', cust_judge: '', remarks: '' });

// ─────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────

const Field = ({ label, value, onChange, options, placeholder, required }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
    </label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', padding: '10px 12px',
        border: `1.5px solid ${value ? '#6366f1' : '#e2e8f0'}`,
        borderRadius: 8, fontSize: 14, fontWeight: 500,
        background: value ? '#f5f3ff' : '#f8fafc',
        color: value ? '#3730a3' : '#94a3b8',
        outline: 'none', cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      <option value="">{placeholder || 'Select...'}</option>
      {options.map(o => typeof o === 'string'
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.v} value={o.v}>{o.l}</option>
      )}
    </select>
  </div>
);

const InspItem = ({ row, onUpdate, srNum, isProduct, onRemove, dbItems = [] }) => {
  const [spec, setSpec] = useState(row.spec || '');
  useEffect(() => setSpec(row.spec || ''), [row.spec]);
  const color = isProduct ? '#4f46e5' : '#ea580c';
  const staticItems = isProduct ? PRODUCT_ITEMS : PROCESS_ITEMS;
  const items = [...new Set([...dbItems.map(i => i.name || i), ...staticItems])];
  const tols = isProduct
    ? TOLERANCES.map(t => ({ v: t, l: `± ${t}` }))
    : PROCESS_TOLERANCES.map(t => ({ v: t, l: t === 'MIN' || t === 'MAX' ? t : `± ${t}` }));
  const filled = !!(row.name && row.spec && row.inst);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
      border: `1.5px solid ${filled ? '#22c55e' : color + '33'}`,
      borderLeft: `4px solid ${filled ? '#22c55e' : color}`,
      borderRadius: 8, background: filled ? '#f0fdf4' : '#fafafa',
      marginBottom: 6, transition: 'all 0.2s',
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: 6, background: color,
        color: '#fff', fontWeight: 800, fontSize: 11,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{srNum}</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <select value={row.name} onChange={e => {
          const val = e.target.value; onUpdate('name', val);
          const match = dbItems.find(i => (i.name || i) === val);
          if (match?.spec)       onUpdate('spec', match.spec);
          if (match?.instrument) onUpdate('inst', match.instrument);
          if (match?.tolerance)  onUpdate('tolerance', match.tolerance);
        }} style={{
          width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0',
          borderRadius: 6, fontSize: 13, background: '#fff', color: '#1e293b', outline: 'none',
        }}>
          <option value="">{isProduct ? 'Product item...' : 'Process item...'}</option>
          {items.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="text" value={spec} placeholder="Spec"
            onChange={e => { setSpec(e.target.value); onUpdate('spec', e.target.value); }}
            style={{ flex: 2, padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, outline: 'none', background: '#fff' }}
          />
          <select value={row.tolerance} onChange={e => onUpdate('tolerance', e.target.value)}
            style={{ flex: 1, padding: '5px 6px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, background: '#fff', outline: 'none' }}>
            <option value="">Tol.</option>
            {tols.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
          </select>
          <select value={row.inst} onChange={e => onUpdate('inst', e.target.value)}
            style={{ flex: 1, padding: '5px 6px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, background: '#fff', outline: 'none' }}>
            <option value="">Instr.</option>
            {INSTRUMENTS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
      </div>
      {onRemove
        ? <button onClick={onRemove} style={{ width: 24, height: 24, border: 'none', background: '#fee2e2', color: '#ef4444', borderRadius: 6, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
        : <div style={{ width: 24 }} />}
    </div>
  );
};


const ObsTable = ({ rows, onUpdate }) => {
  const judgeStyle = (val) => ({
    padding: '4px 8px', borderRadius: 6, border: `1.5px solid ${val === 'OK' ? '#22c55e' : val === 'NG' ? '#ef4444' : '#e2e8f0'}`,
    background: val === 'OK' ? '#f0fdf4' : val === 'NG' ? '#fef2f2' : '#f8fafc',
    color: val === 'OK' ? '#16a34a' : val === 'NG' ? '#dc2626' : '#94a3b8',
    fontWeight: val ? 800 : 400, fontSize: 12, cursor: 'pointer', outline: 'none',
    minWidth: 58, textAlign: 'center',
  });

  const inputStyle = { padding: '5px 6px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, textAlign: 'center', outline: 'none', background: '#fff', width: '100%' };

  return (
    <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: '#f1f5f9' }}>
            <th style={{ padding: '10px 8px', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', width: 32, textAlign: 'center' }}>SR</th>
            <th style={{ padding: '10px 8px', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', textAlign: 'left', minWidth: 130 }}>INSPECTION ITEM</th>
            <th style={{ padding: '10px 8px', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', textAlign: 'center', minWidth: 70 }}>SPEC</th>
            <th style={{ padding: '10px 8px', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', textAlign: 'center', minWidth: 70 }}>TOLERANCE</th>
            <th style={{ padding: '10px 8px', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', textAlign: 'center', minWidth: 100 }}>METHOD</th>
            <th colSpan={3} style={{ padding: '10px 8px', fontWeight: 700, color: '#4f46e5', borderBottom: '2px solid #6366f1', textAlign: 'center', background: '#eff6ff' }}>VENDOR OBSERVATIONS</th>
          </tr>
          <tr style={{ background: '#f8fafc' }}>
            <th colSpan={5} style={{ borderBottom: '1px solid #e2e8f0' }} />
            <th style={{ padding: '6px 8px', fontWeight: 600, color: '#6366f1', borderBottom: '1px solid #c7d2fe', textAlign: 'center', background: '#eff6ff', minWidth: 72 }}>Reading 1</th>
            <th style={{ padding: '6px 8px', fontWeight: 600, color: '#6366f1', borderBottom: '1px solid #c7d2fe', textAlign: 'center', background: '#eff6ff', minWidth: 72 }}>Reading 2</th>
            <th style={{ padding: '6px 8px', fontWeight: 600, color: '#6366f1', borderBottom: '1px solid #c7d2fe', textAlign: 'center', background: '#eff6ff', minWidth: 72 }}>Judgement</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
              <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, color: '#6366f1', fontSize: 13 }}>{i + 1}</td>
              <td style={{ padding: '6px 8px', fontWeight: 600, color: '#1e293b' }}>{row.item}</td>
              <td style={{ padding: '6px 8px', textAlign: 'center', color: '#475569' }}>{row.spec}</td>
              <td style={{ padding: '6px 8px', textAlign: 'center', color: '#ea580c', fontWeight: 600 }}>{row.tolerance}</td>
              <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600, color: '#1e293b' }}>
                {row.inst || row.method || '—'}
              </td>
              <td style={{ padding: '5px 6px', background: '#f5f3ff' }}>
                <input type="text" value={row.vendor_obs1 || ''} onChange={e => onUpdate(i, 'vendor_obs1', e.target.value)}
                  style={{ ...inputStyle, background: row.vendor_obs1 ? '#ede9fe' : '#fff', color: '#4f46e5', fontWeight: row.vendor_obs1 ? 600 : 400 }} />
              </td>
              <td style={{ padding: '5px 6px', background: '#f5f3ff' }}>
                <input type="text" value={row.vendor_obs2 || ''} onChange={e => onUpdate(i, 'vendor_obs2', e.target.value)}
                  style={{ ...inputStyle, background: row.vendor_obs2 ? '#ede9fe' : '#fff', color: '#4f46e5', fontWeight: row.vendor_obs2 ? 600 : 400 }} />
              </td>
              <td style={{ padding: '5px 6px', background: '#f5f3ff', textAlign: 'center' }}>
                <select value={row.vendor_judge || ''} onChange={e => onUpdate(i, 'vendor_judge', e.target.value)} style={judgeStyle(row.vendor_judge)}>
                  <option value="">—</option>
                  <option value="OK">OK</option>
                  <option value="NG">NG</option>
                </select>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                Step 1 mein items add karo, phir yahan dikhenge.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// ═══════════════════════════════════════════
//  MAIN PDIForm component
// ═══════════════════════════════════════════
const PDIForm = ({ onSubmit, onCancel, initialData = {}, items = [] }) => {
  // ── DEBUG ──
  console.log('PDIForm initialData:', JSON.stringify(initialData, null, 2));

  // ── MUST be declared first — used in useState hooks below ──
  const isEditMode = !!(initialData && initialData.id);
  const initialLoadDone = useRef(false);

  const [step, setStep] = useState(1);
  const [dbOptions, setDbOptions] = useState({ customers: [], part_names: [], part_numbers: [], operations: [], suppliers: [] });
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);

  useEffect(() => {
    getDropdownOptions()
      .then(data => { setDbOptions(data); setOptionsLoading(false); })
      .catch(() => setOptionsLoading(false));
  }, []);

  const [header, setHeader] = useState({
    supplierName:  initialData.supplier_name  || '',
    customerName:  initialData.customer_name  || '',
    partName:      initialData.part_name      || '',
    partNo:        initialData.part_no        || '',
    inspectionDate:initialData.inspection_date|| new Date().toISOString().split('T')[0],
    invoiceNo:     initialData.invoice_no     || '',
    lotQty:        initialData.lot_qty        || '',
    pageNo:        initialData.page_no        || '01 OF 01',
    operationName: initialData.operation_name || '',
  });

  const step1Done = !!(header.customerName && header.partName && header.partNo && header.inspectionDate);

  const [productRows, setProductRows] = useState([emptyRow()]);
  const [processRows, setProcessRows] = useState([emptyRow()]);

  // ── FIX: Edit mode mein obsRows seedha initialData.items se load karo ──
  const [obsRows, setObsRows] = useState(() => {
    if (isEditMode && initialData.items && initialData.items.length > 0) {
      return initialData.items.map((item, i) => ({ ...item, sr_no: i + 1 }));
    }
    return [];
  });

  // ── FIX: operationName change hone par sirf NEW mode mein items fetch karo ──
  useEffect(() => {
    if (!header.operationName) return;

    // Edit mode mein: pehli baar skip karo (initialData se already loaded hai)
    if (isEditMode && !initialLoadDone.current) {
      initialLoadDone.current = true;
      return;
    }

    setItemsLoading(true);
    fetchInspectionItems(header.operationName).then(data => {
      const mapItem = i => {
        const rawSpec = i.spec || i.specification || '';
        const { spec: parsedSpec, tol: parsedTol } = parseSpecTol(rawSpec);
        return {
          name:      i.name       || '',
          spec:      parsedSpec   || rawSpec,
          tolerance: i.tolerance  || parsedTol || '',
          inst:      i.instrument || i.inst || '',
          _rawSpec:  rawSpec,
        };
      };
      setProductRows(data.product?.length > 0
        ? [...data.product.map(mapItem), emptyRow()]
        : [emptyRow()]);
      setProcessRows(data.process?.length > 0
        ? [...data.process.map(mapItem), emptyRow()]
        : [emptyRow()]);
      setItemsLoading(false);
    });
  }, [header.operationName]);

  const filledProducts  = productRows.filter(r => r.name && r.name.trim());
  const filledProcesses = processRows.filter(r => r.name && r.name.trim());
  const totalItems = filledProducts.length + filledProcesses.length;

  const buildObsRows = () => {
    return [
      ...filledProducts.map((r, i) => ({
        sr_no: i + 1, item: r.name, spec: r.spec || '',
        tolerance: r.tolerance || '', inst: r.inst || '',
        method: r.inst || '', ...emptyObs(),
      })),
      ...filledProcesses.map((r, i) => ({
        sr_no: filledProducts.length + i + 1, item: r.name, spec: r.spec || '',
        tolerance: r.tolerance || '', inst: r.inst || '',
        method: r.inst || '', ...emptyObs(),
      })),
    ];
  };

  // ── FIX: productRows/processRows change par obsRows sirf tab rebuild karo
  //         jab edit mode NAHI hai — edit mode mein user ka data preserve karo ──
  useEffect(() => {
    if (isEditMode) return; // Edit mode mein override mat karo
    setObsRows(buildObsRows());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productRows, processRows]);

  const handleGoToStep2 = () => {
    // Edit mode mein existing obsRows preserve karo, new mode mein rebuild karo
    if (!isEditMode) {
      setObsRows(buildObsRows());
    }
    setStep(2);
  };

  const handleObsUpdate = (idx, field, val) => {
    setObsRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  };

  const [footer, setFooter] = useState({
    supplierRemarks: initialData.supplier_remarks || '',
    inspectedBy:     initialData.inspected_by     || '',
    verifiedBy:      initialData.verified_by       || '',
    approvedBy:      initialData.approved_by       || '',
  });

  const handleSubmit = () => {
    if (!step1Done)           { alert('Step 1 pura karo (Customer, Part Name, Part No, Date required)'); return; }
    if (obsRows.length === 0) { alert('Pehle inspection items add karo!'); return; }
    onSubmit({
      supplier_name:    header.supplierName,
      customer_name:    header.customerName,
      part_name:        header.partName,
      part_no:          header.partNo,
      inspection_date:  header.inspectionDate,
      invoice_no:       header.invoiceNo,
      lot_qty:          header.lotQty,
      page_no:          header.pageNo,
      operation_name:   header.operationName,
      supplier_remarks: footer.supplierRemarks,
      inspected_by:     footer.inspectedBy,
      verified_by:      footer.verifiedBy,
      approved_by:      footer.approvedBy,
      items: obsRows,
    });
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  const cardStyle = {
    background: '#fff', borderRadius: 14, padding: '20px 24px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9',
    marginBottom: 16,
  };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 5 };
  const inputStyle = {
    width: '100%', padding: '10px 12px',
    border: '1.5px solid #e2e8f0', borderRadius: 8,
    fontSize: 14, background: '#f8fafc', color: '#1e293b',
    outline: 'none', transition: 'border 0.2s',
  };

  const ItemsTableHeader = () => (
    <thead>
      <tr style={{ background: '#f0f4ff', borderBottom: '2px solid #c5cae9' }}>
        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#333', width: 40 }}>SR</th>
        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#333', width: 80 }}>Category</th>
        <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 700, color: '#333' }}>Item</th>
        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#333' }}>Spec</th>
        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#333' }}>Tolerance</th>
        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#333' }}>Instrument</th>
      </tr>
    </thead>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f3f4f6', fontFamily: "'Inter', -apple-system, sans-serif" }}>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      {/* ── Top Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 56,
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        position: 'sticky', top: 0, zIndex: 200,
      }}>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 14, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="bi bi-arrow-left"></i> Back
        </button>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>
          <i className="bi bi-clipboard2-check-fill" style={{ marginRight: 8, color: '#6366f1' }}></i>
          {isEditMode ? 'Edit PDI Report' : 'Pre Dispatch Inspection Form'}
        </span>
        {/* Edit mode badge */}
        {isEditMode && (
          <span style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fcd34d', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>
            ✏️ Edit Mode
          </span>
        )}
        {!isEditMode && <div style={{ width: 60 }} />}
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, padding: '20px 16px 100px', maxWidth: 960, width: '100%', margin: '0 auto' }}>

        {/* Progress */}
        <div style={{ ...cardStyle, padding: '16px 24px', marginBottom: 16 }}>
          <div style={{ height: 5, background: '#e2e8f0', borderRadius: 5, marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: '#6366f1', borderRadius: 5, transition: 'width 0.4s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {STEPS.map(s => {
              const done = s.id < step || (s.id === 1 && step1Done);
              const active = s.id === step;
              return (
                <div key={s.id}
                  onClick={() => { if (s.id < step || s.id === 1) setStep(s.id); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', opacity: s.id > step && !(s.id === 2 && step1Done) ? 0.4 : 1 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    border: `1.5px solid ${active ? '#6366f1' : done ? '#22c55e' : '#e2e8f0'}`,
                    background: active ? '#eff6ff' : done ? '#f0fdf4' : '#fff',
                    color: active ? '#6366f1' : done ? '#16a34a' : '#94a3b8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: done ? 16 : 18, fontWeight: 800,
                  }}>
                    {done ? '✓' : <i className={s.icon}></i>}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: active ? '#6366f1' : done ? '#16a34a' : '#94a3b8' }}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ════ STEP 1: Report Info ════ */}
        {step === 1 && (
          <>
            <div style={cardStyle}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="bi bi-info-circle-fill" style={{ color: '#6366f1' }}></i> Report Information
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Supplier Name</label>
                  <input value={header.supplierName} onChange={e => setHeader(p => ({ ...p, supplierName: e.target.value }))}
                    placeholder="Supplier name..." style={inputStyle} />
                </div>
                <Field label="Customer Name *" value={header.customerName}
                  onChange={v => setHeader(p => ({ ...p, customerName: v }))}
                  options={dbOptions.customers} placeholder={optionsLoading ? 'Loading...' : 'Select customer...'} required />
                <Field label="Part Name *" value={header.partName}
                  onChange={v => setHeader(p => ({ ...p, partName: v }))}
                  options={dbOptions.part_names} placeholder={optionsLoading ? 'Loading...' : 'Select part...'} required />
                <div>
                  <label style={labelStyle}>Part No <span style={{ color: '#ef4444' }}>*</span></label>
                  <input value={header.partNo} onChange={e => setHeader(p => ({ ...p, partNo: e.target.value }))}
                    placeholder="Part number..." style={{ ...inputStyle, borderColor: header.partNo ? '#6366f1' : '#e2e8f0' }} />
                </div>
                <div>
                  <label style={labelStyle}>Inspection Date <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="date" value={header.inspectionDate} onChange={e => setHeader(p => ({ ...p, inspectionDate: e.target.value }))}
                    style={{ ...inputStyle, borderColor: header.inspectionDate ? '#6366f1' : '#e2e8f0' }} />
                </div>
                <div>
                  <label style={labelStyle}>Invoice No</label>
                  <input value={header.invoiceNo} onChange={e => setHeader(p => ({ ...p, invoiceNo: e.target.value }))}
                    placeholder="Invoice number..." style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Lot Qty</label>
                  <input value={header.lotQty} onChange={e => setHeader(p => ({ ...p, lotQty: e.target.value }))}
                    placeholder="Lot quantity..." style={inputStyle} type="number" min="0" />
                </div>
                <div>
                  <label style={labelStyle}>Page No</label>
                  <input value={header.pageNo} onChange={e => setHeader(p => ({ ...p, pageNo: e.target.value }))}
                    placeholder="01 OF 01" style={inputStyle} />
                </div>
              </div>

              <div style={{ maxWidth: 320 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Operation (auto-load items)
                  </label>
                  {isEditMode ? (
                    /* Edit mode: plain text input — no dependency on dbOptions loading */
                    <input
                      type="text"
                      value={header.operationName || initialData?.operation_name || '(Not saved — please re-save report)'}
                      readOnly
                      style={{
                        width: '100%', padding: '10px 12px',
                        border: '1.5px solid #6366f1',
                        borderRadius: 8, fontSize: 14, fontWeight: 600,
                        background: '#f5f3ff',
                        color: (header.operationName || initialData?.operation_name) ? '#3730a3' : '#f87171',
                        outline: 'none', cursor: 'default',
                      }}
                    />
                  ) : (
                    /* New mode: dropdown */
                    <select
                      value={header.operationName}
                      onChange={e => setHeader(p => ({ ...p, operationName: e.target.value }))}
                      style={{
                        width: '100%', padding: '10px 12px',
                        border: `1.5px solid ${header.operationName ? '#6366f1' : '#e2e8f0'}`,
                        borderRadius: 8, fontSize: 14, fontWeight: 500,
                        background: header.operationName ? '#f5f3ff' : '#f8fafc',
                        color: header.operationName ? '#3730a3' : '#94a3b8',
                        outline: 'none', cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      <option value="">{optionsLoading ? 'Loading...' : 'Select operation (optional)...'}</option>
                      {dbOptions.operations.map(o => typeof o === 'string'
                        ? <option key={o} value={o}>{o}</option>
                        : <option key={o.v} value={o.v}>{o.l}</option>
                      )}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* ── Edit mode mein: same style table as new mode ── */}
            {isEditMode && obsRows.length > 0 && (
              <div style={cardStyle}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <i className="bi bi-search" style={{ color: '#4f46e5' }}></i> Inspection Items
                  <span style={{
                    fontSize: 11, color: '#16a34a', fontWeight: 700,
                    background: '#dcfce7', border: '1px solid #86efac',
                    borderRadius: 20, padding: '2px 10px',
                  }}>
                    ✓ {obsRows.length} items loaded
                  </span>
                  {header.operationName && (
                    <span style={{
                      fontSize: 11, color: '#4f46e5', fontWeight: 700,
                      background: '#eff6ff', border: '1px solid #c7d2fe',
                      borderRadius: 20, padding: '2px 10px',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <i className="bi bi-gear-fill"></i> {header.operationName}
                    </span>
                  )}
                </div>
                <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f0f4ff', borderBottom: '2px solid #c5cae9' }}>
                        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#333', width: 40 }}>SR</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#333', width: 80 }}>Category</th>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 700, color: '#333' }}>Item</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#333' }}>Spec</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#333' }}>Tolerance</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#333' }}>Instrument</th>
                      </tr>
                    </thead>
                    <tbody>
                      {obsRows.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #eee', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ padding: '9px 8px', textAlign: 'center', fontWeight: 700, color: '#1976d2' }}>{i + 1}</td>
                          <td style={{ padding: '9px 8px', textAlign: 'center' }}>
                            <span style={{
                              background: '#e3f2fd', color: '#1976d2',
                              border: '1px solid #1976d2',
                              borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700,
                            }}>PRODUCT</span>
                          </td>
                          <td style={{ padding: '9px 8px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase' }}>{row.item || '—'}</td>
                          <td style={{ padding: '9px 8px', textAlign: 'center', color: '#475569' }}>{row.spec || '—'}</td>
                          <td style={{ padding: '9px 8px', textAlign: 'center', color: '#e65100', fontWeight: 600 }}>{row.tolerance || '—'}</td>
                          <td style={{ padding: '9px 8px', textAlign: 'center', color: '#1565c0' }}>{row.inst || row.method || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={{ fontSize: 12, color: '#6366f1', marginTop: 10, fontStyle: 'italic' }}>
                  💡 Step 2 mein jaao toh observations edit kar sakte ho.
                </p>
              </div>
            )}

            {/* ── New mode mein: operation se auto-loaded items ── */}
            {!isEditMode && header.operationName && <div style={cardStyle}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="bi bi-search" style={{ color: '#4f46e5' }}></i> Inspection Items

                {itemsLoading && (
                  <span style={{ fontSize: 12, color: '#6366f1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      width: 13, height: 13, border: '2px solid #c7d2fe', borderTopColor: '#6366f1',
                      borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite',
                    }} />
                    Loading items...
                  </span>
                )}

                {!itemsLoading && header.operationName && totalItems > 0 && (
                  <span style={{
                    fontSize: 11, color: '#16a34a', fontWeight: 700,
                    background: '#dcfce7', border: '1px solid #86efac',
                    borderRadius: 20, padding: '2px 10px',
                  }}>
                    ✓ {totalItems} items loaded
                  </span>
                )}
              </div>

              {itemsLoading && (
                <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <ItemsTableHeader />
                    <tbody>
                      {[1,2,3,4,5].map(i => (
                        <tr key={i} style={{ borderBottom: '1px solid #eee', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                          {[40, 80, 200, 80, 80, 140].map((w, j) => (
                            <td key={j} style={{ padding: '11px 8px' }}>
                              <div style={{
                                height: 13, width: w, borderRadius: 6, margin: '0 auto',
                                background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 1.2s infinite',
                              }} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!itemsLoading && totalItems === 0 && (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '24px 0', fontSize: 13 }}>
                  <i className="bi bi-exclamation-circle" style={{ fontSize: 28, display: 'block', marginBottom: 8, color: '#fbbf24' }}></i>
                  Is operation ke liye koi items nahi mile
                </div>
              )}

              {!itemsLoading && totalItems > 0 && (
                <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <ItemsTableHeader />
                    <tbody>
                      {[
                        ...filledProducts.map((r, i) => ({ ...r, category: 'PRODUCT', catColor: '#1976d2', sr: i + 1 })),
                        ...filledProcesses.map((r, i) => ({ ...r, category: 'PROCESS', catColor: '#e65100', sr: filledProducts.length + i + 1 })),
                      ].map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #eee', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ padding: '9px 8px', textAlign: 'center', fontWeight: 700, color: row.catColor }}>{row.sr}</td>
                          <td style={{ padding: '9px 8px', textAlign: 'center' }}>
                            <span style={{
                              background: row.category === 'PRODUCT' ? '#e3f2fd' : '#fff3e0',
                              color: row.catColor, border: `1px solid ${row.catColor}`,
                              borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700,
                            }}>{row.category}</span>
                          </td>
                          <td style={{ padding: '9px 8px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase' }}>{row.name}</td>
                          <td style={{ padding: '9px 8px', textAlign: 'center', color: '#475569' }}>{row.spec || '—'}</td>
                          <td style={{ padding: '9px 8px', textAlign: 'center', color: '#e65100', fontWeight: 600 }}>{row.tolerance || '—'}</td>
                          <td style={{ padding: '9px 8px', textAlign: 'center', color: '#1565c0' }}>{row.inst || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>}
          </>
        )}

        {/* ════ STEP 2: Fill Observations ════ */}
        {step === 2 && (
          <>
            <div style={{ ...cardStyle, padding: '12px 20px', marginBottom: 12, background: '#f5f3ff', border: '1px solid #c7d2fe' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 24px', fontSize: 13 }}>
                {[
                  { label: 'Customer', val: header.customerName },
                  { label: 'Part', val: header.partName },
                  { label: 'Part No', val: header.partNo },
                  { label: 'Date', val: header.inspectionDate?.split('-').reverse().join('/') },
                ].map(f => (
                  <span key={f.label} style={{ color: '#475569' }}>
                    <span style={{ fontWeight: 700, color: '#4f46e5' }}>{f.label}: </span>{f.val || '—'}
                  </span>
                ))}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="bi bi-table" style={{ color: '#6366f1' }}></i> Observation Data Fill Karo
              </div>
              <ObsTable rows={obsRows} onUpdate={handleObsUpdate} />
            </div>
          </>
        )}
      </div>

      {/* ── Footer Nav ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
        borderTop: '1px solid #e2e8f0', padding: '14px 24px',
        display: 'flex', justifyContent: 'space-between', gap: 12, zIndex: 200,
      }}>
        {step > 1
          ? <button onClick={() => setStep(s => s - 1)}
              style={{ padding: '0 24px', height: 44, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#64748b' }}>
              ← Back
            </button>
          : <button onClick={onCancel}
              style={{ padding: '0 24px', height: 44, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#64748b' }}>
              Cancel
            </button>
        }
        {step < 2
          ? <button
              onClick={handleGoToStep2}
              disabled={!step1Done}
              style={{
                padding: '0 32px', height: 44, borderRadius: 10, fontSize: 14, fontWeight: 700,
                border: 'none', cursor: step1Done ? 'pointer' : 'not-allowed',
                background: step1Done ? '#6366f1' : '#cbd5e1', color: '#fff',
                boxShadow: step1Done ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                transition: 'all 0.2s',
              }}>
              Next →
            </button>
          : <button onClick={handleSubmit}
              style={{ padding: '0 32px', height: 44, background: '#22c55e', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}>
              <i className="bi bi-check-circle-fill" style={{ marginRight: 6 }}></i>
              {isEditMode ? 'Update Report' : 'Save Report'}
            </button>
        }
      </div>
    </div>
  );
};

export default PDIForm;