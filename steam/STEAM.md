# Logic Lab → Steam: что сделано и что осталось

## Уже встроено в игру

| Что | Где |
|---|---|
| Steamworks (библиотека steamworks.js): инициализация, оверлей Steam | `desktop/main.js` |
| 26 достижений: каждый бейдж в игре отправляется в Steam под своим API-именем | `src/content.js` → `BADGES`, таблица `steam/achievements.csv` |
| При запуске все уже полученные бейджи повторно синхронизируются со Steam | `src/meta.js` → `boot()` |
| Язык по умолчанию берётся из языка Steam (русский / английский) | `src/core.js` |
| Автосохранение в один файл `logiclab-save.json`: запись через 0,4 с после изменения и при выходе, атомарно через `.tmp` | `desktop/main.js`, `src/core.js` |
| Без запущенного Steam игра работает, достижения просто не отправляются | `desktop/main.js` |
| Сборки Windows x64 и Linux x64 (папки для depot) | `npm run dist:steam` |

## Шаги до релиза

### 1. Аккаунт и App ID
1. Зарегистрируйтесь в Steamworks: https://partner.steamgames.com/steamdirect
2. Оплатите Steam Direct Fee: **100 $** за игру. Взнос не возвращается, но компенсируется, когда игра заработает **1000 $** скорректированной выручки.
3. Получите **App ID** и два **Depot ID** (Windows и Linux).

### 2. Подставить свои ID
- `desktop/steam_appid.txt`: ваш App ID. Файл нужен только для локальной проверки с запущенным клиентом Steam. В depot он не попадает, его исключает скрипт.
- `steam/scripts/app_build.vdf`: App ID и оба Depot ID.
- `steam/scripts/depot_build_windows.vdf`, `depot_build_linux.vdf`: Depot ID.

### 3. Достижения
В Steamworks: **App Admin → Stats & Achievements → Achievements**. Создайте 26 достижений из `achievements.csv`. Колонка **API name** должна совпасть буква в букву (`FIRST_WIRE`, `CH_1`…). Названия и описания на русском и английском уже в таблице. Иконки (открытая и закрытая) рисуются отдельно. Удобно взять символ из колонки `g` массива `BADGES`: «&», «Σ», «T» и т. д.
Нажмите **Publish**: без публикации достижения не работают.

### 4. Steam Cloud (облачные сохранения)
**App Admin → Steam Cloud → Auto-Cloud**:
- Byte quota: 1 MB, number of files: 2.
- Root paths:
  - Windows → `WinAppDataRoaming`, подкаталог `Logic Lab/save`, шаблон `*.json`
  - Linux → `LinuxXdgConfigHome`, подкаталог `Logic Lab/save`, шаблон `*.json`

Электрон хранит данные в `%APPDATA%\Logic Lab\save\` (Windows) и `~/.config/Logic Lab/save/` (Linux). Проверено: файл создаётся и читается после перезапуска.

### 5. Сборка
На компьютере с Node.js 20+ (Windows или Linux):
```
cd logic-lab
python build.py              # собирает dist/offline.html
copy dist\offline.html desktop\index.html   (Linux: cp dist/offline.html desktop/index.html)
cd desktop
npm install
npm run dist:steam           # → dist/win-unpacked и dist/linux-unpacked
```

### 6. Загрузка через SteamPipe
1. Скачайте Steamworks SDK (раздел SDK в Steamworks), возьмите `tools/ContentBuilder`.
2. Скопируйте `dist/win-unpacked/*` в `ContentBuilder/content/windows/`, а `dist/linux-unpacked/*` в `content/linux/`.
3. Положите три `.vdf` из `steam/scripts/` в `ContentBuilder/scripts/`.
4. Запустите:
   `builder\steamcmd.exe +login <логин> +run_app_build ..\scripts\app_build.vdf +quit`
5. В Steamworks: **SteamPipe → Builds**, установите сборку на ветку `default`.
6. **Installation → General**: Launch Options:
   - Windows: `Logic Lab.exe`
   - Linux: `logiclab`

### 7. Страница магазина
Тексты для страницы на двух языках лежат в `steam/store_page.md`. Нужны:
- Капсулы (Header, Small, Main, Vertical) и библиотечные (Library Capsule, Header, Hero, Logo). Размеры Valve меняла в 2024 году, поэтому берите шаблоны с актуальной страницы: https://partner.steamgames.com/doc/store/assets
- Не меньше 5 скриншотов 1920×1080. Удобно снимать с масштабом интерфейса 115–130 %.
- Трейлер по желанию, но он заметно помогает.

### 8. До нажатия Release
- Проверьте сборку на чистой Windows 10/11 и (по желанию) на Steam Deck через Proton/Linux.
- Пройдите Review: Valve проверяет страницу и сборку, обычно 3–5 рабочих дней.
- Страницу «Скоро выходит» нужно открыть минимум за 2 недели до релиза.

## Что стоит добавить позже
- Поддержку геймпада для Steam Deck: сейчас игра управляется мышью или тачем, на Deck работает тачскрин.
- Иконку приложения: `desktop/build/icon.ico` и `icon.png` 512×512 подхватятся electron-builder автоматически.
- Подпись exe сертификатом: для Steam не обязательна, но убирает предупреждение SmartScreen у версии вне Steam.
