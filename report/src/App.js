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
import PDIReport from './PDIReport';
import SOPProcedure from './SOPProcedure';
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

// 👇 NAYA COMPONENT BANA DIYA HAI TAAKI ROUTE CHANGE DETECT HO SAKE 👇
function AppContent() {
  const [currentReport, setCurrentReport] = useState({
    doc_no: 'KGTL-QCL-01', revision_no: '01', date: '',
    part_name: '', part_number: '', operation_name: '', customer_name: '',
    items: [], schedule_entries: [],
  });
  const [viewItems, setViewItems]         = useState([]);
  const [formItems, setFormItems]         = useState([]);
  const [loading, setLoading]             = useState(false);
  const [formKey, setFormKey]             = useState(0);

  const location = useLocation();

  // 👇 YAHAN MAGIC HOGA: Jab bhi aap Home ya Selection page par jayenge, data blank ho jayega
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
          if (check.ok) {
            reportId = currentReport.id;
          }
        } catch (_) {
          // network error — create new
        }
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
      <Route path="/pdi-report" element={<PDIReport />} />
      <Route path="/sop-procedure" element={<SOPProcedure />} />
    </Routes>
  );
}

// App wrapper for Router
function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;