<!-- 我的页：用户卡片（登录态）+ 菜单列表 -->
<template>
  <view class="page">
    <!-- 用户卡片 -->
    <view class="user-card">
      <!-- 头像占位：白色圆底 + CSS 人像剪影 -->
      <view class="avatar">
        <view class="avatar-head"></view>
        <view class="avatar-body"></view>
      </view>
      <view class="user-info">
        <text class="user-name">{{ loggedIn ? (userInfo.name || '微信用户') : '未登录' }}</text>
        <text class="user-sub">{{ loggedIn ? maskPhone(userInfo.phone) : '登录后享受更多服务' }}</text>
      </view>
      <button v-if="!loggedIn" class="login-btn" size="mini" @tap="onLogin">登录</button>
      <button v-else class="login-btn" size="mini" @tap="onLogout">退出</button>
    </view>

    <!-- 菜单列表 -->
    <view class="menu-card mz-card">
      <!-- 我的报名：接真实报名列表 -->
      <view class="menu-row" @tap="goRegistrations">
        <view class="menu-icon tint-green">
          <view class="sh-flag-pole"></view>
          <view class="sh-flag-cloth"></view>
        </view>
        <text class="menu-title">我的报名</text>
        <text class="menu-arrow">›</text>
      </view>
      <!-- 我的成绩：接真实成绩列表 -->
      <view class="menu-row" @tap="goResults">
        <view class="menu-icon tint-teal">
          <view class="sh-bar b1"></view>
          <view class="sh-bar b2"></view>
          <view class="sh-bar b3"></view>
        </view>
        <text class="menu-title">我的成绩</text>
        <text class="menu-arrow">›</text>
      </view>
      <!-- 收藏赛事：爱心（占位提示） -->
      <view class="menu-row" @tap="todoTip">
        <view class="menu-icon tint-rose">
          <view class="sh-heart-c1"></view>
          <view class="sh-heart-c2"></view>
          <view class="sh-heart-sq"></view>
        </view>
        <text class="menu-title">收藏赛事</text>
        <text class="menu-arrow">›</text>
      </view>
      <!-- 消息通知：信封（占位提示） -->
      <view class="menu-row" @tap="todoTip">
        <view class="menu-icon tint-amber">
          <view class="sh-env"></view>
          <view class="sh-env-flap"></view>
        </view>
        <text class="menu-title">消息通知</text>
        <text class="menu-arrow">›</text>
      </view>
      <!-- 设置：滑杆（占位提示） -->
      <view class="menu-row" @tap="todoTip">
        <view class="menu-icon tint-green">
          <view class="sh-line sl1"></view>
          <view class="sh-line sl2"></view>
          <view class="sh-line sl3"></view>
          <view class="sh-knob k1"></view>
          <view class="sh-knob k2"></view>
          <view class="sh-knob k3"></view>
        </view>
        <text class="menu-title">设置</text>
        <text class="menu-arrow">›</text>
      </view>
      <!-- 关于我们：信息圈（占位提示） -->
      <view class="menu-row" @tap="todoTip">
        <view class="menu-icon tint-teal">
          <view class="sh-info">
            <view class="sh-info-dot"></view>
            <view class="sh-info-bar"></view>
          </view>
        </view>
        <text class="menu-title">关于我们</text>
        <text class="menu-arrow">›</text>
      </view>
      <!-- 常见问题：问号（占位提示） -->
      <view class="menu-row" @tap="todoTip">
        <view class="menu-icon tint-amber">
          <text class="sh-faq">?</text>
        </view>
        <text class="menu-title">常见问题</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <!-- 版本信息 -->
    <text class="version-text">马拉松报名 · 版本 1.0.0</text>

    <view class="safe-bottom"></view>
    <!-- 自定义 tabBar 占位 -->
    <view class="tabbar-space"></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { isLoggedIn as hasToken, getMe, ensureLogin, logout } from '@/api/auth'
import { syncTabBarSelected } from '@/utils/tabbar'

const loggedIn = ref(false)
const userInfo = ref({})

onShow(async () => {
  // 同步自定义 tabBar 选中态（我的 tab = 2）
  syncTabBarSelected(2)
  loggedIn.value = hasToken()
  if (loggedIn.value) {
    try {
      userInfo.value = (await getMe()) || {}
    } catch (e) {
      // 401 时 request 层已自动重登录并重试；仍失败说明会话不可用
      loggedIn.value = false
    }
  }
})

