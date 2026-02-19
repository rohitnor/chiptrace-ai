import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const api = axios.create({ baseURL: BASE });

// Metric Tree
export const fetchSnapshot = () => api.get('/api/metric-tree/snapshot');
export const fetchAlerts = () => api.get('/api/metric-tree/alerts');
export const fetchNode = (nodeId) => api.get(`/api/metric-tree/node/${nodeId}`);
export const fetchTreeDefinition = () => api.get('/api/metric-tree/tree-definition');

// Disruptions
export const fetchDisruptions = (limit = 20) => api.get(`/api/disruptions?limit=${limit}`);
export const fetchDisruption = (id) => api.get(`/api/disruptions/${id}`);

// Predictions
export const fetchFullPrediction = () => api.get('/api/predict/full');
export const fetchDelayPrediction = () => api.get('/api/predict/delay');
export const fetchResolutionPrediction = (type, severity) =>
  api.get(`/api/predict/resolution/${type}/${severity}`);

// Compare
export const fetchComparison = () => api.get('/api/compare/flat-vs-tree');

// Suppliers
export const fetchSuppliers = (tier) =>
  api.get(`/api/suppliers${tier !== undefined ? `?tier=${tier}` : ''}`);
export const fetchSupplierEvents = (id) => api.get(`/api/suppliers/${id}/events`);

// Simulate
export const simulateDisruption = (type, severity) =>
  api.post(`/api/simulate/disruption?disruption_type=${type}&severity=${severity}`);

export default api;
