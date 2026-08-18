<!-- 赛事活动页：顶部筛选 tab + 赛事卡片列表（静态演示数据） -->
<template>
  <view class="page">
    <!-- 筛选 tab：本地状态切换高亮 + 客户端过滤演示数据 -->
    <view class="filter-bar">
      <view class="filter-item" :class="{ active: activeTab === tab.key }"
        v-for="tab in tabs" :key="tab.key" @tap="activeTab = tab.key">
        <text class="filter-text">{{ tab.label }}</text>
      </view>
    </view>

    <!-- 赛事列表 -->
    <view class="race-list">
      <view class="race-card mz-card" v-for="race in filteredRaces" :key="race.id">
        <!-- 赛事名 + 状态 -->
        <view class="race-top">
          <text class="race-name">{{ race.name }}</text>
          <text class="race-status" :class="race.statusClass">{{ race.status }}</text>
        </view>
        <!-- 时间与地点 -->
        <view class="race-meta">
          <text class="race-meta-item">{{ race.date }}</text>
          <text class="race-meta-item">{{ race.location }}</text>
        </view>
        <!-- 报名时间（event.signup_start ~ signup_end） -->
        <view class="race-meta">
          <text class="race-meta-item">报名 {{ race.signup }}</text>
        </view>
        <!-- 名额进度（event.registered / event.total_quota） -->
        <view class="quota-row">
          <text class="quota-text">已报名 {{ race.registered }}/{{ race.quota }}</text>
          <view class="quota-bar">
            <view class="quota-fill" :style="{ width: race.percent + '%' }"></view>
          </view>
        </view>
        <!-- 距离组别 + 报名按钮 -->
        <view class="race-bottom">
          <view class="race-distances">
            <text class="distance-tag" v-for="d in race.distances" :key="d">{{ d }}</text>
          </view>
          <button class="race-btn" :class="{ disabled: race.status !== '报名中' }" size="mini" @tap="onSignup(race)">
            {{ race.status === '报名中' ? '立即报名' : race.status === '已结束' ? '查看成绩' : '进行中' }}
          </button>
        </view>
      </view>
    </view>

    <view class="safe-bottom"></view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

// 筛选 tab 定义（对齐 event.status：报名中/进行中/已结束；未发布不下发到 C 端）
const tabs = [
  { key: 'all', label: '全部' },
  { key: 'open', label: '报名中' },
  { key: 'ongoing', label: '进行中' },
  { key: 'done', label: '已结束' },
]

// 当前选中的 tab
const activeTab = ref('all')

// 静态演示赛事数据（对应 /api/event/list；statusClass 对齐 event.status，quota 对应 total_quota/registered）
const races = ref([
  { id: 1, name: '2026 芒市国际马拉松', date: '2026-09-06', signup: '06-01 ~ 08-31', location: '云南 · 芒市', distances: ['全程', '半程', '迷你'], status: '报名中', statusClass: 's-open', registered: 3280, quota: 5000, percent: 66 },
  { id: 2, name: '2026 大理环洱海马拉松', date: '2026-10-11', signup: '07-01 ~ 09-30', location: '云南 · 大理', distances: ['全程', '半程'], status: '报名中', statusClass: 's-open', registered: 640, quota: 2000, percent: 32 },
  { id: 3, name: '2026 香格里拉高原马拉松', date: '2026-10-25', signup: '07-15 ~ 10-10', location: '云南 · 迪庆', distances: ['全程', '半程'], status: '报名中', statusClass: 's-open', registered: 0, quota: 2000, percent: 0 },
  { id: 4, name: '2026 西双版纳热带雨林马拉松', date: '2026-11-08', signup: '08-01 ~ 10-31', location: '云南 · 版纳', distances: ['全程', '半程', '迷你'], status: '报名中', statusClass: 's-open', registered: 96, quota: 1500, percent: 6 },
  { id: 5, name: '2026 丽江古城马拉松', date: '2026-08-18', signup: '06-01 ~ 08-10', location: '云南 · 丽江', distances: ['迷你'], status: '进行中', statusClass: 's-ongoing', registered: 3000, quota: 3000, percent: 100 },
  { id: 6, name: '2026 昆明高原半程马拉松', date: '2026-04-20', signup: '01-15 ~ 03-31', location: '云南 · 昆明', distances: ['半程', '迷你'], status: '已结束', statusClass: 's-done', registered: 2980, quota: 3000, percent: 99 },
  { id: 7, name: '2025 抚仙湖高原马拉松', date: '2025-12-07', signup: '10-01 ~ 11-20', location: '云南 · 玉溪', distances: ['全程', '半程'], status: '已结束', statusClass: 's-done', registered: 2560, quota: 2560, percent: 100 },
  { id: 8, name: '2025 腾冲火山热海马拉松', date: '2025-11-02', signup: '09-01 ~ 10-20', location: '云南 · 保山', distances: ['半程', '迷你'], status: '已结束', statusClass: 's-done', registered: 1800, quota: 2000, percent: 90 },
])

