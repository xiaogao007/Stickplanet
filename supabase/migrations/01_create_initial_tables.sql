/*
# 创建坚持喵小程序初始数据库表

## 1. 新建表

### profiles 表 - 用户信息
- `id` (uuid, 主键) - 用户ID，关联 auth.users
- `phone` (text, 唯一) - 手机号
- `email` (text, 唯一) - 邮箱
- `nickname` (text) - 昵称
- `avatar_url` (text) - 头像URL
- `role` (user_role) - 角色（user/admin）
- `total_days` (integer, 默认0) - 累计坚持天数
- `level` (integer, 默认1) - 用户等级
- `points` (integer, 默认0) - 积分
- `created_at` (timestamptz) - 创建时间

### plans 表 - 坚持计划
- `id` (uuid, 主键) - 计划ID
- `user_id` (uuid, 外键) - 创建用户ID
- `name` (text, 非空) - 计划名称
- `description` (text) - 计划描述
- `start_date` (date, 非空) - 开始日期
- `end_date` (date, 非空) - 结束日期
- `total_days` (integer, 非空) - 总天数
- `frequency` (text, 默认'daily') - 执行频次（daily/weekly/custom）
- `daily_target` (text) - 每日目标（如"30分钟"、"1次"）
- `reminder_enabled` (boolean, 默认false) - 是否启用提醒
- `reminder_times` (text[]) - 提醒时间列表
- `motivation_text` (text) - 激励语
- `status` (text, 默认'active') - 状态（active/paused/completed/abandoned）
- `is_template` (boolean, 默认false) - 是否为模板
- `template_category` (text) - 模板分类
- `cover_image` (text) - 封面图片
- `created_at` (timestamptz) - 创建时间
- `updated_at` (timestamptz) - 更新时间

### check_ins 表 - 打卡记录
- `id` (uuid, 主键) - 打卡ID
- `plan_id` (uuid, 外键) - 计划ID
- `user_id` (uuid, 外键) - 用户ID
- `check_date` (date, 非空) - 打卡日期
- `completed` (boolean, 默认true) - 是否完成
- `note` (text) - 打卡备注
- `images` (text[]) - 图片URL数组
- `mood` (text) - 心情（happy/normal/sad）
- `is_makeup` (boolean, 默认false) - 是否补卡
- `created_at` (timestamptz) - 创建时间

### achievements 表 - 成就勋章
- `id` (uuid, 主键) - 成就ID
- `user_id` (uuid, 外键) - 用户ID
- `plan_id` (uuid, 外键) - 计划ID
- `type` (text, 非空) - 成就类型（day_7/day_21/day_50/custom）
- `title` (text, 非空) - 成就标题
- `description` (text) - 成就描述
- `icon` (text) - 图标
- `achieved_at` (timestamptz) - 达成时间

## 2. 安全策略
- 所有表启用 RLS
- 管理员拥有所有表的完全访问权限
- 用户可以查看和管理自己的数据
- 计划模板（is_template=true）对所有人可见
- 首位注册用户自动成为管理员

## 3. 触发器
- 自动设置首位用户为管理员
- 自动更新 updated_at 时间戳
*/

-- 创建角色枚举类型
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- 创建 profiles 表
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone text UNIQUE,
    email text UNIQUE,
    nickname text,
    avatar_url text,
    role user_role DEFAULT 'user'::user_role NOT NULL,
    total_days integer DEFAULT 0,
    level integer DEFAULT 1,
    points integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 创建 plans 表
CREATE TABLE IF NOT EXISTS plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    start_date date NOT NULL,
    end_date date NOT NULL,
    total_days integer NOT NULL,
    frequency text DEFAULT 'daily',
    daily_target text,
    reminder_enabled boolean DEFAULT false,
    reminder_times text[],
    motivation_text text,
    status text DEFAULT 'active',
    is_template boolean DEFAULT false,
    template_category text,
    cover_image text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 创建 check_ins 表
CREATE TABLE IF NOT EXISTS check_ins (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid REFERENCES plans(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    check_date date NOT NULL,
    completed boolean DEFAULT true,
    note text,
    images text[],
    mood text,
    is_makeup boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    UNIQUE(plan_id, check_date)
);

-- 创建 achievements 表
CREATE TABLE IF NOT EXISTS achievements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    plan_id uuid REFERENCES plans(id) ON DELETE CASCADE,
    type text NOT NULL,
    title text NOT NULL,
    description text,
    icon text,
    achieved_at timestamptz DEFAULT now()
);

