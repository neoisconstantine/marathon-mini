<!-- 首页：顶部大图背景（占 60%+ 屏高）+ 功能入口 + 热门赛事 + 赛事公告 -->
<template>
  <view class="page">
    <!-- ===== 顶部大图区：海报背景占 62vh，上滑时收起，自定义导航悬浮其上 ===== -->
    <view class="hero" :style="{ height: heroHeight + 'px' }">
      <!-- 大图背景层：微信 WXSS 的 background-image 不支持本地图片，必须用 <image> 标签；aspectFill 等效 cover 裁剪；高度固定，上滑时靠 translateY 视差收起 -->
      <image class="hero-bg" :style="{ height: heroBgHeight + 'px', transform: 'translateY(' + heroBgOffset + 'px)' }" src="/static/hero.png" mode="aspectFill"></image>
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
      <!-- 赛事咨讯：公告单图标（跳转资讯列表页 /pages/news/news） -->
      <view class="entry-item" @tap="goNews">
        <view class="sicon tint-amber">
          <view class="sh-doc">
            <view class="sh-doc-line l1"></view>
            <view class="sh-doc-line l2"></view>
            <view class="sh-doc-line l3"></view>
          </view>
        </view>
        <view class="entry-text">
          <text class="entry-title">赛事咨讯</text>
          <text class="entry-sub">赛事动态早知道</text>
        </view>
      </view>
      <!-- 成绩查询：放大镜图标（需登录：跳转成绩查询页，选已结束赛事查成绩） -->
      <view class="entry-item" @tap="goResult">
        <view class="sicon tint-teal">
          <view class="sh-mag-lens"></view>
          <view class="sh-mag-handle"></view>
        </view>
        <view class="entry-text">
          <text class="entry-title">成绩查询</text>
          <text class="entry-sub">完赛成绩一键查</text>
        </view>
      </view>
      <!-- 我的报名：勾选清单图标（需登录：跳转我的报名列表页） -->
      <view class="entry-item" @tap="goMyRegistrations">
        <view class="sicon tint-green">
          <view class="sh-list-line l1"></view>
          <view class="sh-list-line l2"></view>
          <view class="sh-list-line l3"></view>
          <view class="sh-list-check"></view>
        </view>
        <view class="entry-text">
          <text class="entry-title">我的报名</text>
          <text class="entry-sub">查看我的报名记录</text>
        </view>
      </view>
      <!-- 路线地图：图钉图标（需登录：跳转路线地图页） -->
      <view class="entry-item" @tap="goRouteMap">
        <view class="sicon tint-teal">
          <view class="sh-pin-head"></view>
          <view class="sh-pin-tail"></view>
        </view>
        <view class="entry-text">
          <text class="entry-title">路线地图</text>
          <text class="entry-sub">赛道路线一键查看</text>
        </view>
      </view>
      <!-- 实时轨迹：雷达图标（需登录：当前参与赛事的位置轨迹展示） -->
      <view class="entry-item" @tap="goLiveTrack">
        <view class="sicon tint-green">
          <view class="sh-track-ring r1"></view>
          <view class="sh-track-ring r2"></view>
          <view class="sh-track-dot"></view>
        </view>
        <view class="entry-text">
          <text class="entry-title">实时轨迹</text>
          <text class="entry-sub">比赛轨迹实时看</text>
        </view>
      </view>
    </view>

    <!-- ===== 热门赛事 ===== -->
    <view class="section">
      <view class="section-head">
        <text class="section-title">热门赛事</text>
        <text class="section-more" @tap="goActivity">更多 ›</text>
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

    <!-- ===== 赛事资讯 ===== -->
    <view class="section">
      <view class="section-head">
        <text class="section-title">赛事资讯</text>
        <text class="section-more" @tap="goNews">更多 ›</text>
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
import { onPageScroll, onShow } from '@dcloudio/uni-app'
import { getNoticeList } from '@/api/content'
import { getEventList, mapEvent, statusWeight } from '@/api/event'
import * as authApi from '@/api/auth'

// 状态栏高度：自定义导航下需要手动占位（刘海屏适配）
// 注意：微信新版已弃用 getSystemInfoSync（控制台会告警），优先用 getWindowInfo，低版本降级回退
const statusBarHeight = ref(44)
let windowHeight = 667
function readWindowInfo() {
  try {
    const win = uni.getWindowInfo()
    if (win) {
      if (win.statusBarHeight) statusBarHeight.value = win.statusBarHeight
      if (win.windowHeight) windowHeight = win.windowHeight
      return
    }
  } catch (e) { /* 旧版本无 getWindowInfo，走下方降级 */ }
  try {
    const sys = uni.getSystemInfoSync()
    if (sys && sys.statusBarHeight) {
      statusBarHeight.value = sys.statusBarHeight
    }
    if (sys && sys.windowHeight) {
      windowHeight = sys.windowHeight
    }
  } catch (e) {
    // 拿不到时使用默认值，不影响页面布局
    console.log('getSystemInfoSync error', e)
  }
}
readWindowInfo()

