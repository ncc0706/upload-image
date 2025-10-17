<template>
  <div class="order-create">
    <header class="header">
      <h1>订单创建与图片上传系统</h1>
      <p class="subtitle">创建运输订单并上传相关图片</p>
    </header>

    <div class="main-container">
      <!-- 左侧表单区域 -->
      <div class="form-section">
        <div class="form-card">
          <h2 class="section-title">订单信息</h2>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">站点编码</label>
              <input
                  v-model="siteCode"
                  class="form-input"
                  placeholder="请输入站点编码"
                  @blur="validateSiteCode"
              >
              <div class="validation-message">
                <span v-if="siteCodeError" class="error-text">{{ siteCodeError }}</span>
                <span v-else-if="siteCodeValid" class="success-text">✓ 编码有效</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">车牌号</label>
              <input
                  v-model="formData.plateNumber"
                  class="form-input"
                  placeholder="请输入车牌号"
              >
            </div>

            <div class="form-group">
              <label class="form-label">车牌颜色</label>
              <input
                  v-model="formData.plateNumColor"
                  class="form-input"
                  placeholder="请输入车牌颜色"
              >
            </div>

            <div class="form-group">
              <label class="form-label">方向</label>
              <select v-model="formData.direction" class="form-select">
                <option value="1">进站</option>
                <option value="2">出站</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">工地类型</label>
              <select v-model="formData.workType" class="form-select">
                <option value="1">工地</option>
                <option value="3">卸载点</option>
              </select>
            </div>

            <div class="form-group full-width">
              <label class="form-label">低位图片</label>
              <div class="file-upload-area">
                <input
                    type="file"
                    class="file-input"
                    @change="onLowImageChange"
                    accept="image/*"
                >
                <div class="file-placeholder" :class="{ 'has-file': lowImage }">
                  <span v-if="!lowImage" class="file-text">点击选择低位图片</span>
                  <span v-else class="file-text success">✓ {{ lowImage.name }}</span>
                </div>
              </div>
            </div>

            <div class="form-group full-width">
              <label class="form-label">高位图片</label>
              <div class="file-upload-area">
                <input
                    type="file"
                    class="file-input"
                    @change="onHighImageChange"
                    accept="image/*"
                >
                <div class="file-placeholder" :class="{ 'has-file': highImage }">
                  <span v-if="!highImage" class="file-text">点击选择高位图片</span>
                  <span v-else class="file-text success">✓ {{ highImage.name }}</span>
                </div>
              </div>
            </div>
          </div>

          <button
              @click="createOrder"
              :disabled="!siteCodeValid || loading"
              class="submit-btn"
          >
            <span v-if="loading" class="loading-spinner">⏳</span>
            {{ loading ? '处理中...' : '创建订单并上传图片' }}
          </button>
        </div>
      </div>

      <!-- 右侧结果区域 -->
      <div class="result-section">
        <div class="result-card">
          <h2 class="section-title">操作结果</h2>

          <div class="result-tabs">
            <button
                class="tab-btn"
                :class="{ active: activeTab === 'order' }"
                @click="activeTab = 'order'"
            >
              订单结果
            </button>
            <button
                class="tab-btn"
                :class="{ active: activeTab === 'upload' }"
                @click="activeTab = 'upload'"
            >
              上传结果
            </button>
          </div>

          <div class="result-content">
            <div v-if="activeTab === 'order'" class="tab-panel">
              <h3>创建订单结果</h3>
              <div class="result-display">
                <pre v-if="orderResult">{{ orderResult }}</pre>
                <p v-else class="no-data">暂无订单结果</p>
              </div>
            </div>

            <div v-if="activeTab === 'upload'" class="tab-panel">
              <h3>上传图片结果</h3>
              <div class="result-display">
                <pre v-if="uploadResult">{{ uploadResult }}</pre>
                <p v-else class="no-data">暂无上传结果</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { apiService } from '../services/apiService'

const siteCode = ref('')
const siteCodeError = ref('')
const siteCodeValid = ref(false)
const activeTab = ref('order')

const formData = ref({
  plateNumber: '沪FR1392',
  plateNumColor: '黄色',
  direction: '1',
  workType: '1'
})

const lowImage = ref<File | null>(null)
const highImage = ref<File | null>(null)
const orderResult = ref('')
const uploadResult = ref('')
const loading = ref(false)

const validateSiteCode = () => {
  if (!siteCode.value.trim()) {
    siteCodeError.value = '请输入站点编码'
    siteCodeValid.value = false
    return
  }

  const isValid = apiService.setCurrentConfig(siteCode.value.trim())
  if (!isValid) {
    siteCodeError.value = '无效的站点编码'
    siteCodeValid.value = false
  } else {
    siteCodeError.value = ''
    siteCodeValid.value = true
  }
}

const onLowImageChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) lowImage.value = file
}

const onHighImageChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) highImage.value = file
}

