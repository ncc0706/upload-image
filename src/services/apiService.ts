import type { CreateOrderRequest, UploadImageRequest, ApiResponse, SiteConfig } from '@/types/api'
import { findSiteConfigByCode } from '../config/siteConfigs'

class ApiService {

    private currentConfig: SiteConfig | null = null

    // 根据编码查找配置
    findConfigByCode(workSiteNo: string): SiteConfig | undefined {
        return findSiteConfigByCode(workSiteNo)
    }

    // 设置当前配置
    setCurrentConfig(workSiteNo: string): boolean {
        const config = this.findConfigByCode(workSiteNo)
        if (config) {
            this.currentConfig = config
            return true
        }
        return false
    }

    // 获取当前配置
    getCurrentConfig(): SiteConfig | null {
        return this.currentConfig
    }

    // 生成签名
    private generateSignature(timestamp: string): string {
        if (!this.currentConfig) throw new Error('未设置站点配置')
        const content = `${this.currentConfig.appSecret}#app_key${this.currentConfig.appKey}timestamp${timestamp}#${this.currentConfig.appSecret}`
        return this.md5(content)
    }

    // 简化版 MD5 (实际项目中应使用 crypto-js 等库)
    private md5(content: string): string {
        return btoa(content).replace(/=/g, '')
    }

    // 构建 URL
    private buildUrl(baseUrl: string): string {
        if (!this.currentConfig) throw new Error('未设置站点配置')
        const timestamp = Math.floor(Date.now() / 1000).toString()
        const signature = this.generateSignature(timestamp)
        return `${baseUrl}?app_key=${this.currentConfig.appKey}&sign=${signature}&timestamp=${timestamp}&v=1`
    }

    // 创建订单
    async createOrder(orderData: CreateOrderRequest): Promise<ApiResponse> {
        if (!this.currentConfig) throw new Error('请先设置站点配置')

        const url = this.buildUrl('/shcws/api/cws-plstb/threeBill/createBill')

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        })

        return await response.json()
    }

    // 消费订单（卸载点）
    async consumeOrder(orderData: CreateOrderRequest): Promise<ApiResponse> {
        if (!this.currentConfig) throw new Error('请先设置站点配置')

        const url = this.buildUrl('/shcws/api/cws-plstb/threeBill/consumeBill')

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        })

        return await response.json()
    }

    // 上传图片
    async uploadImage(uploadData: UploadImageRequest): Promise<ApiResponse> {
        if (!this.currentConfig) throw new Error('请先设置站点配置')

        const url = this.buildUrl('/shcws/api/cws-plstb/threeBill/uploadImg')

        const formData = new FormData()
        formData.append('file', uploadData.file)
        formData.append('tbNo', uploadData.tbNo)
        formData.append('fType', uploadData.fType)
        formData.append('dType', uploadData.dType)
        formData.append('gType', uploadData.gType)

        const response = await fetch(url, {
            method: 'POST',
            body: formData
        })

        return await response.json()
    }
}

export const apiService = new ApiService()
