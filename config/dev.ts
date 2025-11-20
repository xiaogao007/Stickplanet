import type {UserConfigExport} from '@tarojs/cli'
import {injectedGuiListenerPlugin, injectOnErrorPlugin, makeTagger} from 'miaoda-sc-plugin'

export default {
  mini: {
    debugReact: true
  },
  h5: {},
  compiler: {
    type: 'vite',
    vitePlugins: [
      makeTagger({
        root: process.cwd()
      }),
      injectedGuiListenerPlugin({
        path: 'https://resource-static.cdn.bcebos.com/common/v2/injected.js'
      }),
      injectOnErrorPlugin()
    ]
  }
} satisfies UserConfigExport<'vite'>
