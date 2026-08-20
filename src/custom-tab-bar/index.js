// 自定义 tabBar（微信原生组件）：字体增大一号（24rpx），图标/颜色保持原生视觉
// 注意：uni-app 会原样拷贝 custom-tab-bar 目录到小程序产物，此处必须是原生 wxml/wxss/js/json，
// 不能用 .vue。页面通过 this.getTabBar().setData({ selected }) 同步选中态（见 utils/tabbar.js）。
Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: '/pages/index/index',
        text: '首页',
        iconPath: '/static/tabbar/home.png',
        selectedIconPath: '/static/tabbar/home-active.png'
      },
      {
        pagePath: '/pages/activity/activity',
        text: '活动',
        iconPath: '/static/tabbar/flag.png',
        selectedIconPath: '/static/tabbar/flag-active.png'
      },
      {
        pagePath: '/pages/mine/mine',
        text: '我的',
        iconPath: '/static/tabbar/person.png',
        selectedIconPath: '/static/tabbar/person-active.png'
      }
    ]
  },
  methods: {
    switchTab(e) {
      const index = Number(e.currentTarget.dataset.index)
      if (this.data.selected === index) return
      wx.switchTab({
        url: this.data.list[index].pagePath
      })
    }
  }
})