/** 登录：微信静默登录（无需弹授权窗），成功后拉取用户信息 */
async function onLogin() {
  uni.showLoading({ title: '登录中' })
  try {
    await ensureLogin()
    loggedIn.value = true
    userInfo.value = (await getMe()) || {}
    uni.hideLoading()
    uni.showToast({ title: '登录成功', icon: 'success' })
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: '登录失败，请重试', icon: 'none' })
  }
}

/** 退出登录：清除本地 token */
function onLogout() {
  uni.showModal({
    title: '提示',
    content: '确定退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        logout()
        loggedIn.value = false
        userInfo.value = {}
      }
    },
  })
}

/** 我的报名：未登录先提示登录 */
function goRegistrations() {
  if (!loggedIn.value) {
    promptLogin('查看我的报名')
    return
  }
  uni.navigateTo({ url: '/pages/my-registrations/my-registrations' })
}

/** 我的成绩：未登录先提示登录 */
function goResults() {
  if (!loggedIn.value) {
    promptLogin('查看我的成绩')
    return
  }
  uni.navigateTo({ url: '/pages/my-results/my-results' })
}

/** 未登录引导：弹窗确认后静默登录 */
function promptLogin(feature) {
  uni.showModal({
    title: '未登录',
    content: `${feature}需要先登录，是否立即登录？`,
    success: async (res) => {
      if (!res.confirm) return
      uni.showLoading({ title: '登录中' })
      try {
        await ensureLogin()
        loggedIn.value = true
        userInfo.value = (await getMe()) || {}
        uni.hideLoading()
        uni.showToast({ title: '登录成功', icon: 'success' })
      } catch (e) {
        uni.hideLoading()
        uni.showToast({ title: '登录失败，请重试', icon: 'none' })
      }
    },
  })
}

/** 手机号脱敏：152****2718 */
function maskPhone(phone) {
  if (!phone || phone.length < 7) return ''
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

// 未开发功能占位提示
function todoTip() {
  uni.showToast({ title: '功能建设中，敬请期待', icon: 'none' })
}
</script>

<style scoped lang="scss">
/* ===== 用户卡片 ===== */
.user-card {
  margin: 24rpx 24rpx 0;
  padding: 40rpx 32rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #16A34A 0%, #15803D 100%);
  display: flex;
  align-items: center;
  box-shadow: 0 8rpx 24rpx rgba(22, 163, 74, 0.25);
}

/* 头像：白色圆底 + CSS 人像剪影 */
.avatar {
  position: relative;
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.95);
  flex-shrink: 0;
}

.avatar-head {
  position: absolute;
  left: 40rpx;
  top: 28rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background-color: #16A34A;
}

.avatar-body {
  position: absolute;
  left: 30rpx;
  top: 74rpx;
  width: 60rpx;
  height: 28rpx;
  border-radius: 30rpx;
  background-color: #16A34A;
}

.user-info {
  flex: 1;
  margin-left: 24rpx;
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 34rpx;
  font-weight: 700;
  color: #ffffff;
}

.user-sub {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.85);
}

/* 登录/退出按钮：白色胶囊 */
.login-btn {
  margin: 0;
  padding: 0 32rpx;
  height: 60rpx;
  line-height: 60rpx;
  font-size: 26rpx;
  color: #15803D;
  background-color: #ffffff;
  border-radius: 30rpx;
  flex-shrink: 0;
}

.login-btn::after {
  border: none;
}

/* ===== 菜单列表 ===== */
.menu-card {
  margin: 24rpx 24rpx 0;
  padding: 8rpx 24rpx;
}

.menu-row {
  display: flex;
  align-items: center;
  padding: 22rpx 0;
  border-bottom: 1rpx solid #F3F4F6;
}

.menu-row:last-child {
  border-bottom: none;
}

.menu-title {
  flex: 1;
  margin-left: 20rpx;
  font-size: 28rpx;
  color: #1F2937;
}

.menu-arrow {
  font-size: 36rpx;
  color: #D1D5DB;
}

