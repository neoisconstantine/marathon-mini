/**
 * src/api/payment.js
 * 报名支付模块：预留第三方支付（微信支付）对接接口，当前为【模拟实现】。
 *
 * ── 真实对接时（有后端后）的替换方式 ──
 * 1. createOrder()：改为请求 POST /api/payment/order，入参 { eventId, amount }；
 *    后端完成微信支付统一下单后返回 { orderNo, amount, payParams }，
 *    其中 payParams 为微信支付拉起参数：
 *    { provider: 'wxpay', timeStamp, nonceStr, package, signType, paySign }
 * 2. pay()：改为 uni.requestPayment({ provider: 'wxpay', ...order.payParams })；
 *    支付成功回调里再调 POST /api/registration/confirm 通知后端确认报名结果。
 *
 * ── 当前模拟 ──
 * 本地生成订单号，uni.showModal 模拟微信支付收银台，返回统一结果：
 *   payForRegistration() → Promise<{ success: boolean, orderNo: string, cancelled?: boolean }>
 */

/** 本地模拟订单号（真实场景由后端生成） */
function genOrderNo() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const stamp =
    d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
    pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds())
  return 'MZ' + stamp + String(Math.floor(Math.random() * 900) + 100)
}

/** 创建支付订单（模拟网络请求，300ms 延迟） */
export function createOrder({ eventId, eventName, amount }) {
  // TODO 对接后端：POST /api/payment/order { eventId, amount }
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        orderNo: genOrderNo(),
        amount, // 单位：分（微信支付金额单位，与官方保持一致）
        // TODO 真实场景：payParams 由后端统一下单返回
        payParams: { provider: 'wxpay' },
      })
    }, 300)
  })
}

/** 发起支付（模拟微信支付收银台；对接后改为 uni.requestPayment） */
export function pay(order) {
  // TODO 对接后端：uni.requestPayment({ provider: 'wxpay', ...order.payParams })
  return new Promise((resolve) => {
    uni.showModal({
      title: '模拟支付',
      content: `订单号：${order.orderNo}\n金额：¥${(order.amount / 100).toFixed(2)}`,
      confirmText: '确认支付',
      cancelText: '取消',
      success: (res) => {
        resolve({ success: !!res.confirm, orderNo: order.orderNo, cancelled: !res.confirm })
      },
    })
  })
}

/** 报名支付完整流程（模拟）：创建订单 → 发起支付 → 返回支付结果 */
export function payForRegistration(race, amount) {
  return createOrder({ eventId: race.id, eventName: race.name, amount }).then(pay)
}
