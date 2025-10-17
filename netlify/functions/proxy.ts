import fetch from 'node-fetch'
import type { Handler } from '@netlify/functions'

export const handler: Handler = async (event) => {
    // 解析查询参数
    const target = event.queryStringParameters?.target
    const appKey = event.queryStringParameters?.app_key
    const sign = event.queryStringParameters?.sign
    const timestamp = event.queryStringParameters?.timestamp
    const v = event.queryStringParameters?.v

    if (!target) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing target parameter' })
        }
    }

    try {
        // 构建目标 URL
        const targetUrl = new URL(target)
        if (appKey) targetUrl.searchParams.append('app_key', appKey)
        if (sign) targetUrl.searchParams.append('sign', sign)
        if (timestamp) targetUrl.searchParams.append('timestamp', timestamp)
        if (v) targetUrl.searchParams.append('v', v)

        // 转发请求
        const response = await fetch(targetUrl.toString(), {
            method: event.httpMethod,
            headers: {
                'Content-Type': event.headers['content-type'] || 'application/json',
            },
            body: event.httpMethod !== 'GET' ? event.body : undefined
        })

        const data = await response.text()

        return {
            statusCode: response.status,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            body: data
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })
        }
    }
}
