import apiClient from './client'

export function evaluateRagApi(payload) {
  return apiClient.post('/rag/evaluate', payload, { timeout: 120000 })
}

export function loadEvalDatasetApi() {
  return apiClient.get('/rag/eval-dataset')
}

export function saveEvalDatasetApi(payload) {
  return apiClient.post('/rag/eval-dataset', payload)
}
