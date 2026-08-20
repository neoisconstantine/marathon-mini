<template>
  <!-- 全局组件：首次登录手机号授权引导（模态，任意页面生效） -->
  <phone-guide />
</template>

<script>
import { setToken, wxLogin } from '@/api/request'

export default {
  onLaunch: function () {
    // 开发模拟模式：每次启动强制重新登录，后端用 code 生成全新模拟 openid，
    // 相当于每次刷新都是"新用户"（可测试报名/成绩全流程）；退出登录按钮仍可主动登出
    setToken('')
    wxLogin().catch(() => {})
  },
  onShow: function () {
    console.log('App Show')
  },
  onHide: function () {
    console.log('App Hide')
  },
}
</script>

<style>
/* ===== 全局公共样式：所有页面生效 ===== */

/* 页面基础：浅绿灰底 + 默认字体与文字色 */
page {
  background-color: #F4F8F4;
  color: #1F2937;
  font-size: 28rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue',
    'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 通用白卡片（各页面复用） */
.mz-card {
  background-color: #FFFFFF;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(22, 163, 74, 0.08);
}

/* 底部安全区留白：避免内容被 tabBar 或底部横条遮挡 */
.safe-bottom {
  height: 40rpx;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
</style>