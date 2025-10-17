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

          <div class="form-content">
            <!-- 站点编码 -->
            <div class="form-row">
              <div class="form-item">
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
            </div>

            <!-- 车牌信息 -->
            <div class="form-row">
              <div class="form-item">
                <label class="form-label">车牌号</label>
                <input
                    v-model="formData.plateNumber"
                    class="form-input"
                    placeholder="请输入车牌号"
                >
              </div>
              <div class="form-item">
                <label class="form-label">车牌颜色</label>
                <input
                    v-model="formData.plateNumColor"
                    class="form-input"
                    placeholder="请输入车牌颜色"
                >
              </div>
            </div>

            <!-- 方向选择 -->
            <div class="form-row">
              <div class="form-item">
                <label class="form-label">方向</label>
                <select v-model="formData.direction" class="form-select">
                  <option value="1">进站</option>
                  <option value="2">出站</option>
                </select>
              </div>
              <div class="form-item">
                <label class="form-label">工地类型</label>
                <select v-model="formData.workType" class="form-select">
                  <option value="1">工地</option>
                  <option value="3">卸载点</option>
                </select>
              </div>
            </div>

            <!-- 图片上传 -->
            <div class="form-row">
              <div class="form-item full-width">
                <label class="form-label">低位图片</label>
                <div class="file-upload-area">
                  <input
                      type="file"
                      class="file-input"
                      @change="onLowImageChange"
                      accept="image/*"
                      ref="lowImageInput"
                  >
                  <div class="file-placeholder" :class="{ 'has-file': lowImage }" @click="triggerLowImageInput">
                    <span v-if="!lowImage" class="file-text">点击选择低位图片</span>
                    <span v-else class="file-text success">✓ {{ lowImage.name }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-item full-width">
                <label class="form-label">高位图片</label>
                <div class="file-upload-area">
                  <input
                      type="file"
                      class="file-input"
                      @change="onHighImageChange"
                      accept="image/*"
                      ref="highImageInput"
                  >
                  <div class="file-placeholder" :class="{ 'has-file': highImage }" @click="triggerHighImageInput">
                    <span v-if="!highImage" class="file-text">点击选择高位图片</span>
                    <span v-else class="file-text success">✓ {{ highImage.name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="submit-section">
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
              <h3 class="result-title">创建订单结果</h3>
              <div class="result-display">
                <pre v-if="orderResult">{{ orderResult }}</pre>
                <p v-else class="no-data">暂无订单结果</p>
              </div>
            </div>

            <div v-if="activeTab === 'upload'" class="tab-panel">
              <h3 class="result-title">上传图片结果</h3>
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

// 文件输入框的引用
const lowImageInput = ref<HTMLInputElement>()
const highImageInput = ref<HTMLInputElement>()

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

// 触发文件选择器
const triggerLowImageInput = () => {
  lowImageInput.value?.click()
}

const triggerHighImageInput = () => {
  highImageInput.value?.click()
}

const onLowImageChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    lowImage.value = file
    console.log('低位图片已选择:', file.name, file.size, file.type)
  }
}

const onHighImageChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    highImage.value = file
    console.log('高位图片已选择:', file.name, file.size, file.type)
  }
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

    if (!config) {
      throw new Error('站点配置获取失败')
    }

    const orderData = {
      plateNumber: formData.value.plateNumber,
      doorNo: '1号门',
      platenumcolor: formData.value.plateNumColor,
      ...(formData.value.workType === '1' ? {
        outWorkSiteDate: currentTime,
        workSiteNo: config.workSiteNo,
        dType: parseInt(formData.value.direction)
      } : {
        inDisposalDate: currentTime,
        disposalNo: config.workSiteNo
      })
    }

    console.log('创建订单请求数据:', orderData)

    const orderResponse = formData.value.workType === '1'
        ? await apiService.createOrder(orderData)
        : await apiService.consumeOrder(orderData)

    console.log('创建订单响应:', orderResponse)
    orderResult.value = JSON.stringify(orderResponse, null, 2)

    if (orderResponse.code !== 200 || !orderResponse.data?.tbNo) {
      throw new Error(orderResponse.message || '创建订单失败')
    }

    const tbNo = orderResponse.data.tbNo
    console.log('订单号:', tbNo)

    // 上传图片
    const uploadPromises = []

    if (lowImage.value) {
      console.log('开始上传低位图片...')
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
      console.log('开始上传高位图片...')
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

    if (uploadPromises.length > 0) {
      console.log('等待图片上传完成...')
      const uploadResults = await Promise.all(uploadPromises)
      console.log('图片上传结果:', uploadResults)
      uploadResult.value = uploadResults.map(result =>
          `${result.location}图片上传结果:\n${JSON.stringify(result.response, null, 2)}`
      ).join('\n\n')
    } else {
      uploadResult.value = '未选择图片，跳过上传步骤'
    }

    // 如果有上传结果，切换到上传标签页
    if (uploadPromises.length > 0) {
      activeTab.value = 'upload'
    }

  } catch (error) {
    console.error('操作失败:', error)
    orderResult.value = `错误: ${error instanceof Error ? error.message : '未知错误'}`
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.order-create {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 20px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.header h1 {
  font-size: 2.2rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  letter-spacing: 0.5px;
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
  font-weight: 300;
}

.main-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  max-width: 1200px;
  margin: -30px auto 0;
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
  border: 1px solid #e8ecef;
}

.section-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #eaeff2;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.form-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.form-item.full-width {
  flex: 1 1 100%;
}

