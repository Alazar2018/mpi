import axios from "axios";
import { responseHandler } from "./ApiResponseHandler";
import type { AsyncResponse } from "@/interface";
import type { AxiosInstance, AxiosRequestConfig } from 'axios'
// import { useAuthStore } from "@/store/auth.store"; 

export const backendApi = import.meta.env?.v_API_URL

export default class ApiService {

  api: AxiosInstance

  constructor(baseURL?: string) {
    if (baseURL){
      this.api = axios.create({
        //timeout: 3000,
        baseURL,
        validateStatus: (status: number) => {
          return status < 300 && status >= 200;
        },
      })
    } else {
      this.api = axios.create({
        //timeout: 3000,
        baseURL: backendApi,
        validateStatus: (status: number) => {
          return status < 300 && status >= 200;
        },
      })
    }
  }

  async get<T>(url: string, config: AxiosRequestConfig = {}): Promise<AsyncResponse<T>> {
    return await responseHandler<T>(
      this.api({
        ...config,
        headers: {
          ...(config?.headers || {}),
        },
        url,
        method: "get",
      })
    );
  }

  async post<T, D = any>(url: string, data: D, config: AxiosRequestConfig = {}) {
    return await responseHandler<T>(
      this.api({
        ...config,
        headers: {
          ...(config?.headers || {}),
        },
        data,
        url,
        method: "post",
      })
    );
  }

  async put<T>(url: string, data: T, config: AxiosRequestConfig = {}) {
    return await responseHandler(
      this.api({
        ...config,
        headers: {
          ...(config?.headers || {}),
        },
        data,
        url,
        method: "put",
      })
    );
  }

  async patch<T>(url: string, data: T, config: AxiosRequestConfig = {}) {
    return await responseHandler(
      this.api({
        ...config,
        headers: {
          ...(config?.headers || {}),
        },
        data,
        url,
        method: "patch",
      })
    );
  }

  async delete<T>(url: string, config: AxiosRequestConfig = {}) {
    return await responseHandler(
      this.api({
        ...config,
        headers: {
          ...(config?.headers || {}),
        },
        url,
        method: "delete",
      })
    );
  }

  addAuthenticationHeader() {
    let tokens = localStorage.getItem('tokens') ?? '{accessToken: ""}'
    if(tokens) {
      tokens = JSON.parse(tokens) as any
    }
    this.api.defaults.headers.common.Authorization = `Bearer ${(tokens as any)?.accessToken}`;
    return this;
  }
}
