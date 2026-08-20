<!-- 成绩查询页：我的成绩列表（GET /api/result/my，需登录） -->
<template>
  <view class="page">
    <!-- 未登录：引导登录 -->
    <view v-if="needLogin" class="empty-box">
      <view class="empty-icon">
        <view class="sh-bar b1"></view>
        <view class="sh-bar b2"></view>
        <view class="sh-bar b3"></view>
      </view>
      <text class="empty-text">登录后查看我的成绩</text>
      <button class="empty-btn" size="mini" @tap="goLogin">去登录</button>
    </view>

    <!-- 已登录但无数据 -->
    <view v-else-if="!loading && results.length === 0" class="empty-box">
      <view class="empty-icon">
        <view class="sh-bar b1"></view>
        <view class="sh-bar b2"></view>
        <view class="sh-bar b3"></view>
      </view>
      <text class="empty-text">暂无成绩记录</text>
    </view>

    <!-- 成绩列表 -->
    <view v-else class="list">
      <view v-for="item in results" :key="item.id" class="result-card mz-card">
        <view class="result-top">
          <text class="result-event">{{ item.eventName || '未知赛事' }}</text>
          <text class="result-bib">号码 {{ item.bib || '—' }}</text>
        </view>
        <view class="result-grid">
          <view class="result-cell">
            <text class="cell-label">枪声成绩</text>
            <text class="cell-val">{{ item.gunTime || '—' }}</text>
          </view>
          <view class="result-cell">
            <text class="cell-label">净成绩</text>
            <text class="cell-val">{{ item.netTime || '—' }}</text>
          </view>
          <view class="result-cell">
            <text class="cell-label">平均配速</text>
            <text class="cell-val">{{ item.avgPace || '—' }}</text>
          </view>
          <view class="result-cell">
            <text class="cell-label">总排名</text>
            <text class="cell-val">{{ item.totalRank ? '第' + item.totalRank + '名' : '—' }}</text>
          </view>
        </view>
        <view class="result-detail" v-if="item.segments && item.segments.length" @tap="showDetail(item)">
          <text class="detail-text">查看分段明细</text>
          <text class="detail-arrow">›</text>
        </view>
      </view>
      <view class="safe-bottom"></view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getMyResults, getResultDetail } from '@/api/result'
import { isLoggedIn, ensureLogin } from '@/api/auth'

const results = ref([])
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
    const data = await getMyResults()
    results.value = Array.isArray(data) ? data : []
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

/** 分段明细：拉详情后弹窗展示 */
async function showDetail(item) {
  uni.showLoading({ title: '加载中' })
  try {
    const detail = await getResultDetail(item.id)
    uni.hideLoading()
    const segs = (detail && detail.segments) || []
    if (!segs.length) {
      uni.showToast({ title: '暂无分段数据', icon: 'none' })
      return
    }
    const lines = segs
      .map((s) => `${s.segmentName || s.cameraName || '分段'}：${s.splitTime || '—'}`)
      .join('\n')
    uni.showModal({
      title: item.eventName || '分段明细',
      content: lines,
      showCancel: false,
    })
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: (e && e.message) || '加载失败', icon: 'none' })
  }
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
  background-color: #CCFBF1;
}

.sh-bar {
  position: absolute;
  bottom: 24rpx;
  width: 12rpx;
  border-radius: 6rpx;
  background-color: #0D9488;
}
.sh-bar.b1 { left: 40rpx; height: 28rpx; }
.sh-bar.b2 { left: 54rpx; height: 48rpx; }
.sh-bar.b3 { left: 68rpx; height: 64rpx; }

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

/* 成绩卡片 */
.list {
  padding: 0 24rpx;
}

.result-card {
  margin-bottom: 24rpx;
  padding: 28rpx 28rpx;
}

.result-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.result-event {
  flex: 1;
  font-size: 30rpx;
  font-weight: 700;
  color: #1F2937;
}

.result-bib {
  flex-shrink: 0;
  margin-left: 16rpx;
  font-size: 24rpx;
  color: #9CA3AF;
}

.result-grid {
  margin-top: 24rpx;
  display: flex;
  flex-wrap: wrap;
}

.result-cell {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cell-label {
  font-size: 22rpx;
  color: #9CA3AF;
}

.cell-val {
  margin-top: 8rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #1F2937;
}

.result-detail {
  margin-top: 24rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #F3F4F6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-text {
  font-size: 24rpx;
  color: #16A34A;
}

.detail-arrow {
  margin-left: 4rpx;
  font-size: 28rpx;
  color: #16A34A;
}
</style>