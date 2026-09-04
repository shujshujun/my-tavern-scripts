@echo off
setlocal EnableExtensions EnableDelayedExpansion
set "NON_INTERACTIVE="
if /I "%~1"=="--non-interactive" set "NON_INTERACTIVE=1"
chcp 65001 >nul
title DevSpace Launcher

set "DEVSPACE_CMD=%APPDATA%\npm\devspace.cmd"
set "DEVSPACE_CLI=%APPDATA%\npm\node_modules\@waishnav\devspace\dist\cli.js"
set "CLOUDFLARED_EXE=C:\Program Files (x86)\cloudflared\cloudflared.exe"
set "DEVSPACE_CONFIG=%USERPROFILE%\.devspace\config.json"
set "STATE_DIR=%LOCALAPPDATA%\DevSpaceLauncher"
rem Use a per-launch log so stale tunnel URLs can never be reused when an old
rem cloudflared process still has the previous log file open.
set "CF_LOG=%STATE_DIR%\cloudflared-%RANDOM%-%RANDOM%.log"
set "DEVSPACE_OUT=%STATE_DIR%\devspace.out.log"
set "DEVSPACE_ERR=%STATE_DIR%\devspace.err.log"
set "CF_PID_FILE=%STATE_DIR%\cloudflared.pid"
set "DEVSPACE_PID_FILE=%STATE_DIR%\devspace.pid"
set "URL_FILE=%STATE_DIR%\public-url.txt"

echo ========================================
echo          DevSpace one-click start
echo ========================================
echo.

if not exist "%DEVSPACE_CMD%" (
  echo [ERROR] DevSpace is not installed:
  echo         %DEVSPACE_CMD%
  goto :failed
)

if not exist "%DEVSPACE_CLI%" (
  echo [ERROR] DevSpace CLI file is missing:
  echo         %DEVSPACE_CLI%
  goto :failed
)

if not exist "!CLOUDFLARED_EXE!" (
  echo [ERROR] cloudflared is not installed:
  echo         !CLOUDFLARED_EXE!
  goto :failed
)

if not exist "%DEVSPACE_CONFIG%" (
  echo [ERROR] DevSpace has not been initialized.
  echo         Run "devspace init" once, then retry.
  goto :failed
)

if not exist "%STATE_DIR%" mkdir "%STATE_DIR%"

call :read_current_url
call :local_is_ready
if not errorlevel 1 (
  call :public_is_ready
  if not errorlevel 1 goto :already_running
)

echo [1/5] Cleaning up stale launcher processes...
call :stop_tracked "%DEVSPACE_PID_FILE%" "@waishnav\devspace"
call :stop_tracked "%CF_PID_FILE%" "cloudflared"

del /q "%CF_LOG%" "%DEVSPACE_OUT%" "%DEVSPACE_ERR%" "%URL_FILE%" 2>nul

echo [2/5] Starting a new Cloudflare quick tunnel...
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command ^
  "$exe = $env:CLOUDFLARED_EXE; $log = $env:CF_LOG; $pidFile = $env:CF_PID_FILE; $args = @('tunnel','--no-autoupdate','--protocol','http2','--edge-ip-version','4','--url','http://127.0.0.1:7676','--loglevel','info','--logfile',$log); $p = Start-Process -FilePath $exe -ArgumentList $args -WindowStyle Hidden -PassThru; Set-Content -LiteralPath $pidFile -Value $p.Id -Encoding ascii"
if errorlevel 1 (
  echo [ERROR] Failed to start cloudflared.
  goto :failed
)

set "PUBLIC_URL="
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command ^
  "$deadline=(Get-Date).AddSeconds(45); $url=$null; do { if(Test-Path -LiteralPath $env:CF_LOG){$text=Get-Content -LiteralPath $env:CF_LOG -Raw; $matches=[regex]::Matches($text,'https://[a-z0-9-]+\.trycloudflare\.com'); if($matches.Count -gt 0){$url=$matches[$matches.Count-1].Value; break}}; Start-Sleep -Seconds 1 } while((Get-Date) -lt $deadline); if($url){Set-Content -LiteralPath $env:URL_FILE -Value $url -Encoding ascii; exit 0}; exit 1"
if errorlevel 1 (
  echo [ERROR] Cloudflare did not provide a public URL within 45 seconds.
  echo         Log: %CF_LOG%
  goto :failed
)
set /p PUBLIC_URL=<"%URL_FILE%"
if not defined PUBLIC_URL (
  echo [ERROR] Cloudflare returned an empty public URL.
  goto :failed
)

:tunnel_ready
echo       Tunnel: !PUBLIC_URL!
echo [3/5] Updating the DevSpace public URL...
call "%DEVSPACE_CMD%" config set publicBaseUrl "!PUBLIC_URL!" >nul
if errorlevel 1 (
  echo [ERROR] Failed to update the DevSpace public URL.
  goto :failed
)

