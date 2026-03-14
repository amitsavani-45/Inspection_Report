// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import QMS_Portal from './QMS_Portal';
import Inspection from './Inspection';
import Form from './Form';
import SelectionPage from './Selection';
import RawMaterial from './RawMaterial';
import LayoutReport from './LayoutReport';
import Dispatch from './Dispatch';
import Dispatch_Inspection from './PDIReport';
import PDIReportselection from './PDIReportselection';
import PDIReport from './PDIReport';
import SOPProcedure from './SOPProcedure';
import PDIForm from './PDIForm';
import Scrapnoteprint from './Scrapnoteprint';
import ScrapNoteSelection from './ScrapNoteSelection';
import { getReportById, createReport, updateReport } from './services/api';

function FormPageWrapper({ onAddItem, items = [], currentReport = null }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNew = searchParams.get('mode') === 'new';

  const handleSubmit = async (formData) => {
    try {
      await onAddItem({ ...formData, _isNew: isNew });
      navigate('/inspection');
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to save: ' + error.message);
    }
  };

  const formItems = isNew ? [] : items;

  const safeInitialData = isNew ? {} : {
    ...(currentReport || {}),
    schedule_entries: (currentReport || {}).schedule_entries || [],
  };

  return (
    <Form
      onSubmit={handleSubmit}
      onCancel={() => navigate('/selection')}
      initialData={safeInitialData}
      items={formItems}
    />
  );
}

// ── PDI Form Route Wrapper — location key se fresh mount guarantee ──
function PDIFormRouteWrapper({ onSavePDI }) {
  const location = useLocation();
  const initialData  = location.state?.initialData  || {};
  const editReportId = location.state?.editReportId || null;
  return (
    <PDIFormWrapper
      key={location.key}
      onSavePDI={onSavePDI}
      initialData={initialData}
      editReportId={editReportId}
    />
  );
}

// ── PDI Form Wrapper ──
function PDIFormWrapper({ onSavePDI, initialData = {}, editReportId = null }) {
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    try {
      if (editReportId) {
        const response = await fetch(`http://localhost:8000/api/pdi-reports/${editReportId}/`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!response.ok) throw new Error(await response.text());
        alert('✅ PDI Report updated successfully!');
      } else {
        if (onSavePDI) await onSavePDI(formData);
        alert('✅ PDI Report saved successfully!');
      }
      navigate('/pdi-report');
    } catch (error) {
      console.error('PDI save error:', error);
      alert('Failed to save PDI: ' + error.message);
    }
  };

  return (
    <PDIForm
      onSubmit={handleSubmit}
      onCancel={() => navigate('/pdi-report')}
      initialData={initialData}
    />
  );
}

