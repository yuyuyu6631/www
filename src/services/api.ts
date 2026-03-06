import axios from 'axios';
import { message } from 'antd';

const api = axios.create({
  // 预留接口文档中的 Base URL: http://localhost:8080/api
  // 在当前开发环境下使用相对路径 /api 以便 Vite 代理生效
  baseURL: '/api',
  timeout: 10000,
});

// 请求拦截器：添加 JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：处理统一响应格式 { code, message, data }
api.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 按照文档：code 200 为成功
    if (res.code === 200) {
      return res.data;
    }
    
    // 处理业务错误
    const errorMsg = res.message || '系统错误';
    message.error(errorMsg);
    
    // 如果是 401 未授权，清除 token 并跳转登录（可选）
    if (res.code === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(new Error(errorMsg));
  },
  (error) => {
    const msg = error.response?.data?.message || '网络请求失败';
    message.error(msg);
    return Promise.reject(error);
  }
);

export default api;
