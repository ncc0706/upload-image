<template>
  <div class="order-create">
    <h2>订单创建与图片上传</h2>

    <div class="input-group">
      <label>站点编码:</label>
      <input v-model="siteCode" placeholder="请输入站点编码" @change="validateSiteCode">
      <span v-if="siteCodeError" class="error">{{ siteCodeError }}</span>
    </div>

    <div class="input-group">
      <label>车牌号:</label>
      <input v-model="formData.plateNumber" placeholder="请输入车牌号">
    </div>

    <div class="input-group">
      <label>车牌颜色:</label>
      <input v-model="formData.plateNumColor" placeholder="请输入车牌颜色">
    </div>

    <div class="input-group">
      <label>方向:</label>
      <select v-model="formData.direction">
        <option value="1">进站</option>
        <option value="2">出站</option>
      </select>
    </div>

    <div class="input-group">
      <label>工地类型:</label>
      <select v-model="formData.workType">
        <option value="1">工地</option>
        <option value="3">卸载点</option>
      </select>
    </div>

    <div class="input-group">
      <label>低位图片:</label>
      <input type="file" @change="onLowImageChange" accept="image/*">
    </div>

    <div class="input-group">
      <label>高位图片:</label>
      <input type="file" @change="onHighImageChange" accept="image/*">
    </div>

    <button @click="createOrder" :disabled="!siteCodeValid || loading">
      {{ loading ? '处理中...' : '创建订单并上传图片' }}
    </button>

    <div class="results">
      <div class="result-section">
        <h3>创建订单结果:</h3>
        <pre>{{ orderResult }}</pre>
      </div>

      <div class="result-section">
        <h3>上传图片结果:</h3>
        <pre>{{ uploadResult }}</pre>
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
  if (!siteCode.value) {
    siteCodeError.value = '请输入站点编码'
    siteCodeValid.value = false
    return
  }

  const isValid = apiService.setCurrentConfig(siteCode.value)
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

  try {
    // 创建订单
    const currentTime = new Date().toISOString().replace('T', ' ').split('.')[0]
    const config = apiService.getCurrentConfig()

    const orderData = {
      plateNumber: formData.value.plateNumber,
      doorNo: '1号门',
      platenumcolor: formData.value.plateNumColor,
      ...(formData.value.workType === '1' ? {
        outWorkSiteDate: currentTime,
        workSiteNo: config?.code,
        dType: parseInt(formData.value.direction)
      } : {
        inDisposalDate: currentTime,
        disposalNo: config?.code
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

  } catch (error) {
    orderResult.value = `错误: ${error instanceof Error ? error.message : '未知错误'}`
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.order-create {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.input-group {
  margin: 15px 0;
}

.input-group label {
  display: inline-block;
  width: 100px;
}

.error {
  color: red;
  margin-left: 10px;
}

.results {
  margin-top: 30px;
}

.result-section {
  margin: 20px 0;
}

pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 5px;
  overflow-x: auto;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
