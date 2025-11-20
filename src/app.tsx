/**
 * @file Taro application entry file
 */

import Taro from '@tarojs/taro'
import type React from 'react'
import type {PropsWithChildren} from 'react'
import {initCloud} from '@/client/cloud'
import {useTabBarPageClass} from '@/hooks/useTabBarPageClass'
import './app.scss'

// 在模块加载时初始化云开发，确保在使用云 API 前完成初始化
if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
  initCloud()
}

const App: React.FC = ({children}: PropsWithChildren<unknown>) => {
  useTabBarPageClass()

  return <>{children}</>
}

export default App
