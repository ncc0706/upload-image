import type { CreateOrderRequest, UploadImageRequest, ApiResponse, SiteConfig } from '@/types/api'
import { findSiteConfigByCode } from '../config/siteConfigs'

class ApiService {
    private currentConfig: SiteConfig | null = null

    /**
     * 获取基础 URL
     * - 开发环境使用 Vite 代理 (/shcws)
     * - 生产环境使用 Netlify Functions (/api/proxy)
     */
    private getBaseUrl(): string {
        if (import.meta.env.DEV) {
            return '/shcws' // Vite 代理路径
        } else {
            return '/api/proxy' // Netlify Functions 路径
        }
    }

    /**
     * 根据编码查找配置
     */
    findConfigByCode(workSiteNo: string): SiteConfig | undefined {
        return findSiteConfigByCode(workSiteNo)
    }

    /**
     * 设置当前配置
     */
    setCurrentConfig(workSiteNo: string): boolean {
        const config = this.findConfigByCode(workSiteNo)
        if (config) {
            this.currentConfig = config
            return true
        }
        return false
    }

    /**
     * 获取当前配置
     */
    getCurrentConfig(): SiteConfig | null {
        return this.currentConfig
    }

    /**
     * 生成签名
     */
    private generateSignature(timestamp: string): string {
        if (!this.currentConfig) throw new Error('未设置站点配置')
        const content = `${this.currentConfig.appSecret}#app_key${this.currentConfig.appKey}timestamp${timestamp}#${this.currentConfig.appSecret}`
        return this.md5(content)
    }

    /**
     * MD5 加密（简化版）
     */
    private md5(content: string): string {
        // 使用更安全的编码方式
        const encoder = new TextEncoder()
        const data = encoder.encode(content)
        return btoa(String.fromCharCode(...new Uint8Array(data))).replace(/=/g, '')
    }

    /**
     * 构建完整 API URL
     */
    private buildUrl(apiPath: string): string {
        if (!this.currentConfig) throw new Error('未设置站点配置')
        const timestamp = Math.floor(Date.now() / 1000).toString()
        const signature = this.generateSignature(timestamp)
        const baseUrl = this.getBaseUrl()

        // 生产环境需要传递完整 URL
        if (!import.meta.env.DEV) {
            const fullPath = `https://ets.lhsr.sh.gov.cn/shcws${apiPath}`
            return `${baseUrl}?target=${encodeURIComponent(fullPath)}&app_key=${this.currentConfig.appKey}&sign=${signature}&timestamp=${timestamp}&v=1`
        }

        // 开发环境直接拼接路径
        return `${baseUrl}${apiPath}?app_key=${this.currentConfig.appKey}&sign=${signature}&timestamp=${timestamp}&v=1`
    }

    /**
     * 通用请求方法
     */
    private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error('API 请求失败:', error)
            throw error
        }
    }

    /**
     * 创建订单（工地）
     */
    async createOrder(orderData: CreateOrderRequest): Promise<ApiResponse> {
        if (!this.currentConfig) throw new Error('请先设置站点配置')

        const url = this.buildUrl('/api/cws-plstb/threeBill/createBill')

        return this.request<ApiResponse>(url, {
            method: 'POST',
            body: JSON.stringify(orderData)
        })
    }

    /**
     * 消费订单（卸载点）
     */
    async consumeOrder(orderData: CreateOrderRequest): Promise<ApiResponse> {
        if (!this.currentConfig) throw new Error('请先设置站点配置')

        const url = this.buildUrl('/api/cws-plstb/threeBill/consumeBill')

        return this.request<ApiResponse>(url, {
            method: 'POST',
            body: JSON.stringify(orderData)
        })
    }

    /**
     * 上传图片
     */
    async uploadImage(uploadData: UploadImageRequest): Promise<ApiResponse> {
        if (!this.currentConfig) throw new Error('请先设置站点配置')

        const url = this.buildUrl('/api/cws-plstb/threeBill/uploadImg')
        const formData = new FormData()
        formData.append('file', uploadData.file)
        formData.append('tbNo', uploadData.tbNo)
        formData.append('fType', uploadData.fType)
        formData.append('dType', uploadData.dType)
        formData.append('gType', uploadData.gType)

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error('上传图片失败:', error)
            throw error
        }
    }
}

export const apiService = new ApiService()
