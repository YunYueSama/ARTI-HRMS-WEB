<script setup>
import { computed, onMounted, ref } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { ElMessage } from 'element-plus'
import { DataLine, Connection } from '@element-plus/icons-vue'
import { listTracesApi, getTraceDetailApi, getTokenUsageApi } from '@/api/trace'

use([CanvasRenderer, BarChart, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

// 筛选条件
const filters = ref({
  user_id: '',
  status: '',
  operation_type: '',
  date_range: []
})

// 追踪列表
const traces = ref([])
const traceLoading = ref(false)
const tracePagination = ref({ page: 1, size: 15, total: 0 })

// Token 用量数据
const tokenUsage = ref([])
const usageLoading = ref(false)

// 详情对话框
const detailDialogVisible = ref(false)
const traceDetail = ref(null)
const detailLoading = ref(false)

// 加载追踪列表
const loadTraces = async () => {
  traceLoading.value = true
  try {
    const params = {
      page: tracePagination.value.page,
      size: tracePagination.value.size
    }
    if (filters.value.user_id) params.user_id = filters.value.user_id
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.operation_type) params.operation_type = filters.value.operation_type
    if (filters.value.date_range?.length === 2) {
      params.start_time = filters.value.date_range[0]
      params.end_time = filters.value.date_range[1]
    }
    const res = await listTracesApi(params)
    traces.value = res?.items || (Array.isArray(res) ? res : []) || []
    tracePagination.value.total = res?.total ?? traces.value.length
  } catch (error) {
    console.warn('[Trace] 加载追踪数据失败:', error)
    traces.value = []
    tracePagination.value.total = 0
  } finally {
    traceLoading.value = false
  }
}

// 加载 Token 用量
const loadTokenUsage = async () => {
  usageLoading.value = true
  try {
    const res = await getTokenUsageApi({ aggregation: 'daily' })
    tokenUsage.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.warn('[Trace] 加载用量数据失败:', error)
    tokenUsage.value = []
  } finally {
    usageLoading.value = false
  }
}

// 查看详情
const handleViewDetail = async (trace) => {
  detailDialogVisible.value = true
  detailLoading.value = true
  try {
    traceDetail.value = await getTraceDetailApi(trace.traceId || trace.trace_id)
  } catch (error) {
    ElMessage.error(error.message || '加载详情失败')
  } finally {
    detailLoading.value = false
  }
}

// 筛选
const handleFilter = () => {
  tracePagination.value.page = 1
  loadTraces()
}

// 重置筛选
const handleReset = () => {
  filters.value = { user_id: '', status: '', operation_type: '', date_range: [] }
  tracePagination.value.page = 1
  loadTraces()
}

// 分页
const handlePageChange = (page) => {
  tracePagination.value.page = page
  loadTraces()
}

// 状态标签
const getStatusType = (status) => {
  const map = { success: 'success', error: 'danger', slow: 'warning' }
  return map[status] || 'info'
}

// 操作类型标签颜色
const getOpType = (type) => {
  const map = { chat: '', agent: 'warning', rag: 'success' }
  return map[type] || 'info'
}

// 计算汇总数据
const usageSummary = computed(() => {
  let totalInput = 0
  let totalOutput = 0
  let totalCost = 0
  let totalRequests = 0
  for (const item of tokenUsage.value) {
    totalInput += item.totalInputTokens || item.input_tokens || 0
    totalOutput += item.totalOutputTokens || item.output_tokens || 0
    totalCost += item.totalCost || item.total_cost || 0
    totalRequests += item.requestCount || item.request_count || 0
  }
  return {
    totalInput,
    totalOutput,
    totalCost,
    totalRequests,
    totalTokens: totalInput + totalOutput
  }
})

// Token 用量图表配置（参考图样式：浅色柱状图 + 悬浮卡片 tooltip）
const usageChartOption = computed(() => {
  const dates = tokenUsage.value.map(item => item.date)
  const inputData = tokenUsage.value.map(item => item.totalInputTokens || item.input_tokens || 0)
  const outputData = tokenUsage.value.map(item => item.totalOutputTokens || item.output_tokens || 0)
  const costData = tokenUsage.value.map(item => Number(item.totalCost || item.total_cost || 0))

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: 'rgba(91, 124, 250, 0.18)',
      borderWidth: 1,
      padding: [12, 16],
      textStyle: { color: '#1f2937', fontSize: 13 },
      extraCssText: 'box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12); border-radius: 10px;',
      formatter: (params) => {
        if (!params || !params.length) return ''
        const date = params[0].axisValue
        const input = inputData[params[0].dataIndex] || 0
        const output = outputData[params[0].dataIndex] || 0
        const cost = costData[params[0].dataIndex] || 0
        const totalTok = input + output
        return `
          <div style="font-weight:600; margin-bottom:8px; color:#0f172a; display:flex; justify-content:space-between; gap:24px;">
            <span>${date}</span>
            <span style="color:#5b7cfa;">${totalTok.toLocaleString()} tokens</span>
          </div>
          <div style="display:flex; justify-content:space-between; gap:24px; line-height:1.9;">
            <span><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#a8c5ff;margin-right:6px;"></i>输入 Token</span>
            <span style="color:#475569;">${input.toLocaleString()}</span>
          </div>
          <div style="display:flex; justify-content:space-between; gap:24px; line-height:1.9;">
            <span><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#5b7cfa;margin-right:6px;"></i>输出 Token</span>
            <span style="color:#475569;">${output.toLocaleString()}</span>
          </div>
          <div style="display:flex; justify-content:space-between; gap:24px; line-height:1.9; padding-top:6px; border-top:1px dashed #e5e7eb; margin-top:6px;">
            <span><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f59e0b;margin-right:6px;"></i>消费金额</span>
            <span style="color:#b45309; font-weight:600;">¥${cost.toFixed(4)}</span>
          </div>
        `
      }
    },
    grid: { left: 50, right: 30, top: 20, bottom: 36 },
    xAxis: {
      type: 'category',
      data: dates,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#94a3b8', fontSize: 12 }
    },
    yAxis: [
      {
        type: 'value',
        position: 'left',
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: {
          color: '#94a3b8',
          fontSize: 12,
          formatter: (val) => {
            if (val >= 1000) return (val / 1000).toFixed(0) + 'K'
            return val
          }
        },
        axisLine: { show: false },
        axisTick: { show: false }
      }
    ],
    series: [
      {
        name: '输入 Token',
        type: 'bar',
        stack: 'tokens',
        barMaxWidth: 32,
        data: inputData,
        itemStyle: {
          color: '#a8c5ff',
          borderRadius: [0, 0, 0, 0]
        },
        emphasis: { itemStyle: { color: '#7ca8ff' } }
      },
      {
        name: '输出 Token',
        type: 'bar',
        stack: 'tokens',
        barMaxWidth: 32,
        data: outputData,
        itemStyle: {
          color: '#5b7cfa',
          borderRadius: [6, 6, 0, 0]
        },
        emphasis: { itemStyle: { color: '#3d5dd9' } }
      }
    ]
  }
})

