import type { CreateOrderRequest, UploadImageRequest, ApiResponse, SiteConfig } from '@/types/api'
import { findSiteConfigByCode } from '../config/siteConfigs'

class ApiService {
    private currentConfig: SiteConfig | null = null

    // 获取基础 URL
    private getBaseUrl(): string {
        // 根据你的重定向配置，使用 /api 作为代理路径
        // /api/* 会被重定向到 https://ets.lhsr.sh.gov.cn/:splat
        return '/api'
    }

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

    // MD5 加密
    private md5(content: string): string {
        return btoa(unescape(encodeURIComponent(content))).replace(/=/g, '')
    }

    // 构建完整的 API URL
    private buildUrl(apiPath: string): string {
        if (!this.currentConfig) throw new Error('未设置站点配置')
        const timestamp = Math.floor(Date.now() / 1000).toString()
        const signature = this.generateSignature(timestamp)
        const baseUrl = this.getBaseUrl()

        // 根据你的重定向规则：
        // /api/shcws/... 会被重定向到 https://ets.lhsr.sh.gov.cn/shcws/...
        return `${baseUrl}/shcws${apiPath}?app_key=${this.currentConfig.appKey}&sign=${signature}&timestamp=${timestamp}&v=1`
    }

    // 创建订单（工地）
    async createOrder(orderData: CreateOrderRequest): Promise<ApiResponse> {
        if (!this.currentConfig) throw new Error('请先设置站点配置')

        const url = this.buildUrl('/api/cws-plstb/threeBill/createBill')
        console.log('创建订单 URL:', url)

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            })

            console.log('响应状态:', response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
            }

            return await response.json()
        } catch (error) {
            console.error('创建订单失败:', error)
            throw error
        }
    }

    // 消费订单（卸载点）
    async consumeOrder(orderData: CreateOrderRequest): Promise<ApiResponse> {
        if (!this.currentConfig) throw new Error('请先设置站点配置')

        const url = this.buildUrl('/api/cws-plstb/threeBill/consumeBill')
        console.log('消费订单 URL:', url)

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            })

            console.log('响应状态:', response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
            }

            return await response.json()
        } catch (error) {
            console.error('消费订单失败:', error)
            throw error
        }
    }

    // 上传图片
    async uploadImage(uploadData: UploadImageRequest): Promise<ApiResponse> {
        if (!this.currentConfig) throw new Error('请先设置站点配置')

        const url = this.buildUrl('/api/cws-plstb/threeBill/uploadImg')
        console.log('上传图片 URL:', url)

        try {
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

            console.log('上传图片响应状态:', response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
            }

            return await response.json()
        } catch (error) {
            console.error('上传图片失败:', error)
            throw error
        }
    }
}

export const apiService = new ApiService()