/* 菜单小图标容器 */
.menu-icon {
  position: relative;
  width: 56rpx;
  height: 56rpx;
  border-radius: 14rpx;
  flex-shrink: 0;
}

.tint-green { background-color: #DCFCE7; }
.tint-amber { background-color: #FEF3C7; }
.tint-teal  { background-color: #CCFBF1; }
.tint-rose  { background-color: #FEE2E2; }

/* 旗帜（我的报名） */
.sh-flag-pole {
  position: absolute;
  left: 20rpx;
  top: 10rpx;
  width: 5rpx;
  height: 36rpx;
  border-radius: 3rpx;
  background-color: #16A34A;
}
.sh-flag-cloth {
  position: absolute;
  left: 25rpx;
  top: 10rpx;
  width: 20rpx;
  height: 14rpx;
  border-radius: 3rpx;
  background-color: #16A34A;
}

/* 柱状图（我的成绩） */
.sh-bar {
  position: absolute;
  bottom: 12rpx;
  width: 8rpx;
  border-radius: 4rpx;
  background-color: #0D9488;
}
.sh-bar.b1 { left: 14rpx; height: 14rpx; }
.sh-bar.b2 { left: 24rpx; height: 24rpx; }
.sh-bar.b3 { left: 34rpx; height: 32rpx; }

/* 爱心（收藏赛事） */
.sh-heart-sq {
  position: absolute;
  left: 20rpx;
  top: 26rpx;
  width: 18rpx;
  height: 18rpx;
  border-radius: 3rpx;
  background-color: #EF4444;
  transform: rotate(45deg);
}
.sh-heart-c1,
.sh-heart-c2 {
  position: absolute;
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
  background-color: #EF4444;
}
.sh-heart-c1 { left: 13rpx; top: 19rpx; }
.sh-heart-c2 { left: 27rpx; top: 19rpx; }

/* 信封（消息通知） */
.sh-env {
  position: absolute;
  left: 10rpx;
  top: 16rpx;
  width: 36rpx;
  height: 26rpx;
  border-radius: 5rpx;
  background-color: #D97706;
}
.sh-env-flap {
  position: absolute;
  left: 10rpx;
  top: 16rpx;
  width: 0;
  height: 0;
  border-left: 18rpx solid transparent;
  border-right: 18rpx solid transparent;
  border-top: 11rpx solid rgba(255, 255, 255, 0.85);
}

/* 滑杆（设置） */
.sh-line {
  position: absolute;
  left: 12rpx;
  width: 32rpx;
  height: 4rpx;
  border-radius: 2rpx;
  background-color: #16A34A;
}
.sh-line.sl1 { top: 18rpx; }
.sh-line.sl2 { top: 27rpx; }
.sh-line.sl3 { top: 36rpx; }
.sh-knob {
  position: absolute;
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background-color: #ffffff;
  border: 3rpx solid #16A34A;
  box-sizing: border-box;
}
.sh-knob.k1 { left: 24rpx; top: 15rpx; }
.sh-knob.k2 { left: 34rpx; top: 24rpx; }
.sh-knob.k3 { left: 18rpx; top: 33rpx; }

/* 信息圈（关于我们） */
.sh-info {
  position: absolute;
  left: 14rpx;
  top: 12rpx;
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  border: 4rpx solid #0D9488;
  box-sizing: border-box;
}
.sh-info-dot {
  position: absolute;
  left: 25rpx;
  top: 17rpx;
  width: 6rpx;
  height: 6rpx;
  border-radius: 50%;
  background-color: #0D9488;
}
.sh-info-bar {
  position: absolute;
  left: 25rpx;
  top: 26rpx;
  width: 6rpx;
  height: 12rpx;
  border-radius: 3rpx;
  background-color: #0D9488;
}

/* 问号（常见问题）：绝对定位铺满图标盒并居中 */
.sh-faq {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
  text-align: center;
  line-height: 56rpx;
  font-size: 36rpx;
  font-weight: 700;
  color: #D97706;
}

/* ===== 版本信息 ===== */
.version-text {
  display: block;
  margin-top: 48rpx;
  text-align: center;
  font-size: 22rpx;
  color: #B8BEC9;
}

/* 自定义 tabBar 悬浮占位（不占文档流，需预留底部高度） */
.tabbar-space {
  height: 100rpx;
}
</style>