<!-- 路线地图页：默认展示地图并定位到当前位置
     赛道轨迹：拉取后端摄像头点位（GET /api/camera/list?eventId=），按点位里程排序后
     连成 polyline 展示赛道路线，markers 标注计时点位
     赛事范围：仅展示当前用户已报名的赛事（GET /api/registration/my，按 eventId 去重）；
     无 GPS 点位数据的赛事显示"路线信息不足"提示，不绘制 -->
<template>
  <view class="page">
    <!-- 赛事选择器 -->
    <view class="event-bar">
      <picker mode="selector" :range="eventNames" @change="onEventChange">
        <view class="event-picker">
          <text class="event-name">{{ currentEvent ? currentEvent.eventName : '选择赛事' }}</text>
          <text class="event-arrow">▾</text>
        </view>
      </picker>
    </view>

    <!-- 地图：摄像头点位连成赛道路线 -->
    <map
      id="raceMap"
      class="map"
      :latitude="latitude"
      :longitude="longitude"
      :scale="scale"
      :polyline="polyline"
      :markers="markers"
      :include-points="includePoints"
      show-location
      enable-poi
    ></map>

    <!-- 状态提示 -->
    <view v-if="loading" class="tip">加载中...</view>
    <view v-else-if="!events.length" class="tip warn">暂无已报名赛事，报名后可查看赛道地图</view>
    <view v-else-if="locateFailed" class="tip warn">定位失败，已显示默认位置</view>
    <view v-else-if="!routePoints.length" class="tip warn">该赛事路线信息不足，暂无 GPS 点位</view>
    <view v-else class="tip ok">赛道共 {{ routePoints.length }} 个计时点位</view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getCameraList } from '@/api/camera'
import { getMyRegistrations } from '@/api/registration'
import { wxLogin, getToken } from '@/api/request'
import { smoothPolyline } from '@/utils/smooth'

// ===== 地图基础状态 =====
const latitude = ref(24.8801)
const longitude = ref(102.8329)
const scale = ref(14)
const locateFailed = ref(false)

// 定位到当前位置（gcj02；权限已在 manifest 声明）
uni.getLocation({
  type: 'gcj02',
  isHighAccuracy: true,
  success: (res) => {
    latitude.value = res.latitude
    longitude.value = res.longitude
  },
  fail: () => {
    locateFailed.value = true
  },
})

// ===== 赛事选择：仅我报名的赛事（来源 /api/registration/my，按 eventId 去重） =====
const events = ref([])
const eventIndex = ref(0)
const eventNames = computed(() => events.value.map((e) => e.eventName))
const currentEvent = computed(() => events.value[eventIndex.value] || null)

function onEventChange(e) {
  eventIndex.value = Number(e.detail.value) || 0
  loadCameras()
}

// ===== 摄像头点位 → 赛道轨迹 =====
const loading = ref(true)
const cameras = ref([])
// 轨迹点：摄像头 GPS 点位按里程排序后经 Catmull-Rom 样条插值平滑（点位稀疏，直线连会显生硬）
const routePoints = computed(() =>
  smoothPolyline(
    sortCameras(cameras.value).map((c) => [Number(c.lat), Number(c.lng)]),
    10
  ).map(([latitude, longitude]) => ({ latitude, longitude }))
)
// polyline：绿色带箭头方向线
const polyline = computed(() =>
  routePoints.value.length >= 2
    ? [
        {
          points: routePoints.value,
          color: '#16A34AFF',
          width: 6,
          arrowLine: true,
          borderColor: '#15803DFF',
          borderWidth: 1,
        },
      ]
    : []
)
// markers：计时点位标注（callout 点按显示名称）
const markers = computed(() =>
  sortCameras(cameras.value).map((c, idx) => ({
    id: idx,
    latitude: Number(c.lat),
    longitude: Number(c.lng),
    width: 20,
    height: 20,
    callout: {
      content: c.name || c.cameraId || `点位${idx + 1}`,
      display: 'BYCLICK',
      padding: 6,
      borderRadius: 6,
      fontSize: 12,
    },
  }))
)
// 视野自动适配所有点位
const includePoints = computed(() => routePoints.value)

