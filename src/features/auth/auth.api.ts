import type { LoginPayload, LoginResponse, RegisterPayload } from "@/interface";
import { getApi } from "@/utils/utils";
import axios from "axios";

const api = getApi("/auth", import.meta.env.v_BASE_URL);

export function refreshToken(data: {refreshToken: string}) {
  return axios.post("https://mpiglobal.org/auth/refresh", data, {
    validateStatus: (status) => {
      return status >= 200 && status < 300 
    }
  })
}

export function login(credentials: LoginPayload) {
  return api.post<LoginResponse>("/login", credentials);
}

export function register(credentials: RegisterPayload) {
  return api.post<LoginResponse>("/register", credentials, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
}

export function getAccountCreationOtp(data: {email: string}) {
  return api.post('/generateotp', data)
}

export function verifyOTP(data: {email: string, otp: string}) {
  return api.post('verifyOTP', data)
}