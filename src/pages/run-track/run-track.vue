<!-- 运动轨迹记录页：使用手机GPS记录跑步路线 -->
<template>
  <view class="page">
    <!-- 顶部数据面板：白底绿字，适配小程序主题 -->
    <view class="stats-bar">
      <view class="stat-card">
        <view class="stat-icon">
          <view class="i-route"></view>
        </view>
        <view class="stat-main">
          <text class="stat-num">{{ formatDistance(distance) }}</text>
          <text class="stat-unit">公里</text>
        </view>
      </view>
      <view class="stat-card">
        <view class="stat-icon">
          <view class="i-time"></view>
        </view>
        <view class="stat-main">
          <text class="stat-num">{{ formatTime(elapsed) }}</text>
          <text class="stat-unit">用时</text>
        </view>
      </view>
      <view class="stat-card">
        <view class="stat-icon">
          <view class="i-pace"></view>
        </view>
        <view class="stat-main">
          <text class="stat-num">{{ formatPace(distance, elapsed) }}</text>
          <text class="stat-unit">配速</text>
        </view>
      </view>
    </view>

    <!-- 地图：实时绘制用户运动轨迹 -->
    <view class="map-wrap">
      <map
        id="runMap"
        class="map"
        :latitude="centerLat"
        :longitude="centerLng"
        :scale="scale"
        :polyline="polyline"
        :markers="markers"
        :enable-satellite="enableSatellite"
        show-location
        enable-poi
      ></map>
      <!-- 图层切换 -->
      <view class="map-tool layer-btn" @tap="toggleLayer">
        <text class="layer-text">{{ enableSatellite ? '卫星' : '标准' }}</text>
      </view>
      <!-- 定位按钮：回到当前位置 -->
      <view class="map-tool loc-btn" @tap="locateMe">
        <view class="loc-icon"></view>
      </view>
    </view>

    <!-- 定位状态提示 -->
    <view v-if="locating" class="tip">定位中...</view>
    <view v-else-if="locationFailed" class="tip warn">定位失败，请检查定位权限</view>
    <view v-else-if="!isRunning && trackPoints.length === 0" class="tip">点击开始按钮开始记录运动轨迹</view>
    <view v-else-if="isRunning" class="tip ok">正在记录轨迹 · 已采集 {{ trackPoints.length }} 个点位</view>
    <view v-else-if="trackPoints.length > 0" class="tip">轨迹记录完成 · 共 {{ trackPoints.length }} 个点位</view>

    <!-- 底部控制按钮 -->
    <view class="control-bar">
      <button
        v-if="!isRunning && trackPoints.length === 0"
        class="ctrl-btn start"
        @tap="startRun"
      >开始运动</button>
      <template v-else-if="isRunning">
        <button class="ctrl-btn pause" @tap="pauseRun">暂停</button>
        <button class="ctrl-btn stop" @tap="stopRun">结束</button>
      </template>
      <template v-else-if="!isRunning && trackPoints.length > 0">
        <button class="ctrl-btn resume" @tap="resumeRun">继续</button>
        <button class="ctrl-btn stop" @tap="stopRun">结束</button>
      </template>
      <button
        v-if="!isRunning && trackPoints.length > 0"
        class="ctrl-btn reset"
        @tap="resetRun"
      >重置</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onUnload } from '@dcloudio/uni-app'

// ===== 地图状态 =====
const centerLat = ref(24.8801)
const centerLng = ref(102.8329)
const scale = ref(16)
const locating = ref(false)
const locationFailed = ref(false)
const enableSatellite = ref(false)

// ===== 运动状态 =====
const isRunning = ref(false)
const trackPoints = ref([])
const distance = ref(0)
const elapsed = ref(0)

let locationTimer = null
let elapsedTimer = null
let startTimestamp = null
let pausedElapsed = 0

// ===== 计算属性 =====
const polyline = computed(() =>
  trackPoints.value.length >= 2
    ? [{
        points: trackPoints.value.map((p) => ({
          latitude: p.latitude,
          longitude: p.longitude,
        })),
        color: '#16A34AFF',
        width: 6,
        arrowLine: true,
        borderColor: '#15803DFF',
        borderWidth: 1,
      }]
    : []
)

