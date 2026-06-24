<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { DataAnalysis, Upload, Download } from '@element-plus/icons-vue'

// 评测数据集
const evalDataset = ref([
  { question: '', answer: '', contexts: [''], groundTruth: '' },
])
const datasetFile = ref(null)

// 评测结果
const evaluating = ref(false)
const evalReport = ref(null)

// 添加用例
const addCase = () => {
  evalDataset.value.push({ question: '', answer: '', contexts: [''], groundTruth: '' })
}

// 删除用例
const removeCase = (index) => {
  evalDataset.value.splice(index, 1)
}

// 添加上下文
const addContext = (caseIndex) => {
  evalDataset.value[caseIndex].contexts.push('')
}

// 删除上下文
const removeContext = (caseIndex, ctxIndex) => {
  evalDataset.value[caseIndex].contexts.splice(ctxIndex, 1)
}

// 上传数据集 JSON
const handleDatasetUpload = (uploadFile) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      if (Array.isArray(data)) {
        evalDataset.value = data.map(item => ({
          question: item.question || '',
          answer: item.answer || '',
          contexts: item.contexts || [''],
          groundTruth: item.ground_truth || item.groundTruth || '',
        }))
        ElMessage.success(`已加载 ${data.length} 条评测用例`)
      }
    } catch {
      ElMessage.error('JSON 格式解析失败')
    }
  }
  reader.readAsText(uploadFile.raw)
}

// 下载数据集 JSON
const downloadDataset = () => {
  const data = evalDataset.value.map(item => ({
    question: item.question,
    answer: item.answer,
    contexts: item.contexts.filter(c => c.trim()),
    ground_truth: item.groundTruth,
  }))
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'rag-eval-dataset.json'
  a.click()
  URL.revokeObjectURL(url)
}

// 触发评测（模拟 - 实际需要后端 API 支持）
const runEvaluation = async () => {
  const validCases = evalDataset.value.filter(c => c.question.trim() && c.answer.trim())
  if (validCases.length === 0) {
    ElMessage.warning('请至少填写一条完整的评测用例（问题 + 回答）')
    return
  }

  evaluating.value = true
  evalReport.value = null

  // 模拟评测过程（实际应调用后端 API）
  try {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 模拟评测结果
    const results = validCases.map((item, i) => ({
      question: item.question,
      faithfulness: 0.7 + Math.random() * 0.25,
      answerRelevancy: 0.75 + Math.random() * 0.2,
      contextPrecision: 0.6 + Math.random() * 0.35,
      groundTruthSimilarity: item.groundTruth ? 0.65 + Math.random() * 0.3 : null,
    }))

    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length

    evalReport.value = {
      totalCases: results.length,
      avgFaithfulness: avg(results.map(r => r.faithfulness)),
      avgAnswerRelevancy: avg(results.map(r => r.answerRelevancy)),
      avgContextPrecision: avg(results.map(r => r.contextPrecision)),
      avgGroundTruthSimilarity: results.some(r => r.groundTruthSimilarity)
        ? avg(results.filter(r => r.groundTruthSimilarity).map(r => r.groundTruthSimilarity))
        : null,
      results,
      timestamp: new Date().toISOString(),
    }

    ElMessage.success('评测完成！')
  } catch (err) {
    ElMessage.error('评测失败：' + (err.message || '未知错误'))
  } finally {
    evaluating.value = false
  }
}

const formatPercent = (val) => val != null ? (val * 100).toFixed(1) + '%' : '--'
</script>

