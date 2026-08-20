/**
 * 轨迹平滑工具（无第三方依赖）
 *
 * 摄像头 GPS 点位（CP-START / CP-05KM / ... / CP-FINISH）通常只有十几个，
 * 直接连 polyline 会呈生硬直线。用 Catmull-Rom 样条在每两个点位之间
 * 插值出密集采样点，视觉上呈现平滑曲线。
 */

/**
 * Catmull-Rom 样条平滑：将稀疏折线顶点插值为密集采样点
 * @param {Array<[number, number]>} points 折线顶点 [[lat, lng], ...]，至少 3 个点
 * @param {number} [samples=10] 每段插值点数（越大越平滑，也越耗渲染性能）
 * @returns {Array<[number, number]>} 平滑后的密集点（含首尾原始点）
 */
export function smoothPolyline(points, samples = 10) {
  if (!points || points.length < 3) return points || []
  const out = []
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    for (let s = 0; s < samples; s++) {
      out.push(catmullRom(p0, p1, p2, p3, s / samples))
    }
  }
  out.push(points[points.length - 1])
  return out
}

/** Catmull-Rom 样条单点插值（三次 Hermite 形式），返回 [lat, lng] */
function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t
  const t3 = t2 * t
  return [
    0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
    0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
  ]
}