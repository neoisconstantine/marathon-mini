/**
 * src/api/registration.js
 * 报名模块接口：对应后端 ApiRegistrationController
 */
import { request } from './request'

/**
 * 创建报名（支付成功后调用）：POST /api/registration/create
 * @param {Object} param0 { eventId, name, phone }，name/phone 非空时后端回填到参赛用户资料
 */
export function createRegistration({ eventId, name, phone }) {
  return request({
    url: '/api/registration/create',
    method: 'POST',
    data: { eventId, name, phone },
  })
}

/** 微信手机号快捷验证 code 换取手机号：POST /api/auth/phone（需后端配置 wx.appid） */
export function getPhoneByCode(code) {
  return request({
    url: '/api/auth/phone',
    method: 'POST',
    data: { code },
  }).then((data) => (data && data.phone) || '')
}

/**
 * 我的报名记录：GET /api/registration/my
 * 返回 Registration[]（含 eventId/eventName/bib/status），按报名时间倒序，最新在前
 */
export function getMyRegistrations() {
  return request({
    url: '/api/registration/my',
  }).then((data) => (Array.isArray(data) ? data : []))
}