const markers = computed(() => {
  const ms = []
  if (trackPoints.value.length > 0) {
    const first = trackPoints.value[0]
    ms.push({
      id: 1,
      latitude: first.latitude,
      longitude: first.longitude,
      title: '起点',
      width: 24,
      height: 24,
    })
    const last = trackPoints.value[trackPoints.value.length - 1]
    ms.push({
      id: 2,
      latitude: last.latitude,
      longitude: last.longitude,
      title: '当前位置',
      width: 24,
      height: 24,
    })
  }
  return ms
})

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    uni.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      highAccuracyExpireTime: 3000,
      success: resolve,
      fail: reject,
    })
  })
}

async function collectPoint() {
  try {
    const pos = await getCurrentPosition()
    locationFailed.value = false
    const point = {
      latitude: pos.latitude,
      longitude: pos.longitude,
      timestamp: Date.now(),
    }
    if (trackPoints.value.length > 0) {
      const last = trackPoints.value[trackPoints.value.length - 1]
      const d = calcDistance(last.latitude, last.longitude, point.latitude, point.longitude)
      if (d < 3) return
      distance.value += d
    }
    trackPoints.value.push(point)
    centerLat.value = point.latitude
    centerLng.value = point.longitude
    if (trackPoints.value.length > 1) fitTrack()
  } catch (err) {
    console.log('定位失败', err)
    locationFailed.value = true
  }
}

async function startRun() {
  locating.value = true
  try {
    const pos = await getCurrentPosition()
    centerLat.value = pos.latitude
    centerLng.value = pos.longitude
    trackPoints.value = [{
      latitude: pos.latitude,
      longitude: pos.longitude,
      timestamp: Date.now(),
    }]
    distance.value = 0
    elapsed.value = 0
    pausedElapsed = 0
    isRunning.value = true
    startTimestamp = Date.now()
    locationTimer = setInterval(collectPoint, 3000)
    elapsedTimer = setInterval(() => {
      elapsed.value = pausedElapsed + Math.floor((Date.now() - startTimestamp) / 1000)
    }, 1000)
    locating.value = false
  } catch (err) {
    locating.value = false
    locationFailed.value = true
    uni.showToast({ title: '定位失败，请检查权限', icon: 'none' })
  }
}

function pauseRun() {
  isRunning.value = false
  pausedElapsed = elapsed.value
  clearInterval(locationTimer)
  clearInterval(elapsedTimer)
  locationTimer = null
  elapsedTimer = null
}

function resumeRun() {
  isRunning.value = true
  startTimestamp = Date.now()
  locationTimer = setInterval(collectPoint, 3000)
  elapsedTimer = setInterval(() => {
    elapsed.value = pausedElapsed + Math.floor((Date.now() - startTimestamp) / 1000)
  }, 1000)
}

function stopRun() {
  isRunning.value = false
  clearInterval(locationTimer)
  clearInterval(elapsedTimer)
  locationTimer = null
  elapsedTimer = null
  uni.showModal({
    title: '运动结束',
    content: `距离：${formatDistance(distance.value)} km\n用时：${formatTime(elapsed.value)}\n配速：${formatPace(distance.value, elapsed.value)}`,
    showCancel: false,
  })
}

function resetRun() {
  trackPoints.value = []
  distance.value = 0
  elapsed.value = 0
  pausedElapsed = 0
  startTimestamp = null
}

function locateMe() {
  uni.getLocation({
    type: 'gcj02',
    isHighAccuracy: true,
    success: (res) => {
      centerLat.value = res.latitude
      centerLng.value = res.longitude
    },
    fail: () => {
      uni.showToast({ title: '定位失败', icon: 'none' })
    },
  })
}

function toggleLayer() {
  enableSatellite.value = !enableSatellite.value
}

function fitTrack() {
  const points = trackPoints.value
  if (points.length < 2) return
  const ctx = uni.createMapContext('runMap')
  ctx.includePoints({
    points: points.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
    padding: [80, 40, 160, 40],
  })
}

