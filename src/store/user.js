/**
 * src/store/user.js
 * 全局用户状态（响应式）：
 *  - token：登录态（request.js setToken 时同步更新，各页面入口可见性据此响应式变化）
 *  - guideVisible：首次登录手机号授权引导开关（登录成功且 isNewUser 时置 true，
 *    全局组件 phone-guide 监听渲染为模态，授权/拒绝后关闭）
 */
import { reactive } from 'vue'

export const userState = reactive({
  token: uni.getStorageSync('wx_token') || '',
  guideVisible: false,
})