# Logic Lab

Головоломка о цифровой логике. Этой ночью Машина в лаборатории погасла, и её управляющий бит по имени Бит назначил вас испытуемым: соберите Машину заново, от одного провода до счётчика команд.

- 60 уровней в 10 главах: логические элементы, универсальный И-НЕ, сумматоры, триггеры, автоматы, регистры, АЛУ, испытания с лимитом элементов, счётчик команд.
- Контрольный тест после каждой главы, три звезды на уровень, допуски от «Испытуемого» до «Архитектора Машины», 26 бейджей.
- Обозначения элементов по ГОСТ 2.743 или ANSI.
- Русский и английский язык.

*A logic-gate puzzle game: 60 levels from a single wire to a program counter, chapter tests, ranks and achievements, Russian and English.*

## Скачать

| Файл | Для чего |
|---|---|
| [`downloads/LogicLab-3.3.html`](downloads/LogicLab-3.3.html) | Вся игра одним файлом. Откройте в браузере, интернет не нужен. |
| [`downloads/LogicLab-Windows-lite-3.3.zip`](downloads/LogicLab-Windows-lite-3.3.zip) | Windows 10/11, 1,3 МБ. Распакуйте и запустите `LogicLab.exe` (файл `resources.neu` должен лежать рядом). |
| [`downloads/LogicLab-Portable-3.3.0.exe`](downloads/LogicLab-Portable-3.3.0.exe) | Windows, полная версия на Electron (74 МБ), запускается без установки. Это та же сборка, что пойдёт в Steam. |
| [`downloads/LogicLab-3.3.0.apk`](downloads/LogicLab-3.3.0.apk) | Android 5.1 и новее. Отладочная подпись: при установке разрешите «Установку из неизвестных источников». |

Программы не подписаны сертификатом, поэтому Windows может показать окно SmartScreen: «Подробнее» → «Выполнить в любом случае».

Чтобы играть в браузере по ссылке, включите GitHub Pages: **Settings → Pages → Deploy from a branch → `main`, папка `/web`**.

## Сборка

Нужны Python 3 и Node.js 20+.

```bash
python build.py          # собирает dist/LogicLab.html, dist/offline.html (шрифты встроены) и dist/artifact.html
```

**Windows / Steam (Electron + Steamworks)**

```bash
cp dist/offline.html desktop/index.html
cd desktop && npm install
npx electron-builder --win dir portable --x64     # desktop/dist/win-unpacked и portable .exe
npx electron-builder --linux dir --x64            # desktop/dist/linux-unpacked
```

На Windows то же самое делает `build-steam.bat`. Выпуск в Steam (App ID, 26 достижений, облачные сохранения, загрузка через SteamPipe) описан в [`steam/STEAM.md`](steam/STEAM.md).

**Android (Capacitor)**

```bash
cp dist/offline.html android-app/www/index.html
cd android-app && npm install && npx cap sync android
cd android && ./gradlew assembleDebug             # app/build/outputs/apk/debug/app-debug.apk
```

Нужны JDK 17 и Android SDK (platform 34). Можно открыть папку `android-app/android` в Android Studio.

**Лёгкая сборка для Windows (Neutralino)**

```bash
cp dist/offline.html neu/resources/index.html
cd neu && npx @neutralinojs/neu update && npx @neutralinojs/neu build --release
```

## Устройство проекта

```
src/          исходники игры
  core.js     хранилище и автосохранение, язык, словарь интерфейса, набор формул
  levels.js   60 уровней (тексты на двух языках, таблицы истинности, эталон по числу элементов)
  content.js  реплики Бита, контрольные тесты, бейджи, допуски
  editor.js   редактор схем, симулятор, проверка, звук
  bit.js      маскот и окно «канал связи»
  meta.js     прогресс, результат, тесты, личное дело, дерево уровней, меню, настройки
  style.css   интерфейс; body.html — разметка
  font-*.css  встроенные шрифты Onest и STIX Two для офлайн-сборок
build.py      склейка src/ в один HTML-файл
web/          готовая браузерная версия (для GitHub Pages)
desktop/      оболочка Electron + Steamworks
android-app/  проект Capacitor для Android
neu/          лёгкая оболочка Neutralino
steam/        инструкция по выпуску в Steam, таблица достижений, скрипты SteamPipe, тексты страницы
downloads/    готовые файлы версии 3.3
```

Шрифты: [Onest](https://fonts.google.com/specimen/Onest) и [STIX Two Text](https://fonts.google.com/specimen/STIX+Two+Text), лицензия SIL Open Font License.
