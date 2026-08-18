<!-- 首页：顶部大图背景（占 60%+ 屏高）+ 功能入口 + 热门赛事 + 赛事公告 -->
<template>
  <view class="page">
    <!-- ===== 顶部大图区：海报背景占 62vh，自定义导航悬浮其上 ===== -->
    <view class="hero">
      <!-- 状态栏占位：高度取自系统信息，保证刘海屏不被遮挡 -->
      <view :style="{ height: statusBarHeight + 'px' }"></view>

      <view class="hero-nav">
        <!-- 定位行：展示实时位置，点击可重新选点定位 -->
        <view class="location" hover-class="location-hover" @tap="onLocationTap">
          <view class="location-dot"></view>
          <text class="location-text">{{ locationText }}</text>
          <text class="location-more">▾</text>
        </view>
        <!-- 应用标题与口号 -->
        <text class="hero-title">马拉松报名</text>
        <text class="hero-slogan">健康生活 幸福奔跑</text>
      </view>
    </view>

    <!-- ===== 2x2 功能入口 ===== -->
    <view class="entry-grid mz-card">
      <!-- 赛事报名：旗帜图标（跳转活动页） -->
      <view class="entry-item" @tap="goActivity">
        <view class="sicon tint-green">
          <view class="sh-flag-pole"></view>
          <view class="sh-flag-cloth"></view>
        </view>
        <view class="entry-text">
          <text class="entry-title">赛事报名</text>
          <text class="entry-sub">一键报名热门赛事</text>
        </view>
      </view>
      <!-- 赛事公告：公告单图标（占位提示） -->
      <view class="entry-item" @tap="todoTip">
        <view class="sicon tint-amber">
          <view class="sh-doc">
            <view class="sh-doc-line l1"></view>
            <view class="sh-doc-line l2"></view>
            <view class="sh-doc-line l3"></view>
          </view>
        </view>
        <view class="entry-text">
          <text class="entry-title">赛事公告</text>
          <text class="entry-sub">重要通知早知道</text>
        </view>
      </view>
      <!-- 成绩查询：放大镜图标（占位提示） -->
      <view class="entry-item" @tap="todoTip">
        <view class="sicon tint-teal">
          <view class="sh-mag-lens"></view>
          <view class="sh-mag-handle"></view>
        </view>
        <view class="entry-text">
          <text class="entry-title">成绩查询</text>
          <text class="entry-sub">完赛成绩一键查</text>
        </view>
      </view>
      <!-- 常见问题：问号图标（占位提示） -->
      <view class="entry-item" @tap="todoTip">
        <view class="sicon tint-amber">
          <text class="sh-q">?</text>
        </view>
        <view class="entry-text">
          <text class="entry-title">常见问题</text>
          <text class="entry-sub">报名规则与答疑</text>
        </view>
      </view>
    </view>

    <!-- ===== 热门赛事 ===== -->
    <view class="section">
      <view class="section-head">
        <text class="section-title">热门赛事</text>
        <text class="section-more" @tap="goActivity">查看全部 ›</text>
      </view>
      <!-- 赛事卡片：点击跳转活动页 -->
      <view class="race-card mz-card" v-for="race in hotRaces" :key="race.id" @tap="goActivity">
        <view class="race-info">
          <text class="race-name">{{ race.name }}</text>
          <text class="race-meta">{{ race.date }} · {{ race.location }}</text>
          <!-- 名额进度（event.registered / event.total_quota） -->
          <view class="quota-row">
            <text class="quota-text">已报名 {{ race.registered }}/{{ race.quota }} 人</text>
            <view class="quota-bar">
              <view class="quota-fill" :style="{ width: race.percent + '%' }"></view>
            </view>
          </view>
        </view>
        <text class="race-tag" :class="{ done: race.status === '已结束' }">{{ race.status }}</text>
      </view>
    </view>

    <!-- ===== 赛事公告 ===== -->
    <view class="section">
      <view class="section-head">
        <text class="section-title">赛事公告</text>
        <text class="section-more" @tap="todoTip">更多 ›</text>
      </view>
      <view class="notice-card mz-card">
        <view class="notice-row" v-for="notice in notices" :key="notice.id">
          <view class="notice-dot"></view>
          <text class="notice-title">{{ notice.title }}</text>
          <text class="notice-date">{{ notice.date }}</text>
        </view>
      </view>
    </view>

    <!-- 底部安全区留白 -->
    <view class="safe-bottom"></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

// 状态栏高度：自定义导航下需要手动占位（刘海屏适配）
const statusBarHeight = ref(44)
try {
  const sys = uni.getSystemInfoSync()
  if (sys && sys.statusBarHeight) {
    statusBarHeight.value = sys.statusBarHeight
  }
} catch (e) {
  // 拿不到时使用默认值，不影响页面布局
  console.log('getSystemInfoSync error', e)
}

