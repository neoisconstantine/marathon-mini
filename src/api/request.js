/**
 * src/api/request.js
 * 小程序请求层：封装 uni.request，对接 RuoYi 后端（D:\hzwxwork\marathon-backend，端口 8080）。
 *
 * 鉴权交互说明（后端 WxAuthInterceptor 独立鉴权）：
 *   - 登录：POST /api/auth/wx-login { code } → { code:0, data:{ token } }
 *     （后端 wx.appid 留空时为开发模式，任意 code 可用，openid = mock_ + code）
 *   - 业务接口：请求头携带 wx-token（注意：不是 Authorization！），401 时自动重新登录并重试一次
 *   - 统一响应：ApiResult = { code, message, data }，code=0 表示成功
 */
import { userState } from '@/store/user'

// 后端地址（微信开发者工具需开启"不校验合法域名"才能访问 http://localhost:8080）
// 真机调试：手机与电脑需同一 WiFi，用电脑局域网 IP 替换 localhost（192.168.31.162）
const BASE_URL = 'http://192.168.31.162:8080'
const TOKEN_KEY = 'wx_token'

export function getToken() {
  return uni.getStorageSync(TOKEN_KEY) || ''
}

export function setToken(token) {
  uni.setStorageSync(TOKEN_KEY, token)
  // 同步全局登录态：各页面入口可见性据此响应式更新
  userState.token = token
}

// 登录进行中共享的 Promise：并发调用 wxLogin 时复用同一次登录，
// 避免 App 启动强制登录与页面 401 重试同时触发两次 wxLogin、注册出两个模拟用户
let wxLoginPending = null

/** 微信登录换取小程序 token（dev 模式后端 appid 为空，任意 code 可用，openid 随 code 变化） */
export function wxLogin() {
  if (wxLoginPending) return wxLoginPending
  wxLoginPending = new Promise((resolve, reject) => {
    const doLogin = (code) =>
      new Promise((resolve, reject) => {
        uni.request({
          url: BASE_URL + '/api/auth/wx-login',
          method: 'POST',
          data: { code },
          success: (res) => {
            let body = res.data
            if (typeof body === 'string') {
              try {
                body = JSON.parse(body)
              } catch (e) {
                body = null
              }
            }
            if (body && body.code === 0 && body.data && body.data.token) {
              setToken(body.data.token)
              // 首次登录（后端自动注册的新用户）：弹出全局模态引导授权手机号
              if (body.data.isNewUser) {
                userState.guideVisible = true
              }
              resolve(body.data.token)
            } else {
              reject(new Error((body && (body.message || body.msg)) || '登录失败'))
            }
          },
          fail: reject,
        })
      })
    uni.login({
      provider: 'weixin',
      success: (loginRes) => {
        doLogin(loginRes.code).then(resolve).catch(reject)
      },
      fail: () => {
        // 开发者工具异常等场景兜底（dev 模式后端任意 code 可用）
        doLogin('dev_mock').then(resolve).catch(reject)
      },
    })
  }).finally(() => {
    wxLoginPending = null
  })
  return wxLoginPending
}

/**
 * 剔除 undefined/null 参数：uni.request 会把 undefined 序列化成字符串 "undefined" 拼进 query，
 * 导致后端（如 Spring 的 Integer 字段）类型转换失败返回 400 —— 必须显式剔除
 */
function cleanData(data) {
  if (!data || typeof data !== 'object') return data
  const out = {}
  Object.keys(data).forEach((k) => {
    if (data[k] !== undefined && data[k] !== null) out[k] = data[k]
  })
  return out
}

/**
 * 写操作防连点：同一 POST/PUT 请求（url+参数相同）在间隔内重复发起时直接拒绝，
 * 兜住页面忘记加 loading 锁的连点场景（报名等关键提交另有 submitting 锁，双保险）
 * GET 不限制（下拉刷新/onShow 刷新列表是合法重复）
 */
const DUPLICATE_SUBMIT_INTERVAL = 1000
const recentSubmits = new Map()

function rejectDuplicateSubmit(method, url, data) {
  const key = method + ' ' + url + ' ' + JSON.stringify(data || {})
  const now = Date.now()
  const last = recentSubmits.get(key)
  if (last && now - last < DUPLICATE_SUBMIT_INTERVAL) {
    return true
  }
  recentSubmits.set(key, now)
  // 惰性清理：条目过多时移除已过期的，防止 map 无限增长
  if (recentSubmits.size > 100) {
    recentSubmits.forEach((t, k) => {
      if (now - t > DUPLICATE_SUBMIT_INTERVAL) recentSubmits.delete(k)
    })
  }
  return false
}

/**
 * 通用请求：自动携带 wx-token，401 时自动重新登录后重试一次
 * @returns Promise<data>（已解包 ApiResult.data）
 */
export function request({ url, method = 'GET', data }) {
  if (method !== 'GET' && rejectDuplicateSubmit(method, url, cleanData(data))) {
    return Promise.reject(new Error('操作过于频繁，请稍候再试'))
  }
  const doRequest = () =>
    new Promise((resolve, reject) => {
      uni.request({
        url: BASE_URL + url,
        method,
        data: cleanData(data),
        header: { 'Content-Type': 'application/json', 'wx-token': getToken() },
        success: (res) => {
          // 微信端对无 charset 的 application/json 响应可能不自动 JSON.parse（res.data 为字符串），
          // 这里兜底解析，确保能取到后端返回的错误 message/msg
          let body = res.data
          if (typeof body === 'string') {
            try {
              body = JSON.parse(body)
            } catch (e) {
              body = null
            }
          }
          // 兼容后端两套响应结构：ApiResult 用 message 字段，若依异常处理器返回 AjaxResult 用 msg 字段
          const errMsg = body && (body.message || body.msg)
          if (res.statusCode === 401) {
            const err = new Error(errMsg || '未登录或登录已过期')
            err.code = 401
            reject(err)
          } else if (body && body.code === 0) {
            resolve(body.data)
          } else {
            reject(new Error(errMsg || '请求失败'))
          }
        },
        fail: reject,
      })
    })

  return doRequest().catch((err) => {
    if (err.code === 401) {
      // token 缺失/过期：重新登录后重试一次
      return wxLogin().then(doRequest)
    }
    throw err
  })
}
