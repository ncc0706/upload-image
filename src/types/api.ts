export interface SiteConfig {
    appKey: string
    appSecret: string
    workSiteNo: string
}

export interface CreateOrderRequest {
    plateNumber: string
    outWorkSiteDate?: string
    inDisposalDate?: string
    workSiteNo?: string
    disposalNo?: string
    doorNo: string
    platenumcolor: string
    dType?: number
}

export interface UploadImageRequest {
    tbNo: string
    fType: string
    dType: string
    gType: string
    file: File
}

export interface ApiResponse {
    code: number
    message: string
    data?: any
}
