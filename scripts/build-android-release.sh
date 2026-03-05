// filepath: scripts/build-android-release.sh
#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🤖 Сборка Android Release${NC}\n"

# Конфигурация
KEYSTORE_PATH="$HOME/.android/sklad-uchot-release.jks"
KEY_ALIAS="sklad-uchot"
APK_OUTPUT_DIR="src-tauri/gen/android/app/build/outputs/apk/universal/release"
SIGNED_APK_NAME="sklad-uchot-signed.apk"
UPDATER_KEY_PATH="$HOME/.tauri/sklad-uchot.key"

# Проверка keystore
if [ ! -f "$KEYSTORE_PATH" ]; then
    echo -e "${RED}❌ Keystore не найден: $KEYSTORE_PATH${NC}"
    echo -e "${YELLOW}Создайте keystore командой:${NC}"
    echo "keytool -genkey -v -keystore $KEYSTORE_PATH -keyalg RSA -keysize 2048 -validity 10000 -alias $KEY_ALIAS"
    exit 1
fi

echo -e "${GREEN}✅ Keystore найден${NC}"

# Поиск apksigner
echo -e "${BLUE}🔍 Поиск apksigner...${NC}"
APKSIGNER=$(find $ANDROID_HOME/build-tools -name apksigner 2>/dev/null | sort -V | tail -1)

if [ -z "$APKSIGNER" ]; then
    echo -e "${RED}❌ apksigner не найден в Android SDK${NC}"
    echo -e "${YELLOW}Установите Android SDK Build-Tools${NC}"
    exit 1
fi

echo -e "${GREEN}✅ apksigner найден: $APKSIGNER${NC}"

# Проверка существования gen/android
if [ ! -d "src-tauri/gen/android" ]; then
    echo -e "${YELLOW}📱 Инициализация Android проекта...${NC}"
    pnpm tauri android init
fi

echo -e "${GREEN}🔨 Начинаем сборку Android APK...${NC}\n"

# Сборка unsigned APK
pnpm tauri android build

if [ $? -ne 0 ]; then
    echo -e "\n${RED}❌ Ошибка сборки${NC}"
    exit 1
fi

# Поиск unsigned APK
UNSIGNED_APK=$(find $APK_OUTPUT_DIR -name "*-unsigned.apk" -type f | head -1)

if [ -z "$UNSIGNED_APK" ]; then
    echo -e "${RED}❌ Unsigned APK не найден${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ APK собран: $UNSIGNED_APK${NC}"

# Подписание APK
echo -e "${BLUE}🔑 Подписание APK...${NC}"
echo -e "${YELLOW}Введите пароль keystore:${NC}"

$APKSIGNER sign \
    --ks "$KEYSTORE_PATH" \
    --ks-key-alias "$KEY_ALIAS" \
    --out "$SIGNED_APK_NAME" \
    "$UNSIGNED_APK"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка подписания APK${NC}"
    exit 1
fi

# Проверка подписи
echo -e "${BLUE}🔍 Проверка подписи...${NC}"
$APKSIGNER verify "$SIGNED_APK_NAME"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка проверки подписи${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ APK успешно подписан и проверен!${NC}"
echo -e "${GREEN}📦 Подписанный APK: $SIGNED_APK_NAME${NC}"

# Информация о файле
ls -lh "$SIGNED_APK_NAME"

# ============================================
# СОЗДАНИЕ UPDATER СИГНАТУРЫ
# ============================================

echo -e "\n${BLUE}🔐 Создание updater сигнатуры...${NC}"

# Проверка minisign
if ! command -v minisign &> /dev/null; then
    echo -e "${YELLOW}⬇️  Устанавливаем minisign...${NC}"
    sudo apt-get update && sudo apt-get install -y minisign
fi

# Проверка приватного ключа
if [ ! -f "$UPDATER_KEY_PATH" ]; then
    echo -e "${RED}❌ Приватный ключ updater не найден: $UPDATER_KEY_PATH${NC}"
    echo -e "${YELLOW}⚠️  Пропускаем создание updater сигнатуры${NC}"
else
    echo -e "${YELLOW}Введите пароль приватного ключа updater:${NC}"

    SIGNATURE_FILE="${SIGNED_APK_NAME}.sig"
    minisign -S -s "$UPDATER_KEY_PATH" -m "$SIGNED_APK_NAME" -x "$SIGNATURE_FILE"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Updater сигнатура создана: $SIGNATURE_FILE${NC}"

        # Извлечение ТОЛЬКО base64 подписи (вторая строка файла)
        SIGNATURE=$(sed -n '2p' "$SIGNATURE_FILE")

        echo -e "\n${GREEN}📋 Сигнатура для updater:${NC}"
        echo -e "${BLUE}$SIGNATURE${NC}"

        echo -e "\n${YELLOW}📝 Используйте эту сигнатуру в update manifest:${NC}"
        echo -e "${BLUE}{
  \"version\": \"0.1.6\",
  \"platforms\": {
    \"android-aarch64\": {
      \"signature\": \"$SIGNATURE\",
      \"url\": \"https://your-domain.com/releases/$SIGNED_APK_NAME\"
    }
  }
}${NC}"
    else
        echo -e "${RED}❌ Ошибка создания updater сигнатуры${NC}"
    fi
fi

# ============================================
# УСТАНОВКА НА УСТРОЙСТВО
# ============================================

echo -e "\n${YELLOW}📱 Установка на устройство:${NC}"
echo -e "  ${BLUE}adb install -r $SIGNED_APK_NAME${NC}"

# Спросить об установке
echo -e "\n${YELLOW}Установить APK на подключенное устройство? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}📲 Установка APK...${NC}"
    adb install -r "$SIGNED_APK_NAME"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ APK успешно установлен!${NC}"
    else
        echo -e "${RED}❌ Ошибка установки. Проверьте подключение устройства.${NC}"
    fi
fi

echo -e "\n${GREEN}🎉 Готово!${NC}"