// ===== 顶部大图收起：上滑时背景视差收起，功能菜单悬浮（吸顶）在背景上 =====
const HERO_FULL_H = Math.round(windowHeight * 0.62) // 展开高度：62% 屏高
const HERO_COMPACT_H = Math.round(statusBarHeight.value + 150) // 收起下限：状态栏 + 导航高度
const heroHeight = ref(HERO_FULL_H)
const heroBgHeight = HERO_FULL_H // 背景图高度固定，靠 translateY 上滑实现"收起"（避免拉伸变形）
const heroBgOffset = ref(0)

onPageScroll((e) => {
  const st = Math.max(0, e.scrollTop || 0)
  // 背景高度随滚动收缩（底部边缘以 2 倍滚动速度上移，即视觉上的"收起"）
  heroHeight.value = Math.max(HERO_COMPACT_H, HERO_FULL_H - st)
  heroBgOffset.value = -st
})

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

// 热门赛事演示数据（后端不可用时的降级数据；字段对齐 mapEvent 输出）
const hotRaces = ref([
  { id: 1, name: '2026 芒市国际马拉松', date: '2026-09-06', location: '云南 · 芒市', status: '报名中', registered: 3280, quota: 5000, percent: 66 },
  { id: 2, name: '2026 昆明高原半程马拉松', date: '2026-04-20', location: '云南 · 昆明', status: '已结束', registered: 2980, quota: 3000, percent: 99 },
  { id: 3, name: '2026 大理环洱海马拉松', date: '2026-10-11', location: '云南 · 大理', status: '报名中', registered: 640, quota: 2000, percent: 32 },
])

// 拉取热门赛事（/api/event/list）：按 进行中→报名中→已结束 排序，同状态按报名人数取前 3，失败时保持演示数据
function loadHotRaces() {
  getEventList()
    .then(({ list }) => {
      if (Array.isArray(list) && list.length > 0) {
        hotRaces.value = list
          .map(mapEvent)
          .sort((a, b) => {
            const diff = statusWeight(a) - statusWeight(b)
            if (diff !== 0) return diff
            return b.registered - a.registered
          })
          .slice(0, 3)
      }
    })
    .catch((err) => {
      console.log('热门赛事加载失败，使用演示数据', err)
    })
}

// 页面加载时拉取热门赛事
loadHotRaces()

// tab 页每次显示（如从活动页报名后切回）重新拉取热门赛事，保持已报名人数显示最新
// 注：首次登录的手机号授权引导由全局组件 phone-guide 处理（登录成功且 isNewUser 时触发）
onShow(() => {
  loadHotRaces()
})

// ===== 页面骨架阶段的入口跳转 =====

// 打开活动页（赛事列表 tab）
function goActivity() {
  uni.switchTab({ url: '/pages/activity/activity' })
}

// 打开赛事咨讯列表页（对接 /api/content/notice）
function goNews() {
  uni.navigateTo({ url: '/pages/news/news' })
}

// 打开路线地图页（需登录：轨迹查看属个人服务）
function goRouteMap() {
  requireLoginThen(() => uni.navigateTo({ url: '/pages/route-map/route-map' }), '路线地图')
}

// 打开实时轨迹页（需登录：基于我的报名赛事生成轨迹）
function goLiveTrack() {
  requireLoginThen(() => uni.navigateTo({ url: '/pages/live-track/live-track' }), '实时轨迹')
}

/**
 * 需要登录的功能统一门槛：未登录弹窗提示，确认后静默登录再执行跳转
 * 注：首次登录（新用户）时，登录成功后由全局组件 phone-guide 弹出手机号授权引导（模态），
 * 授权/拒绝后才能操作目标页面
 */
function requireLoginThen(afterLogin, feature = '该功能') {
  const { isLoggedIn, ensureLogin } = authApi
  if (isLoggedIn()) {
    afterLogin()
    return
  }
  uni.showModal({
    title: '未登录',
    content: `${feature}需要先登录，是否立即登录？`,
    success: async (res) => {
      if (!res.confirm) return
      uni.showLoading({ title: '登录中' })
      try {
        await ensureLogin()
        uni.hideLoading()
        afterLogin()
      } catch (e) {
        uni.hideLoading()
        uni.showToast({ title: '登录失败，请重试', icon: 'none' })
      }
    },
  })
}

// 打开我的报名页（需登录：点击时未登录先引导登录，登录后进入）
function goMyRegistrations() {
  requireLoginThen(() => uni.navigateTo({ url: '/pages/my-registrations/my-registrations' }), '我的报名')
}

// 打开成绩查询页（需登录：点击时未登录先引导登录，登录后进入）
function goResult() {
  requireLoginThen(() => uni.navigateTo({ url: '/pages/result/result' }), '成绩查询')
}

// 未开发功能占位提示（后续接入对应接口后替换为真实跳转）
function todoTip() {
  uni.showToast({ title: '功能建设中，敬请期待', icon: 'none' })
}

