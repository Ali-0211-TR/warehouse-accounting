NOTE: sea-orm entity выглядит как кодоген, и у нас нет генератора в репо. Для поля label_template нужно:
- добавить column `label_template` (Text, nullable) в `src-tauri/entity/src/device_config.rs` в struct Model и ActiveModel
- прогнать кодоген (если используется) или отредактировать вручную.

В этом PR я добавил миграцию, доменную сущность и репозиторий уже ожидают поле `label_template`.
