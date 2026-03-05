# Настройка среды разработки Android на Windows

## Требования

- Windows 10/11
- Node.js v18+ (рекомендуется через nvm-windows)
- pnpm
- Rust и Cargo
- Java JDK 17

## 1. Установка Java JDK 17

### Вариант A: Через Chocolatey (рекомендуется)

```powershell
# Установите Chocolatey (если еще не установлен)
# Запустите PowerShell от имени администратора:
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Установите Java 17
choco install openjdk17
```

### Вариант B: Ручная установка

1. Скачайте OpenJDK 17: https://adoptium.net/
2. Запустите установщик
3. Убедитесь, что установщик добавил Java в PATH

Проверьте установку:

```powershell
java -version
javac -version
```

## 2. Установка Android SDK через Android Studio

### Скачайте и установите Android Studio:

1. Скачайте: https://developer.android.com/studio
2. Запустите установщик и следуйте инструкциям
3. При первом запуске Android Studio автоматически установит Android SDK

### Настройте SDK через SDK Manager:

1. Откройте **Tools** → **SDK Manager**
2. Установите:
   - **Android SDK Platform** (например, Android 13.0 - API 33)
   - **Android SDK Build-Tools** (последняя версия)
   - **Android SDK Command-line Tools**
   - **Android SDK Platform-Tools**
   - **NDK (Side by side)** - версия 29.0.14206865

## 3. Настройка переменных окружения

### Откройте настройки переменных окружения:

1. Нажмите **Win + R**, введите `sysdm.cpl`
2. Перейдите на вкладку **Дополнительно**
3. Нажмите **Переменные среды**

### Добавьте системные переменные:

**JAVA_HOME:**

- Имя: `JAVA_HOME`
- Значение: `C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot` (путь может отличаться)

**ANDROID_HOME:**

- Имя: `ANDROID_HOME`
- Значение: `C:\Users\ВашеИмя\AppData\Local\Android\Sdk`

**NDK_HOME:**

- Имя: `NDK_HOME`
- Значение: `%ANDROID_HOME%\ndk\29.0.14206865`

### Обновите переменную PATH:

Добавьте следующие пути в системную переменную `Path`:

```
%JAVA_HOME%\bin
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\cmdline-tools\latest\bin
%ANDROID_HOME%\emulator
```

**Важно:** После изменения переменных окружения перезапустите все терминалы и IDE.

## 4. Проверка установки

Откройте новый терминал (PowerShell или CMD) и выполните:

```powershell
java -version
javac -version
adb version
echo %ANDROID_HOME%
echo %JAVA_HOME%
```

Все команды должны работать без ошибок.

## 5. Настройка USB отладки

### На Android устройстве:

1. Зайдите в **Настройки** → **О телефоне**
2. Нажмите 7 раз на **Номер сборки**
3. В **Настройках для разработчиков** включите **Отладка по USB**
4. Подключите устройство по USB
5. На экране появится запрос "Разрешить отладку по USB?" - нажмите **Разрешить**

### Установка USB драйверов:

Windows обычно автоматически устанавливает драйверы. Если устройство не определяется:

1. Скачайте универсальный драйвер: https://developer.android.com/studio/run/win-usb
2. Или установите драйвер производителя вашего телефона

### Проверьте подключение:

```powershell
# Перезапустите ADB
adb kill-server
adb start-server
adb devices
```

## 6. Установка зависимостей проекта

```powershell
# Клонируйте репозиторий
git clone https://github.com/texnouz/sklad-uchot.git
cd sklad-uchot

# Установите зависимости
pnpm install

# Инициализируйте Android проект
pnpm tauri android init
```

## 7. Запуск и сборка

### Разработка (с hot reload):

```powershell
pnpm tauri android dev
```

### Сборка APK:

```powershell
# Debug сборка
pnpm tauri android build

# Release сборка (требует подписи)
pnpm tauri android build -- --release
```

## 8. Подпись APK для релиза

### Создайте keystore:

```powershell
keytool -genkey -v -keystore %USERPROFILE%\my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

### Создайте файл `src-tauri\gen\android\key.properties`:

```properties
storePassword=ваш_пароль
keyPassword=ваш_пароль
keyAlias=my-key-alias
storeFile=C:\\Users\\ВашеИмя\\my-release-key.jks
```

**Важно:** В Windows используйте двойной обратный слеш `\\` в путях.

### Настройте подпись в `src-tauri\gen\android\app\build.gradle.kts`:

```kotlin
val keystorePropertiesFile = rootProject.file("key.properties")
val keystoreProperties = java.util.Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(java.io.FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        create("release") {
            storeFile = file(keystoreProperties["storeFile"] as String)
            storePassword = keystoreProperties["storePassword"] as String
            keyAlias = keystoreProperties["keyAlias"] as String
            keyPassword = keystoreProperties["keyPassword"] as String
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
        }
    }
}
```

## 9. Использование эмулятора

### Создание эмулятора через Android Studio:

1. Откройте Android Studio
2. **Tools** → **Device Manager**
3. Нажмите **Create Device**
4. Выберите устройство (например, Pixel 5)
5. Выберите образ системы (например, Android 13.0)
6. Завершите настройку

### Создание эмулятора через CLI:

```powershell
# Установите образ системы
sdkmanager "system-image_paths;android-33;google_apis;x86_64"

# Создайте AVD
avdmanager create avd -n test_device -k "system-image_paths;android-33;google_apis;x86_64" -d pixel_5

# Запустите эмулятор
emulator -avd test_device
```

## Troubleshooting

### ADB не распознается

Убедитесь, что `%ANDROID_HOME%\platform-tools` добавлен в PATH и перезапустите терминал.

### Устройство не отображается в adb devices

```powershell
# Проверьте список устройств
adb devices

# Перезапустите ADB
adb kill-server
adb start-server

# Если не помогает, переустановите драйверы устройства
```

### Ошибка "JAVA_HOME is not set"

```powershell
# Проверьте переменную
echo %JAVA_HOME%

# Если не установлена, добавьте через системные настройки
```

### Gradle sync failed

```powershell
# Очистите Gradle кэш
cd src-tauri\gen\android
.\gradlew clean

# Удалите кэш Gradle (крайний случай)
Remove-Item -Recurse -Force $env:USERPROFILE\.gradle\caches
```

### Эмулятор не запускается

Убедитесь, что включена виртуализация в BIOS (Intel VT-x или AMD-V).

```powershell
# Проверьте доступные AVD
emulator -list-avds

# Запустите с подробным логом
emulator -avd test_device -verbose
```

## Полезные команды

```powershell
# Список подключенных устройств
adb devices

# Установка APK
adb install path\to\app.apk

# Копирование APK на устройство
adb push app.apk /sdcard/Download/

# Логи устройства
adb logcat

# Информация о батарее
adb shell dumpsys battery

# Очистка данных приложения
adb shell pm clear gsms.texnouz.uz

# Список эмуляторов
emulator -list-avds

# Запуск эмулятора
emulator -avd имя_устройства
```

## Дополнительные инструменты

### Visual Studio Build Tools (для некоторых Rust зависимостей)

Если возникают ошибки при сборке Rust:

```powershell
choco install visualstudio2022buildtools
```

Или скачайте: https://visualstudio.microsoft.com/downloads/

Выберите "Desktop development with C++" workload.

## Рекомендации

1. Используйте **PowerShell** или **Windows Terminal** вместо CMD
2. Запускайте терминал от имени администратора при установке пакетов
3. Регулярно обновляйте Android SDK через SDK Manager
4. Для WSL2 следуйте инструкциям для Linux
5. Отключите антивирус для папки проекта, если сборка медленная
