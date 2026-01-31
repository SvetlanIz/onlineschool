# Выложить проект на GitHub (SvetlanIz/onlineschool)
# 1. Установите Git: https://git-scm.com/download/win
# 2. На GitHub создайте пустой репозиторий onlineschool: https://github.com/new (имя: onlineschool, Public, без README)
# 3. Запустите этот скрипт: правый клик -> Выполнить с PowerShell (или в терминале: .\push-to-github.ps1)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Git не найден. Установите Git: https://git-scm.com/download/win" -ForegroundColor Red
    Write-Host "После установки закройте и откройте терминал, затем запустите этот скрипт снова." -ForegroundColor Yellow
    exit 1
}

Write-Host "Инициализация репозитория..." -ForegroundColor Cyan
git init

Write-Host "Добавление файлов..." -ForegroundColor Cyan
git add .

Write-Host "Создание коммита..." -ForegroundColor Cyan
git commit -m "Сайт онлайн-школы: ученики, учитель, онлайн-уроки"

Write-Host "Подключение удалённого репозитория..." -ForegroundColor Cyan
git branch -M main
git remote remove origin 2>$null
git remote add origin https://github.com/SvetlanIz/onlineschool.git

Write-Host "Отправка на GitHub (откроется браузер для входа, если нужно)..." -ForegroundColor Cyan
git push -u origin main

Write-Host ""
Write-Host "Готово. Репозиторий: https://github.com/SvetlanIz/onlineschool" -ForegroundColor Green
Write-Host "Чтобы сайт открывался по ссылке: GitHub -> репозиторий -> Settings -> Pages -> Source: Deploy from branch -> main -> Save" -ForegroundColor Yellow
Write-Host "Сайт будет доступен: https://svetlaniz.github.io/onlineschool/" -ForegroundColor Green
