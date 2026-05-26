<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UserFilled, Plus } from '@element-plus/icons-vue'
import {
  listPersonasApi,
  createPersonaApi,
  updatePersonaApi,
  activatePersonaApi,
  deletePersonaApi
} from '@/api/persona'

// 人设列表
const personas = ref([])
const loading = ref(false)

// 对话框
const dialogVisible = ref(false)
const dialogMode = ref('create') // create | edit
const saving = ref(false)

// 表单
const form = ref({
  id: null,
  name: '',
  content: '',
  description: ''
})

// 加载人设列表
const loadPersonas = async () => {
  loading.value = true
  try {
    const res = await listPersonasApi()
    personas.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.warn('[Persona] 加载人设列表失败:', error)
    personas.value = []
  } finally {
    loading.value = false
  }
}

// 打开新建对话框
const handleCreate = () => {
  dialogMode.value = 'create'
  form.value = { id: null, name: '', content: '', description: '' }
  dialogVisible.value = true
}

// 打开编辑对话框
const handleEdit = (row) => {
  dialogMode.value = 'edit'
  form.value = {
    id: row.id,
    name: row.name,
    content: row.content,
    description: row.description || ''
  }
  dialogVisible.value = true
}

// 保存人设
const handleSave = async () => {
  if (!form.value.name.trim()) {
    ElMessage.warning('请输入人设名称')
    return
  }
  if (!form.value.content.trim()) {
    ElMessage.warning('请输入人设内容')
    return
  }

  saving.value = true
  try {
    if (dialogMode.value === 'create') {
      await createPersonaApi({
        name: form.value.name,
        content: form.value.content,
        description: form.value.description || null
      })
      ElMessage.success('人设创建成功')
    } else {
      await updatePersonaApi(form.value.id, {
        name: form.value.name,
        content: form.value.content,
        description: form.value.description || null
      })
      ElMessage.success('人设更新成功')
    }
    dialogVisible.value = false
    await loadPersonas()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// 激活人设
const handleActivate = (row) => {
  if (row.isActive) return
  ElMessageBox.confirm(
    `确定切换到人设「${row.name}」吗？切换后下次对话将使用新人设。`,
    '确认激活',
    { confirmButtonText: '激活', cancelButtonText: '取消', type: 'info' }
  ).then(async () => {
    try {
      await activatePersonaApi(row.id)
      ElMessage.success(`已激活人设「${row.name}」`)
      await loadPersonas()
    } catch (error) {
      ElMessage.error(error.message || '激活失败')
    }
  }).catch(() => {})
}

// 删除人设
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定删除人设「${row.name}」吗？删除后不可恢复。`,
    '确认删除',
    { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      await deletePersonaApi(row.id)
      ElMessage.success('删除成功')
      await loadPersonas()
    } catch (error) {
      ElMessage.error(error.message || '删除失败')
    }
  }).catch(() => {})
}

onMounted(loadPersonas)
</script>

<template>
  <div class="persona-page">
    <!-- 人设列表 -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon class="title-icon"><UserFilled /></el-icon>
            人设管理
          </span>
          <span class="card-desc">管理亚托莉的 AI 人设配置，可创建多个人设并随时切换</span>
        </div>
        <el-button type="primary" :icon="Plus" @click="handleCreate" style="margin-top: 12px">
          新建人设
        </el-button>
      </template>

      <el-table
        :data="personas"
        v-loading="loading"
        stripe
        highlight-current-row
        style="width: 100%"
      >
        <el-table-column prop="name" label="人设名称" min-width="150">
          <template #default="{ row }">
            <div class="name-cell">
              <span>{{ row.name }}</span>
              <el-tag v-if="row.isActive" type="success" size="small" effect="dark" style="margin-left: 8px">
                当前激活
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="content" label="内容预览" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="content-preview">{{ row.content?.substring(0, 80) }}...</span>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="180">
          <template #default="{ row }">
            {{ row.updateTime?.replace('T', ' ').substring(0, 19) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="!row.isActive"
              type="success"
              link
              size="small"
              @click="handleActivate(row)"
            >
              激活
            </el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              @click="handleDelete(row)"
              :disabled="row.isActive"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新建人设' : '编辑人设'"
      width="700px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form label-position="top" :model="form">
        <el-form-item label="人设名称" required>
          <el-input v-model="form.name" placeholder="例如：亚托莉（ATRI）" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" placeholder="简要描述这个人设的用途" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="人设提示词（System Prompt）" required>
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="20"
            placeholder="请输入完整的人设系统提示词..."
            style="font-family: monospace"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ dialogMode === 'create' ? '创建' : '保存' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.persona-page {
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

.name-cell {
  display: flex;
  align-items: center;
}

.content-preview {
  color: #909399;
  font-size: 13px;
}

@media (max-width: 768px) {
  .persona-page {
    gap: 12px;
  }
}
</style>