// ===== 左上角定位：实时位置 + 点击地图选点修改 =====
// 位置文案：默认全国，选点成功后展示所选位置名称
const locationText = ref('全国 · 马拉松')
// 实时坐标（gcj02）：打开选点地图时用于把中心定位到当前位置
const locationCoords = ref(null)
// 选点进行中标记，防止重复触发
const locating = ref(false)

// 获取实时定位坐标（逆地理编码需地图服务 key，暂未接入，仅取坐标用于地图居中）
function getLocation() {
  return new Promise((resolve) => {
    uni.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      success: (res) => {
        locationCoords.value = { latitude: res.latitude, longitude: res.longitude }
        resolve(true)
      },
      fail: (err) => {
        // 未授权等场景静默降级，不影响页面展示
        console.log('getLocation error', err)
        resolve(false)
      },
    })
  })
}

// 点击定位行：打开地图选点（微信内置），可查看实时位置并修改所在城市
function onLocationTap() {
  if (locating.value) return
  locating.value = true
  const options = {}
  // 已有实时坐标则让地图中心定位到当前位置
  if (locationCoords.value) {
    options.latitude = locationCoords.value.latitude
    options.longitude = locationCoords.value.longitude
  }
  uni.chooseLocation({
    ...options,
    success: (res) => {
      locationText.value = res.name || res.address || '全国 · 马拉松'
    },
    fail: (err) => {
      // 用户主动取消选点不做提示
      if (!String(err.errMsg || '').includes('cancel')) {
        uni.showToast({ title: '定位失败，请检查定位权限', icon: 'none' })
      }
    },
    complete: () => {
      locating.value = false
    },
  })
}

// 页面加载时静默获取一次实时定位（首次会请求位置授权，拒绝也不阻塞使用）
getLocation()

// 热门赛事演示数据（对应 /api/event/list；状态对齐 event.status：报名中/进行中/已结束）
const hotRaces = ref([
  { id: 1, name: '2026 芒市国际马拉松', date: '2026-09-06', location: '云南 · 芒市', status: '报名中', registered: 3280, quota: 5000, percent: 66 },
  { id: 2, name: '2026 昆明高原半程马拉松', date: '2026-04-20', location: '云南 · 昆明', status: '已结束', registered: 2980, quota: 3000, percent: 99 },
  { id: 3, name: '2026 大理环洱海马拉松', date: '2026-10-11', location: '云南 · 大理', status: '报名中', registered: 640, quota: 2000, percent: 32 },
  { id: 4, name: '2025 抚仙湖高原马拉松', date: '2025-12-07', location: '云南 · 玉溪', status: '已结束', registered: 2560, quota: 2560, percent: 100 },
])

// ===== 页面骨架阶段的入口跳转 =====

// 打开活动页（赛事列表 tab）
function goActivity() {
  uni.switchTab({ url: '/pages/activity/activity' })
}

// 未开发功能占位提示（后续接入对应接口后替换为真实跳转）
function todoTip() {
  uni.showToast({ title: '功能建设中，敬请期待', icon: 'none' })
}

// 赛事公告演示数据
const notices = ref([
  { id: 1, title: '2026 芒市国际马拉松报名须知', date: '01-15' },
  { id: 2, title: '关于调整赛事物资领取时间的通知', date: '01-12' },
  { id: 3, title: '2025 年 12 月赛事成绩公示与证书下载', date: '01-08' },
])
</script>

<style scoped lang="scss">
/* ===== 顶部大图区：海报背景占 62vh，自定义导航悬浮其上 ===== */
.hero {
  position: relative;
  min-height: 62vh;
  border-radius: 0 0 32rpx 32rpx;
  overflow: hidden;
  /* 大图背景：src/static/hero.png 由 scripts/gen-hero-image.js 生成，可直接替换为真实海报 */
  background-image: url('/static/hero.png');
  background-size: cover;
  background-position: center;
  padding-bottom: 72rpx;
}

/* 顶部压暗渐变：保证白色导航文字在亮色海报上可读 */
.hero::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 260rpx;
  background: linear-gradient(180deg, rgba(20, 83, 45, 0.5), rgba(20, 83, 45, 0));
  pointer-events: none;
}

.hero-nav {
  position: relative;
  z-index: 1;
  padding: 20rpx 32rpx 0;
}

/* 定位行：小圆点 + 文案 + 下拉箭头（可点击重新定位，padding 扩大点击热区） */
.location {
  display: flex;
  align-items: center;
  padding: 12rpx 0;
  margin: -12rpx 0;
}

/* 点击反馈 */
.location-hover {
  opacity: 0.7;
}

.location-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.9);
  margin-right: 10rpx;
}

.location-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 24rpx;
}

.location-more {
  margin-left: 6rpx;
  color: rgba(255, 255, 255, 0.85);
  font-size: 20rpx;
}

