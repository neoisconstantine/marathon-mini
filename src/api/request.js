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

// 后端地址（微信开发者工具需开启"不校验合法域名"才能访问 http://localhost:8080）
// 真机调试：手机与电脑需同一 WiFi，用电脑局域网 IP 替换 localhost（192.168.31.162）
const BASE_URL = 'http://192.168.31.162:8080'
const TOKEN_KEY = 'wx_token'

export function getToken() {
  return uni.getStorageSync(TOKEN_KEY) || ''
}

export function setToken(token) {
  uni.setStorageSync(TOKEN_KEY, token)
}

/** 微信登录换取小程序 token（dev 模式后端 appid 为空，任意 code 可用） */
export function wxLogin() {
  const doLogin = (code) =>
    new Promise((resolve, reject) => {
      uni.request({
        url: BASE_URL + '/api/auth/wx-login',
        method: 'POST',
        data: { code },
        success: (res) => {
          const body = res.data
          if (body && body.code === 0 && body.data && body.data.token) {
            setToken(body.data.token)
            resolve(body.data.token)
          } else {
            reject(new Error((body && body.message) || '登录失败'))
          }
        },
        fail: reject,
      })
    })
  return new Promise((resolve, reject) => {
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
  })
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
 * 通用请求：自动携带 wx-token，401 时自动重新登录后重试一次
 * @returns Promise<data>（已解包 ApiResult.data）
 */
export function request({ url, method = 'GET', data }) {
  const doRequest = () =>
    new Promise((resolve, reject) => {
      uni.request({
        url: BASE_URL + url,
        method,
        data: cleanData(data),
        header: { 'Content-Type': 'application/json', 'wx-token': getToken() },
        success: (res) => {
          const body = res.data
          if (res.statusCode === 401) {
            const err = new Error((body && body.message) || '未登录或登录已过期')
            err.code = 401
            reject(err)
          } else if (body && body.code === 0) {
            resolve(body.data)
          } else {
            reject(new Error((body && body.message) || '请求失败'))
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
