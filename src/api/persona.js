import apiClient from './client'

// 查询所有人设列表
export function listPersonasApi() {
  return apiClient.get('/ai/personas')
}

// 获取当前激活的人设
export function getActivePersonaApi() {
  return apiClient.get('/ai/personas/active')
}

// 创建人设
export function createPersonaApi(data) {
  return apiClient.post('/ai/personas', data)
}

// 更新人设
export function updatePersonaApi(id, data) {
  return apiClient.put(`/ai/personas/${id}`, data)
}

// 激活人设
export function activatePersonaApi(id) {
  return apiClient.put(`/ai/personas/${id}/activate`)
}

// 删除人设
export function deletePersonaApi(id) {
  return apiClient.delete(`/ai/personas/${id}`)
}
