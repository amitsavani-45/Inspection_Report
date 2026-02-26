const API_BASE_URL = 'http://localhost:8000/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const safeFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (err) {
    if (err.message === 'Failed to fetch') {
      throw new Error(
        'Backend server se connect nahi ho pa raha.\n\n' +
        'Please check:\n' +
        '1. Django server chal raha hai? → python manage.py runserver\n' +
        '2. URL sahi hai? → http://localhost:8000'
      );
    }
    throw err;
  }
};

export const getAllReports = async () => {
  try {
    const response = await safeFetch(`${API_BASE_URL}/reports/`);
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : (data.results || []);
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
};

export const getReportByDate = async (date) => {
  try {
    const response = await safeFetch(`${API_BASE_URL}/reports/?date=${date}`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching report by date:', error);
    throw error;
  }
};

export const getReportById = async (id) => {
  try {
    const response = await safeFetch(`${API_BASE_URL}/reports/${id}/`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching report:', error);
    throw error;
  }
};

export const createReport = async (reportData) => {
  try {
    const response = await safeFetch(`${API_BASE_URL}/reports/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error creating report:', error);
    throw error;
  }
};

export const updateReport = async (id, reportData) => {
  try {
    const response = await safeFetch(`${API_BASE_URL}/reports/${id}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error updating report:', error);
    throw error;
  }
};

export const getDropdownOptions = async () => {
  try {
    const response = await safeFetch(`${API_BASE_URL}/dropdown-options/`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching dropdown options:', error);
    throw error;
  }
};

export default { getAllReports, getReportByDate, getReportById, createReport, updateReport, getDropdownOptions };