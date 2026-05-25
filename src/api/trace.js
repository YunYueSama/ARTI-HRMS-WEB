import apiClient from './client'

export function listTracesApi(params = {}) {
  return apiClient.get('/traces', { params })
}

export function getTraceDetailApi(traceId) {
  return apiClient.get(`/traces/${traceId}`)
}

export function getTokenUsageApi(params = { aggregation: 'daily' }) {
  return apiClient.get('/traces/usage', { params })
}

export function submitFeedbackApi(payload) {
  return apiClient.post('/traces/feedback', payload)
}
