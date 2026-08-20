/**
 * src/api/result.js
 * 成绩模块接口：对应后端 ApiResultController
 * 接口均需 wx-token（后端按 personId 隔离数据，只能查自己的成绩）
 */
import { request } from './request'

/** 我的赛事成绩列表：GET /api/result/my */
export function getMyResults() {
  return request({ url: '/api/result/my' })
}

/** 成绩详情：GET /api/result/detail?id=（后端校验归属，非本人成绩返回"成绩不存在"） */
export function getResultDetail(id) {
  return request({ url: '/api/result/detail', data: { id } })
}
