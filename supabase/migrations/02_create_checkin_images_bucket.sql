/*
# 创建打卡图片存储桶

## 1. 存储桶配置
- 桶名称：app-7nmudrc1tudd_checkin_images
- 文件大小限制：1MB
- 允许的文件类型：image/jpeg, image/png, image/gif, image/webp, image/avif

## 2. 安全策略
- 认证用户可以上传图片
- 所有人可以查看图片（公开访问）
*/

-- 创建存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'app-7nmudrc1tudd_checkin_images',
    'app-7nmudrc1tudd_checkin_images',
    true,
    1048576,
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
);

-- 允许认证用户上传图片
CREATE POLICY "认证用户可以上传图片" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'app-7nmudrc1tudd_checkin_images');

-- 允许所有人查看图片
CREATE POLICY "所有人可以查看图片" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'app-7nmudrc1tudd_checkin_images');

-- 允许用户删除自己上传的图片
CREATE POLICY "用户可以删除自己的图片" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'app-7nmudrc1tudd_checkin_images' AND auth.uid()::text = (storage.foldername(name))[1]);
