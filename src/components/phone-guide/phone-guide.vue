<!--
  src/components/phone-guide/phone-guide.vue
  首次登录手机号授权引导（全局模态）：
  - 登录成功且 isNewUser 时由 store/user.js 置 guideVisible=true 触发（任意页面生效）
  - 模态期间：全屏拦截触摸 + 隐藏 tabBar，授权/拒绝前无法跳转到其他界面
  - 出口只有两个：点击"微信手机号快捷授权"（成功/失败/取消）或点击"暂不绑定"
-->
<template>
  <view class="guide-mask" v-if="userState.guideVisible" @touchmove.stop.prevent="noop">
    <view class="guide-dialog">
      <view class="guide-title">完善手机号</view>
      <view class="guide-desc">绑定手机号后，赛事报名、成绩通知将第一时间发送到您的手机</view>
      <button class="guide-btn" open-type="getPhoneNumber" @getphonenumber="onGuidePhone">微信手机号快捷授权</button>
      <view class="guide-skip" @tap="closeGuide">暂不绑定</view>
    </view>
  </view>
</template>

<script setup>
import { watch } from 'vue'
import { userState } from '@/store/user'
import { getPhoneByCode } from '@/api/registration'
import { bindPhone } from '@/api/auth'

// 打开时隐藏 tabBar（模态期间无法切换 tab）；关闭时恢复
watch(
  () => userState.guideVisible,
  (visible) => {
    if (visible) {
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

/** 关闭引导（授权完成/拒绝）：本次不再弹出 */
function closeGuide() {
  userState.guideVisible = false
}

/** 空处理：拦截遮罩层触摸滚动穿透 */
function noop() {}

/**
 * 微信手机号快捷授权回调
 * 授权成功：code 换手机号 → 回填当前用户（/api/auth/bind-phone）
 * 授权失败/取消：明确提示即可（dev 模式后端未配置 appid 拿不到手机号属预期，可报名时手动填写）
 */
async function onGuidePhone(e) {
  const detail = e.detail || {}
  if (!detail.code) {
    uni.showToast({ title: '已取消授权，可报名时手动填写', icon: 'none', size: 'large' })
    closeGuide()
    return
  }
  uni.showLoading({ title: '绑定中' })
  try {
    const phone = await getPhoneByCode(detail.code)
    if (phone) {
      await bindPhone(phone)
      uni.hideLoading()
      uni.showToast({ title: '手机号绑定成功', icon: 'success' })
    } else {
      uni.hideLoading()
      uni.showToast({ title: '获取失败，可报名时手动填写', icon: 'none', size: 'large' })
    }
  } catch (err) {
    uni.hideLoading()
    uni.showToast({ title: (err && err.message) || '获取失败，可报名时手动填写', icon: 'none', size: 'large' })
  }
  closeGuide()
}
</script>

<style scoped lang="scss">
/* 首次登录手机号授权引导：全屏模态，z-index 需高于自定义 tabBar(9999) */
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

.guide-btn {
  margin-top: 40rpx;
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
  color: #9CA3AF;
}
</style>