const createOrder = async () => {
  if (!siteCodeValid.value) {
    alert('请先输入有效的站点编码')
    return
  }

  loading.value = true
  orderResult.value = ''
  uploadResult.value = ''
  activeTab.value = 'order'

  try {
    const currentTime = new Date().toISOString().replace('T', ' ').split('.')[0]
    const config = apiService.getCurrentConfig()

    const orderData = {
      plateNumber: formData.value.plateNumber,
      doorNo: '1号门',
      platenumcolor: formData.value.plateNumColor,
      ...(formData.value.workType === '1' ? {
        outWorkSiteDate: currentTime,
        workSiteNo: config?.workSiteNo,
        dType: parseInt(formData.value.direction)
      } : {
        inDisposalDate: currentTime,
        disposalNo: config?.workSiteNo
      })
    }

    const orderResponse = formData.value.workType === '1'
        ? await apiService.createOrder(orderData)
        : await apiService.consumeOrder(orderData)

    orderResult.value = JSON.stringify(orderResponse, null, 2)

    if (orderResponse.code !== 200 || !orderResponse.data?.tbNo) {
      throw new Error(orderResponse.message || '创建订单失败')
    }

    const tbNo = orderResponse.data.tbNo

    // 上传图片
    const uploadPromises = []

    if (lowImage.value) {
      uploadPromises.push(
          apiService.uploadImage({
            tbNo,
            fType: formData.value.workType,
            dType: formData.value.direction,
            gType: '1',
            file: lowImage.value
          }).then(response => ({
            location: '低位',
            response
          }))
      )
    }

    if (highImage.value) {
      uploadPromises.push(
          apiService.uploadImage({
            tbNo,
            fType: formData.value.workType,
            dType: formData.value.direction,
            gType: '2',
            file: highImage.value
          }).then(response => ({
            location: '高位',
            response
          }))
      )
    }

    const uploadResults = await Promise.all(uploadPromises)
    uploadResult.value = uploadResults.map(result =>
        `${result.location}图片上传结果:\n${JSON.stringify(result.response, null, 2)}`
    ).join('\n\n')

    // 如果有上传结果，切换到上传标签页
    if (uploadResults.length > 0) {
      activeTab.value = 'upload'
    }

  } catch (error) {
    orderResult.value = `错误: ${error instanceof Error ? error.message : '未知错误'}`
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.order-create {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 0;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 20px;
  text-align: center;
}

.header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 10px 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 0;
}

.main-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  max-width: 1400px;
  margin: -40px auto 0;
  padding: 0 20px 40px;
  position: relative;
}

.form-section, .result-section {
  display: flex;
  flex-direction: column;
}

.form-card, .result-card {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  height: fit-content;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e2e8f0;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-label {
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.form-input, .form-select {
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.validation-message {
  min-height: 20px;
  margin-top: 5px;
}

.error-text {
  color: #e53e3e;
  font-size: 0.875rem;
}

.success-text {
  color: #38a169;
  font-size: 0.875rem;
}

.file-upload-area {
  position: relative;
}

.file-input {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.file-placeholder {
  padding: 20px;
  border: 2px dashed #cbd5e0;
  border-radius: 8px;
  text-align: center;
  color: #718096;
  transition: all 0.3s ease;
  background: #fafafa;
}

.file-placeholder:hover {
  border-color: #667eea;
  background: #f7faff;
}

.file-placeholder.has-file {
  border-color: #48bb78;
  background: #f0fff4;
}

.file-text {
  font-size: 1rem;
}

.file-text.success {
  color: #48bb78;
  font-weight: 500;
}

.submit-btn {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 16px;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.submit-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 结果区域样式 */
.result-tabs {
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 20px;
}

.tab-btn {
  padding: 12px 24px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: #718096;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
}

.tab-btn.active {
  color: #667eea;
  border-bottom-color: #667eea;
  font-weight: 600;
}

.tab-btn:hover {
  color: #667eea;
}

.tab-panel h3 {
  font-size: 1.2rem;
  color: #4a5568;
  margin-bottom: 15px;
}

.result-display {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
}

.result-display pre {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', monospace;
}

.no-data {
  color: #a0aec0;
  font-style: italic;
  text-align: center;
  margin: 0;
  padding: 40px 0;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .main-container {
    grid-template-columns: 1fr;
    gap: 20px;
    margin-top: -20px;
  }

  .header {
    padding: 30px 20px;
  }

  .header h1 {
    font-size: 2rem;
  }
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .form-card, .result-card {
    padding: 20px;
  }

  .header h1 {
    font-size: 1.8rem;
  }

  .subtitle {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .main-container {
    padding: 0 15px 20px;
  }

  .header {
    padding: 25px 15px;
  }

  .header h1 {
    font-size: 1.5rem;
  }

  .form-card, .result-card {
    padding: 15px;
    border-radius: 8px;
  }

  .section-title {
    font-size: 1.3rem;
  }
}

/* 滚动条样式 */
.result-display::-webkit-scrollbar {
  width: 6px;
}

.result-display::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.result-display::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.result-display::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
