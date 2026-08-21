<!-- 我的报名：报名记录列表（GET /api/registration/my，需登录） -->
<template>
  <view class="page">
    <!-- 未登录：引导登录 -->
    <view v-if="needLogin" class="empty-box">
      <view class="empty-icon">
        <view class="sh-flag-pole"></view>
        <view class="sh-flag-cloth"></view>
      </view>
      <text class="empty-text">登录后查看我的报名</text>
      <button class="empty-btn" size="mini" @tap="goLogin">去登录</button>
    </view>

    <!-- 已登录但无数据 -->
    <view v-else-if="!loading && registrations.length === 0" class="empty-box">
      <view class="empty-icon">
        <view class="sh-flag-pole"></view>
        <view class="sh-flag-cloth"></view>
      </view>
      <text class="empty-text">暂无报名记录</text>
      <button class="empty-btn" size="mini" @tap="goActivity">去报名</button>
    </view>

    <!-- 报名列表 -->
    <view v-else class="list">
      <view v-for="item in registrations" :key="item.id" class="reg-card mz-card">
        <view class="reg-top">
          <text class="reg-event">{{ item.eventName || '未知赛事' }}</text>
          <text class="reg-status" :class="'st-' + item.status">{{ statusText(item.status) }}</text>
        </view>
        <view class="reg-mid">
          <view class="bib-box">
            <text class="bib-label">参赛号</text>
            <text class="bib-num">{{ item.bib || '—' }}</text>
          </view>
          <view class="reg-time" v-if="item.eventStartTime">
            <text class="reg-time-label">比赛时间</text>
            <text class="reg-time-val">{{ formatTime(item.eventStartTime) }}</text>
          </view>
        </view>
      </view>
      <view class="safe-bottom"></view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getMyRegistrations } from '@/api/registration'
import { isLoggedIn, ensureLogin } from '@/api/auth'

const registrations = ref([])
const loading = ref(false)
const needLogin = ref(false)

onShow(() => {
  if (!isLoggedIn()) {
    needLogin.value = true
    return
  }
  needLogin.value = false
  loadList()
})

async function loadList() {
  loading.value = true
  try {
    const data = await getMyRegistrations()
    registrations.value = data
  } catch (e) {
    if (e && e.code === 401) {
      needLogin.value = true
    } else {
      uni.showToast({ title: (e && e.message) || '加载失败', icon: 'none' })
    }
  } finally {
    loading.value = false
  }
}

/** 点击去登录：静默登录成功后重新加载 */
async function goLogin() {
  uni.showLoading({ title: '登录中' })
  try {
    await ensureLogin()
    uni.hideLoading()
    needLogin.value = false
    loadList()
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: '登录失败，请重试', icon: 'none' })
  }
}

function goActivity() {
  uni.switchTab({ url: '/pages/activity/activity' })
}

/** 报名状态 0=已报名 1=已审核 2=已退赛 */
function statusText(s) {
  s = Number(s)
  if (s === 0) return '已报名'
  if (s === 1) return '已审核'
  if (s === 2) return '已退赛'
  return '未知'
}

function formatTime(t) {
  if (!t) return ''
  return String(t).slice(0, 10)
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background-color: $mz-bg-page;
  padding-top: 24rpx;
}

/* 空态/未登录 */
.empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 200rpx;
}

.empty-icon {
  position: relative;
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background-color: #DCFCE7;
}

.sh-flag-pole {
  position: absolute;
  left: 52rpx;
  top: 24rpx;
  width: 10rpx;
  height: 72rpx;
  border-radius: 5rpx;
  background-color: #16A34A;
}
.sh-flag-cloth {
  position: absolute;
  left: 62rpx;
  top: 24rpx;
  width: 40rpx;
  height: 28rpx;
  border-radius: 5rpx;
  background-color: #16A34A;
}

.empty-text {
  margin-top: 24rpx;
  font-size: 28rpx;
  color: #9CA3AF;
}

.empty-btn {
  margin-top: 32rpx;
  padding: 0 48rpx;
  height: 64rpx;
  line-height: 64rpx;
  font-size: 28rpx;
  color: #ffffff;
  background-color: #16A34A;
  border-radius: 32rpx;
}
.empty-btn::after {
  border: none;
}

/* 报名卡片 */
.list {
  padding: 0 24rpx;
}

.reg-card {
  margin-bottom: 24rpx;
  padding: 28rpx 28rpx;
}

.reg-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.reg-event {
  flex: 1;
  font-size: 30rpx;
  font-weight: 700;
  color: #1F2937;
}

.reg-status {
  flex-shrink: 0;
  margin-left: 16rpx;
  padding: 4rpx 16rpx;
  font-size: 22rpx;
  border-radius: 20rpx;
}
.st-0 { color: #D97706; background-color: #FEF3C7; }
.st-1 { color: #16A34A; background-color: #DCFCE7; }
.st-2 { color: #6B7280; background-color: #F3F4F6; }

.reg-mid {
  margin-top: 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bib-box {
  display: flex;
  flex-direction: column;
}
.bib-label,
.reg-time-label {
  font-size: 22rpx;
  color: #9CA3AF;
}
.bib-num {
  margin-top: 6rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #16A34A;
}

.reg-time {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.reg-time-val {
  margin-top: 6rpx;
  font-size: 26rpx;
  color: #4B5563;
}
</style>