.hero-title {
  display: block;
  margin-top: 16rpx;
  color: #ffffff;
  font-size: 48rpx;
  font-weight: 700;
}

.hero-slogan {
  display: block;
  margin-top: 8rpx;
  color: rgba(255, 255, 255, 0.85);
  font-size: 26rpx;
  letter-spacing: 2rpx;
}

/* ===== 2x2 功能入口（上移重叠到海报底部，营造层次感） ===== */
.entry-grid {
  margin: -48rpx 24rpx 0;
  padding: 24rpx 16rpx;
  display: flex;
  flex-wrap: wrap;
}

.entry-item {
  width: 50%;
  display: flex;
  align-items: center;
  padding: 20rpx 8rpx;
  box-sizing: border-box;
}

.entry-text {
  margin-left: 16rpx;
  display: flex;
  flex-direction: column;
}

.entry-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1F2937;
}

.entry-sub {
  margin-top: 6rpx;
  font-size: 20rpx;
  color: #9CA3AF;
}

/* ===== 通用小图标容器（浅色底 + CSS 图形） ===== */
.sicon {
  position: relative;
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  flex-shrink: 0;
}

/* 浅色底变体 */
.tint-green { background-color: #DCFCE7; }
.tint-amber { background-color: #FEF3C7; }
.tint-teal  { background-color: #CCFBF1; }

/* 旗帜（赛事报名） */
.sh-flag-pole {
  position: absolute;
  left: 28rpx;
  top: 18rpx;
  width: 6rpx;
  height: 46rpx;
  border-radius: 3rpx;
  background-color: #16A34A;
}
.sh-flag-cloth {
  position: absolute;
  left: 34rpx;
  top: 18rpx;
  width: 26rpx;
  height: 18rpx;
  border-radius: 4rpx;
  background-color: #16A34A;
}

/* 公告单（赛事公告） */
.sh-doc {
  position: absolute;
  left: 24rpx;
  top: 18rpx;
  width: 32rpx;
  height: 44rpx;
  border-radius: 6rpx;
  background-color: #D97706;
}
.sh-doc-line {
  position: absolute;
  left: 8rpx;
  width: 16rpx;
  height: 4rpx;
  border-radius: 2rpx;
  background-color: #ffffff;
}
.sh-doc-line.l1 { top: 10rpx; }
.sh-doc-line.l2 { top: 20rpx; }
.sh-doc-line.l3 { top: 30rpx; width: 10rpx; }

/* 放大镜（成绩查询） */
.sh-mag-lens {
  position: absolute;
  left: 22rpx;
  top: 18rpx;
  width: 30rpx;
  height: 30rpx;
  border-radius: 50%;
  border: 6rpx solid #0D9488;
  box-sizing: border-box;
}
.sh-mag-handle {
  position: absolute;
  left: 50rpx;
  top: 46rpx;
  width: 18rpx;
  height: 6rpx;
  border-radius: 3rpx;
  background-color: #0D9488;
  transform: rotate(45deg);
}

/* 问号（常见问题） */
.sh-q {
  font-size: 52rpx;
  font-weight: 700;
  color: #D97706;
  line-height: 80rpx;
}

/* 名额进度条（event.registered / event.total_quota） */
.quota-row {
  margin-top: 14rpx;
  display: flex;
  align-items: center;
}

.quota-text {
  font-size: 22rpx;
  color: #9CA3AF;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.quota-bar {
  flex: 1;
  height: 8rpx;
  border-radius: 4rpx;
  background-color: #F3F4F6;
  overflow: hidden;
}

.quota-fill {
  height: 100%;
  border-radius: 4rpx;
  background: linear-gradient(90deg, #86EFAC, #16A34A);
}

/* ===== 区块 ===== */
.section {
  margin-top: 32rpx;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 32rpx;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1F2937;
}

.section-more {
  font-size: 24rpx;
  color: #9CA3AF;
}

/* 热门赛事卡片 */
.race-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 24rpx 16rpx;
  padding: 24rpx;
}

.race-info {
  display: flex;
  flex-direction: column;
}

.race-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #1F2937;
}

.race-meta {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #9CA3AF;
}

.race-tag {
  font-size: 22rpx;
  color: #15803D;
  background-color: #DCFCE7;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  flex-shrink: 0;
}

.race-tag.done {
  color: #9CA3AF;
  background-color: #F3F4F6;
}

/* 赛事公告卡片 */
.notice-card {
  margin: 0 24rpx;
  padding: 8rpx 24rpx;
}

.notice-row {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #F3F4F6;
}

/* 最后一行去掉分割线 */
.notice-row:last-child {
  border-bottom: none;
}

.notice-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background-color: #16A34A;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.notice-title {
  flex: 1;
  font-size: 26rpx;
  color: #374151;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.notice-date {
  margin-left: 16rpx;
  font-size: 22rpx;
  color: #9CA3AF;
  flex-shrink: 0;
}
</style>