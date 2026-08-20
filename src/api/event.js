/**
 * src/api/event.js
 * 赛事模块接口：对应后端 ApiEventController
 * 列表响应解包后 data = { list: Event[], total }；Event 字段见后端 com.ruoyi.system.domain.Event
 */
import { request } from './request'

/** 后端赛事状态：0未发布 1报名中 2进行中 3已结束 */
const STATUS_TEXT = { 1: '报名中', 2: '进行中', 3: '已结束' }
const STATUS_CLASS = { 1: 's-open', 2: 's-ongoing', 3: 's-done' }

// 后端 Event 暂无报名费字段，报名支付模拟暂用本地默认值（待后端补充费用字段后移除）
const DEFAULT_FEE = 150

/** 赛事列表（分页）：GET /api/event/list；status 传数字（1/2/3）可服务端过滤，不传时后端自动剔除未发布 */
export function getEventList({ status, pageNum = 1, pageSize = 10 } = {}) {
  return request({
    url: '/api/event/list',
    data: { status, pageNum, pageSize },
  }).then((data) => (data && data.list) || [])
}

/** 赛事详情：GET /api/event/detail?id= */
export function getEventDetail(id) {
  return request({ url: '/api/event/detail', data: { id } })
}

/** "yyyy-MM-dd HH:mm:ss" → "MM-DD" */
function fmtMD(time) {
  const s = String(time || '')
  return s.length >= 10 ? s.slice(5, 10) : s
}

/** 报名窗口 "06-01 ~ 08-31" */
function fmtSignup(start, end) {
  return `${fmtMD(start)} ~ ${fmtMD(end)}`
}

/** 名额占比（0-100 取整） */
function calcPercent(registered, quota) {
  if (!quota) return 0
  return Math.min(100, Math.max(0, Math.round(((registered || 0) / quota) * 100)))
}

/**
 * 后端 Event → 页面展示模型
 * 映射：status 数字→文案/样式类、startTime→日期、signupStart/End→报名窗口、registered/totalQuota→占比
 */
export function mapEvent(e) {
  const statusNum = e.status
  return {
    id: e.id,
    name: e.name || '',
    date: (String(e.startTime || '')).slice(0, 10),
    signup: fmtSignup(e.signupStart, e.signupEnd),
    location: e.location || '',
    statusNum, // 原始数字状态（1未开始/2进行中/3已结束），供过滤使用
    status: STATUS_TEXT[statusNum] || '已结束',
    statusClass: STATUS_CLASS[statusNum] || 's-done',
    registered: e.registered || 0,
    quota: e.totalQuota || 0,
    percent: calcPercent(e.registered, e.totalQuota),
    fee: DEFAULT_FEE, // TODO 后端暂无报名费字段，待补充后改为 e.fee
  }
}
