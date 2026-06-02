<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, Loading, Document, Folder, Search } from '@element-plus/icons-vue'
import { uploadDocumentApi, listDocumentsApi, getDocumentChunksApi, deleteDocumentApi, searchRagApi, reprocessDocumentApi } from '@/api/rag'

// 文档列表
const documents = ref([])
const docLoading = ref(false)
const docPagination = ref({ page: 1, size: 10, total: 0 })

// 上传相关
const uploading = ref(false)

// 搜索相关
const searchQuery = ref('')
const searchResults = ref([])
const searching = ref(false)
const enableRerank = ref(false)

// 分块预览
const chunkDialogVisible = ref(false)
const chunks = ref([])
const chunkLoading = ref(false)
const chunkPagination = ref({ page: 1, size: 20, total: 0 })
const currentDoc = ref(null)

// 加载文档列表
const loadDocuments = async () => {
  docLoading.value = true
  try {
    const res = await listDocumentsApi({ page: docPagination.value.page, size: docPagination.value.size })
    documents.value = res?.items || (Array.isArray(res) ? res : []) || []
    docPagination.value.total = res?.total ?? documents.value.length
  } catch (error) {
    // 后端 pgvector 未就绪时只 warn，不弹错误。页面保持可见，用户能看到"暂无数据"
    console.warn('[RAG] 加载文档列表失败:', error)
    documents.value = []
    docPagination.value.total = 0
  } finally {
    docLoading.value = false
  }
}

// 上传文件
const handleUpload = async (options) => {
  uploading.value = true
  const formData = new FormData()
  formData.append('file', options.file)
  try {
    await uploadDocumentApi(formData)
    ElMessage.success('文档上传成功，正在处理中...')
    await loadDocuments()
  } catch (error) {
    ElMessage.error(error.message || '上传失败')
  } finally {
    uploading.value = false
  }
}

// 删除文档
const handleDelete = (doc) => {
  ElMessageBox.confirm(`确定删除文档「${doc.filename}」吗？删除后不可恢复。`, '确认删除', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteDocumentApi(doc.docId || doc.id)
      ElMessage.success('删除成功')
      await loadDocuments()
    } catch (error) {
      ElMessage.error(error.message || '删除失败')
    }
  }).catch(() => {})
}

// 重新处理文档
const handleReprocess = async (doc) => {
  try {
    await reprocessDocumentApi(doc.docId || doc.id)
    ElMessage.success('已提交重新处理')
    await loadDocuments()
  } catch (error) {
    ElMessage.error(error.message || '重新处理失败')
  }
}

// 查看分块
const handleViewChunks = async (doc) => {
  currentDoc.value = doc
  chunkDialogVisible.value = true
  chunkLoading.value = true
  chunkPagination.value.page = 1
  try {
    const res = await getDocumentChunksApi(doc.docId || doc.id, { page: 1, size: chunkPagination.value.size })
    chunks.value = res?.items || (Array.isArray(res) ? res : []) || []
    chunkPagination.value.total = res?.total ?? chunks.value.length
  } catch (error) {
    ElMessage.error(error.message || '加载分块失败')
  } finally {
    chunkLoading.value = false
  }
}

// 分块分页
const handleChunkPageChange = async (page) => {
  chunkPagination.value.page = page
  chunkLoading.value = true
  try {
    const res = await getDocumentChunksApi(currentDoc.value.docId || currentDoc.value.id, { page, size: chunkPagination.value.size })
    chunks.value = res?.items || (Array.isArray(res) ? res : []) || []
    chunkPagination.value.total = res?.total ?? chunks.value.length
  } catch (error) {
    ElMessage.error(error.message || '加载分块失败')
  } finally {
    chunkLoading.value = false
  }
}

// 语义搜索
const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    ElMessage.warning('请输入搜索内容')
    return
  }
  searching.value = true
  try {
    const res = await searchRagApi({
      query: searchQuery.value.trim(),
      top_k: 5,
      enable_rerank: enableRerank.value,
    })
    searchResults.value = res || []
  } catch (error) {
    ElMessage.error(error.message || '搜索失败')
  } finally {
    searching.value = false
  }
}

// 文档分页
const handleDocPageChange = (page) => {
  docPagination.value.page = page
  loadDocuments()
}

// 状态标签类型
const getStatusType = (status) => {
  const map = { completed: 'success', processing: 'warning', failed: 'danger', pending: 'info' }
  return map[status] || 'info'
}

const getStatusLabel = (status) => {
  const map = { completed: '已完成', processing: '处理中', failed: '失败', pending: '等待中' }
  return map[status] || status
}

onMounted(loadDocuments)
</script>

