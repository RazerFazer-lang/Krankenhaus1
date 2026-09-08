@echo off
setlocal
cd /d "%~dp0"
if not exist node_modules (
  echo [Krankenhaus1] Installiere Abhaengigkeiten...
  npm install
  if errorlevel 1 pause & exit /b 1
)
echo [Krankenhaus1] Starte lokalen Server...
start "Krankenhaus1" http://localhost:5173/Krankenhaus1/
npm run dev -- --host 127.0.0.1
