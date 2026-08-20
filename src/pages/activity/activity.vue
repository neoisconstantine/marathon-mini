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
        <!-- 报名按钮（无需组别分类，直接报名） -->
        <view class="race-bottom">
          <button class="race-btn" :class="{ disabled: race.status !== '报名中' }" size="mini" @tap="onSignup(race)">
            {{ race.status === '报名中' ? '立即报名' : race.status === '已结束' ? '查看成绩' : '进行中' }}
          </button>
        </view>
      </view>
    </view>

    <!-- 报名表单弹层：姓名 + 手机号（微信快捷获取/手动输入）→ 支付 → 保存后台 -->
    <view class="sheet-mask" v-if="formVisible" @tap="closeForm">
      <view class="sheet" @tap.stop>
        <view class="sheet-title">报名信息</view>
        <view class="sheet-race">
          <text class="sheet-race-name">{{ formRace.name }}</text>
          <text class="sheet-race-fee">¥{{ formRace.fee }}</text>
        </view>

        <!-- 姓名 -->
        <view class="form-item">
          <text class="form-label">姓名</text>
          <input class="form-input" v-model="form.name" placeholder="请输入真实姓名"
            placeholder-class="ph" />
        </view>

        <!-- 手机号：手动输入 -->
        <view class="form-item">
          <text class="form-label">手机号</text>
          <input class="form-input" v-model="form.phone" type="number" maxlength="11"
            placeholder="用于接收赛事通知" placeholder-class="ph" />
        </view>

        <!-- 微信手机号快捷获取（需已认证小程序，游客模式会失败降级手动输入） -->
        <button class="phone-btn" open-type="getPhoneNumber" @getphonenumber="onGetPhone">
          微信手机号快捷获取
        </button>

        <!-- 提交并支付 -->
        <button class="submit-btn" :loading="submitting" @tap="onSubmitForm">
          提交并支付 ¥{{ formRace.fee }}
        </button>
      </view>
    </view>

    <view class="safe-bottom"></view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { payForRegistration } from '@/api/payment'
import { getEventList, mapEvent } from '@/api/event'
import { createRegistration, getPhoneByCode } from '@/api/registration'

// 筛选 tab 定义（对齐 event.status：报名中/进行中/已结束；未发布不下发到 C 端）
const tabs = [
  { key: 'all', label: '全部' },
  { key: 'open', label: '报名中' },
  { key: 'ongoing', label: '进行中' },
  { key: 'done', label: '已结束' },
]

// 当前选中的 tab
const activeTab = ref('all')

