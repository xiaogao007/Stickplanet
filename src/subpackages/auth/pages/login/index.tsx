import {Button, Image, Input, View, Text, Checkbox} from '@tarojs/components'
import Taro, {reLaunch, showLoading, showToast, switchTab} from '@tarojs/taro'
import type React from 'react'
import {useState} from 'react'
import {wechatLogin} from '@/utils/wechatAuth'
import bgImg from '@/assets/images/bg.png'
import './index.scss'

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [showAvatarNicknameForm, setShowAvatarNicknameForm] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [nickname, setNickname] = useState<string>('')
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false) // 隐私政策同意状态

  // 点击登录按钮，检查是否同意隐私政策
  const handleWechatLogin = () => {
    if (!agreedToPrivacy) {
      showToast({
        title: '请先阅读并同意《用户协议》和《隐私政策》',
        icon: 'none',
        duration: 2000
      })
      return
    }
    setShowAvatarNicknameForm(true)
  }

  // 处理头像选择
  const handleChooseAvatar = (e: any) => {
    const {avatarUrl: url} = e.detail
    setAvatarUrl(url)
    console.log('选择头像:', url)
  }

  // 处理昵称输入
  const handleNicknameInput = (e: any) => {
    const value = e.detail?.value || e.target?.value || ''
    setNickname(value)
  }

  // 使用头像昵称填写方式登录
  const handleAvatarNicknameLogin = async () => {
    if (!nickname.trim()) {
      showToast({
        title: '请输入昵称',
        icon: 'none',
        duration: 2000
      })
      return
    }

    setShowAvatarNicknameForm(false)
    setLoading(true)
    showLoading({title: '登录中...'})

    try {
      // 构造用户信息对象
      const customUserInfo = {
        nickName: nickname.trim(),
        avatarUrl: avatarUrl || '',
        gender: 0,
        country: '',
        province: '',
        city: '',
        language: ''
      }

      // 调用登录函数
      const result = await wechatLogin(customUserInfo as any)
      Taro.hideLoading()

      if (result.success) {
        showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        })

        // 保存用户信息到本地存储
        if (result.user) {
          console.log('登录成功，保存用户信息:', result.user)
          Taro.setStorageSync('user', result.user)
        }

        // 跳转到首页
        const path = '/pages/home/index'
        setTimeout(() => {
          try {
            switchTab({url: path})
          } catch (_e) {
            reLaunch({url: path})
          }
        }, 1500)
      } else {
        showToast({
          title: result.error || '登录失败',
          icon: 'none',
          duration: 2000
        })
      }
    } catch (error: any) {
      Taro.hideLoading()
      showToast({
        title: error.message || '登录失败，请重试',
        icon: 'none',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View
      className="min-h-screen px-6 py-10 flex flex-col justify-end relative overflow-hidden"
      style={{
        backgroundImage: `url(${bgImg})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center'
      }}>
      <View className="absolute inset-0" />

      <View className="relative flex flex-col gap-4">
        <Button
          className="w-full bg-primary text-primary-foreground rounded-full py-4 text-lg font-semibold tracking-wide shadow-lg shadow-primary/40"
          onClick={handleWechatLogin}
          disabled={loading}>
          微信快捷登录
        </Button>
        <View className="flex items-center justify-center gap-2 pb-4">
          <Checkbox
            checked={agreedToPrivacy}
            onClick={() => setAgreedToPrivacy(!agreedToPrivacy)}
            className="scale-90"
          />
          <Text className="text-xs text-muted-foreground text-center">
            我已阅读并同意
            <Text
              className="text-primary"
              onClick={() => {
                // 这里可以跳转到用户协议页面
                Taro.showToast({title: '用户协议页面', icon: 'none'})
              }}>
              《用户协议》
            </Text>
            和
            <Text
              className="text-primary"
              onClick={() => {
                // 这里可以跳转到隐私政策页面
                Taro.showToast({title: '隐私政策页面', icon: 'none'})
              }}>
              《隐私政策》
            </Text>
          </Text>
        </View>
      </View>

      {/* 头像昵称填写弹窗 */}
      {showAvatarNicknameForm && (
        <View
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-6"
          onClick={() => setShowAvatarNicknameForm(false)}>
          <View
            className="bg-card rounded-3xl p-6 w-full space-y-6 shadow-2xl border border-border/60"
            onClick={(e) => e.stopPropagation()}>
            <Text className="text-xl font-semibold text-foreground text-center">完善资料</Text>

            <View className="flex flex-col items-center space-y-4">
              <Button
                openType="chooseAvatar"
                onChooseAvatar={handleChooseAvatar}
                className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/40">
                {avatarUrl ? (
                  <Image src={avatarUrl} className="w-full h-full" mode="aspectFill" />
                ) : (
                  <Text className="text-3xl text-primary">+</Text>
                )}
              </Button>

              <View className="w-full space-y-2">
                <Text className="text-sm text-muted-foreground">昵称</Text>
                <Input
                  type="nickname"
                  className="w-full px-4 py-3 rounded-2xl bg-muted text-foreground"
                  placeholder="给自己一个喜欢的名字"
                  value={nickname}
                  onInput={handleNicknameInput}
                  maxlength={12}
                />
              </View>

              <Text className="text-xs text-muted-foreground text-center">头像与昵称会展示在「成就」与「个人中心」</Text>
            </View>

            <View className="flex gap-3">
              <Button className="flex-1 rounded-2xl bg-muted text-foreground py-3 text-base" onClick={() => setShowAvatarNicknameForm(false)}>
                取消
              </Button>
              <Button
                className="flex-1 rounded-2xl bg-primary text-primary-foreground py-3 text-base"
                onClick={handleAvatarNicknameLogin}
                disabled={loading || !nickname.trim()}>
                {loading ? '登录中...' : '完成登录'}
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default Login