/** 点位加载成功后，把地图视野跳到赛道位置（否则默认中心在昆明，看不到丽江/芒市轨迹） */
function fitRoute() {
  const points = routePoints.value
  if (!points.length) return
  const ctx = uni.createMapContext('raceMap')
  ctx.includePoints({
    points,
    padding: [100, 60, 100, 60],
    success: () => {
      // 视野缩放到位后以赛道中心为地图中心
      const mid = points[Math.floor(points.length / 2)]
      if (mid) {
        latitude.value = mid.latitude
        longitude.value = mid.longitude
      }
    },
  })
}

/** 点位按里程排序：cameraId 形如 CP-START / CP-05KM / CP-FINISH（内嵌里程），兜底按名称/插入顺序 */
function sortCameras(list) {
  const mileage = (c) => {
    const m = String(c.cameraId || '').match(/(\d+(?:\.\d+)?)\s*KM/i)
    if (m) return parseFloat(m[1])
    if (/START|起点/i.test(String(c.cameraId) + String(c.name))) return 0
    if (/FINISH|终点/i.test(String(c.cameraId) + String(c.name))) return 9999
    return 5000 + Number(c.id || 0) // 无法解析里程的排最后，保持稳定顺序
  }
  return [...list].sort((a, b) => mileage(a) - mileage(b))
}

// 拉取当前赛事的摄像头点位；无点位时保留空态，提示路线信息不足
function loadCameras() {
  const event = currentEvent.value
  if (!event) {
    loading.value = false
    return
  }
  loading.value = true
  getCameraList(event.eventId)
    .then((list) => {
      cameras.value = Array.isArray(list) ? list : []
      // 点位就绪后让地图视野跳到赛道（include-points 在异步加载时不可靠，需显式调用）
      if (cameras.value.length) {
        setTimeout(fitRoute, 300)
      }
    })
    .catch((err) => {
      console.log('摄像头点位加载失败', err)
      cameras.value = []
    })
    .finally(() => {
      loading.value = false
    })
}

// ===== 初始化：确保登录（openid→token）→ 查我的报名 → 只展示我报名过的赛事 =====
// 报名记录按报名时间倒序（最新在前），同一赛事多次报名时按 eventId 去重保留最新一条
async function init() {
  try {
    // 1. 确保已登录：无 token 时先 wx-login（后端用 openid 识别当前用户）
    if (!getToken()) {
      await wxLogin()
    }
    // 2. 查我的报名记录（后端通过 token 里的 openid 解析出 personId）
    const regs = await getMyRegistrations()
    const seen = new Map()
    ;(Array.isArray(regs) ? regs : []).forEach((r) => {
      if (r && r.eventId && !seen.has(r.eventId)) seen.set(r.eventId, r)
    })
    events.value = Array.from(seen.values())
    // 3. 有报名赛事时加载第一个赛事的摄像头点位
    if (events.value.length) {
      await loadCameras()
    }
  } catch (err) {
    console.log('我的报名赛事加载失败', err)
    // 登录/查询失败：保持空态，提示暂无已报名赛事
  } finally {
    loading.value = false
  }
}
init()
</script>

<style scoped lang="scss">
.page {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 赛事选择条 */
.event-bar {
  position: relative;
  z-index: 5;
  background-color: #ffffff;
  padding: 16rpx 24rpx;
  border-bottom: 1rpx solid #F3F4F6;
}

.event-picker {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F4F8F4;
  border-radius: 32rpx;
  padding: 14rpx 28rpx;
}

.event-name {
  font-size: 28rpx;
  color: #1F2937;
  max-width: 560rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.event-arrow {
  margin-left: 12rpx;
  font-size: 20rpx;
  color: #6B7280;
}

/* 地图铺满剩余区域 */
.map {
  flex: 1;
  width: 100%;
}

/* 底部状态提示 */
.tip {
  position: absolute;
  bottom: 60rpx;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(31, 41, 55, 0.75);
  color: #ffffff;
  font-size: 24rpx;
  padding: 12rpx 32rpx;
  border-radius: 32rpx;
  z-index: 5;
}

.tip.warn {
  background-color: rgba(217, 119, 6, 0.85);
}

.tip.ok {
  background-color: rgba(22, 163, 74, 0.9);
}
</style>
