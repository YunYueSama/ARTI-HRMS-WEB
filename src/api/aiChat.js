import apiClient from './client'

export function chatWithAtriApi(payload) {
  return apiClient.post('/ai/chat', payload, { timeout: 60000 })
}

/**
 * SSE 流式聊天
 * 使用 fetch + ReadableStream 接收 Server-Sent Events
 *
 * @param {Object} payload - { userId, message }
 * @param {Function} onChunk - 每收到一个文本 chunk 时回调 (text: string)
 * @param {Function} onDone - 流结束时回调 (meta: { model, provider })
 * @param {Function} onError - 错误回调 (error: Error)
 * @returns {AbortController} 用于取消请求
 */
export function chatWithAtriStreamApi(payload, { onChunk, onDone, onError }) {
  const controller = new AbortController()

  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
  const token = localStorage.getItem('token') || ''

  // fetch 不经过 axios 拦截器，需手动转 snake_case
  const snakePayload = {
    user_id: payload.userId,
    message: payload.message,
  }

  fetch(`${baseUrl}/ai/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(snakePayload),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6).trim()
          if (!jsonStr) continue

          try {
            const data = JSON.parse(jsonStr)
            if (data.done) {
              onDone?.({ model: data.model, provider: data.provider })
            } else if (data.text) {
              onChunk?.(data.text)
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError?.(err)
      }
    })

  return controller
}

export function getChatHistoryApi(userId) {
  return apiClient.get(`/ai/history/${userId}`)
}

export function clearChatHistoryApi(userId) {
  return apiClient.delete(`/ai/history/${userId}`)
}

export function getProviderInfoApi() {
  return apiClient.get('/ai/provider-info')
}