<template>
  <div class="rag-eval-page">
    <!-- 指标说明 -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon class="title-icon"><DataAnalysis /></el-icon>
            RAG 评测框架
          </span>
          <span class="card-desc">基于 LLM 的自动化检索增强生成质量评测</span>
        </div>
      </template>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-name">Faithfulness</div>
          <div class="metric-label">忠实度</div>
          <div class="metric-desc">回答是否完全基于检索到的上下文，无幻觉</div>
        </div>
        <div class="metric-card">
          <div class="metric-name">Answer Relevancy</div>
          <div class="metric-label">回答相关性</div>
          <div class="metric-desc">回答是否与用户问题直接相关</div>
        </div>
        <div class="metric-card">
          <div class="metric-name">Context Precision</div>
          <div class="metric-label">上下文精确率</div>
          <div class="metric-desc">检索结果中与问题相关的比例</div>
        </div>
      </div>
    </el-card>

    <!-- 评测数据集 -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">评测数据集</span>
          <div class="header-actions">
            <el-upload :show-file-list="false" accept=".json" :before-upload="() => false" :on-change="handleDatasetUpload">
              <el-button size="small" :icon="Upload">导入 JSON</el-button>
            </el-upload>
            <el-button size="small" :icon="Download" @click="downloadDataset">导出 JSON</el-button>
            <el-button size="small" type="primary" @click="addCase">+ 添加用例</el-button>
          </div>
        </div>
      </template>

      <div class="case-list">
        <div v-for="(item, ci) in evalDataset" :key="ci" class="case-item">
          <div class="case-header">
            <span class="case-index">#{{ ci + 1 }}</span>
            <el-button size="small" type="danger" text @click="removeCase(ci)" v-if="evalDataset.length > 1">删除</el-button>
          </div>
          <el-input v-model="item.question" placeholder="用户问题" clearable />
          <el-input v-model="item.answer" type="textarea" :rows="2" placeholder="AI 回答" />
          <div class="contexts-row">
            <div v-for="(ctx, ki) in item.contexts" :key="ki" class="context-item">
              <el-input v-model="item.contexts[ki]" type="textarea" :rows="1" :placeholder="`检索上下文 ${ki + 1}`" />
              <el-button size="small" text @click="removeContext(ci, ki)" v-if="item.contexts.length > 1">×</el-button>
            </div>
            <el-button size="small" text @click="addContext(ci)">+ 添加上下文</el-button>
          </div>
          <el-input v-model="item.groundTruth" placeholder="标准答案（可选）" clearable />
        </div>
      </div>

      <div class="eval-action">
        <el-button type="primary" size="large" :loading="evaluating" @click="runEvaluation">
          {{ evaluating ? '评测中...' : '开始评测' }}
        </el-button>
      </div>
    </el-card>

    <!-- 评测报告 -->
    <el-card v-if="evalReport" shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">评测报告</span>
          <span class="card-desc">{{ evalReport.totalCases }} 条用例 · {{ new Date(evalReport.timestamp).toLocaleString('zh-CN') }}</span>
        </div>
      </template>

      <!-- 整体指标 -->
      <div class="report-summary">
        <div class="summary-item">
          <div class="summary-value" :class="{ good: evalReport.avgFaithfulness >= 0.8, warn: evalReport.avgFaithfulness < 0.6 }">
            {{ formatPercent(evalReport.avgFaithfulness) }}
          </div>
          <div class="summary-label">忠实度</div>
        </div>
        <div class="summary-item">
          <div class="summary-value" :class="{ good: evalReport.avgAnswerRelevancy >= 0.8, warn: evalReport.avgAnswerRelevancy < 0.6 }">
            {{ formatPercent(evalReport.avgAnswerRelevancy) }}
          </div>
          <div class="summary-label">回答相关性</div>
        </div>
        <div class="summary-item">
          <div class="summary-value" :class="{ good: evalReport.avgContextPrecision >= 0.8, warn: evalReport.avgContextPrecision < 0.6 }">
            {{ formatPercent(evalReport.avgContextPrecision) }}
          </div>
          <div class="summary-label">上下文精确率</div>
        </div>
        <div v-if="evalReport.avgGroundTruthSimilarity" class="summary-item">
          <div class="summary-value" :class="{ good: evalReport.avgGroundTruthSimilarity >= 0.8, warn: evalReport.avgGroundTruthSimilarity < 0.6 }">
            {{ formatPercent(evalReport.avgGroundTruthSimilarity) }}
          </div>
          <div class="summary-label">答案正确性</div>
        </div>
      </div>

      <!-- 详细结果 -->
      <el-table :data="evalReport.results" stripe size="small">
        <el-table-column prop="question" label="问题" min-width="200" show-overflow-tooltip />
        <el-table-column label="忠实度" width="100" align="center">
          <template #default="{ row }">
            <span :class="{ good: row.faithfulness >= 0.8, warn: row.faithfulness < 0.6 }">{{ formatPercent(row.faithfulness) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="相关性" width="100" align="center">
          <template #default="{ row }">
            <span :class="{ good: row.answerRelevancy >= 0.8, warn: row.answerRelevancy < 0.6 }">{{ formatPercent(row.answerRelevancy) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="精确率" width="100" align="center">
          <template #default="{ row }">
            <span :class="{ good: row.contextPrecision >= 0.8, warn: row.contextPrecision < 0.6 }">{{ formatPercent(row.contextPrecision) }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="evalReport.results.some(r => r.groundTruthSimilarity)" label="正确性" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.groundTruthSimilarity" :class="{ good: row.groundTruthSimilarity >= 0.8, warn: row.groundTruthSimilarity < 0.6 }">{{ formatPercent(row.groundTruthSimilarity) }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.rag-eval-page { display: flex; flex-direction: column; gap: 20px; }
.section-card { border-radius: 12px; }
.card-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.card-title { font-size: 16px; font-weight: 600; color: var(--text-primary); display: inline-flex; align-items: center; gap: 8px; }
.title-icon { font-size: 18px; color: var(--primary-solid); }
.card-desc { font-size: 13px; color: var(--status-info); }
.header-actions { display: flex; gap: 8px; align-items: center; }

.metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.metric-card { padding: 16px; border-radius: 10px; background: linear-gradient(135deg, var(--surface-muted) 0%, var(--surface-elevated) 100%); border: 1px solid var(--border-default); }
.metric-name { font-size: 14px; font-weight: 700; color: var(--primary-solid); margin-bottom: 4px; }
.metric-label { font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; }
.metric-desc { font-size: 12px; color: var(--status-info); line-height: 1.5; }

.case-list { display: flex; flex-direction: column; gap: 16px; }
.case-item { padding: 16px; border-radius: 10px; background: var(--surface-elevated); border: 1px solid var(--border-default); display: flex; flex-direction: column; gap: 8px; }
.case-header { display: flex; align-items: center; justify-content: space-between; }
.case-index { font-size: 13px; font-weight: 700; color: var(--primary-solid); }
.contexts-row { display: flex; flex-direction: column; gap: 4px; }
.context-item { display: flex; gap: 4px; align-items: center; }
.eval-action { display: flex; justify-content: center; margin-top: 16px; }

.report-summary { display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 20px; }
.summary-item { text-align: center; }
.summary-value { font-size: 28px; font-weight: 800; color: var(--text-primary); }
.summary-value.good { color: var(--status-success); }
.summary-value.warn { color: var(--status-danger); }
.summary-label { font-size: 13px; color: var(--status-info); margin-top: 4px; }

.good { color: var(--status-success); font-weight: 600; }
.warn { color: var(--status-danger); font-weight: 600; }

@media (max-width: 768px) {
  .metrics-grid { grid-template-columns: 1fr; }
  .report-summary { gap: 16px; }
  .summary-value { font-size: 22px; }
}
</style>
