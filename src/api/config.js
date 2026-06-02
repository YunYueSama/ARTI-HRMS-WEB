import apiClient from './client'

export function getModelConfigApi() {
  return apiClient.get('/config/model')
}

export function updateModelConfigApi(payload) {
  return apiClient.put('/config/model', payload)
}