.form-label {
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 8px;
  font-size: 0.95rem;
  display: block;
}

.form-input, .form-select {
  padding: 12px 16px;
  border: 1px solid #d1d9e0;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
  width: 100%;
  box-sizing: border-box;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.15);
  border-width: 1px;
}

.form-input:hover, .form-select:hover {
  border-color: #a0aec0;
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234a5568' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 14px;
  padding-right: 40px;
}

.validation-message {
  min-height: 20px;
  margin-top: 6px;
}

.error-text {
  color: #e53e3e;
  font-size: 0.85rem;
  font-weight: 500;
}

.success-text {
  color: #38a169;
  font-size: 0.85rem;
  font-weight: 500;
}

.file-upload-area {
  position: relative;
  width: 100%;
}

.file-input {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

.file-placeholder {
  padding: 14px 16px;
  border: 1px dashed #cbd5e0;
  border-radius: 6px;
  text-align: center;
  color: #718096;
  transition: all 0.2s ease;
  background: #fafafa;
  cursor: pointer;
  min-height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
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
  font-size: 0.95rem;
  font-weight: 500;
}

.file-text.success {
  color: #48bb78;
}

.submit-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eaeff2;
}

.submit-btn {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 8px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  letter-spacing: 0.5px;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.submit-btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
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
  background: #f8f9fa;
  border-radius: 6px 6px 0 0;
  padding: 4px;
}

.tab-btn {
  flex: 1;
  padding: 12px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  color: #718096;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-weight: 500;
}

.tab-btn.active {
  background: white;
  color: #667eea;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.tab-btn:hover {
  color: #667eea;
}

.result-content {
  min-height: 300px;
}

.tab-panel {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.result-title {
  font-size: 1.1rem;
  color: #4a5568;
  margin-bottom: 15px;
  font-weight: 600;
}

.result-display {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 20px;
  max-height: 350px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
}

.result-display pre {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Consolas', 'Monaco', monospace;
  color: #2d3748;
}

.no-data {
  color: #a0aec0;
  font-style: italic;
  text-align: center;
  margin: 0;
  padding: 60px 0;
  font-size: 0.95rem;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .main-container {
    grid-template-columns: 1fr;
    gap: 25px;
    margin-top: -25px;
    max-width: 800px;
  }

  .form-row {
    flex-direction: column;
    gap: 15px;
  }

  .form-item {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .main-container {
    padding: 0 15px 30px;
  }

  .header {
    padding: 30px 15px;
  }

  .header h1 {
    font-size: 1.8rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .form-card, .result-card {
    padding: 25px 20px;
    border-radius: 10px;
  }

  .section-title {
    font-size: 1.3rem;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 25px 12px;
  }

  .header h1 {
    font-size: 1.5rem;
  }

  .main-container {
    padding: 0 12px 25px;
  }

  .form-card, .result-card {
    padding: 20px 15px;
    border-radius: 8px;
  }

  .form-content {
    gap: 15px;
  }

  .form-row {
    gap: 12px;
  }
}

/* 滚动条优化 */
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

/* 防止文本溢出 */
.form-input, .form-select, .file-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 确保布局稳定 */
.form-item {
  min-height: 80px;
}

.validation-message {
  min-height: 20px;
}
</style>
