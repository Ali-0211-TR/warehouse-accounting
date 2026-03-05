#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🔑 Подписание Android APK${NC}\n"

# Конфигурация
KEYSTORE_PATH="$HOME/.android/sklad-uchot-release.jks"
KEY_ALIAS="sklad-uchot"

# Проверка входного файла
if [ -z "$1" ]; then
    echo -e "${YELLOW}Использование: $0 <путь-к-unsigned-apk> [имя-выходного-apk]${NC}"
    echo -e "\nПример:"
    echo -e "  $0 app-unsigned.apk"
    echo -e "  $0 app-unsigned.apk my-app-signed.apk"
    exit 1
fi

UNSIGNED_APK="$1"
SIGNED_APK="${2:-sklad-uchot-signed.apk}"

if [ ! -f "$UNSIGNED_APK" ]; then
    echo -e "${RED}❌ Файл не найден: $UNSIGNED_APK${NC}"
    exit 1
fi

# Проверка keystore
if [ ! -f "$KEYSTORE_PATH" ]; then
    echo -e "${RED}❌ Keystore не найден: $KEYSTORE_PATH${NC}"
    echo -e "${YELLOW}Создайте keystore командой:${NC}"
    echo "keytool -genkey -v -keystore $KEYSTORE_PATH -keyalg RSA -keysize 2048 -validity 10000 -alias $KEY_ALIAS"
    exit 1
fi

# Поиск apksigner
echo -e "${BLUE}🔍 Поиск apksigner...${NC}"
APKSIGNER=$(find $ANDROID_HOME/build-tools -name apksigner 2>/dev/null | sort -V | tail -1)

if [ -z "$APKSIGNER" ]; then
    echo -e "${RED}❌ apksigner не найден в Android SDK${NC}"
    echo -e "${YELLOW}Установите Android SDK Build-Tools${NC}"
    exit 1
fi

echo -e "${GREEN}✅ apksigner: $APKSIGNER${NC}"

# Подписание
echo -e "\n${BLUE}🔑 Подписание APK...${NC}"
echo -e "${YELLOW}Введите пароль keystore:${NC}"

$APKSIGNER sign \
    --ks "$KEYSTORE_PATH" \
    --ks-key-alias "$KEY_ALIAS" \
    --out "$SIGNED_APK" \
    "$UNSIGNED_APK"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка подписания${NC}"
    exit 1
fi

# Проверка подписи
echo -e "\n${BLUE}🔍 Проверка подписи...${NC}"
$APKSIGNER verify "$SIGNED_APK"

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ APK успешно подписан!${NC}"
    echo -e "${GREEN}📦 Подписанный APK: $SIGNED_APK${NC}\n"
    ls -lh "$SIGNED_APK"
else
    echo -e "${RED}❌ Ошибка проверки подписи${NC}"
    exit 1
fi
