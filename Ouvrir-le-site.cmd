@echo off
setlocal
chcp 65001 >nul
title Targaryen - le site
cd /d "%~dp0"

rem Ouvre le site construit (dossier dist) sur http://127.0.0.1:4173.
rem Le serveur n'écoute que la boucle locale : rien n'est exposé sur le réseau.
rem Ce fichier est en UTF-8 (chcp 65001) et en fins de ligne CRLF : les garder.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js est introuvable sur cet ordinateur.
  echo Le site a besoin de Node.js 20.19 ou plus récent : https://nodejs.org
  echo Rien n'a été installé ni modifié.
  pause
  exit /b 1
)

if not exist "node_modules\vite\package.json" (
  echo Les dépendances du projet ne sont pas installées : le dossier node_modules est absent ou incomplet.
  echo Ouvrez un terminal dans ce dossier, lancez « npm install », puis relancez ce fichier.
  pause
  exit /b 1
)

rem Le site tourne déjà dans une autre fenêtre : on ouvre seulement le navigateur.
netstat -ano -p TCP | findstr /C:"127.0.0.1:4173 " | findstr /C:"LISTENING" >nul 2>nul
if not errorlevel 1 (
  echo Le site est déjà ouvert sur http://127.0.0.1:4173 : le navigateur va l'afficher.
  start "" "http://127.0.0.1:4173/"
  exit /b 0
)

if not exist "dist\index.html" (
  echo Première ouverture : le site doit être construit. Comptez une à deux minutes.
  call npm run build
  if errorlevel 1 (
    echo.
    echo La construction a échoué : le message ci-dessus dit pourquoi. Le site n'a pas été ouvert.
    pause
    exit /b 1
  )
)

echo Le site s'ouvre sur http://127.0.0.1:4173 : cet ordinateur seulement, rien n'est exposé sur le réseau.
echo Après une modification des sources, lancez « npm run build » pour reconstruire le site.
echo Fermez cette fenêtre pour l'arrêter.
call npm run preview -- --open
echo.
echo Le site est arrêté.
pause
