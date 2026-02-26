import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import Inspection from './Inspection';
import Form from './Form';
import { getAllReports, getReportById, createReport, updateReport } from './services/api';

function FormPageWrapper({ onAddItem, items = [], currentReport = null }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNew = searchParams.get('mode') === 'new';   // ✅ URL se read — hamesha fresh

  const handleSubmit = async (formData) => {
    try {
      await onAddItem({ ...formData, _isNew: isNew });
      navigate('/');
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to save: ' + error.message);
    }
  };

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

      const isNew = formData._isNew === true;

      const updatedItems = (formData.items || []).map(item => ({
        sr_no:        item.sr_no,
        item:         item.item || '',
        special_char: item.special_char || '',
        spec:         item.spec         || '',
        tolerance:    item.tolerance    || '',
        inst:         item.inst         || '',
      }));

      const newScheduleEntries = (formData.schedule_entries || []).map(entry => {
        const { _isNew, ...cleanEntry } = entry;  // _isNew nikalo agar ho
        return {
          ...cleanEntry,
          sr: 1,
          slot_index: cleanEntry.slot_index ?? 0,
        };
      });

      // _isNew sirf frontend ka flag hai — backend ko nahi bhejte
      const reportPayload = {
        doc_no:           'KGTL-QCL-01',
        revision_no:      '01',
        date,
        part_name:        formData.partName      || '',
        part_number:      formData.partNumber    || '',
        operation_name:   formData.operationName || '',
        customer_name:    formData.customerName  || '',
        items:            updatedItems,
        schedule_entries: newScheduleEntries,
      };

      let reportId = null;

      // Step 1: decide karo create karna hai ya update
      if (!isNew && currentReport?.id) {
        // DB mein verify karo ye ID exist karti hai
        try {
          const check = await fetch(`http://localhost:8000/api/reports/${currentReport.id}/`);
          if (check.ok) {
            reportId = currentReport.id; // exists — update karenge
          }
          // 404 aaya toh reportId null rehta hai — naya create hoga
        } catch (_) {
          // network error — naya create karo
        }
      }

      // Step 2: create ya update
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
            onNewForm={() => { setFormKey(k => k + 1); }}
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;