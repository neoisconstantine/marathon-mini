<!-- 赛事咨讯页：资讯列表（对接后端 GET /api/content/notice，需 wx-token，请求层自动登录/重登） -->
<template>
  <view class="page">
    <!-- 加载中 -->
    <view v-if="loading" class="empty">
      <text class="empty-text">加载中...</text>
    </view>

    <!-- 资讯列表 -->
    <view v-else-if="newsList.length" class="news-list">
      <view class="news-card mz-card" v-for="item in newsList" :key="item.id" @tap="onItemTap(item)">
        <text class="news-title">{{ item.title }}</text>
        <text class="news-summary" v-if="item.summary">{{ item.summary }}</text>
        <text class="news-date">{{ item.date }}</text>
      </view>
    </view>

    <!-- 空态（后端不可用或无数据） -->
    <view v-else class="empty">
      <text class="empty-text">暂无赛事资讯</text>
    </view>

    <view class="safe-bottom"></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { getNoticeList } from '@/api/content'

const loading = ref(true)
const newsList = ref([])

// 后端 startTime（"yyyy-MM-dd HH:mm:ss"）转为列表展示的 "MM-DD"
function formatDate(time) {
  const s = String(time || '')
  return s.length >= 10 ? s.slice(5, 10) : s
}

// 拉取资讯列表：request 层自动携带 wx-token（缺失/过期自动重登重试）
function loadNews() {
  loading.value = true
  getNoticeList()
    .then((list) => {
      newsList.value = (Array.isArray(list) ? list : []).map((item) => ({
        id: item.id,
        title: item.title || '',
        summary: item.summary || '',
        date: formatDate(item.startTime),
      }))
    })
    .catch((err) => {
      console.log('资讯加载失败', err)
      newsList.value = []
    })
    .finally(() => {
      loading.value = false
    })
}

loadNews()

// 资讯详情页未开发，暂占位（后续对接 GET /api/content/{id} 或详情页）
function onItemTap(item) {
  uni.showToast({ title: '资讯详情建设中，敬请期待', icon: 'none' })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
}

.news-list {
  padding: 24rpx 24rpx 0;
}

.news-card {
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.news-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #1F2937;
}

.news-summary {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #6B7280;
  line-height: 1.6;
  overflow: hidden;
  /* 多行截断（-webkit-box 方案） */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.news-date {
  display: block;
  margin-top: 16rpx;
  font-size: 22rpx;
  color: #9CA3AF;
}

/* 空态 */
.empty {
  padding-top: 240rpx;
  display: flex;
  justify-content: center;
}

.empty-text {
  font-size: 26rpx;
  color: #9CA3AF;
}
</style>