<template>
  <div class="rag-page">
    <!-- 上传区域 -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon class="title-icon"><Document /></el-icon>
            文档上传
          </span>
          <span class="card-desc">支持 PDF、DOCX、MD、TXT 格式</span>
        </div>
      </template>
      <el-upload
        class="upload-area"
        drag
        :http-request="handleUpload"
        :show-file-list="false"
        accept=".pdf,.docx,.md,.txt"
        :disabled="uploading"
      >
        <div class="upload-content">
          <el-icon class="upload-icon" :class="{ 'is-loading': uploading }">
            <UploadFilled v-if="!uploading" />
            <Loading v-else />
          </el-icon>
          <div class="upload-text">
            <span v-if="!uploading">将文件拖到此处，或<em>点击上传</em></span>
            <span v-else>正在上传处理中...</span>
          </div>
          <div class="upload-tip">支持 PDF / DOCX / Markdown / TXT，单文件最大 20MB</div>
        </div>
      </el-upload>
    </el-card>

    <!-- 文档列表 -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon class="title-icon"><Folder /></el-icon>
            文档列表
          </span>
          <span class="card-desc">共 {{ docPagination.total }} 个文档</span>
        </div>
      </template>
      <el-table :data="documents" v-loading="docLoading" stripe style="width: 100%">
        <el-table-column prop="filename" label="文件名" min-width="200" show-overflow-tooltip />
        <el-table-column prop="fileType" label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.fileType || '--' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="chunkCount" label="分块数" width="90" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="uploadTime" label="上传时间" width="170" align="center">
          <template #default="{ row }">
            {{ row.uploadTime ? new Date(row.uploadTime).toLocaleString('zh-CN') : '--' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewChunks(row)">分块</el-button>
            <el-button type="warning" link size="small" @click="handleReprocess(row)">重处理</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap" v-if="docPagination.total > docPagination.size">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="docPagination.total"
          :page-size="docPagination.size"
          :current-page="docPagination.page"
          @current-change="handleDocPageChange"
        />
      </div>
    </el-card>

    <!-- 语义搜索 -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon class="title-icon"><Search /></el-icon>
            语义搜索
          </span>
          <span class="card-desc">基于向量相似度的知识检索</span>
        </div>
      </template>
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="输入问题或关键词进行语义搜索..."
          size="large"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button :loading="searching" @click="handleSearch" type="primary">搜索</el-button>
          </template>
        </el-input>
        <div class="search-options">
          <el-switch v-model="enableRerank" active-text="Rerank 精排" inactive-text="基础检索" />
          <span class="rerank-hint">{{ enableRerank ? '向量检索 + LLM 精排（更准确）' : '仅向量相似度排序' }}</span>
        </div>
      </div>
      <div class="search-results" v-if="searchResults.length > 0">
        <div class="result-card" v-for="(item, index) in searchResults" :key="index">
          <div class="result-header">
            <el-tag size="small" type="success" effect="dark">
              相似度 {{ (item.score * 100).toFixed(1) }}%
            </el-tag>
            <el-tag v-if="item.rerankScore" size="small" type="warning" effect="dark">
              Rerank {{ (item.rerankScore * 100).toFixed(1) }}%
            </el-tag>
            <span class="result-source">{{ item.filename || item.source || '未知来源' }}</span>
          </div>
          <div class="result-content">{{ item.content || item.text }}</div>
        </div>
      </div>
      <el-empty v-else-if="!searching && searchQuery && searchResults.length === 0" description="未找到相关内容" />
    </el-card>

    <!-- 分块预览对话框 -->
    <el-dialog
      v-model="chunkDialogVisible"
      :title="`分块预览 - ${currentDoc?.filename || ''}`"
      width="700px"
      destroy-on-close
    >
      <div v-loading="chunkLoading">
        <div class="chunk-list" v-if="chunks.length > 0">
          <div class="chunk-item" v-for="(chunk, index) in chunks" :key="index">
            <div class="chunk-header">
              <el-tag size="small">第 {{ (chunkPagination.page - 1) * chunkPagination.size + index + 1 }} 块</el-tag>
              <span class="chunk-tokens" v-if="chunk.tokenCount">{{ chunk.tokenCount }} tokens</span>
            </div>
            <div class="chunk-text">{{ chunk.content || chunk.text }}</div>
          </div>
        </div>
        <el-empty v-else description="暂无分块数据" />
      </div>
      <div class="pagination-wrap" v-if="chunkPagination.total > chunkPagination.size">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="chunkPagination.total"
          :page-size="chunkPagination.size"
          :current-page="chunkPagination.page"
          @current-change="handleChunkPageChange"
        />
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.rag-page {
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

.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  border-radius: 12px;
  border: 1px dashed #d8dde7;
  background: #fafbfd;
  transition: all 0.25s ease;
  padding: 40px 20px;
}

.upload-area :deep(.el-upload-dragger:hover) {
  border-color: #5b7cfa;
  background: rgba(91, 124, 250, 0.03);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-icon {
  font-size: 36px;
  color: #b8bdc7;
}

.upload-icon.is-loading {
  color: #5b7cfa;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.upload-text {
  font-size: 15px;
  color: #606266;
}

.upload-text em {
  color: #409eff;
  font-style: normal;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.search-bar {
  margin-bottom: 20px;
}

.search-options {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}

.rerank-hint {
  font-size: 12px;
  color: #909399;
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-card {
  padding: 16px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f8faff 0%, #f0f5ff 100%);
  border: 1px solid #e8edf5;
  transition: box-shadow 0.2s ease;
}

.result-card:hover {
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.result-source {
  font-size: 12px;
  color: #909399;
}

.result-content {
  font-size: 14px;
  color: #303133;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.chunk-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;
}

.chunk-item {
  padding: 14px;
  border-radius: 8px;
  background: #f9fafb;
  border: 1px solid #ebeef5;
}

.chunk-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.chunk-tokens {
  font-size: 12px;
  color: #909399;
}

.chunk-text {
  font-size: 13px;
  color: #303133;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 768px) {
  .rag-page {
    gap: 14px;
  }

  .upload-area :deep(.el-upload-dragger) {
    padding: 24px 12px;
  }

  .upload-icon {
    font-size: 36px;
  }

  .card-header {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
