import apiClient from './client'

export function getGraphVisualizationApi() {
  return apiClient.get('/graph/visualization')
}

export function queryGraphRelationshipsApi(params) {
  return apiClient.get('/graph/query', { params })
}

export function syncGraphApi() {
  return apiClient.post('/graph/sync')
}

export function listGraphNodesApi(params = { page: 1, size: 50 }) {
  return apiClient.get('/graph/nodes', { params })
}
