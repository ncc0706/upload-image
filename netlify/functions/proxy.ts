// netlify/functions/proxy.ts
import { HandlerEvent, HandlerResponse } from '@netlify/functions';
import fetch, { RequestInit } from 'node-fetch';

export const handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
    try {
        // 1. 解析请求参数（带类型校验）
        const { httpMethod, headers, body, path, queryStringParameters } = event;
        const splat = event.pathParameters?.splat; // 从路径参数中获取 /api/* 后的动态部分（可能为 undefined）

        if (!splat) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: '请求路径不完整，缺少后端路径' })
            };
        }

        // 2. 构建后端目标 URL（明确类型）
        const backendBaseUrl: string = 'https://ets.lhsr.sh.gov.cn';
        const backendUrl: string = `${backendBaseUrl}/${splat}`;

        // 3. 处理查询参数（如 ?app_key=xxx ）
        const queryParams: URLSearchParams = new URLSearchParams(queryStringParameters as Record<string, string>);
        const fullBackendUrl: string = queryParams.toString() ? `${backendUrl}?${queryParams.toString()}` : backendUrl;

        // 4. 配置转发请求的 headers（过滤 Netlify 内部头）
        const forwardHeaders: Record<string, string> = { ...headers } as Record<string, string>;
        delete forwardHeaders['host']; // 移除 Netlify 自动添加的 host 头（避免后端校验问题）
        delete forwardHeaders['x-nf-request-id']; // 移除 Netlify 内部标识头

        // 5. 配置 fetch 请求参数（带类型）
        const fetchOptions: RequestInit = {
            method: httpMethod,
            headers: forwardHeaders,
            body: httpMethod !== 'GET' && httpMethod !== 'HEAD' ? body : undefined, // GET/HEAD 请求无 body
            redirect: 'follow'
        };

        // 6. 转发请求到后端
        const response = await fetch(fullBackendUrl, fetchOptions);

        // 7. 处理后端响应（转换响应头为对象）
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });

        // 8. 添加 CORS 头并返回响应
        const responseBody = await response.text();
        return {
            statusCode: response.status,
            headers: {
                ...responseHeaders,
                'Access-Control-Allow-Origin': '*', // 允许跨域
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            body: responseBody
        };

    } catch (error) {
        // 错误处理（明确错误类型）
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: '代理请求失败', details: errorMessage })
        };
    }
};
