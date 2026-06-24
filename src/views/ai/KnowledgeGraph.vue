<script setup>
import { computed, onMounted, ref } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { GraphChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { ElMessage } from 'element-plus'
import { Refresh, Search, Grid, Setting, Share } from '@element-plus/icons-vue'
import { getGraphVisualizationApi, queryGraphRelationshipsApi, syncGraphApi } from '@/api/graph'

use([CanvasRenderer, GraphChart, TitleComponent, TooltipComponent, LegendComponent])

// 图谱数据
const graphData = ref({ nodes: [], edges: [] })
const graphLoading = ref(false)

// 搜索与查询
const searchEntity = ref('')
const queryResults = ref([])
const queryLoading = ref(false)

// 同步状态
const syncing = ref(false)

// 节点类型颜色映射
const nodeColorMap = {
  employee: '#2563eb',
  department: '#67C23A',
  position: '#E6A23C',
  role: '#9B59B6'
}

const nodeTypeLabels = {
  employee: '员工',
  department: '部门',
  position: '职位',
  role: '角色'
}

// 加载图谱数据
const loadGraph = async () => {
  graphLoading.value = true
  try {
    const res = await getGraphVisualizationApi()
    graphData.value = res || { nodes: [], edges: [] }
  } catch (error) {
    ElMessage.error(error.message || '加载图谱数据失败')
  } finally {
    graphLoading.value = false
  }
}

// 查询关系
const handleQuery = async () => {
  if (!searchEntity.value.trim()) {
    ElMessage.warning('请输入实体名称')
    return
  }
  queryLoading.value = true
  try {
    // 后端参数名是 entity_name，不是 entity
    const res = await queryGraphRelationshipsApi({ entity_name: searchEntity.value.trim(), max_hops: 4 })
    // 后端返回 { entityName, maxHops, relationships: [...], total }
    queryResults.value = res?.relationships || (Array.isArray(res) ? res : []) || []
  } catch (error) {
    ElMessage.error(error.message || '查询失败')
  } finally {
    queryLoading.value = false
  }
}

// 同步图谱
const handleSync = async () => {
  syncing.value = true
  try {
    await syncGraphApi()
    ElMessage.success('图谱同步已触发，数据将在后台更新')
    setTimeout(loadGraph, 2000)
  } catch (error) {
    ElMessage.error(error.message || '同步失败')
  } finally {
    syncing.value = false
  }
}

// ECharts 图表配置
const graphChartOption = computed(() => {
  const nodes = (graphData.value.nodes || []).map(node => ({
    id: String(node.id),
    name: node.name || node.label || `节点${node.id}`,
    symbolSize: getNodeSize(node.type),
    category: node.type || 'default',
    itemStyle: {
      color: nodeColorMap[node.type] || '#909399',
      borderColor: '#fff',
      borderWidth: 2,
      shadowBlur: 8,
      shadowColor: 'rgba(0, 0, 0, 0.1)'
    },
    label: {
      show: true,
      fontSize: 11,
      color: '#303133'
    }
  }))

  const edges = (graphData.value.edges || []).map(edge => ({
    source: String(edge.source),
    target: String(edge.target),
    label: {
      show: true,
      formatter: edge.relation || edge.label || '',
      fontSize: 10,
      color: '#909399'
    },
    lineStyle: {
      color: '#c0c4cc',
      width: 1.5,
      curveness: 0.2
    }
  }))

  const categories = Object.keys(nodeColorMap).map(key => ({
    name: key,
    itemStyle: { color: nodeColorMap[key] }
  }))

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (params.dataType === 'node') {
          const type = nodeTypeLabels[params.data.category] || params.data.category
          return `<b>${params.data.name}</b><br/>类型: ${type}`
        }
        if (params.dataType === 'edge') {
          return `${params.data.label?.formatter || '关联'}`
        }
        return ''
      }
    },
    legend: {
      data: categories.map(c => ({ name: c.name, icon: 'circle' })),
      formatter: (name) => nodeTypeLabels[name] || name,
      bottom: 10,
      textStyle: { color: '#606266' }
    },
    series: [{
      type: 'graph',
      layout: 'force',
      data: nodes,
      links: edges,
      categories,
      roam: true,
      draggable: true,
      force: {
        repulsion: 300,
        gravity: 0.1,
        edgeLength: [100, 200],
        layoutAnimation: true
      },
      emphasis: {
        focus: 'adjacency',
        lineStyle: { width: 3 }
      },
      lineStyle: {
        opacity: 0.7
      }
    }]
  }
})

// 根据节点类型返回大小
function getNodeSize(type) {
  const map = { department: 45, employee: 30, position: 35, role: 40 }
  return map[type] || 30
}

