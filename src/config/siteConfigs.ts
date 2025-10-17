import type {SiteConfig} from '../types/api'

// 硬编码的站点配置
export const SITE_CONFIGS: SiteConfig[] = [
    {
        workSiteNo: 'GD202501038',
        appKey: '40d91d71-af85-4477-8a60-48be23639ea9',
        appSecret: 'CyCfOjjFixBjnU7apOlxluBUMSYKxvp4ZkgNzv3sp2m3v4sfT4DpYqBFEp51oyTq'
    },
    {
        workSiteNo: 'GD202501039',
        appKey: '40d91d71-af85-4477-8a60-48be23639ea9',
        appSecret: 'CyCfOjjFixBjnU7apOlxluBUMSYKxvp4ZkgNzv3sp2m3v4sfT4DpYqBFEp51oyTq'
    }
]

// 根据站点编码查找配置
export const findSiteConfigByCode = (workSiteNo: string): SiteConfig | undefined => {
    return SITE_CONFIGS.find(config => config.workSiteNo === workSiteNo)
}

// 获取所有站点编码列表（用于验证或下拉菜单）
export const getSiteCodes = (): string[] => {
    return SITE_CONFIGS.map(config => config.workSiteNo)
}
