/**
 * src/api/content.js
 * 内容模块接口（轮播图/资讯）：对应后端 ApiContentController
 * 响应解包后 data 为 Content[]（{ id, type, title, summary, sort, status, startTime, ... }）
 */
import { request } from './request'

/** 资讯（公告）列表：GET /api/content/notice（type=2 且已上架），首页"赛事资讯"使用 */
export function getNoticeList() {
  return request({ url: '/api/content/notice' })
}

/** 轮播图列表：GET /api/content/banner（type=1 且已上架），首页大图区后续可接入 */
export function getBannerList() {
  return request({ url: '/api/content/banner' })
}
