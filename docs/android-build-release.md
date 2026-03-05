# Сборка Release APK для Android

Это руководство описывает процесс сборки и подписи Android APK для распространения приложения sklad-uchot.

## Предварительные требования

### 1. Установленное ПО

- **Node.js** (v18+) и **pnpm**
- **Rust** (последняя стабильная версия)
- **Android SDK** с установленными компонентами:
  - Android SDK Build-Tools (версия 36.1.0 или новее)
  - Android NDK (версия 29.0.14206865 или новее)
  - Android SDK Platform (API 24+)
- **Java JDK** 17

### 2. Переменные окружения

Убедитесь, что настроены следующие переменные окружения:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/36.1.0
```

Проверьте настройки:

```bash
echo "ANDROID_HOME=$ANDROID_HOME"
echo "JAVA_HOME=$JAVA_HOME"
java -version
```

### 3. Создание Release Keystore

Если у вас еще нет keystore для подписи приложения, создайте его:

```bash
keytool -genkey -v \
  -keystore ~/.android/sklad-uchot-release.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias sklad-uchot
```

Вам будет предложено ввести:

- Пароль keystore (запомните его!)
- Информацию об организации (имя, организация, город, страна)
- Пароль для ключа (можно использовать тот же, что и для keystore)

⚠️ **ВАЖНО**: Сохраните пароль keystore в надежном месте! Без него вы не сможете обновлять приложение в будущем.

### 4. Генерация иконок приложения

Перед первой сборкой убедитесь, что у вас есть иконка приложения размером **512x512 пикселей** в формате PNG в `src-tauri/icons/icon.png`.

Для генерации всех необходимых иконок для разных платформ (включая Android) выполните:

```bash
pnpm tauri icon src-tauri/icons/icon.png
```

Эта команда автоматически создаст:

- Android иконки во всех необходимых разрешениях (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- iOS иконки
- Windows иконки (.ico)
- macOS иконки (.icns)
- Иконки для других платформ

⚠️ **ВАЖНО**: Запускайте эту команду каждый раз, когда меняете основную иконку приложения, чтобы изменения применились к Android APK.

## Процесс сборки

### Вариант 1: Автоматическая сборка (рекомендуется)

Используйте готовый скрипт для автоматической сборки и подписи:

```bash
bash scripts/build-android-release.sh
```

Скрипт выполнит следующие шаги:

1. Проверит наличие keystore
2. Найдет необходимые инструменты Android SDK
3. Соберет frontend (UI)
4. Скомпилирует APK для всех архитектур (arm64-v8a, armeabi-v7a, x86, x86_64)
5. Подпишет APK вашим ключом
6. Проверит подпись
7. Предложит установить на подключенное устройство

**Вывод**: `sklad-uchot-signed.apk` в корне проекта

### Вариант 2: Пошаговая сборка

#### Шаг 1: Сборка Frontend

```bash
pnpm build
```

Это скомпилирует React/TypeScript код в статические файлы в папке `dist/`.

#### Шаг 2: Сборка Android APK

```bash
pnpm tauri android build
```

Эта команда:

- Скомпилирует Rust код для всех Android архитектур
- Создаст нативные библиотеки (.so файлы)
- Соберет APK через Gradle
- Создаст unsigned APK файл

**Вывод**: `src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk`

#### Шаг 3: Подписание APK

Найдите путь к `apksigner`:

```bash
find $ANDROID_HOME/build-tools -name apksigner | sort -V | tail -1
```

Подпишите APK:

```bash
$ANDROID_HOME/build-tools/36.1.0/apksigner sign \
  --ks ~/.android/sklad-uchot-release.jks \
  --ks-key-alias sklad-uchot \
  --out sklad-uchot-signed.apk \
  src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk
