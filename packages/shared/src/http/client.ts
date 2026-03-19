import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
export interface HttpClientOptions {
  baseURL: string;
  timeout?: number;
  getToken?: () => string | null;
  onUnauthorized?: () => void;
}

export function createHttpClient(options: HttpClientOptions): AxiosInstance {
  const { baseURL, timeout = 10_000, getToken, onUnauthorized } = options;

  const instance = axios.create({ baseURL, timeout });

  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getToken?.();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (res: AxiosResponse) => res,
    (err) => {
      if (err.response?.status === 401) {
        onUnauthorized?.();
      }
      return Promise.reject(err);
    }
  );

  return instance;
}
