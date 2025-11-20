@echo off
REM 云函数一键部署脚本 (Windows 批处理版本)
REM 使用方法: scripts\deploy-cloudfunctions.bat

setlocal enabledelayedexpansion

set CLOUDFUNCTIONS_DIR=cloudfunctions
set CLOUD_ENV_ID=cloud1-9gu9ppxt5c82bbc1

set FUNCTIONS=wechatLogin getProfile getUserPlans getTemplates getPlanById createPlan createCheckIn getCheckInsByPlan getUserCheckInsForMonth getUserAchievements

echo ==========================================
echo 开始部署云函数...
echo ==========================================

REM 检查 cloudfunctions 目录是否存在
if not exist "%CLOUDFUNCTIONS_DIR%" (
    echo 错误: cloudfunctions 目录不存在
    exit /b 1
)

REM 检查是否安装了 cloudbase-cli
where cloudbase >nul 2>&1
if errorlevel 1 (
    echo 警告: 未检测到 cloudbase-cli
    echo 请先安装: npm install -g @cloudbase/cli
    echo.
    echo 或者使用微信开发者工具手动部署：
    echo 1. 在微信开发者工具中打开项目
    echo 2. 右键点击 cloudfunctions\wechatLogin 目录
    echo 3. 选择"上传并部署：云端安装依赖"
    echo 4. 重复上述步骤部署其他云函数
    exit /b 1
)

REM 部署每个云函数
for %%f in (%FUNCTIONS%) do (
    set func=%%f
    set func_path=%CLOUDFUNCTIONS_DIR%\!func!
    
    if not exist "!func_path!" (
        echo ⚠️  跳过: !func! (目录不存在)
        goto :next
    )
    
    echo.
    echo 正在部署: !func!
    echo ----------------------------------------
    
    cd /d "!func_path!"
    
    REM 检查 package.json 是否存在
    if not exist "package.json" (
        echo ⚠️  警告: !func!\package.json 不存在，跳过
        cd ..\..
        goto :next
    )
    
    REM 安装依赖
    if exist "node_modules" (
        echo 📦 依赖已存在，跳过安装
    ) else (
        echo 📦 正在安装依赖...
        call npm install
        if errorlevel 1 (
            echo ❌ !func! 依赖安装失败
            cd ..\..
            goto :next
        )
    )
    
    REM 部署云函数
    echo 🚀 正在部署到云端...
    call cloudbase functions:deploy !func! --env %CLOUD_ENV_ID%
    if errorlevel 1 (
        echo ❌ !func! 部署失败
        cd ..\..
        goto :next
    )
    
    cd ..\..
    echo ✅ !func! 部署完成
    
    :next
)

echo.
echo ==========================================
echo 所有云函数部署完成！
echo ==========================================

endlocal