onMounted(loadGraph)
</script>

<template>
  <div class="graph-page">
    <div class="graph-layout">
      <!-- 侧边栏 -->
      <div class="graph-sidebar">
        <el-card shadow="hover" class="sidebar-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon class="title-icon"><Search /></el-icon>
                实体查询
              </span>
            </div>
          </template>
          <div class="search-section">
            <el-input
              v-model="searchEntity"
              placeholder="输入实体名称..."
              clearable
              @keyup.enter="handleQuery"
            />
            <el-button type="primary" :loading="queryLoading" @click="handleQuery" style="margin-top: 10px; width: 100%;">
              查询关系
            </el-button>
          </div>

          <!-- 查询结果 -->
          <div class="query-results" v-if="queryResults.length > 0">
            <div class="result-title">关系路径 ({{ queryResults.length }})</div>
            <div class="relation-item" v-for="(item, index) in queryResults" :key="index">
              <div class="relation-path">
                <el-tag size="small" :color="nodeColorMap[item.sourceType]" effect="dark" style="color: #fff;">
                  {{ item.sourceName }}
                </el-tag>
                <span class="relation-arrow">→ {{ item.relation }} →</span>
                <el-tag size="small" :color="nodeColorMap[item.targetType]" effect="dark" style="color: #fff;">
                  {{ item.targetName }}
                </el-tag>
              </div>
            </div>
          </div>
          <el-empty v-else-if="!queryLoading && searchEntity && queryResults.length === 0" description="未找到关系" :image-size="60" />
        </el-card>

        <!-- 图例 -->
        <el-card shadow="hover" class="sidebar-card legend-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon class="title-icon"><Grid /></el-icon>
                节点图例
              </span>
            </div>
          </template>
          <div class="legend-list">
            <div class="legend-item" v-for="(color, type) in nodeColorMap" :key="type">
              <span class="legend-dot" :style="{ background: color }"></span>
              <span class="legend-label">{{ nodeTypeLabels[type] }}</span>
            </div>
          </div>
        </el-card>

        <!-- 操作按钮 -->
        <el-card shadow="hover" class="sidebar-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon class="title-icon"><Setting /></el-icon>
                操作
              </span>
            </div>
          </template>
          <el-button type="success" :loading="syncing" @click="handleSync" style="width: 100%;">
            <el-icon><Refresh /></el-icon>
            同步数据库
          </el-button>
          <div class="sync-tip">从数据库同步最新的组织关系数据到图谱</div>
        </el-card>
      </div>

      <!-- 图谱可视化 -->
      <div class="graph-main">
        <el-card shadow="hover" class="graph-card" v-loading="graphLoading">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon class="title-icon"><Share /></el-icon>
                知识图谱可视化
              </span>
              <span class="card-desc">
                {{ graphData.nodes?.length || 0 }} 个节点 · {{ graphData.edges?.length || 0 }} 条关系
              </span>
            </div>
          </template>
          <v-chart
            v-if="graphData.nodes?.length > 0"
            class="graph-chart"
            :option="graphChartOption"
            autoresize
          />
          <el-empty v-else description="暂无图谱数据，请先同步数据库" :image-size="120" />
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.graph-page {
  height: 100%;
}

.graph-layout {
  display: flex;
  gap: 20px;
  height: calc(100vh - 140px);
}

.graph-sidebar {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.graph-main {
  flex: 1;
  min-width: 0;
}

.sidebar-card {
  border-radius: 12px;
}

.graph-card {
  border-radius: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.graph-card :deep(.el-card__body) {
  flex: 1;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 17px;
  color: var(--primary-solid);
  flex-shrink: 0;
}

.card-desc {
  font-size: 13px;
  color: var(--status-info);
}

.search-section {
  margin-bottom: 16px;
}

.query-results {
  margin-top: 16px;
}

.result-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-default);
}

.relation-item {
  padding: 8px 0;
  border-bottom: 1px dashed var(--border-default);
}

.relation-item:last-child {
  border-bottom: none;
}

.relation-path {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.relation-arrow {
  font-size: 12px;
  color: var(--status-info);
  white-space: nowrap;
}

.legend-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.legend-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.legend-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.sync-tip {
  margin-top: 10px;
  font-size: 12px;
  color: var(--status-info);
  line-height: 1.5;
}

.graph-chart {
  width: 100%;
  height: 100%;
  min-height: 500px;
}

@media (max-width: 768px) {
  .graph-layout {
    flex-direction: column;
    height: auto;
  }

  .graph-sidebar {
    width: 100%;
    overflow-y: visible;
  }

  .graph-main {
    min-height: 400px;
  }

  .graph-chart {
    min-height: 350px;
  }

  .graph-card {
    height: auto;
  }
}
</style>
