<!-- 实时轨迹页：按摄像头点位 GPS 生成赛道轨迹
     逻辑：拉取我的报名记录（/api/registration/my）拿到我已完赛的赛事（event_status=3，用户结束比赛后才能查看）
      → 拉取该赛事摄像头点位（/api/camera/list?eventId=）按里程排序
      → <map> 上连成 polyline 轨迹 + markers 标注计时点位
     与 route-map 的区别：route-map 是任意赛事选看，本页自动定位到我的完赛赛事 -->
<template>
  <view class="page">
    <!-- 我的赛事信息条 -->
    <view class="event-bar">
      <view v-if="myEvent" class="event-info">
        <text class="event-name">{{ myEvent.eventName }}</text>
        <text class="event-bib" v-if="myEvent.bib">号码牌 {{ myEvent.bib }}</text>
      </view>
      <view v-else class="event-info empty-event">
        <text class="event-name">{{ NO_FINISHED }}</text>
      </view>
    </view>

    <!-- 地图：摄像头点位连成赛道轨迹 -->
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
    <view v-else-if="!myEvent" class="tip warn">{{ NO_FINISHED }}，完赛后即可查看实时轨迹</view>
    <view v-else-if="!routePoints.length" class="tip warn">该赛事暂无路线点位</view>
    <view v-else class="tip ok">{{ myEvent.eventName }} · 赛道共 {{ routePoints.length }} 个计时点位</view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getCameraList } from '@/api/camera'
import { getMyRegistrations } from '@/api/registration'
import { wxLogin, getToken } from '@/api/request'
import { smoothPolyline } from '@/utils/smooth'

// ===== 地图基础状态（默认中心：芒市，定位成功后切换当前位置） =====
const latitude = ref(24.8801)
const longitude = ref(102.8329)
const scale = ref(14)

// 定位到当前位置（gcj02；权限已在 manifest 声明）
uni.getLocation({
  type: 'gcj02',
  isHighAccuracy: true,
  success: (res) => {
    latitude.value = res.latitude
    longitude.value = res.longitude
  },
  fail: () => {
    // 定位失败保持默认中心
  },
})

// ===== 我的报名赛事 =====
const myEvent = ref(null)
// 实时轨迹只展示已完赛的赛事（event_status=3，用户结束比赛后才能查看轨迹）；无完赛赛事时提示
const NO_FINISHED = '暂无已完赛的赛事'

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

/** 点位加载成功后，把地图视野跳到赛道位置（否则默认中心在昆明，看不到丽江轨迹） */
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

// ===== 初始化：确保登录（openid→token）→ 查我的报名 → 取已完赛赛事 → 拉该赛事摄像头点位 =====
async function init() {
  try {
    // 1. 确保已登录：无 token 时先 wx-login（后端用 openid 识别当前用户）
    if (!getToken()) {
      await wxLogin()
    }
    // 2. 查我的报名记录（后端通过 token 里的 openid 解析出 personId）
    const data = await getMyRegistrations()
    const regs = Array.isArray(data) ? data : []
    // 3. 只保留已完赛的赛事（event_status=3，用户结束比赛后才能查看轨迹）
    const finished = regs.find((r) => Number(r.eventStatus) === 3)
    if (finished && finished.eventId) {
      myEvent.value = finished
      const camerasList = await getCameraList(finished.eventId)
      cameras.value = Array.isArray(camerasList) ? camerasList : []
      // 点位就绪后让地图视野跳到赛道（include-points 在异步加载时不可靠，需显式调用）
      setTimeout(fitRoute, 300)
    }
    // 4. 无完赛赛事：保持空态，提示完赛后查看
  } catch (err) {
    console.log('实时轨迹初始化失败', err)
    // 登录/查询失败同样空态
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

/* 我的赛事信息条 */
.event-bar {
  position: relative;
  z-index: 5;
  background-color: #ffffff;
  padding: 16rpx 24rpx;
  border-bottom: 1rpx solid #F3F4F6;
}

.event-info {
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
  max-width: 480rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.event-bib {
  margin-left: 20rpx;
  font-size: 24rpx;
  color: #16A34A;
  background-color: #DCFCE7;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  flex-shrink: 0;
}

.empty-event .event-name {
  color: #9CA3AF;
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
  white-space: nowrap;
  max-width: 80%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tip.warn {
  background-color: rgba(217, 119, 6, 0.85);
}

.tip.ok {
  background-color: rgba(22, 163, 74, 0.9);
}
</style>
