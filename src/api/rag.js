import apiClient from './client'

export function uploadDocumentApi(formData) {
  return apiClient.post('/rag/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000
  })
}

export function listDocumentsApi(params = { page: 1, size: 10 }) {
  return apiClient.get('/rag/documents', { params })
}

export function getDocumentChunksApi(docId, params = { page: 1, size: 20 }) {
  return apiClient.get(`/rag/documents/${docId}/chunks`, { params })
}

export function deleteDocumentApi(docId) {
  return apiClient.delete(`/rag/documents/${docId}`)
}

export function searchRagApi(payload) {
  return apiClient.post('/rag/search', payload)
}

export function searchRagWithRerankApi(payload) {
  return apiClient.post('/rag/search', { ...payload, enable_rerank: true })
}

export function reprocessDocumentApi(docId) {
  return apiClient.post(`/rag/reprocess/${docId}`)
}
