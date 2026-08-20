/**
 * src/api/auth.js
 * 认证/用户信息接口：对应后端 ApiAuthController
 * 需 wx-token；401 时 request 层会自动重新登录并重试
 */
import { request, getToken, setToken, wxLogin } from './request'

/**
 * 当前登录用户信息：GET /api/auth/me
 * 返回 { id, name, phone }；未登录（401）由 request 层自动登录后重试
 */
export function getMe() {
  return request({ url: '/api/auth/me' })
}

/** 是否已登录：本地是否有 wx-token */
export function isLoggedIn() {
  return !!getToken()
}

/** 静默登录并返回 token（已登录则直接返回现有 token） */
export function ensureLogin() {
  if (getToken()) return Promise.resolve(getToken())
  return wxLogin()
}

/** 退出登录：清除本地 token */
export function logout() {
  setToken('')
  uni.removeStorageSync('wx_token')
}

export { getToken, setToken, wxLogin }