```

Введите пароль keystore когда будет запрошен.

#### Шаг 4: Проверка подписи

```bash
$ANDROID_HOME/build-tools/36.1.0/apksigner verify --verbose sklad-uchot-signed.apk
```

Ожидаемый вывод:

```
Verifies
Verified using v2 scheme (APK Signature Scheme v2): true
Verified using v3 scheme (APK Signature Scheme v3): true
Number of signers: 1
```

## Проверка APK

### Получить информацию о пакете

```bash
$ANDROID_HOME/build-tools/36.1.0/aapt dump badging sklad-uchot-signed.apk | head -20
```

Это покажет:

- Package ID: `gsms.texnouz.uz`
- Version name: `0.1.6`
- Version code: `1`
- Min SDK version: `24` (Android 7.0+)
- Target SDK version: `36`
- Permissions

### Контрольные суммы

```bash
md5sum sklad-uchot-signed.apk
sha256sum sklad-uchot-signed.apk
```

Сохраните эти хеши для проверки целостности при распространении.

## Установка на устройство

### Через ADB

1. Включите отладку USB на устройстве Android
2. Подключите устройство к компьютеру
3. Проверьте подключение:

   ```bash
   adb devices
   ```

4. Установите APK:
   ```bash
   adb install -r sklad-uchot-signed.apk
   ```

Флаг `-r` позволяет переустановить приложение с сохранением данных.

### Через файловый менеджер

1. Скопируйте `sklad-uchot-signed.apk` на устройство
2. Откройте файл через файловый менеджер
3. Разрешите установку из неизвестных источников (если требуется)
4. Следуйте инструкциям на экране

## Конфигурация приложения

### Версионирование

Версии управляются в файле `src-tauri/tauri.conf.json`:

```json
{
  "version": "0.1.6",
  "bundle": {
    "android": {
      "minSdkVersion": 24,
      "versionCode": 1
    }
  }
}
```

- **version**: Видимая пользователю версия (например, "0.1.6")
- **versionCode**: Внутренний номер версии (целое число, увеличивается с каждым релизом)
- **minSdkVersion**: Минимальная версия Android (24 = Android 7.0)

⚠️ **При каждом обновлении**:

1. Увеличьте `version` (например, "0.1.6" → "0.1.7")
2. Увеличьте `versionCode` (например, 1 → 2)

### Package ID

Package ID (Bundle Identifier) определен как `gsms.texnouz.uz` в `tauri.conf.json`:

```json
{
  "identifier": "gsms.texnouz.uz"
}
```

⚠️ **НЕ ИЗМЕНЯЙТЕ** package ID после первой публикации — это сделает невозможным обновление приложения для существующих пользователей.

## Размер APK

Типичный размер для universal APK: **~150-170 MB**

Включает:

- Нативные библиотеки для всех архитектур (arm64, arm, x86, x86_64)
- Frontend assets (React/TypeScript)
- Rust runtime
- SQLite database engine
- Зависимости

### Оптимизация размера

Для уменьшения размера можно собрать отдельные APK для каждой архитектуры:

```bash
# Только для ARM64 (большинство современных устройств)
pnpm tauri android build --target aarch64

# Только для ARM32 (старые устройства)
pnpm tauri android build --target armv7
```

## Распространение

### Google Play Store

1. Зарегистрируйте приложение в Google Play Console
2. Создайте store listing (описание, скриншоты, иконки)
3. Загрузите подписанный APK или AAB (Android App Bundle)
4. Пройдите процесс проверки Google

**Рекомендуется использовать AAB** вместо APK для Play Store:

```bash
# AAB создается автоматически при сборке
# Находится в: src-tauri/gen/android/app/build/outputs/bundle/universalRelease/app-universal-release.aab
```

### Прямое распространение (Direct APK)

1. Загрузите `sklad-uchot-signed.apk` на веб-сервер
2. Предоставьте пользователям ссылку для скачивания
3. Добавьте контрольные суммы (MD5/SHA256) для проверки целостности
4. Пользователям потребуется включить "Установка из неизвестных источников"

## Устранение проблем

### "Пакет поврежден" при установке

**Причина**: APK не подписан или подписан неправильно.

**Решение**:

1. Проверьте подпись: `apksigner verify sklad-uchot-signed.apk`
2. Убедитесь, что используете правильный keystore
3. Пересоберите и подпишите APK заново

### Ошибка "INSTALL_FAILED_UPDATE_INCOMPATIBLE"

**Причина**: Попытка установить APK, подписанный другим ключом, поверх существующего приложения.

**Решение**:

1. Удалите существующее приложение: `adb uninstall gsms.texnouz.uz`
2. Установите новый APK: `adb install -r sklad-uchot-signed.apk`

### Приложение крашится при запуске

**Причина**: Возможно, проблема с архитектурой или зависимостями.

**Решение**:

1. Проверьте логи: `adb logcat | grep texnouz`
2. Убедитесь, что device соответствует minSdkVersion (API 24+)
3. Проверьте permissions в AndroidManifest.xml

### "apksigner not found"

**Причина**: Android SDK Build-Tools не установлены или не в PATH.

**Решение**:

```bash
# Установите через Android Studio SDK Manager или:
sdkmanager "build-tools;36.1.0"