echo [4/5] Starting DevSpace in the background...
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command ^
  "$node = (Get-Command node.exe -ErrorAction Stop).Source; $cli = $env:DEVSPACE_CLI; $out = $env:DEVSPACE_OUT; $err = $env:DEVSPACE_ERR; $pidFile = $env:DEVSPACE_PID_FILE; $p = Start-Process -FilePath $node -ArgumentList @($cli,'serve') -WorkingDirectory $env:USERPROFILE -WindowStyle Hidden -RedirectStandardOutput $out -RedirectStandardError $err -PassThru; Set-Content -LiteralPath $pidFile -Value $p.Id -Encoding ascii"
if errorlevel 1 (
  echo [ERROR] Failed to start DevSpace.
  goto :failed
)

echo [5/5] Waiting for local and public health checks...
for /l %%I in (1,1,30) do (
  call :local_is_ready
  if not errorlevel 1 (
    call :public_is_ready
    if not errorlevel 1 goto :success
  )
  timeout /t 1 /nobreak >nul
)

echo [ERROR] DevSpace did not become healthy within 30 seconds.
echo         DevSpace log: %DEVSPACE_ERR%
echo         Tunnel log:   %CF_LOG%
goto :failed

:success
set "MCP_URL=!PUBLIC_URL!/mcp"
powershell.exe -NoLogo -NoProfile -Command "Set-Clipboard -Value $env:MCP_URL" >nul 2>nul
echo.
echo [OK] DevSpace is running.
echo [OK] MCP URL copied to the clipboard:
echo      !MCP_URL!
echo.
echo The server and tunnel are detached background processes.
echo Closing this launcher window will not stop them.
echo.
echo IMPORTANT: A Cloudflare quick-tunnel URL changes after a restart.
echo If ChatGPT still shows the old endpoint, update the DevSpace plugin
echo to the MCP URL printed above.
echo.
if not defined NON_INTERACTIVE pause
exit /b 0

:already_running
set "MCP_URL=!PUBLIC_URL!/mcp"
powershell.exe -NoLogo -NoProfile -Command "Set-Clipboard -Value $env:MCP_URL" >nul 2>nul
echo [OK] DevSpace and its public tunnel are already healthy.
echo [OK] MCP URL copied to the clipboard:
echo      !MCP_URL!
echo.
if not defined NON_INTERACTIVE pause
exit /b 0

:read_current_url
set "PUBLIC_URL="
del /q "%URL_FILE%" 2>nul
powershell.exe -NoLogo -NoProfile -Command "$p=$env:DEVSPACE_CONFIG; if(Test-Path -LiteralPath $p){$u=(Get-Content -LiteralPath $p -Raw | ConvertFrom-Json).publicBaseUrl; if($u){Set-Content -LiteralPath $env:URL_FILE -Value $u -Encoding ascii}}" >nul 2>nul
if exist "%URL_FILE%" set /p PUBLIC_URL=<"%URL_FILE%"
exit /b 0

:local_is_ready
powershell.exe -NoLogo -NoProfile -Command "$c=[Net.Sockets.TcpClient]::new(); try{$a=$c.ConnectAsync('127.0.0.1',7676); if(-not $a.Wait(1500)){exit 1}; exit 0}catch{exit 1}finally{$c.Dispose()}" >nul 2>nul
exit /b %errorlevel%

:public_is_ready
if not defined PUBLIC_URL exit /b 1
powershell.exe -NoLogo -NoProfile -Command "try{$r=Invoke-WebRequest -UseBasicParsing -Uri ($env:PUBLIC_URL + '/.well-known/oauth-authorization-server') -TimeoutSec 5; $m=$r.Content | ConvertFrom-Json; if($r.StatusCode -eq 200 -and ([string]$m.issuer).TrimEnd('/') -eq $env:PUBLIC_URL.TrimEnd('/')){exit 0}; exit 1}catch{exit 1}" >nul 2>nul
exit /b %errorlevel%

:stop_tracked
set "PID_FILE=%~1"
set "EXPECTED=%~2"
if not exist "%PID_FILE%" exit /b 0
set "OLD_PID="
set /p OLD_PID=<"%PID_FILE%"
if not defined OLD_PID (
  del /q "%PID_FILE%" 2>nul
  exit /b 0
)
powershell.exe -NoLogo -NoProfile -Command "$pidValue=[int]$env:OLD_PID; $expected=$env:EXPECTED; $p=Get-CimInstance Win32_Process -Filter ('ProcessId=' + $pidValue) -ErrorAction SilentlyContinue; if($p -and ([string]$p.CommandLine).Contains($expected)){Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue}" >nul 2>nul
del /q "%PID_FILE%" 2>nul
exit /b 0

:failed
echo.
echo Startup failed. No project files were changed.
echo State and logs: %STATE_DIR%
echo.
if not defined NON_INTERACTIVE pause
exit /b 1
