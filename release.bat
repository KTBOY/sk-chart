@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ==========================================
echo    sk-chart 提交 / 发布助手
echo ==========================================
echo.

REM ---------- 0. 环境检查：Node >= 18 ----------
node -e "process.exit(Number(process.versions.node.split('.')[0])>=18?0:1)" 2>nul
if errorlevel 1 (
  echo [错误] Node 版本过低：需要 Node ^>= 18，请先切换 Node 版本。
  goto :fail
)

REM ---------- 1. 读取当前版本号 ----------
for /f "delims=" %%v in ('node -p "require('./package.json').version"') do set VER=%%v
echo 当前版本：v%VER%
echo 提示：发新版请先手动改 package.json 的 version，本脚本据此打 tag。
echo.

REM ---------- 2. 本地验证（与 CI / prepublishOnly 同款，全过再提交）----------
echo [1/4] typecheck...
call npm run typecheck || goto :fail
echo [2/4] lint...
call npm run lint || goto :fail
echo [3/4] test...
call npm test || goto :fail
echo [4/4] build...
call npm run build || goto :fail
echo.
echo 全部检查通过。
echo.

REM ---------- 3. 提交并推送 ----------
REM 先暂存全部改动；若没有新改动（如上次已 commit 但未 push）则跳过提交直接推送
git add -A
git diff --cached --quiet
if not errorlevel 1 (
  echo 没有新改动需要提交，直接推送本地已有提交...
  goto :push
)
echo 即将提交以下改动，git add -A 已包含所有新文件：
echo ------------------------------------------
git status --short
echo ------------------------------------------
choice /m "确认全部加入并提交推送吗？请先确认上面没有不想提交的临时文件"
if errorlevel 2 goto :end

set /p MSG=请输入提交信息: 
if "%MSG%"=="" set MSG=chore: update

git commit -m "%MSG%" || goto :fail
:push
git push origin main || goto :fail
echo.
echo 已推送。CI 会自动跑门禁（typecheck / lint / test / build）：
echo   https://github.com/KTBOY/sk-chart/actions
echo.

REM ---------- 4. 可选：打 tag 发版到 npm ----------
choice /m "是否发版？打 tag v%VER% 并发布 npm"
if errorlevel 2 goto :end

git rev-parse "v%VER%" >nul 2>&1
if not errorlevel 1 (
  echo [错误] tag v%VER% 已存在。请先在 package.json 升版本号后重新运行。
  goto :fail
)

git tag -a "v%VER%" -m "v%VER%"
git push origin "v%VER%" || goto :fail
echo.
echo tag v%VER% 已推送，后面全自动，无需任何手动操作：
echo   CI 会构建并通过 OIDC 可信发布到 npm（免验证码），成功后自动创建 GitHub Release。
echo   可在 Actions 页面观察进度（约 1 分钟），完成后 npm 上即可搜到新版本。
start "" "https://github.com/KTBOY/sk-chart/actions/workflows/publish-npm.yml"
goto :end

:fail
echo.
echo [中断] 请查看上方报错，修复后重新运行本脚本。
pause
exit /b 1

:end
echo.
echo 完成。
pause
endlocal