// 按当前 tab 过滤（纯前端演示，后续替换为接口筛选 /api/event/list?status=）
const filteredRaces = computed(() => {
  if (activeTab.value === 'all') {
    return races.value
  }
  const statusMap = { open: '报名中', ongoing: '进行中', done: '已结束' }
  const target = statusMap[activeTab.value]
  return races.value.filter((race) => race.status === target)
})

// 报名按钮：骨架阶段占位提示（后续对接 /api/registration/create）
function onSignup(race) {
  if (race.status === '报名中') {
    uni.showToast({ title: '报名功能建设中，敬请期待', icon: 'none' })
  } else {
    uni.showToast({ title: '该赛事暂不可报名', icon: 'none' })
  }
}
</script>

<style scoped lang="scss">
/* ===== 筛选 tab ===== */
.filter-bar {
  display: flex;
  background-color: #ffffff;
  padding: 20rpx 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.filter-item {
  flex: 1;
  text-align: center;
  padding: 12rpx 0;
}

.filter-text {
  font-size: 28rpx;
  color: #6B7280;
}

/* 选中态：绿色文字 + 浅绿胶囊底 */
.filter-item.active .filter-text {
  color: #15803D;
  font-weight: 600;
  background-color: #DCFCE7;
  padding: 8rpx 28rpx;
  border-radius: 24rpx;
}

/* ===== 赛事卡片 ===== */
.race-list {
  padding: 24rpx 24rpx 0;
}

.race-card {
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.race-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.race-name {
  flex: 1;
  font-size: 30rpx;
  font-weight: 600;
  color: #1F2937;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 状态标签配色 */
.race-status {
  flex-shrink: 0;
  margin-left: 16rpx;
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
}

.s-open { color: #15803D; background-color: #DCFCE7; }
.s-ongoing { color: #D97706; background-color: #FEF3C7; }
.s-done { color: #9CA3AF; background-color: #F3F4F6; }

.race-meta {
  margin-top: 12rpx;
  display: flex;
  font-size: 24rpx;
  color: #9CA3AF;
}

.race-meta-item {
  margin-right: 24rpx;
}

.race-bottom {
  margin-top: 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.race-distances {
  display: flex;
}

.distance-tag {
  font-size: 22rpx;
  color: #6B7280;
  background-color: #F3F4F6;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  margin-right: 12rpx;
}

/* 报名按钮：报名中为绿色，其余置灰 */
.race-btn {
  margin: 0;
  padding: 0 32rpx;
  height: 60rpx;
  line-height: 60rpx;
  font-size: 24rpx;
  color: #ffffff;
  background-color: #16A34A;
  border-radius: 30rpx;
}

.race-btn.disabled {
  background-color: #E5E7EB;
  color: #9CA3AF;
}

/* 按钮默认伪类重置：避免小程序 button 自带边框 */
.race-btn::after {
  border: none;
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
</style>