function AppContent() {
  const navigate = useNavigate();

  const [currentReport, setCurrentReport] = useState({
    doc_no: 'KGTL-QCL-01', revision_no: '01', date: '',
    part_name: '', part_number: '', operation_name: '', customer_name: '',
    items: [], schedule_entries: [],
  });
  const [viewItems, setViewItems]         = useState([]);
  const [formItems, setFormItems]         = useState([]);
  const [loading, setLoading]             = useState(false);
  const [formKey, setFormKey]             = useState(0);

  const [diReport, setDiReport] = useState(null);
  const [diItems,  setDiItems]  = useState([]);
const [diReport, setDiReport] = useState(null);
const [diItems,  setDiItems]  = useState([]);

// ── Scrap Note state ──   ← YEH ADD KARO
const [scrapReport, setScrapReport] = useState(null);
const [scrapItems,  setScrapItems]  = useState([]);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '/selection') {
      setCurrentReport({
        doc_no: 'KGTL-QCL-01', revision_no: '01', date: '',
        part_name: '', part_number: '', operation_name: '', customer_name: '',
        items: [], schedule_entries: [],
      });
      setViewItems([]);
      setFormItems([]);
    }
  }, [location.pathname]);

  const applyReport = (fullReport) => {
    setCurrentReport(fullReport);
    setViewItems(fullReport.items || []);
    setFormItems(fullReport.items || []);
  };

  const handleDateChange = async (date) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/reports/?date=${date}`);
      const reports  = await response.json();
      if (reports && reports.length > 0) {
        const sorted = [...reports].sort((a, b) => b.id - a.id);
        const full = await getReportById(sorted[0].id);
        applyReport(full);
      } else {
        setCurrentReport({
          date, doc_no: 'KGTL-QCL-01', revision_no: '01',
          part_name: '', part_number: '', operation_name: '', customer_name: '',
          items: [], schedule_entries: [],
        });
        setViewItems([]);
        setFormItems([]);
      }
    } catch (error) {
      console.error('Error fetching report by date:', error);
      alert('Error loading report for selected date.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async ({ date, partName, operation, customerName }) => {
    try {
      setLoading(true);
      const params = [];
      if (date)         params.push(`date=${date}`);
      if (partName)     params.push(`part_name=${encodeURIComponent(partName)}`);
      if (operation)    params.push(`operation_name=${encodeURIComponent(operation)}`);
      if (customerName) params.push(`customer_name=${encodeURIComponent(customerName)}`);

      const url = `http://localhost:8000/api/reports/?${params.join('&')}`;
      const response = await fetch(url);
      const reports  = await response.json();

      if (reports && reports.length > 0) {
        const sorted = [...reports].sort((a, b) => b.id - a.id);
        const full = await getReportById(sorted[0].id);
        applyReport(full);
      } else {
        alert('No report found for selected filters.');
      }
    } catch (error) {
      console.error('Filter error:', error);
      alert('Error applying filter.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (formData) => {
    try {
      const date   = formData.scheduleDate || new Date().toISOString().split('T')[0];
      const isNew  = formData._isNew === true;

      const updatedItems = (formData.items || []).map(item => ({
        sr_no:        item.sr_no,
        item:         item.item         || '',
        special_char: item.special_char || '',
        spec:         item.spec         || '',
        tolerance:    item.tolerance    || '',
        inst:         item.inst         || '',
      }));

      const newScheduleEntries = (formData.schedule_entries || []).map(entry => {
        const { _isNew: _flag, values, id, ...cleanEntry } = entry;
        return {
          ...cleanEntry,
          sr:         cleanEntry.sr         ?? 1,
          slot_index: cleanEntry.slot_index ?? 0,
          row_order:  cleanEntry.row_order  ?? 0,
        };
      });

      const reportPayload = {
        doc_no:           'KGTL-QCL-01',
        revision_no:      '01',
        date,
        part_name:        formData.partName      || '',
        part_number:      formData.partNumber    || '',
        operation_name:   formData.operationName || '',
        customer_name:    formData.customerName  || '',
        prepared_by:      formData.preparedBy    || '',
        approved_by:      formData.approvedBy    || '',
        items:            updatedItems,
        schedule_entries: newScheduleEntries,
      };

      let reportId = null;

      if (!isNew && currentReport?.id) {
        try {
          const check = await fetch(`http://localhost:8000/api/reports/${currentReport.id}/`);
          if (check.ok) reportId = currentReport.id;
        } catch (_) {}
      }

      if (reportId) {
        await updateReport(reportId, reportPayload);
      } else {
        const created = await createReport(reportPayload);
        reportId = created.id;
      }

      alert('✅ Data successfully saved to Database!');

      const savedReport = await getReportById(reportId);
      applyReport(savedReport);
      setFormKey(k => k + 1);

    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save: ' + error.message);
      throw error;
    }
  };

  // ── PDI Report save handler (new) ──
  const handleSavePDI = async (formData) => {
    const payload = {
      supplier_name:    formData.supplier_name    || '',
      customer_name:    formData.customer_name    || '',
      part_name:        formData.part_name        || '',
      part_no:          formData.part_no          || '',
      inspection_date:  formData.inspection_date  || new Date().toISOString().split('T')[0],
      invoice_no:       formData.invoice_no       || '',
      lot_qty:          formData.lot_qty          || '',
      page_no:          formData.page_no          || '01 OF 01',
      operation_name:   formData.operation_name   || '',
      supplier_remarks: formData.supplier_remarks || '',
      inspected_by:     formData.inspected_by     || '',
      verified_by:      formData.verified_by      || '',
      approved_by:      formData.approved_by      || '',
      items:            formData.items            || [],
    };

    const response = await fetch('http://localhost:8000/api/pdi-reports/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err);
    }

    return await response.json();
  };

  // ── PDI Edit handler — fresh full data fetch karke navigate karo ──
  // Yahi asli fix hai: diReport cached hota hai jisme operation_name missing ho sakta hai
  const handlePdiEdit = async (report) => {
    try {
      setLoading(true);
      // Fresh full report fetch — ensures operation_name aur baaki sab fields aayein
      const res = await fetch(`http://localhost:8000/api/pdi-reports/${report?.id}/`);
      if (!res.ok) throw new Error('Fetch failed');
      const fullReport = await res.json();
      navigate('/pdi-form', { state: { initialData: fullReport, editReportId: fullReport.id } });
    } catch (err) {
      console.error('PDI edit fetch error:', err);
      // Fallback: jo cached data hai use hi bhejo
      navigate('/pdi-form', { state: { initialData: report || {}, editReportId: report?.id || null } });
    } finally {
      setLoading(false);
    }
  };

  // ── Dispatch / PDI Inspection filter handler ──
  const handleDiFilter = async ({ date, partName, customerName }) => {
    try {
      setLoading(true);
      const params = [];
      if (date)         params.push(`date=${date}`);
      if (partName)     params.push(`part_name=${encodeURIComponent(partName)}`);
      if (customerName) params.push(`customer_name=${encodeURIComponent(customerName)}`);

      const url = `http://localhost:8000/api/pdi-reports/?${params.join('&')}`;
      const response = await fetch(url);
      const reports  = await response.json();

      if (reports && reports.length > 0) {
        const sorted = [...reports].sort((a, b) => b.id - a.id);
        const fullRes = await fetch(`http://localhost:8000/api/pdi-reports/${sorted[0].id}/`);
        const data    = await fullRes.json();
        setDiReport(data);
        setDiItems(data.items || []);
      } else {
        alert('No PDI report found for selected filters.');
      }
    } catch (error) {
      console.error('Dispatch filter error:', error);
      alert('Error applying filter: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px', color: '#666' }}>
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<QMS_Portal />} />
      <Route path="/selection" element={<SelectionPage />} />
      <Route path="/inspection" element={
        <Inspection
          items={viewItems}
          reportId={currentReport?.id}
          currentReport={currentReport}
          onResetAfterSave={() => {
            setCurrentReport(null);
            setViewItems([]);
            setFormItems([]);
          }}
          onDateChange={handleDateChange}
          onFilter={handleFilter}
          onNewForm={() => {
            setCurrentReport({
              doc_no: 'KGTL-QCL-01', revision_no: '01', date: '',
              part_name: '', part_number: '', operation_name: '', customer_name: '',
              items: [], schedule_entries: [],
            });
            setViewItems([]);
            setFormItems([]);
            setFormKey(k => k + 1);
          }}
          onEditForm={() => { setFormKey(k => k + 1); }}
        />
      } />
      <Route path="/form" element={
        <FormPageWrapper
          key={formKey}
          onAddItem={handleAddItem}
          items={formItems}
          currentReport={currentReport}
        />
      } />
      <Route path="/setup-inspection" element={
        <FormPageWrapper
          key={formKey}
          onAddItem={handleAddItem}
          items={formItems}
          currentReport={currentReport}
        />
      } />
      <Route path="/raw-material" element={<RawMaterial />} />
      <Route path="/layout-report" element={<LayoutReport />} />
      <Route path="/dispatch" element={<Dispatch />} />
      <Route path="/dispatch-inspection" element={
        <Dispatch_Inspection
          items={diItems}
          currentReport={diReport}
          onFilter={handleDiFilter}
          onEditForm={handlePdiEdit}
        />
      } />

      {/* ── PDI Routes ── */}
      <Route path="/pdi-report" element={<PDIReportselection />} />
      <Route path="/pdi-report-view" element={
        <PDIReport
          items={diItems}
          currentReport={diReport}
          onFilter={handleDiFilter}
          onEditForm={handlePdiEdit}
        />
      } />

      {/* ── PDI Fill / Edit Form ── */}
      <Route path="/pdi-form" element={<PDIFormRouteWrapper onSavePDI={handleSavePDI} />} />
{/* ── Scrap Note Routes ── */}
  <Route path="/scrap-note" element={<ScrapNoteSelection />} />
  <Route path="/scrap-note-view" element={
  <Scrapnoteprint
    items={scrapItems}
    currentReport={scrapReport}
  />
} />
      <Route path="/sop-procedure" element={<SOPProcedure />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;