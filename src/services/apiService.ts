import type { CreateOrderRequest, UploadImageRequest, ApiResponse, SiteConfig } from '@/types/api'
import { findSiteConfigByCode } from '../config/siteConfigs'

class ApiService {
    private currentConfig: SiteConfig | null = null

    // 基础URL仍为 /api（匹配Netlify代理规则）
    private getBaseUrl(): string {
        return '/api'
    }

    // 其他辅助方法（查找配置、设置配置等）保持不变
    findConfigByCode(workSiteNo: string): SiteConfig | undefined {
        return findSiteConfigByCode(workSiteNo)
    }

    setCurrentConfig(workSiteNo: string): boolean {
        const config = this.findConfigByCode(workSiteNo)
        if (config) {
            this.currentConfig = config
            return true
        }
        return false
    }

    getCurrentConfig(): SiteConfig | null {
        return this.currentConfig
    }

    // 签名生成和MD5方法保持不变
    private generateSignature(timestamp: string): string {
        if (!this.currentConfig) throw new Error('未设置站点配置')
        const content = `${this.currentConfig.appSecret}#app_key${this.currentConfig.appKey}timestamp${timestamp}#${this.currentConfig.appSecret}`
        return this.md5(content)
    }

    private md5(content: string): string {
        return btoa(unescape(encodeURIComponent(content))).replace(/=/g, '')
    }

    // 构建URL：核心修正路径拼接，确保保留 /shcws/api/ 层级
    private buildUrl(apiPath: string): string {
        if (!this.currentConfig) throw new Error('未设置站点配置')
        const timestamp = Math.floor(Date.now() / 1000).toString()
        const signature = this.generateSignature(timestamp)
        const baseUrl = this.getBaseUrl()

        // 拼接逻辑：/api（baseUrl） + /shcws + apiPath（包含/api/...）
        // 最终前端请求路径：/api/shcws/api/cws-plstb/threeBill/createBill?参数
        // 代理后后端路径：https://ets.lhsr.sh.gov.cn/shcws/api/cws-plstb/threeBill/createBill?参数（完全匹配实际地址）
        return `${baseUrl}/shcws${apiPath}?app_key=${this.currentConfig.appKey}&sign=${signature}&timestamp=${timestamp}&v=1`
    }

    // 创建订单：apiPath包含 /api 层级，匹配后端实际路径
    async createOrder(orderData: CreateOrderRequest): Promise<ApiResponse> {
        if (!this.currentConfig) throw new Error('请先设置站点配置')

        // apiPath明确包含 /api，确保拼接后为 /shcws/api/...
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

    // 消费订单：同步保留 /api 层级
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

    // 上传图片：同步保留 /api 层级
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
                body: formData // FormData自动处理Content-Type，无需手动设置
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