// ===== 赛事资讯：优先拉取后端 /api/content/notice（需 wx-token），失败时降级到本地演示数据 =====
// 演示数据（对应 /api/content/notice 返回的 Content 列表）
const notices = ref([
  { id: 1, title: '2026 芒市国际马拉松报名须知', date: '01-15' },
  { id: 2, title: '关于调整赛事物资领取时间的通知', date: '01-12' },
  { id: 3, title: '2025 年 12 月赛事成绩公示与证书下载', date: '01-08' },
])

// 后端 startTime（"yyyy-MM-dd HH:mm:ss"）转为列表展示的 "MM-DD"
function formatNoticeDate(time) {
  const s = String(time || '')
  return s.length >= 10 ? s.slice(5, 10) : s
}

// 拉取资讯：request 层会自动登录/重登并携带 wx-token；失败保持演示数据不阻塞页面。
// 首页只展示前 3 条，更多点击"更多 ›"进入资讯列表页查看全部。
function loadNotices() {
  getNoticeList()
    .then((list) => {
      if (Array.isArray(list) && list.length > 0) {
        notices.value = list
          .map((item) => ({
            id: item.id,
            title: item.title || '',
            date: formatNoticeDate(item.startTime),
          }))
          .slice(0, 3)
      }
    })
    .catch((err) => {
      console.log('资讯加载失败，使用演示数据', err)
    })
}

// 页面加载时拉取资讯
loadNotices()
</script>

<style scoped lang="scss">
/* ===== 顶部大图区：高度由 onPageScroll 动态绑定（上滑收起） ===== */
.hero {
  position: relative;
  box-sizing: border-box;
  border-radius: 0 0 32rpx 32rpx;
  overflow: hidden;
  padding-bottom: 72rpx;
}

/* 大图背景层：<image> 标签铺满（WXSS background-image 不支持本地图，见微信官方文档）；
   高度固定由脚本计算，transform 位移实现视差收起，height/transform 由 onPageScroll 绑定 */
.hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 0;
}

/* 顶部压暗渐变：海报上半部较亮（实测亮度 ~230），白色导航文字需较强遮罩保证可读 */
.hero::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 320rpx;
  background: linear-gradient(180deg, rgba(20, 83, 45, 0.72), rgba(20, 83, 45, 0));
  z-index: 1;
  pointer-events: none;
}

.hero-nav {
  position: relative;
  z-index: 2;
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

/* ===== 2x2 功能入口：上移重叠到海报底部，上滑时吸顶悬浮在背景上 ===== */
.entry-grid {
  position: sticky;
  top: 0;
  z-index: 10;
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

/* 问号（常见问题）：绝对定位铺满图标盒并居中，与其他三个图标视觉对齐 */
.sh-q {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
  text-align: center;
  line-height: 80rpx;
  font-size: 52rpx;
  font-weight: 700;
  color: #D97706;
}

/* 勾选清单（我的报名）：三条横线 + 右上对勾圆，示意报名记录列表 */
.sh-list-line {
  position: absolute;
  left: 18rpx;
  width: 26rpx;
  height: 4rpx;
  border-radius: 2rpx;
  background-color: #16A34A;
}
.sh-list-line.l1 { top: 20rpx; }
.sh-list-line.l2 { top: 30rpx; }
.sh-list-line.l3 { top: 40rpx; }

.sh-list-check {
  position: absolute;
  left: 50rpx;
  top: 24rpx;
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background-color: #16A34A;
}
.sh-list-check::after {
  content: '';
  position: absolute;
  left: 8rpx;
  top: 5rpx;
  width: 7rpx;
  height: 11rpx;
  border-right: 3rpx solid #ffffff;
  border-bottom: 3rpx solid #ffffff;
  transform: rotate(45deg);
}

/* 定位图钉（路线地图）：圆头 + 白芯 + 下尖角 */
.sh-pin-head {
  position: absolute;
  left: 24rpx;
  top: 14rpx;
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background-color: #0D9488;
}

.sh-pin-head::after {
  content: '';
  position: absolute;
  left: 11rpx;
  top: 11rpx;
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background-color: #ffffff;
}

.sh-pin-tail {
  position: absolute;
  left: 34rpx;
  top: 46rpx;
  width: 0;
  height: 0;
  border-left: 6rpx solid transparent;
  border-right: 6rpx solid transparent;
  border-top: 12rpx solid #0D9488;
}

/* 雷达（实时轨迹）：双环 + 中心点，示意实时位置信号 */
.sh-track-ring {
  position: absolute;
  border-radius: 50%;
  border: 4rpx solid #16A34A;
}

.sh-track-ring.r1 {
  left: 28rpx;
  top: 28rpx;
  width: 24rpx;
  height: 24rpx;
}

.sh-track-ring.r2 {
  left: 16rpx;
  top: 16rpx;
  width: 48rpx;
  height: 48rpx;
  opacity: 0.45;
}

.sh-track-dot {
  position: absolute;
  left: 36rpx;
  top: 36rpx;
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background-color: #16A34A;
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