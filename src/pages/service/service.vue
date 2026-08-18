<!-- 服务页：2x3 服务入口网格 + 赛事日历（静态演示数据） -->
<template>
  <view class="page">
    <!-- 2x3 服务入口 -->
    <view class="service-grid mz-card">
      <!-- 报名服务：公告单图标（跳转活动页） -->
      <view class="service-item" @tap="goActivity">
        <view class="sicon tint-green">
          <view class="sh-doc">
            <view class="sh-doc-line l1"></view>
            <view class="sh-doc-line l2"></view>
            <view class="sh-doc-line l3"></view>
          </view>
        </view>
        <text class="service-label">报名服务</text>
      </view>
      <!-- 成绩查询：放大镜图标（占位提示） -->
      <view class="service-item" @tap="todoTip">
        <view class="sicon tint-teal">
          <view class="sh-mag-lens"></view>
          <view class="sh-mag-handle"></view>
        </view>
        <text class="service-label">成绩查询</text>
      </view>
      <!-- 赛事地图：定位图标（占位提示） -->
      <view class="service-item" @tap="todoTip">
        <view class="sicon tint-amber">
          <view class="sh-pin-head"></view>
          <view class="sh-pin-hole"></view>
          <view class="sh-pin-tail"></view>
        </view>
        <text class="service-label">赛事地图</text>
      </view>
      <!-- 赛事公告：公告单图标（占位提示） -->
      <view class="service-item" @tap="todoTip">
        <view class="sicon tint-teal">
          <view class="sh-doc">
            <view class="sh-doc-line l1"></view>
            <view class="sh-doc-line l2"></view>
            <view class="sh-doc-line l3"></view>
          </view>
        </view>
        <text class="service-label">赛事公告</text>
      </view>
      <!-- 常见问题：问号（占位提示） -->
      <view class="service-item" @tap="todoTip">
        <view class="sicon tint-amber">
          <text class="sh-q">?</text>
        </view>
        <text class="service-label">常见问题</text>
      </view>
      <!-- 联系我们：对话气泡（占位提示） -->
      <view class="service-item" @tap="todoTip">
        <view class="sicon tint-green">
          <view class="sh-bubble">
            <view class="sh-bubble-dot d1"></view>
            <view class="sh-bubble-dot d2"></view>
            <view class="sh-bubble-dot d3"></view>
          </view>
          <view class="sh-bubble-tail"></view>
        </view>
        <text class="service-label">联系我们</text>
      </view>
    </view>

    <!-- 赛事日历 -->
    <view class="section">
      <view class="section-head">
        <text class="section-title">赛事日历</text>
        <text class="section-more" @tap="todoTip">全部日程 ›</text>
      </view>
      <view class="calendar-card mz-card">
        <view class="calendar-row" v-for="item in calendar" :key="item.id">
          <!-- 左侧日期块 -->
          <view class="calendar-date">
            <text class="calendar-month">{{ item.month }}</text>
            <text class="calendar-day">{{ item.day }}</text>
          </view>
          <!-- 右侧赛事信息 -->
          <view class="calendar-info">
            <text class="calendar-name">{{ item.name }}</text>
            <text class="calendar-sub">{{ item.weekday }} · {{ item.location }}</text>
          </view>
          <text class="calendar-status" :class="{ done: item.status === '已结束' }">{{ item.status }}</text>
        </view>
      </view>
    </view>

    <view class="safe-bottom"></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

// ===== 页面骨架阶段的入口跳转 =====

// 打开活动页（赛事列表 tab）
function goActivity() {
  uni.switchTab({ url: '/pages/activity/activity' })
}

// 未开发功能占位提示（后续接入对应接口后替换为真实跳转）
function todoTip() {
  uni.showToast({ title: '功能建设中，敬请期待', icon: 'none' })
}

// 赛事日历演示数据（与活动页赛事对齐）
const calendar = ref([
  { id: 1, month: '9月', day: '06', name: '2026 芒市国际马拉松', weekday: '周日', location: '云南 · 芒市', status: '报名中' },
  { id: 2, month: '10月', day: '11', name: '2026 大理环洱海马拉松', weekday: '周日', location: '云南 · 大理', status: '报名中' },
  { id: 3, month: '12月', day: '07', name: '2025 抚仙湖高原马拉松', weekday: '周日', location: '云南 · 玉溪', status: '已结束' },
])
</script>