// 本地演示赛事数据（后端不可用时的降级数据；字段对齐 mapEvent 输出）
const races = ref([
  { id: 1, name: '2026 芒市国际马拉松', date: '2026-09-06', signup: '06-01 ~ 08-31', location: '云南 · 芒市', status: '报名中', statusClass: 's-open', registered: 3280, quota: 5000, percent: 66, fee: 180 },
  { id: 2, name: '2026 大理环洱海马拉松', date: '2026-10-11', signup: '07-01 ~ 09-30', location: '云南 · 大理', status: '报名中', statusClass: 's-open', registered: 640, quota: 2000, percent: 32, fee: 150 },
  { id: 3, name: '2026 香格里拉高原马拉松', date: '2026-10-25', signup: '07-15 ~ 10-10', location: '云南 · 迪庆', status: '报名中', statusClass: 's-open', registered: 0, quota: 2000, percent: 0, fee: 200 },
  { id: 4, name: '2026 西双版纳热带雨林马拉松', date: '2026-11-08', signup: '08-01 ~ 10-31', location: '云南 · 版纳', status: '报名中', statusClass: 's-open', registered: 96, quota: 1500, percent: 6, fee: 160 },
  { id: 5, name: '2026 丽江古城马拉松', date: '2026-08-18', signup: '06-01 ~ 08-10', location: '云南 · 丽江', status: '进行中', statusClass: 's-ongoing', registered: 3000, quota: 3000, percent: 100, fee: 80 },
  { id: 6, name: '2026 昆明高原半程马拉松', date: '2026-04-20', signup: '01-15 ~ 03-31', location: '云南 · 昆明', status: '已结束', statusClass: 's-done', registered: 2980, quota: 3000, percent: 99, fee: 120 },
  { id: 7, name: '2025 抚仙湖高原马拉松', date: '2025-12-07', signup: '10-01 ~ 11-20', location: '云南 · 玉溪', status: '已结束', statusClass: 's-done', registered: 2560, quota: 2560, percent: 100, fee: 150 },
  { id: 8, name: '2025 腾冲火山热海马拉松', date: '2025-11-02', signup: '09-01 ~ 10-20', location: '云南 · 保山', status: '已结束', statusClass: 's-done', registered: 1800, quota: 2000, percent: 90, fee: 100 },
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

// ===== 赛事列表：优先拉取后端 /api/event/list（需 wx-token），失败时降级到本地演示数据 =====
function loadEvents() {
  getEventList()
    .then((list) => {
      if (Array.isArray(list) && list.length > 0) {
        races.value = list.map(mapEvent)
      }
    })
    .catch((err) => {
      console.log('赛事加载失败，使用演示数据', err)
    })
}

// 页面加载时拉取赛事列表
loadEvents()

// ===== 报名流程：表单（姓名+手机号）→ 模拟支付 → 支付成功后保存后台 =====

// 报名表单状态
const formVisible = ref(false)
const formRace = ref(null)
const form = ref({ name: '', phone: '' })
const submitting = ref(false)

// 报名按钮：打开报名表单（已结束赛事跳成绩查询页）
function onSignup(race) {
  if (race.status === '已结束') {
    uni.navigateTo({ url: '/pages/result/result' })
    return
  }
  if (race.status !== '报名中') {
    uni.showToast({ title: '该赛事暂不可报名', icon: 'none' })
    return
  }
  formRace.value = race
  form.value = { name: '', phone: '' }
  formVisible.value = true
}

// 关闭表单（支付中不允许关闭）
function closeForm() {
  if (submitting.value) return
  formVisible.value = false
}

// 微信手机号快捷获取（需已认证小程序并配置 wx.appid；游客模式/未配置时失败，降级手动输入）
function onGetPhone(e) {
  const detail = e.detail || {}
  if (detail.code) {
    // 新版接口：code 交由后端换取手机号
    getPhoneByCode(detail.code)
      .then((phone) => {
        if (phone) {
          form.value.phone = phone
          uni.showToast({ title: '手机号已自动填充', icon: 'none' })
        } else {
          uni.showToast({ title: '获取失败，请手动输入', icon: 'none' })
        }
      })
      .catch((err) => {
        uni.showToast({ title: err.message || '获取失败，请手动输入', icon: 'none' })
      })
  } else {
    // 授权拒绝 / 无权限（游客模式）等场景
    uni.showToast({ title: '暂无法快捷获取，请手动输入', icon: 'none' })
  }
}

// 提交表单并支付：校验 → 模拟支付 → 支付成功后保存报名信息到后台
function onSubmitForm() {
  const name = String(form.value.name || '').trim()
  const phone = String(form.value.phone || '').trim()
  if (!name) {
    uni.showToast({ title: '请输入姓名', icon: 'none' })
    return
  }
  if (!/^1\d{10}$/.test(phone)) {
    uni.showToast({ title: '请输入正确的11位手机号', icon: 'none' })
    return
  }
  if (submitting.value) return
  submitting.value = true
  // 1. 模拟支付（真实微信支付对接点见 src/api/payment.js 注释）
  payForRegistration(formRace.value, formRace.value.fee * 100)
    .then((result) => {
      if (!result.success) {
        uni.showToast({ title: '已取消支付', icon: 'none' })
        return
      }
      // 2. 支付成功：报名信息关联赛事保存到后台（姓名/手机号回填参赛用户资料 + 创建报名记录）
      return createRegistration({
        eventId: formRace.value.id,
        name,
        phone,
      }).then(() => {
        formVisible.value = false
        uni.showToast({ title: '报名成功，请留意短信通知', icon: 'success' })
      })
    })
    .catch((err) => {
      console.log('报名失败', err)
      uni.showToast({ title: err.message || '报名失败，请重试', icon: 'none' })
    })
    .finally(() => {
      submitting.value = false
    })
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

/* 报名按钮行：按钮右对齐 */
.race-bottom {
  margin-top: 16rpx;
  display: flex;
  justify-content: flex-end;
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

/* ===== 报名表单弹层（底部半屏抽屉） ===== */
.sheet-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(17, 24, 39, 0.55);
  z-index: 100;
  display: flex;
  align-items: flex-end;
}

.sheet {
  width: 100%;
  background-color: #ffffff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 40rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.sheet-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1F2937;
  text-align: center;
}

/* 赛事名 + 费用行 */
.sheet-race {
  margin-top: 24rpx;
  padding: 20rpx 24rpx;
  background-color: #F4F8F4;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sheet-race-name {
  flex: 1;
  font-size: 28rpx;
  font-weight: 600;
  color: #1F2937;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  margin-right: 16rpx;
}

.sheet-race-fee {
  flex-shrink: 0;
  font-size: 30rpx;
  font-weight: 700;
  color: #16A34A;
}

/* 表单项 */
.form-item {
  margin-top: 32rpx;
  display: flex;
  align-items: center;
  border-bottom: 1rpx solid #F3F4F6;
  padding-bottom: 16rpx;
}

.form-label {
  width: 120rpx;
  font-size: 28rpx;
  color: #374151;
  flex-shrink: 0;
}

.form-input {
  flex: 1;
  font-size: 28rpx;
  color: #1F2937;
}

/* 输入框 placeholder 颜色 */
.ph {
  color: #C0C4CC;
}

/* 微信手机号快捷获取按钮（次级样式） */
.phone-btn {
  margin-top: 32rpx;
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 26rpx;
  color: #15803D;
  background-color: #DCFCE7;
  border-radius: 40rpx;
  padding: 0;
}

.phone-btn::after {
  border: none;
}

/* 提交并支付按钮（主按钮） */
.submit-btn {
  margin-top: 20rpx;
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: #ffffff;
  background-color: #16A34A;
  border-radius: 44rpx;
  padding: 0;
}

.submit-btn::after {
  border: none;
}
</style>