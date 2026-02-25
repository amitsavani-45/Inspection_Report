import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Inspection from './Inspection';
import Form from './Form';
import { getAllReports, getReportById, createReport, updateReport } from './services/api';

function FormPageWrapper({ onAddItem, items = [], currentReport = null, isNew = false }) {
  const navigate = useNavigate();
  const handleSubmit = async (formData) => {
    try {
      await onAddItem(formData);
      navigate('/');
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to save: ' + error.message);
    }
  };

  // Edit mode: pass full currentReport including schedule_entries
  // New mode: pass empty object
  const formInitialData = isNew ? {} : (currentReport || {});
  const formItems = isNew ? [] : items;

  return (
    <Form
      onSubmit={handleSubmit}
      onCancel={() => navigate('/')}
      initialData={formInitialData}
      items={formItems}
    />
  );
}

function App() {
  const [currentReport, setCurrentReport] = useState(null);
  const [viewItems, setViewItems]         = useState([]);
  const [formItems, setFormItems]         = useState([]);
  const [loading, setLoading]             = useState(false);
  const [formKey, setFormKey]             = useState(0);
  const [isNewForm, setIsNewForm]         = useState(false);

  useEffect(() => { loadLatestReport(); }, []);

  const applyReport = (fullReport) => {
    setCurrentReport(fullReport);
    setViewItems(fullReport.items || []);
    setFormItems(fullReport.items || []);
  };

  const loadLatestReport = async () => {
    try {
      setLoading(true);
      const reports = await getAllReports();
      if (reports && reports.length > 0) {
        const filled = reports.find(r => r.item_count > 0) || reports[0];
        const full = await getReportById(filled.id);
        applyReport(full);
      } else {
        setCurrentReport(null);
        setViewItems([]);
        setFormItems([]);
      }
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = async (date) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/reports/?date=${date}`);
      const reports  = await response.json();
      if (reports && reports.length > 0) {
        const filled = reports.find(r => r.item_count > 0) || reports[0];
        const full = await getReportById(filled.id);
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
        const filled = reports.find(r => r.item_count > 0) || reports[0];
        const full = await getReportById(filled.id);
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
      const date = formData.scheduleDate || new Date().toISOString().split('T')[0];

      const isPartChanged =
        currentReport &&
        (currentReport.part_name      !== formData.partName      ||
         currentReport.part_number    !== formData.partNumber    ||
         currentReport.operation_name !== formData.operationName ||
         currentReport.customer_name  !== formData.customerName);

      let reportId = currentReport?.id;

      if (!reportId || isPartChanged) {
        const createdReport = await createReport({
          doc_no: 'KGTL-QCL-01', revision_no: '01',
          date,
          part_name:      formData.partName      || '',
          part_number:    formData.partNumber    || '',
          operation_name: formData.operationName || '',
          customer_name:  formData.customerName  || '',
          items: [],
          schedule_entries: [],
        });
        reportId = createdReport.id;
      }

      // ✅ FIX: Form.js se directly formData.items aa raha hai — wahi use karo
      const updatedItems = (formData.items || []).map(item => ({
        sr_no:        item.sr_no,
        item:         item.item || '',
        special_char: item.special_char || '',
        spec:         item.spec         || '',
        tolerance:    item.tolerance    || '',
        inst:         item.inst         || '',
      }));

      // ✅ Sirf current form ki entries save karo — koi purani entries merge mat karo
      // IMPORTANT: entry.slot_index Form.js se sahi aa raha hai — overwrite mat karo
      const incomingEntries = formData.schedule_entries || [];

      const newScheduleEntries = incomingEntries.map(entry => ({
        ...entry,
        sr: 1,
        // slot_index Form.js se preserve karo — App.js mein overwrite karna galat tha
        slot_index: entry.slot_index ?? 0,
      }));

      await updateReport(reportId, {
        doc_no:           'KGTL-QCL-01',
        revision_no:      '01',
        date,
        part_name:        formData.partName      || '',
        part_number:      formData.partNumber    || '',
        operation_name:   formData.operationName || '',
        customer_name:    formData.customerName  || '',
        items:            updatedItems,
        schedule_entries: newScheduleEntries,
      });

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
      <div style={{
        display:        'flex',
        justifyContent: 'center',
        alignItems:     'center',
        height:         '100vh',
        fontSize:       '18px',
        color:          '#666',
      }}>
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
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
            onNewForm={() => { setIsNewForm(true);  setFormKey(k => k + 1); }}
            onEditForm={() => { setIsNewForm(false); setFormKey(k => k + 1); }}
          />
        } />
        <Route path="/form" element={
          <FormPageWrapper
            key={formKey}
            onAddItem={handleAddItem}
            items={formItems}
            currentReport={currentReport}
            isNew={isNewForm}
          />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;