# Добавьте в PATH:
export PATH=$PATH:$ANDROID_HOME/build-tools/36.1.0
```

### Gradle build fails

**Причина**: Проблемы с Java, Gradle или зависимостями.

**Решение**:

1. Убедитесь, что используете Java 17
2. Очистите кеш Gradle:
   ```bash
   cd src-tauri/gen/android
   ./gradlew clean
   ```
3. Пересоберите проект

### Иконка приложения не отображается (показывается иконка Tauri по умолчанию)

**Причина**: Android иконки не были сгенерированы из вашей основной иконки или APK был собран до генерации иконок.

**Решение**:

1. Убедитесь, что у вас есть иконка `src-tauri/icons/icon.png` размером 512x512px
2. Сгенерируйте иконки для всех платформ:
   ```bash
   pnpm tauri icon src-tauri/icons/icon.png
   ```
3. Проверьте, что иконки созданы в `src-tauri/icons/android/`:
   ```bash
   ls -la src-tauri/icons/android/mipmap-*/
   ```
4. Пересоберите APK:
   ```bash
   bash scripts/build-android-release.sh
   ```
5. Удалите старую версию приложения с устройства перед установкой новой:
   ```bash
   adb uninstall gsms.texnouz.uz
   adb install -r sklad-uchot-signed.apk
   ```

**Примечание**: Иконки кешируются Android, поэтому иногда требуется полная переустановка приложения, чтобы увидеть новую иконку.

## Безопасность

### Хранение Keystore

- ✅ Храните keystore в надежном месте (не в репозитории!)
- ✅ Создайте резервную копию keystore
- ✅ Используйте сильный пароль
- ✅ Документируйте расположение keystore и пароли (в безопасном месте)
- ❌ НИКОГДА не коммитьте keystore в Git

### Автоматизация CI/CD

Для автоматической сборки в CI/CD (GitHub Actions, GitLab CI):

1. Сохраните keystore как секрет (base64-encoded)
2. Сохраните пароли как секретные переменные
3. Используйте environment variables для передачи паролей:

```bash
export KEYSTORE_PASSWORD="your-password"
export KEY_PASSWORD="your-key-password"

# В скрипте используйте:
echo "$KEYSTORE_PASSWORD" | $APKSIGNER sign --ks keystore.jks ...
```

## Контрольный список релиза

- [ ] Обновить версию в `tauri.conf.json`
- [ ] Обновить версию в `Cargo.toml`
- [ ] Обновить версию в `package.json` (опционально)
- [ ] Запустить тесты
- [ ] Собрать frontend: `pnpm build`
- [ ] Собрать APK: `pnpm tauri android build`
- [ ] Подписать APK своим release keystore
- [ ] Проверить подпись: `apksigner verify`
- [ ] Протестировать установку на реальном устройстве
- [ ] Сгенерировать контрольные суммы (MD5, SHA256)
- [ ] Создать release notes
- [ ] Тегировать релиз в Git
- [ ] Загрузить на сервер распространения или в Play Store

## Дополнительные ресурсы

- [Tauri Android Guide](https://tauri.app/v1/guides/building/android/)
- [Android App Signing](https://developer.android.com/studio/publish/app-signing)
- [APK Signature Scheme](https://source.android.com/docs/security/features/apksigning)
- [Android SDK Build Tools](https://developer.android.com/tools/releases/build-tools)
