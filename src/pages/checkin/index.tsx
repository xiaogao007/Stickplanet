import {Button, Image, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useRouter} from '@tarojs/taro'
import {useAuth} from '@/hooks/useAuth'
import type React from 'react'
import {useCallback, useState} from 'react'
import {achievementApi, checkInApi, planApi} from '@/db/cloudApi'
import {type UploadFileInput, uploadMultipleImages} from '@/utils/cloudUpload'

const CheckIn: React.FC = () => {
  const {user} = useAuth({guard: true})
  const router = useRouter()
  const planId = router.params.planId || ''
  const [note, setNote] = useState('')
  const [mood, setMood] = useState<'happy' | 'normal' | 'sad' | null>(null)
  const [selectedImages, setSelectedImages] = useState<UploadFileInput[]>([])
  const [submitting, setSubmitting] = useState(false)

  const handleChooseImage = useCallback(async () => {
    try {
      const res = await Taro.chooseImage({
        count: 3 - selectedImages.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      const uploadFiles: UploadFileInput[] = res.tempFiles.map((file, index) => ({
        path: file.path,
        size: file.size || 0,
        name: `image_${Date.now()}_${index}.jpg`,
        originalFileObj: (file as any).originalFileObj
      }))

      setSelectedImages([...selectedImages, ...uploadFiles])
    } catch (error) {
      console.error('选择图片失败:', error)
    }
  }, [selectedImages])

  const handleRemoveImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!user?.id || !planId) {
      Taro.showToast({title: '参数错误', icon: 'none'})
      return
    }

    setSubmitting(true)
    try {
      let imageUrls: string[] = []
      if (selectedImages.length > 0) {
        Taro.showLoading({title: '上传图片中...'})
        imageUrls = await uploadMultipleImages(selectedImages)
        Taro.hideLoading()
      }

      const today = new Date().toISOString().split('T')[0]
      const checkInId = await checkInApi.createCheckIn({
        plan_id: planId,
        user_id: user.id,
        check_date: today,
        completed: true,
        note: note.trim() || null,
        images: imageUrls.length > 0 ? imageUrls : null,
        mood: mood || null,
        is_makeup: false
      })

      if (checkInId) {
        const stats = await planApi.getPlanStats(planId)
        await achievementApi.checkAndCreateAchievement(user.id, planId, stats.checked_days)

        Taro.showToast({title: '打卡成功！', icon: 'success'})
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        Taro.showToast({title: '打卡失败', icon: 'none'})
      }
    } catch (error) {
      console.error('打卡失败:', error)
      Taro.showToast({title: '打卡失败', icon: 'none'})
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollView scrollY className="min-h-screen bg-background box-border">
      <View className="p-4 space-y-6">
        <View className="bg-card rounded-2xl p-6 shadow-sm text-center">
          <View className="text-6xl mb-4">🎯</View>
          <Text className="text-2xl font-bold text-foreground block mb-2">今日打卡</Text>
          <Text className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </Text>
        </View>

        <View className="bg-card rounded-2xl p-6 shadow-sm">
          <Text className="text-lg font-bold text-foreground block mb-4">今日心情</Text>
          <View className="flex items-center justify-around">
            <View
              className={`text-center p-4 rounded-xl ${mood === 'happy' ? 'bg-primary/10' : 'bg-muted'}`}
              onClick={() => setMood('happy')}>
              <View className="text-4xl mb-2">😊</View>
              <Text className={`text-sm ${mood === 'happy' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                开心
              </Text>
            </View>
            <View
              className={`text-center p-4 rounded-xl ${mood === 'normal' ? 'bg-primary/10' : 'bg-muted'}`}
              onClick={() => setMood('normal')}>
              <View className="text-4xl mb-2">😐</View>
              <Text className={`text-sm ${mood === 'normal' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                一般
              </Text>
            </View>
            <View
              className={`text-center p-4 rounded-xl ${mood === 'sad' ? 'bg-primary/10' : 'bg-muted'}`}
              onClick={() => setMood('sad')}>
              <View className="text-4xl mb-2">😔</View>
              <Text className={`text-sm ${mood === 'sad' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                低落
              </Text>
            </View>
          </View>
        </View>

        <View className="bg-card rounded-2xl p-6 shadow-sm">
          <Text className="text-lg font-bold text-foreground block mb-4">打卡记录</Text>
          <View style={{overflow: 'hidden'}}>
            <Textarea
              className="bg-input text-foreground px-4 py-3 rounded-lg border border-border w-full"
              placeholder="记录今天的感受和收获..."
              value={note}
              maxlength={500}
              style={{height: '120px'}}
              onInput={(e) => setNote(e.detail.value)}
            />
          </View>
          <Text className="text-xs text-muted-foreground block mt-2">{note.length}/500</Text>
        </View>

        <View className="bg-card rounded-2xl p-6 shadow-sm">
          <Text className="text-lg font-bold text-foreground block mb-4">上传图片（选填）</Text>
          <View className="grid grid-cols-3 gap-3">
            {selectedImages.map((img, index) => (
              <View key={index} className="relative aspect-square">
                <Image src={img.path} className="w-full h-full rounded-lg" mode="aspectFill" />
                <View
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive flex items-center justify-center"
                  onClick={() => handleRemoveImage(index)}>
                  <Text className="text-xs text-destructive-foreground">×</Text>
                </View>
              </View>
            ))}
            {selectedImages.length < 3 && (
              <View
                className="aspect-square bg-muted rounded-lg flex items-center justify-center"
                onClick={handleChooseImage}>
                <View className="text-center">
                  <View className="text-3xl mb-1">+</View>
                  <Text className="text-xs text-muted-foreground">添加图片</Text>
                </View>
              </View>
            )}
          </View>
          <Text className="text-xs text-muted-foreground block mt-2">最多上传3张图片，单张不超过1MB</Text>
        </View>

        <Button
          className="w-full bg-primary text-primary-foreground py-4 rounded-full break-keep text-base font-semibold"
          size="default"
          disabled={submitting}
          onClick={handleSubmit}>
          {submitting ? '提交中...' : '完成打卡'}
        </Button>
      </View>
    </ScrollView>
  )
}

export default CheckIn
