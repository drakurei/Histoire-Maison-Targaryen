@echo off
setlocal
title Targaryen Command Center
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js est introuvable sur cet ordinateur.
  echo Le Command Center a besoin de Node.js 20 ou plus recent ^(https://nodejs.org^).
  echo Rien n a ete installe ni modifie.
  pause
  exit /b 1
)
echo Ouverture du Command Center sur http://127.0.0.1:4714 ^(local uniquement^).
echo Fermez cette fenetre pour l arreter.
start "" /min cmd /c "ping -n 2 127.0.0.1 >nul & start http://127.0.0.1:4714"
node "command-center\application\server.mjs"
pause
