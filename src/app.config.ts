const pages = [
  'pages/home/index',
  'pages/plans/index',
  'pages/calendar/index',
  'pages/profile/index',
  'pages/plan-create/index',
  'pages/plan-detail/index',
  'pages/templates/index',
  'pages/checkin/index',
  'pages/achievements/index'
]

export default defineAppConfig({
  pages,
  // 分包配置
  subPackages: [
    {
      root: 'subpackages/auth',
      name: 'auth',
      pages: ['pages/login/index']
    }
  ],
  // 分包预下载配置（可选）
  preloadRule: {
    'pages/home/index': {
      network: 'all',
      packages: ['auth']
    }
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#10B981',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: './assets/images/unselected/home.png',
        selectedIconPath: './assets/images/selected/home.png'
      },
      {
        pagePath: 'pages/plans/index',
        text: '计划',
        iconPath: './assets/images/unselected/plans.png',
        selectedIconPath: './assets/images/selected/plans.png'
      },
      {
        pagePath: 'pages/calendar/index',
        text: '日历',
        iconPath: './assets/images/unselected/calendar.png',
        selectedIconPath: './assets/images/selected/calendar.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: './assets/images/unselected/profile.png',
        selectedIconPath: './assets/images/selected/profile.png'
      }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#10B981',
    navigationBarTitleText: '一刻习惯',
    navigationBarTextStyle: 'white'
  }
})
