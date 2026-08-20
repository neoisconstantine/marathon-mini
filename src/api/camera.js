/**
 * src/api/camera.js
 * 摄像头点位接口：对应后端 ApiCameraController
 * 用途：赛道沿线计时摄像头 GPS 点位下发，前端按点位顺序连成赛道路线轨迹
 */
import { request } from './request'

/**
 * 摄像头点位列表：GET /api/camera/list?eventId=
 * 返回 Camera[]：{ id, eventId, cameraId（点位编码如 CP-05KM）, name, location, lng, lat, status }
 */
export function getCameraList(eventId) {
  return request({
    url: '/api/camera/list',
    data: { eventId },
  })
}
