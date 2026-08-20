<!--
  src/components/phone-guide/phone-guide.vue
  首次登录完善信息引导（全局模态）：
  - 登录成功且 isNewUser 时由 store/user.js 置 guideVisible=true 触发（任意页面生效）
  - 昵称输入框 type="nickname"：键盘上方显示"使用微信昵称"快捷按钮，一键带入微信昵称
    （微信已收回无感获取昵称能力，nickname 输入框是官方唯一途径，不填也可跳过）
  - 手机号：微信快捷授权（需已认证小程序）或跳过（报名时手动填写）
  - 模态期间：全屏拦截触摸 + 隐藏 tabBar
  - 出口：提交（昵称/手机号至少一项生效）、手机号授权完成、或"暂不填写"跳过
-->
<template>
  <view class="guide-mask" v-if="userState.guideVisible" @touchmove.stop.prevent="noop">
    <view class="guide-dialog">
      <view class="guide-title">完善用户信息</view>
      <view class="guide-desc">昵称将作为您的默认姓名，报名时也可填写真实姓名覆盖</view>

      <!-- 昵称：type=nickname 微信快捷填入（键盘上方"使用微信昵称"按钮） -->
      <view class="field">
        <text class="field-label">昵称</text>
        <input class="field-input" type="nickname" v-model="nickname" placeholder="可一键使用微信昵称"
          placeholder-class="field-placeholder" :maxlength="20" />
      </view>

      <button class="guide-btn" open-type="getPhoneNumber" @getphonenumber="onGuidePhone">绑定手机号（微信快捷授权）</button>
      <view class="guide-skip" @tap="onSkip">完成</view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'
import { userState } from '@/store/user'
import { getPhoneByCode } from '@/api/registration'
import { bindPhone } from '@/api/auth'

// 昵称（type=nickname 输入框：用户可点键盘上方"使用微信昵称"一键带入，也可手动输入）
const nickname = ref('')

// 打开时隐藏 tabBar（模态期间无法切换 tab）并重置昵称；关闭时恢复
watch(
  () => userState.guideVisible,
  (visible) => {
    if (visible) {
      nickname.value = ''
      try {
        uni.hideTabBar()
      } catch (e) { /* 非 tab 页调用无效，忽略 */ }
    } else {
      try {
        uni.showTabBar()
      } catch (e) { /* 非 tab 页调用无效，忽略 */ }
    }
  }
)

/** 空处理：拦截遮罩层触摸滚动穿透 */
function noop() {}

/** 提交昵称（仅昵称非空时调用；静默失败不打扰用户） */
async function saveNickname() {
  const name = String(nickname.value || '').trim()
  if (!name) return
  try {
    await bindPhone({ name })
  } catch (e) { /* 失败静默：昵称非关键信息，报名时仍可填写 */ }
}

/** 关闭引导（提交/跳过后）：本次不再弹出 */
function closeGuide() {
  userState.guideVisible = false
}

/** 点"完成"：昵称有值则保存，随后关闭 */
async function onSkip() {
  await saveNickname()
  closeGuide()
}

/**
 * 微信手机号快捷授权回调
 * 授权成功：code 换手机号 + 昵称一并提交（/api/auth/bind-phone）
 * 授权失败/取消：昵称有值仍单独保存，提示可报名时手动填写手机号
 */
async function onGuidePhone(e) {
  const detail = e.detail || {}
  if (!detail.code) {
    // 取消授权：昵称仍保存
    await saveNickname()
    uni.showToast({ title: '已取消授权，可报名时手动填写', icon: 'none', size: 'large' })
    closeGuide()
    return
  }
  uni.showLoading({ title: '绑定中' })
  const name = String(nickname.value || '').trim()
  try {
    const phone = await getPhoneByCode(detail.code)
    if (phone) {
      await bindPhone({ phone, name })
      uni.hideLoading()
      uni.showToast({ title: '绑定成功', icon: 'success' })
    } else {
      await saveNickname()
      uni.hideLoading()
      uni.showToast({ title: '获取失败，可报名时手动填写', icon: 'none', size: 'large' })
    }
  } catch (err) {
    // 手机号换取失败但昵称可能已提交成功；单独再保存一次昵称兜底
    await saveNickname()
    uni.hideLoading()
    uni.showToast({ title: (err && err.message) || '获取失败，可报名时手动填写', icon: 'none', size: 'large' })
  }
  closeGuide()
}
</script>

<style scoped lang="scss">
/* 首次登录完善信息引导：全屏模态，z-index 需高于自定义 tabBar(9999) */
.guide-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.55);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 64rpx;
}

.guide-dialog {
  width: 100%;
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 48rpx 40rpx 32rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.guide-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #1F2937;
}

.guide-desc {
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #6B7280;
  text-align: center;
  line-height: 1.6;
}

/* 昵称输入框 */
.field {
  margin-top: 40rpx;
  width: 100%;
  background-color: #F4F8F4;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

.field-label {
  font-size: 28rpx;
  color: #374151;
  flex-shrink: 0;
  margin-right: 20rpx;
}

.field-input {
  flex: 1;
  font-size: 28rpx;
  color: #1F2937;
}

.field-placeholder {
  color: #9CA3AF;
}

.guide-btn {
  margin-top: 36rpx;
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  font-size: 30rpx;
  color: #ffffff;
  background: linear-gradient(135deg, #16A34A 0%, #15803D 100%);
  border-radius: 44rpx;
}

.guide-btn::after {
  border: none;
}

.guide-skip {
  margin-top: 24rpx;
  padding: 12rpx 32rpx;
  font-size: 26rpx;
  color: #16A34A;
}
</style>
