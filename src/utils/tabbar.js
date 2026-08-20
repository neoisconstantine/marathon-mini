/**
 * 自定义 tabBar 选中态同步
 * 微信原生机制：tabBar.custom 启用后，页面通过 getTabBar() 获取自定义 tabBar 组件实例，
 * 调用 setData({ selected }) 同步高亮。需在页面 onShow 中调用。
 * @param {number} index tab 索引（0 首页 / 1 活动 / 2 我的）
 */
export function syncTabBarSelected(index) {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  if (page && typeof page.getTabBar === 'function' && page.getTabBar()) {
    page.getTabBar().setData({ selected: index })
  }
}