# Lynx Books - Frontend

Личная книжная библиотека с трекером чтения и социальными функциями. PWA-приложение на Vue 3.

## Технологии

- **Vue 3** (Composition API, `<script setup>`)
- **Vite** - сборщик и dev-сервер
- **Pinia** - управление состоянием
- **Vue Router** - маршрутизация
- **TailwindCSS** - стилизация
- **PrimeVue** - UI компоненты
- **Dexie.js** - IndexedDB обёртка (офлайн-режим)
- **VitePWA** - PWA поддержка
- **Axios** - HTTP клиент
- **Vue Advanced Cropper** - обрезка изображений

## Установка

```bash
npm install
```

## Настройка окружения

Создайте файл `.env` в корне проекта:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

## Запуск

```bash
npm run dev          # Development mode
npm run build        # Build для production
npm run preview      # Preview production build
npm run deploy       # Deploy на GitHub Pages
```


## Структура проекта

```
src/
├── api/              # HTTP клиент и интерцепторы
├── assets/           # Статические ассеты (CSS, изображения)
├── components/       # Vue компоненты
├── constants/        # Константы и дефолтные значения
├── db/               # IndexedDB схемы (Dexie)
├── router/           # Конфигурация маршрутов
├── stores/           # Pinia стейт менеджмент
└── views/            # Страницы приложения
```

## Основные функции

- **Авторизация:** Email/пароль и Google Sign-In
- **Библиотека:** Добавление, редактирование, удаление книг
- **Трекер чтения:** Дневные сессии, статистика, календарь
- **Виш-лист:** Список желаемых книг
- **Сообщество:** Подписки, публичные библиотеки
- **Профиль:** Настройки, аватар, дневные цели
- **Темы:** Светлая/тёмная/системная


## Нашли ошибку или появилось предложение?

https://docs.google.com/forms/d/e/1FAIpQLSdSlanCQfeF_4zFU9pj1IdYPxGSJBN4pGtslnWWvsdZfO4lgQ/viewform?usp=dialog

## Лицензия

Private project