<style scoped lang="scss">
/* ===== 服务网格 ===== */
.service-grid {
  margin: 24rpx 24rpx 0;
  padding: 28rpx 8rpx;
  display: flex;
  flex-wrap: wrap;
}

.service-item {
  width: 33.33%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 0;
  box-sizing: border-box;
}

.service-label {
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #374151;
}

/* ===== 通用小图标容器（浅色底 + CSS 图形） ===== */
.sicon {
  position: relative;
  width: 88rpx;
  height: 88rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tint-green { background-color: #DCFCE7; }
.tint-amber { background-color: #FEF3C7; }
.tint-teal  { background-color: #CCFBF1; }

/* 公告单（报名服务） */
.sh-doc {
  position: relative;
  width: 32rpx;
  height: 44rpx;
  border-radius: 6rpx;
  background-color: #16A34A;
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
  top: 20rpx;
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  border: 6rpx solid #0D9488;
  box-sizing: border-box;
}
.sh-mag-handle {
  position: absolute;
  left: 52rpx;
  top: 50rpx;
  width: 18rpx;
  height: 6rpx;
  border-radius: 3rpx;
  background-color: #0D9488;
  transform: rotate(45deg);
}

/* 定位图标（赛事地图） */
.sh-pin-head {
  position: absolute;
  left: 26rpx;
  top: 18rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background-color: #D97706;
}
.sh-pin-hole {
  position: absolute;
  left: 37rpx;
  top: 29rpx;
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background-color: #ffffff;
}
.sh-pin-tail {
  position: absolute;
  left: 38rpx;
  top: 48rpx;
  width: 0;
  height: 0;
  border-left: 6rpx solid transparent;
  border-right: 6rpx solid transparent;
  border-top: 14rpx solid #D97706;
}

/* 问号（常见问题） */
.sh-q {
  font-size: 52rpx;
  font-weight: 700;
  color: #D97706;
  line-height: 88rpx;
}

/* 对话气泡（联系我们） */
.sh-bubble {
  position: absolute;
  left: 20rpx;
  top: 22rpx;
  width: 48rpx;
  height: 34rpx;
  border-radius: 12rpx;
  background-color: #16A34A;
}
.sh-bubble-dot {
  position: absolute;
  top: 15rpx;
  width: 6rpx;
  height: 6rpx;
  border-radius: 50%;
  background-color: #ffffff;
}
.sh-bubble-dot.d1 { left: 14rpx; }
.sh-bubble-dot.d2 { left: 25rpx; }
.sh-bubble-dot.d3 { left: 36rpx; }
.sh-bubble-tail {
  position: absolute;
  left: 30rpx;
  top: 54rpx;
  width: 0;
  height: 0;
  border-left: 6rpx solid transparent;
  border-right: 6rpx solid transparent;
  border-top: 10rpx solid #16A34A;
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

/* 赛事日历卡片 */
.calendar-card {
  margin: 0 24rpx;
  padding: 8rpx 24rpx;
}

.calendar-row {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #F3F4F6;
}

.calendar-row:last-child {
  border-bottom: none;
}

/* 左侧日期块 */
.calendar-date {
  width: 72rpx;
  height: 76rpx;
  border-radius: 12rpx;
  background-color: #DCFCE7;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.calendar-month {
  font-size: 20rpx;
  color: #15803D;
}

.calendar-day {
  font-size: 32rpx;
  font-weight: 700;
  color: #15803D;
  line-height: 34rpx;
}

.calendar-info {
  flex: 1;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.calendar-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1F2937;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.calendar-sub {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #9CA3AF;
}

.calendar-status {
  flex-shrink: 0;
  margin-left: 16rpx;
  font-size: 22rpx;
  color: #15803D;
  background-color: #DCFCE7;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
}

.calendar-status.done {
  color: #9CA3AF;
  background-color: #F3F4F6;
}
</style>