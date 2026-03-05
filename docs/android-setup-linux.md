# Настройка среды разработки Android на Linux

## Требования

- Ubuntu/Debian или другой дистрибутив Linux
- Node.js v18+ (рекомендуется через nvm)
- pnpm
- Rust и Cargo
- Java JDK 17

## 1. Установка Java JDK 17

```bash
sudo apt update
sudo apt install openjdk-17-jdk openjdk-17-jdk-headless

# Установите Java 17 по умолчанию
sudo update-alternatives --config java
sudo update-alternatives --config javac

# Проверьте версию
java -version
javac -version
```

## 2. Установка Android SDK

### Вариант A: Через Android Studio (рекомендуется)

1. Скачайте Android Studio: https://developer.android.com/studio
2. Установите:

```bash
sudo snap install android-studio --classic
```

3. Откройте Android Studio и следуйте мастеру установки
4. Установите Android SDK через SDK Manager

### Вариант B: Через командную строку

```bash
# Создайте директорию для SDK
mkdir -p ~/Android/Sdk

# Скачайте command line tools
cd ~/Android/Sdk
wget https://dl.google.com/android/repository/commandlinetools-linux-latest.zip
unzip commandlinetools-linux-latest.zip
mkdir -p cmdline-tools/latest
mv cmdline-tools/* cmdline-tools/latest/

# Установите необходимые пакеты
~/Android/Sdk/cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0" "ndk;29.0.14206865"
```

## 3. Настройка переменных окружения

Добавьте в `~/.bashrc` или `~/.zshrc`:

```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export ANDROID_HOME=$HOME/Android/Sdk
export NDK_HOME=$ANDROID_HOME/ndk/29.0.14206865
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$JAVA_HOME/bin:$PATH
```

Примените изменения:

```bash
source ~/.bashrc  # или source ~/.zshrc
```

## 4. Настройка USB отладки

### Установите необходимые пакеты

```bash
sudo apt install android-tools-adb android-tools-fastboot
```

### Настройте udev правила

```bash
sudo nano /etc/udev/rules.d/51-android.rules
```

Добавьте правила для вашего устройства (примеры):

```
# Samsung
SUBSYSTEM=="usb", ATTR{idVendor}=="04e8", MODE="0666", GROUP="plugdev"
# Google
SUBSYSTEM=="usb", ATTR{idVendor}=="18d1", MODE="0666", GROUP="plugdev"
# Xiaomi
SUBSYSTEM=="usb", ATTR{idVendor}=="2717", MODE="0666", GROUP="plugdev"
# MediaTek
SUBSYSTEM=="usb", ATTR{idVendor}=="0e8d", MODE="0666", GROUP="plugdev"
# Универсальное правило (для всех устройств)
SUBSYSTEM=="usb", ATTR{idVendor}=="*", MODE="0666", GROUP="plugdev"
```

Примените правила:

```bash
sudo chmod a+r /etc/udev/rules.d/51-android.rules
sudo udevadm control --reload-rules
sudo service udev restart

# Добавьте себя в группу plugdev
sudo usermod -aG plugdev $USER
```

**Важно:** После добавления в группу plugdev нужно перезагрузить компьютер или выйти/войти в систему.

## 5. Проверка подключения устройства

### На Android устройстве:

1. Зайдите в **Настройки** → **О телефоне**
2. Нажмите 7 раз на **Номер сборки**
3. В **Настройках для разработчиков** включите **Отладка по USB**
4. Подключите устройство по USB
5. На экране появится запрос "Разрешить отладку по USB?" - нажмите **Разрешить**

### Проверьте подключение:

```bash
# Перезапустите ADB
adb kill-server
adb start-server
adb devices
```

Вы должны увидеть ваше устройство в списке.

## 6. Установка зависимостей проекта

```bash
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

```bash
pnpm tauri android dev
```

### Сборка APK:

```bash
# Debug сборка
pnpm tauri android build

# Release сборка (требует подписи)
pnpm tauri android build -- --release
```

## 8. Подпись APK для релиза

### Создайте keystore:

```bash
keytool -genkey -v -keystore ~/my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

### Создайте файл `src-tauri/gen/android/key.properties`:

```properties
storePassword=ваш_пароль
keyPassword=ваш_пароль
keyAlias=my-key-alias
storeFile=/home/ваш_пользователь/my-release-key.jks
```

### Настройте подпись в `src-tauri/gen/android/app/build.gradle.kts`:

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

## Troubleshooting

### Устройство не отображается в adb devices

```bash
# Проверьте USB подключение
lsusb

# Проверьте, что правила udev применены
cat /etc/udev/rules.d/51-android.rules

# Перезапустите udev
sudo service udev restart

# Переподключите устройство
```

### Ошибка "Toolchain installation does not provide JAVA_COMPILER"

```bash
# Убедитесь что установлен полный JDK
sudo apt install openjdk-17-jdk

# Проверьте JAVA_HOME
echo $JAVA_HOME
```

### Gradle кэш поврежден

```bash
rm -rf ~/.gradle/caches/
```

## Полезные команды

```bash
# Список подключенных устройств
adb devices

# Установка APK
adb install path/to/app.apk

# Копирование APK на устройство
adb push app.apk /sdcard/Download/

# Логи устройства
adb logcat

# Информация о батарее
adb shell dumpsys battery

# Очистка данных приложения
adb shell pm clear gsms.texnouz.uz
```
