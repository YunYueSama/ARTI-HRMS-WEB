import axios from 'axios'

// ============================================================
// snake_case → camelCase 自动转换工具
// 说明：Python 后端返回 snake_case 字段名（如 emp_name），
//      前端 JavaScript 惯例使用 camelCase（如 empName）。
//      在响应拦截器中自动转换，前端代码无需关心命名差异。
// ============================================================
function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function convertKeysToCamel(obj) {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamel)
  }
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = snakeToCamel(key)
      result[camelKey] = convertKeysToCamel(obj[key])
      return result
    }, {})
  }
  return obj
}

// ============================================================
// camelCase → snake_case 请求体转换（发送给 Python 后端）
// ============================================================
function camelToSnake(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function convertKeysToSnake(obj) {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToSnake)
  }
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = camelToSnake(key)
      result[snakeKey] = convertKeysToSnake(obj[key])
      return result
    }, {})
  }
  return obj
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000
})

// 请求拦截器：添加Token + 请求体 camelCase → snake_case
apiClient.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // 请求体自动转换为 snake_case（Python 后端期望 snake_case）
    if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
      config.data = convertKeysToSnake(config.data)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器：处理业务逻辑 + 响应体 snake_case → camelCase
apiClient.interceptors.response.use(
  (response) => {
    // 先转换整个响应体的 key 为 camelCase
    const body = convertKeysToCamel(response.data)
    if (body && typeof body === 'object' && 'success' in body) {
      if (!body.success) {
        return Promise.reject(new Error(body.message || '请求失败'))
      }
      return body.data
    }
    return body
  },
  (error) => {
    // 处理401未授权错误
    if (error.response?.status === 401) {
      // 清除token
      localStorage.removeItem('token')
      // 跳转到登录页（如果不在登录页）
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    
    const message = error.response?.data?.message || error.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)

export default apiClient