-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- 创建管理员检查函数
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = uid AND p.role = 'admin'::user_role
    );
$$;

-- profiles 表策略
CREATE POLICY "管理员拥有完全访问权限" ON profiles
    FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可以查看自己的资料" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "用户可以更新自己的资料" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- plans 表策略
CREATE POLICY "管理员拥有完全访问权限" ON plans
    FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可以查看自己的计划" ON plans
    FOR SELECT USING (auth.uid() = user_id OR is_template = true);

CREATE POLICY "用户可以创建计划" ON plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的计划" ON plans
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的计划" ON plans
    FOR DELETE USING (auth.uid() = user_id);

-- check_ins 表策略
CREATE POLICY "管理员拥有完全访问权限" ON check_ins
    FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可以查看自己的打卡记录" ON check_ins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建打卡记录" ON check_ins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的打卡记录" ON check_ins
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的打卡记录" ON check_ins
    FOR DELETE USING (auth.uid() = user_id);

-- achievements 表策略
CREATE POLICY "管理员拥有完全访问权限" ON achievements
    FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可以查看自己的成就" ON achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建成就" ON achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 创建首位用户自动成为管理员的触发器
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    user_count int;
BEGIN
    IF OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL THEN
        SELECT COUNT(*) INTO user_count FROM profiles;
        INSERT INTO profiles (id, phone, email, role)
        VALUES (
            NEW.id,
            NEW.phone,
            NEW.email,
            CASE WHEN user_count = 0 THEN 'admin'::user_role ELSE 'user'::user_role END
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 创建自动更新 updated_at 的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入推荐计划模板
INSERT INTO plans (name, description, total_days, frequency, daily_target, motivation_text, is_template, template_category, cover_image, start_date, end_date) VALUES
('50天早起挑战', '养成早起习惯，开启活力一天。每天6:30前起床，坚持50天改变生活节奏。', 50, 'daily', '6:30前起床', '早起的鸟儿有虫吃，新的一天从早晨开始！', true, '生活习惯', 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800', '2025-01-01', '2025-02-19'),
('30天健身计划', '每天30分钟运动，塑造健康体魄。包括有氧运动、力量训练和拉伸。', 30, 'daily', '30分钟运动', '汗水是脂肪的眼泪，坚持就是胜利！', true, '健康运动', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800', '2025-01-01', '2025-01-30'),
('21天阅读习惯', '每天阅读30分钟，培养阅读习惯。读书使人充实，讨论使人机智。', 21, 'daily', '阅读30分钟', '书籍是人类进步的阶梯，每天进步一点点！', true, '学习成长', 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800', '2025-01-01', '2025-01-21'),
('100天英语学习', '每天学习英语1小时，包括单词、听力、口语练习。坚持100天提升英语水平。', 100, 'daily', '学习1小时', 'Practice makes perfect! 每天进步一点点！', true, '学习成长', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800', '2025-01-01', '2025-04-10'),
('7天冥想入门', '每天10分钟冥想，放松身心，提升专注力。适合冥想初学者。', 7, 'daily', '冥想10分钟', '静心冥想，找回内心的平静与力量。', true, '身心健康', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800', '2025-01-01', '2025-01-07'),
('30天写作训练', '每天写作500字，记录生活、思考人生。用文字记录成长轨迹。', 30, 'daily', '写作500字', '写作是思考的延伸，坚持记录精彩人生！', true, '学习成长', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800', '2025-01-01', '2025-01-30'),
('14天早睡计划', '每天23:00前入睡，养成规律作息。充足睡眠是健康的基础。', 14, 'daily', '23:00前睡觉', '早睡早起身体好，规律作息更健康！', true, '生活习惯', 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800', '2025-01-01', '2025-01-14'),
('30天喝水打卡', '每天喝8杯水（约2000ml），保持身体水分充足，促进新陈代谢。', 30, 'daily', '喝水8杯', '水是生命之源，每天8杯水，健康常相伴！', true, '健康运动', 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800', '2025-01-01', '2025-01-30'),
('50天跑步计划', '每天跑步5公里，提升心肺功能，增强体质。适合有一定运动基础的人群。', 50, 'daily', '跑步5公里', '奔跑吧！每一步都是向更好的自己迈进！', true, '健康运动', 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800', '2025-01-01', '2025-02-19'),
('30天感恩日记', '每天记录3件感恩的事，培养积极心态，发现生活中的美好。', 30, 'daily', '记录3件感恩事', '感恩生活，珍惜当下，幸福就在身边！', true, '身心健康', 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=800', '2025-01-01', '2025-01-30');