function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function formatDistance(meters) {
  return (meters / 1000).toFixed(2)
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatPace(meters, seconds) {
  if (meters <= 0 || seconds <= 0) return "--'--"
  const paceSec = seconds / (meters / 1000)
  const m = Math.floor(paceSec / 60)
  const s = Math.floor(paceSec % 60)
  return `${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}''`
}

onUnload(() => {
  clearInterval(locationTimer)
  clearInterval(elapsedTimer)
})
</script>

<style scoped lang="scss">
.page {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #F4F8F4;
}

/* ===== 顶部数据面板：白底卡片 + 绿色图标 ===== */
.stats-bar {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  padding: 24rpx;
  gap: 16rpx;
}

.stat-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx 0 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.stat-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background-color: #DCFCE7;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
}

/* 路线图标 */
.i-route {
  width: 28rpx;
  height: 28rpx;
  border: 4rpx solid #16A34A;
  border-radius: 50%;
  position: relative;
}
.i-route::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background-color: #16A34A;
}

/* 时钟图标 */
.i-time {
  width: 26rpx;
  height: 26rpx;
  border: 4rpx solid #16A34A;
  border-radius: 50%;
  position: relative;
}
.i-time::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 6rpx;
  width: 3rpx;
  height: 8rpx;
  background-color: #16A34A;
  transform: translateX(-50%);
}
.i-time::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 6rpx;
  height: 3rpx;
  background-color: #16A34A;
  transform: translateY(-50%);
}

/* 配速图标 */
.i-pace {
  width: 22rpx;
  height: 22rpx;
  border: 4rpx solid #16A34A;
  border-radius: 50%;
  position: relative;
}
.i-pace::after {
  content: '';
  position: absolute;
  right: -8rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 8rpx solid #16A34A;
  border-top: 5rpx solid transparent;
  border-bottom: 5rpx solid transparent;
}

.stat-main {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-num {
  font-size: 40rpx;
  font-weight: 700;
  color: #1F2937;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.stat-unit {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #9CA3AF;
}

/* ===== 地图容器 ===== */
.map-wrap {
  flex: 1;
  position: relative;
  width: 100%;
  margin: 0 24rpx 24rpx;
  width: calc(100% - 48rpx);
  border-radius: 20rpx;
  overflow: hidden;
}

.map {
  width: 100%;
  height: 100%;
}

/* 地图工具按钮（图层 + 定位） */
.map-tool {
  position: absolute;
  right: 24rpx;
  width: 76rpx;
  height: 76rpx;
  background-color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
  z-index: 10;
}

.layer-btn {
  bottom: 136rpx;
}

.layer-text {
  font-size: 20rpx;
  color: #1F2937;
  font-weight: 600;
}

.loc-btn {
  bottom: 40rpx;
}

.loc-icon {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  border: 5rpx solid #16A34A;
  position: relative;
}
.loc-icon::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background-color: #16A34A;
}

/* 状态提示 */
.tip {
  position: absolute;
  bottom: 200rpx;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(31, 41, 55, 0.75);
  color: #ffffff;
  font-size: 24rpx;
  padding: 12rpx 32rpx;
  border-radius: 32rpx;
  z-index: 5;
  white-space: nowrap;
}

.tip.warn {
  background-color: rgba(217, 119, 6, 0.85);
}

.tip.ok {
  background-color: rgba(22, 163, 74, 0.9);
}

/* 底部控制栏 */
.control-bar {
  position: relative;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  background-color: #ffffff;
  padding: 24rpx 32rpx 48rpx;
  border-top: 1rpx solid #F3F4F6;
}

.ctrl-btn {
  margin: 0;
  padding: 0 48rpx;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 30rpx;
  border-radius: 40rpx;
  border: none;
}

.ctrl-btn::after {
  border: none;
}

.ctrl-btn.start {
  color: #ffffff;
  background-color: #16A34A;
  width: 320rpx;
}

.ctrl-btn.pause {
  color: #1F2937;
  background-color: #FEF3C7;
}

.ctrl-btn.resume {
  color: #ffffff;
  background-color: #16A34A;
}

.ctrl-btn.stop {
  color: #ffffff;
  background-color: #DC2626;
}

.ctrl-btn.reset {
  color: #6B7280;
  background-color: #F3F4F6;
}
</style>