// 格式化延迟
const formatLatency = (ms) => {
  if (!ms) return '--'
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`
}

// 格式化费用
const formatCost = (cost) => {
  if (!cost) return '--'
  return `¥${Number(cost).toFixed(4)}`
}

onMounted(() => {
  loadTraces()
  loadTokenUsage()
})
</script>

<template>
  <div class="trace-page">
    <!-- 筛选栏 -->
    <el-card shadow="hover" class="section-card">
      <div class="filter-bar">
        <el-input v-model="filters.user_id" placeholder="用户ID" clearable style="width: 150px;" />
        <el-select v-model="filters.status" placeholder="状态" clearable style="width: 120px;">
          <el-option label="成功" value="success" />
          <el-option label="错误" value="error" />
          <el-option label="慢响应" value="slow" />
        </el-select>
        <el-select v-model="filters.operation_type" placeholder="操作类型" clearable style="width: 130px;">
          <el-option label="对话" value="chat" />
          <el-option label="Agent" value="agent" />
          <el-option label="RAG" value="rag" />
        </el-select>
        <el-date-picker
          v-model="filters.date_range"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 260px;"
        />
        <el-button type="primary" @click="handleFilter">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <!-- Token 用量图表 -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon class="title-icon"><DataLine /></el-icon>
            每日用量
          </span>
          <span class="card-desc">按日聚合输入 / 输出 Token 与消费金额</span>
        </div>
      </template>

      <!-- 顶部汇总数据 -->
      <div class="usage-summary">
        <div class="summary-item">
          <span class="summary-label">总输入 Token</span>
          <span class="summary-value">{{ usageSummary.totalInput.toLocaleString() }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">总输出 Token</span>
          <span class="summary-value">{{ usageSummary.totalOutput.toLocaleString() }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">消费金额</span>
          <span class="summary-value summary-cost">¥{{ usageSummary.totalCost.toFixed(2) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">请求次数</span>
          <span class="summary-value">{{ usageSummary.totalRequests }}</span>
        </div>
      </div>

      <div v-loading="usageLoading">
        <v-chart v-if="tokenUsage.length > 0" class="usage-chart" :option="usageChartOption" autoresize />
        <el-empty v-else description="暂无用量数据" />
      </div>
    </el-card>

    <!-- 追踪列表 -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon class="title-icon"><Connection /></el-icon>
            追踪记录
          </span>
          <span class="card-desc">共 {{ tracePagination.total }} 条记录</span>
        </div>
      </template>
      <el-table :data="traces" v-loading="traceLoading" stripe style="width: 100%">
        <el-table-column prop="traceId" label="Trace ID" width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewDetail(row)">
              {{ row.traceId?.slice(0, 8) }}...
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="operationType" label="操作" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getOpType(row.operationType)">{{ row.operationType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="modelName" label="模型" width="150" show-overflow-tooltip />
        <el-table-column prop="totalTokens" label="Tokens" width="90" align="center" />
        <el-table-column prop="latencyMs" label="延迟" width="90" align="center">
          <template #default="{ row }">
            <span :class="{ 'text-warning': row.latencyMs > 3000, 'text-danger': row.latencyMs > 10000 }">
              {{ formatLatency(row.latencyMs) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="costEstimate" label="费用" width="90" align="center">
          <template #default="{ row }">{{ formatCost(row.costEstimate) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getStatusType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="时间" width="170" align="center">
          <template #default="{ row }">
            {{ row.createTime ? new Date(row.createTime).toLocaleString('zh-CN') : '--' }}
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap" v-if="tracePagination.total > tracePagination.size">
        <el-pagination
          background
          layout="prev, pager, next, total"
          :total="tracePagination.total"
          :page-size="tracePagination.size"
          :current-page="tracePagination.page"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="追踪详情" width="700px" destroy-on-close>
      <div v-loading="detailLoading">
        <template v-if="traceDetail">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="Trace ID">{{ traceDetail.traceId }}</el-descriptions-item>
            <el-descriptions-item label="操作类型">
              <el-tag size="small" :type="getOpType(traceDetail.operationType)">{{ traceDetail.operationType }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="模型">{{ traceDetail.modelName }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag size="small" :type="getStatusType(traceDetail.status)">{{ traceDetail.status }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="输入 Tokens">{{ traceDetail.inputTokens || 0 }}</el-descriptions-item>
            <el-descriptions-item label="输出 Tokens">{{ traceDetail.outputTokens || 0 }}</el-descriptions-item>
            <el-descriptions-item label="延迟">{{ formatLatency(traceDetail.latencyMs) }}</el-descriptions-item>
            <el-descriptions-item label="费用">{{ formatCost(traceDetail.costEstimate) }}</el-descriptions-item>
            <el-descriptions-item label="用户ID">{{ traceDetail.userId || '--' }}</el-descriptions-item>
            <el-descriptions-item label="时间">
              {{ traceDetail.createTime ? new Date(traceDetail.createTime).toLocaleString('zh-CN') : '--' }}
            </el-descriptions-item>
          </el-descriptions>

          <div class="detail-section" v-if="traceDetail.input">
            <h4>输入内容</h4>
            <div class="detail-content">{{ typeof traceDetail.input === 'string' ? traceDetail.input : JSON.stringify(traceDetail.input, null, 2) }}</div>
          </div>

          <div class="detail-section" v-if="traceDetail.output">
            <h4>输出内容</h4>
            <div class="detail-content">{{ typeof traceDetail.output === 'string' ? traceDetail.output : JSON.stringify(traceDetail.output, null, 2) }}</div>
          </div>

          <div class="detail-section" v-if="traceDetail.error">
            <h4>错误信息</h4>
            <div class="detail-content error-content">{{ traceDetail.error }}</div>
          </div>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.trace-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 18px;
  color: #5b7cfa;
  flex-shrink: 0;
}

.card-desc {
  font-size: 13px;
  color: #909399;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.usage-chart {
  height: 320px;
}

.usage-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 16px 8px 24px;
  border-bottom: 1px dashed #e5e7eb;
  margin-bottom: 16px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-label {
  font-size: 12px;
  color: #94a3b8;
  letter-spacing: 0.04em;
}

.summary-value {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  font-feature-settings: "tnum";
}

.summary-cost {
  color: #b45309;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.text-warning {
  color: #E6A23C;
  font-weight: 600;
}

.text-danger {
  color: #F56C6C;
  font-weight: 600;
}

.detail-section {
  margin-top: 20px;
}

.detail-section h4 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 14px;
}

.detail-content {
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
  color: #303133;
}

.error-content {
  background: #fef0f0;
  color: #F56C6C;
}

@media (max-width: 768px) {
  .trace-page {
    gap: 14px;
  }

  .filter-bar {
    gap: 8px;
  }

  .filter-bar .el-input,
  .filter-bar .el-select {
    width: 100% !important;
  }

  .filter-bar .el-date-picker {
    width: 100% !important;
  }

  .usage-chart {
    height: 260px;
  }

  .usage-summary {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 12px 4px 18px;
  }

  .summary-value {
    font-size: 18px;
  }
}
</style>
