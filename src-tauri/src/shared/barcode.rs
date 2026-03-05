use barcoders::generators::image::*;
use std::fs::File;
use std::io::prelude::*;
use std::io::{BufWriter, Cursor};
use std::path::PathBuf;

use crate::shared::error::Error;
use ab_glyph::{FontArc, PxScale};
use image::{ImageBuffer, Rgba, RgbaImage};
use imageproc::drawing::{draw_text_mut, text_size};

/// Parameters for generating a product label with barcode
pub struct ProductLabelParams {
    pub product_name: String,
    pub price: f64,
    pub quantity: Option<f64>,
    pub unit: String,
    pub barcode: String,
    pub label_width_mm: u32,  // typically 40, 50, 60, 80
    pub label_height_mm: u32, // typically 30, 40, 50, 60
}

/// Generate a complete product label image with text and barcode
pub fn generate_product_label_image(params: &ProductLabelParams) -> Result<PathBuf, Error> {
    // DPI for XPrinter XP-365B and similar thermal label printers
    let dpi = 203; // или 300 для некоторых принтеров

    // Calculate pixel dimensions based on mm
    // 1 inch = 25.4 mm, so: pixels = mm * dpi / 25.4
    let label_width_px = (params.label_width_mm as f32 * dpi as f32 / 25.4) as u32;
    let label_height_px = (params.label_height_mm as f32 * dpi as f32 / 25.4) as u32;

    println!(
        "🏷️  Generating label: {}x{} px ({}x{}mm) at {} DPI",
        label_width_px, label_height_px, params.label_width_mm, params.label_height_mm, dpi
    );

    // Создаем изображение РОВНОГО размера label
    let mut img: RgbaImage = ImageBuffer::from_pixel(
        label_width_px,
        label_height_px,
        Rgba([255, 255, 255, 255]), // белый фон
    );

    let font = load_system_font()?;
    let black = Rgba([0, 0, 0, 255]);

    // Коэффициент масштабирования относительно базового размера 58mm
    let scale_factor = label_width_px as f32 / 463.0;

    // Оптимальные размеры шрифтов
    let name_scale = PxScale::from(28.0 * scale_factor); // Уменьшил для компактности
    let _price_scale = PxScale::from(32.0 * scale_factor); // Уменьшил
    let _info_scale = PxScale::from(20.0 * scale_factor); // Уменьшил
    let barcode_text_scale = PxScale::from(24.0 * scale_factor); // Уменьшил

    let padding: i32 = 4;

    // -----------------------------
    // ✅ НОВАЯ ЛОГИКА РАСПРЕДЕЛЕНИЯ ПРОСТРАНСТВА
    // -----------------------------
    // Вычисляем доступную высоту для разных частей
    let total_available_height = label_height_px as i32 - (padding * 2);

    // Распределение:
    // 1. Название товара: 20% высоты (макс 3 строки)
    // 2. Цена: 20% высоты (только если не 0)
    // 3. Количество: 15% высоты (только если есть)
    // 4. Штрихкод: всё оставшееся пространство
    // 5. Номер штрихкода: 15% высоты

    let name_height_percent: f32 = 0.20; // 20%
    let price_height_percent: f32 = if params.price > 0.0 { 0.20 } else { 0.0 }; // 20% или 0
    let qty_height_percent: f32 = if params.quantity.is_some() { 0.15 } else { 0.0 }; // 15% или 0
    let barcode_text_height_percent: f32 = 0.15; // 15%

    // Вычисляем высоту для штрихкода динамически
    let remaining_for_barcode: f32 = 1.0
        - (name_height_percent
            + price_height_percent
            + qty_height_percent
            + barcode_text_height_percent);
    let barcode_height_percent = remaining_for_barcode.max(0.3_f32); // минимум 30%

    // Высота элементов в пикселях
    let name_height_px = (total_available_height as f32 * name_height_percent) as i32;
    let _price_height_px = (total_available_height as f32 * price_height_percent) as i32;
    let _qty_height_px = (total_available_height as f32 * qty_height_percent) as i32;
    let barcode_text_height_px =
        (total_available_height as f32 * barcode_text_height_percent) as i32;
    let barcode_height_px = (total_available_height as f32 * barcode_height_percent) as i32;

    let barcode_png_height: u32 = barcode_height_px as u32;
    let barcode_width_ratio: f32 = 0.92; // 92% ширины для штрихкода

    // -----------------------------
    // СЧИТАЕМ РАСПОЛОЖЕНИЕ ЭЛЕМЕНТОВ
    // -----------------------------
    let mut y_offset: i32 = padding;

    // 1) Product name (всегда печатаем, даже если пустое)
    let name_text = if params.product_name.is_empty() {
        " ".to_string()
    } else {
        params.product_name.clone()
    };

    let name_lines = wrap_text(
        &name_text,
        (label_width_px - (padding as u32 * 2)) as usize,
        &font,
        name_scale,
    );

    // Ограничиваем количество строк
    let max_name_lines = 3;
    let name_lines_to_display = if name_lines.len() > max_name_lines {
        &name_lines[0..max_name_lines]
    } else {
        &name_lines
    };

    let line_height = (name_height_px / name_lines_to_display.len() as i32).max(1);

    for line in name_lines_to_display {
        let (text_w, _) = text_size(name_scale, &font, line);
        let x = ((label_width_px as i32 - text_w as i32) / 2).max(padding);
        let y =
            y_offset + ((name_height_px - (line_height * name_lines_to_display.len() as i32)) / 2);
        let idx = name_lines_to_display
            .iter()
            .position(|l| l == line)
            .unwrap_or(0) as i32;
        draw_text_mut(
            &mut img,
            black,
            x,
            y + line_height * idx,
            name_scale,
            &font,
            line,
        );
    }
    y_offset += name_height_px;

    // // 2) Price (печатаем только если > 0)
    // if params.price > 0.0 {
    //     let price_text = format_price(params.price);
    //     let (price_w, price_h) = text_size(price_scale, &font, &price_text);
    //     let price_x = ((label_width_px as i32 - price_w as i32) / 2).max(padding);
    //     let price_y = y_offset + ((price_height_px - price_h as i32) / 2).max(0);

    //     draw_text_mut(
    //         &mut img,
    //         black,
    //         price_x,
    //         price_y,
    //         price_scale,
    //         &font,
    //         &price_text,
    //     );
    //     y_offset += price_height_px;
    // }

    // // 3) Quantity (печатаем только если есть значение)
    // if let Some(qty) = params.quantity {
    //     let unit = if params.unit.is_empty() {
    //         "шт".to_string()
    //     } else {
    //         params.unit.clone()
    //     };
    //     let qty_text = format!("{:.2} {}", qty, unit);
    //     let (qty_w, qty_h) = text_size(info_scale, &font, &qty_text);
    //     let qty_x = ((label_width_px as i32 - qty_w as i32) / 2).max(padding);
    //     let qty_y = y_offset + ((qty_height_px - qty_h as i32) / 2).max(0);

    //     draw_text_mut(
    //         &mut img, black, qty_x, qty_y, info_scale, &font, &qty_text,
    //     );
    //     y_offset += qty_height_px;
    // }

    // 4) Barcode (печатаем всегда, даже если пустой)
    let barcode_text = if params.barcode.is_empty() {
        "0000000000000".to_string()
    } else {
        params.barcode.clone()
    };

    let barcode_result = generate_barcode_bytes(&barcode_text, barcode_png_height, 2)?;
    let barcode_img = image::load_from_memory(&barcode_result)
        .map_err(|e| Error::General(format!("Failed to load barcode image: {}", e)))?;

    // Scale barcode to fit available space
    let max_barcode_width = (label_width_px as f32 * barcode_width_ratio) as u32;
    let barcode_display_height = barcode_height_px as u32;

    let barcode_img = barcode_img.resize_exact(
        max_barcode_width,
        barcode_display_height,
        image::imageops::FilterType::Nearest,
    );

    let barcode_x = ((label_width_px - max_barcode_width) / 2) as i64;
    let barcode_y = y_offset as i64; // начинаем сразу после предыдущего элемента

    image::imageops::overlay(&mut img, &barcode_img.to_rgba8(), barcode_x, barcode_y);
    y_offset += barcode_height_px;

    // 5) Barcode number (всегда печатаем)
    let (barcode_text_w, barcode_text_h) = text_size(barcode_text_scale, &font, &barcode_text);
    let barcode_text_x = ((label_width_px as i32 - barcode_text_w as i32) / 2).max(padding);
    let barcode_text_y = y_offset + ((barcode_text_height_px - barcode_text_h as i32) / 2).max(0);

    draw_text_mut(
        &mut img,
        black,
        barcode_text_x,
        barcode_text_y,
        barcode_text_scale,
        &font,
        &barcode_text,
    );

    // Save
    let temp_dir = std::env::temp_dir();
    let label_file_path = temp_dir.join(format!("product_label_{}.png", uuid::Uuid::new_v4()));

    img.save(&label_file_path)
        .map_err(|e| Error::General(format!("Failed to save label image: {}", e)))?;

    println!(
        "✅ Generated product label at: {} ({}x{}px)",
        label_file_path.display(),
        label_width_px,
        label_height_px
    );

    Ok(label_file_path)
}

/// Format price with thousands separator
fn format_price(price: f64) -> String {
    let price_int = price as i64;
    let formatted = price_int
        .to_string()
        .as_bytes()
        .rchunks(3)
        .rev()
        .map(|chunk| std::str::from_utf8(chunk).unwrap())
        .collect::<Vec<_>>()
        .join(" ");
    format!("{} UZS", formatted)
}

/// Load a system font (Windows: Arial, fallback to other common fonts)
fn load_system_font() -> Result<FontArc, Error> {
    let font_paths = [
        "C:\\Windows\\Fonts\\arial.ttf",
        "C:\\Windows\\Fonts\\Arial.ttf",
        "C:\\Windows\\Fonts\\calibri.ttf",
        "C:\\Windows\\Fonts\\Calibri.ttf",
        "C:\\Windows\\Fonts\\segoeui.ttf",
        "C:\\Windows\\Fonts\\tahoma.ttf",
        "C:\\Windows\\Fonts\\verdana.ttf",
        "C:\\Windows\\Fonts\\times.ttf",
        "C:\\Windows\\Fonts\\cour.ttf",
    ];

    for path in &font_paths {
        if let Ok(font_data) = std::fs::read(path) {
            if let Ok(font) = FontArc::try_from_vec(font_data) {
                println!("✅ Loaded system font: {}", path);
                return Ok(font);
            }
        }
    }

    Err(Error::General(
        "No system font found. Please ensure Windows fonts are installed.".to_string(),
    ))
}

/// Wrap text to fit within a given pixel width
fn wrap_text(text: &str, max_width_px: usize, font: &FontArc, scale: PxScale) -> Vec<String> {
    let mut lines = Vec::new();
    let mut current_line = String::new();

    for word in text.split_whitespace() {
        let test_line = if current_line.is_empty() {
            word.to_string()
        } else {
            format!("{} {}", current_line, word)
        };

        let (test_width, _) = text_size(scale, font, &test_line);

        if test_width as usize <= max_width_px {
            current_line = test_line;
        } else {
            if !current_line.is_empty() {
                lines.push(current_line);
            }
            current_line = word.to_string();
        }
    }

    if !current_line.is_empty() {
        lines.push(current_line);
    }

    if lines.is_empty() {
        lines.push(text.to_string());
    }

    lines
}

/// Generate barcode as PNG bytes
/// ✅ Добавил параметр height_px, чтобы реально управлять размером штрихкода
/// Generate barcode as PNG bytes for various barcode types
/// ✅ Универсальная функция, которая определяет тип штрихкода автоматически
fn generate_barcode_bytes(
    data: &str,
    height_px: u32,
    width_multiplier: u8,
) -> Result<Vec<u8>, Error> {
    // Если строка пустая, возвращаем пустой штрихкод
    if data.trim().is_empty() {
        // Создаем пустое изображение 1x1px
        let empty_img: image::RgbaImage =
            ImageBuffer::from_pixel(1, 1, Rgba([255u8, 255u8, 255u8, 255u8]));

        // Сохраняем в вектор
        let mut bytes = Vec::new();
        empty_img
            .write_to(&mut Cursor::new(&mut bytes), image::ImageFormat::Png)
            .map_err(|e| Error::General(format!("Failed to create empty barcode image: {}", e)))?;

        return Ok(bytes);
    }

    // Пытаемся определить тип штрихкода по формату данных
    let (barcode_type, normalized_data) = detect_barcode_type(data);

    println!(
        "🔍 Detected barcode type: {:?} for data: {}",
        barcode_type, normalized_data
    );

    match barcode_type {
        BarcodeType::EAN13 => {
            // EAN-13: 13 цифр, последняя - контрольная сумма
            if normalized_data.chars().all(|c| c.is_ascii_digit()) && normalized_data.len() == 13 {
                let barcode = barcoders::sym::ean13::EAN13::new(&normalized_data).map_err(|e| {
                    Error::General(format!("Failed to create EAN13 barcode: {}", e))
                })?;

                let png = Image::png(height_px);
                let encoded = barcode.encode();

                png.generate(&encoded[..])
                    .map_err(|e| Error::General(format!("Failed to generate EAN13 PNG: {}", e)))
            } else {
                // Если не валидный EAN13, пробуем Code128
                generate_code128_barcode(&normalized_data, height_px, width_multiplier)
            }
        }
        BarcodeType::Code128 => {
            generate_code128_barcode(&normalized_data, height_px, width_multiplier)
        }
        BarcodeType::Code39 => {
            generate_code39_barcode(&normalized_data, height_px, width_multiplier)
        }
        BarcodeType::Code93 => {
            generate_code93_barcode(&normalized_data, height_px, width_multiplier)
        }
        BarcodeType::Codabar => {
            generate_codabar_barcode(&normalized_data, height_px, width_multiplier)
        }
        BarcodeType::UPCA => {
            // UPC-A: обычно 12 цифр (последняя — checksum). Иногда приходит 11 цифр без checksum.
            let digits_only = normalized_data.chars().all(|c| c.is_ascii_digit());
            if !digits_only {
                return generate_code128_barcode(&normalized_data, height_px, width_multiplier);
            }

            let upc12 = match normalized_data.len() {
                11 => {
                    // Добавляем правильную checksum
                    let cd = upc_a_check_digit(&normalized_data);
                    format!("{}{}", normalized_data, cd)
                }
                12 => {
                    // Если checksum неверная — пересчитаем, чтобы не падать при печати
                    let expected = upc_a_check_digit(&normalized_data[..11]);
                    let got = normalized_data.chars().last().unwrap_or('0');
                    if got != expected {
                        format!("{}{}", &normalized_data[..11], expected)
                    } else {
                        normalized_data.clone()
                    }
                }
                _ => {
                    return generate_code128_barcode(&normalized_data, height_px, width_multiplier);
                }
            };

            // Преобразуем UPC-A → EAN-13: добавляем ведущий 0 (тогда контрольная цифра EAN-13 = checksum UPC-A)
            let ean13_data = format!("0{}", upc12);

            match barcoders::sym::ean13::EAN13::new(&ean13_data) {
                Ok(barcode) => {
                    let png = Image::png(height_px);
                    let encoded = barcode.encode();
                    png.generate(&encoded[..])
                        .map_err(|e| Error::General(format!("Failed to generate UPC-A PNG: {}", e)))
                }
                Err(e) => {
                    // В любом сомнительном случае — не валим печать
                    eprintln!("UPC-A generation failed ({}), fallback to Code128", e);
                    generate_code128_barcode(&normalized_data, height_px, width_multiplier)
                }
            }
        }
        BarcodeType::ITF14 => generate_itf14_barcode(&normalized_data, height_px, width_multiplier),
        BarcodeType::QRCode => generate_qrcode_barcode(&normalized_data, height_px),
        BarcodeType::DataMatrix => generate_datamatrix_barcode(&normalized_data, height_px),
    }
}

/// Compute UPC-A check digit for 11-digit payload.
/// Algorithm: (sum odd positions * 3 + sum even positions) % 10, check = (10 - mod) % 10.
fn upc_a_check_digit(upc11: &str) -> char {
    let mut sum_odd = 0u32;
    let mut sum_even = 0u32;
    for (idx, ch) in upc11.chars().take(11).enumerate() {
        let d = ch.to_digit(10).unwrap_or(0);
        // positions are 1-based from left
        if (idx + 1) % 2 == 1 {
            sum_odd += d;
        } else {
            sum_even += d;
        }
    }
    let total = sum_odd * 3 + sum_even;
    let mod10 = total % 10;
    let check = (10 - mod10) % 10;
    char::from_digit(check, 10).unwrap_or('0')
}

/// Типы штрихкодов
#[derive(Debug, Clone, Copy)]
enum BarcodeType {
    EAN13,
    Code128,
    Code39,
    Code93,
    Codabar,
    UPCA,
    ITF14,
    QRCode,
    DataMatrix,
}

/// Определить тип штрихкода по содержимому данных
fn detect_barcode_type(data: &str) -> (BarcodeType, String) {
    let clean_data = data.trim();

    // Если строка пустая, возвращаем Code128 как fallback
    if clean_data.is_empty() {
        return (BarcodeType::Code128, clean_data.to_string());
    }

    // Проверяем на QR Code (URL, длинный текст, содержит специальные символы)
    if clean_data.starts_with("http://")
        || clean_data.starts_with("https://")
        || clean_data.starts_with("www.")
        || clean_data.contains('/')
        || clean_data.contains('?')
        || clean_data.contains('&')
        || clean_data.contains('=')
        || clean_data.len() > 100
    {
        return (BarcodeType::QRCode, clean_data.to_string());
    }

    // Проверяем на Data Matrix (двоичные данные или специфичные форматы)
    if clean_data.contains(char::is_control)
        || clean_data.as_bytes().len() != clean_data.len()
        || (clean_data.len() > 30 && clean_data.len() < 300)
    {
        return (BarcodeType::DataMatrix, clean_data.to_string());
    }

    // Проверяем на EAN13 (ровно 13 цифр)
    if clean_data.len() == 13 && clean_data.chars().all(|c| c.is_ascii_digit()) {
        return (BarcodeType::EAN13, clean_data.to_string());
    }

    // Проверяем на UPC-A (ровно 12 цифр)
    if clean_data.len() == 12 && clean_data.chars().all(|c| c.is_ascii_digit()) {
        return (BarcodeType::UPCA, clean_data.to_string());
    }

    // Проверяем на ITF14 (ровно 14 цифр)
    if clean_data.len() == 14 && clean_data.chars().all(|c| c.is_ascii_digit()) {
        return (BarcodeType::ITF14, clean_data.to_string());
    }

    // Проверяем на Code39 (только заглавные буквы, цифры, и некоторые символы)
    // НО! Сначала проверяем - если строка длиннее 20 символов, это скорее Code128
    // let code39_chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%";
    // if clean_data.len() <= 20 &&
    //    clean_data.chars().all(|c| code39_chars.contains(c)) &&
    //    !clean_data.is_empty() {
    //     // Дополнительная проверка: если есть строчные буквы - это точно не Code39
    //     if !clean_data.chars().any(|c| c.is_lowercase()) {
    //         return (BarcodeType::Code39, clean_data.to_string());
    //     }
    // }

    // Проверяем на Codabar (цифры и A-D с дефисами)
    let codabar_chars = "0123456789-$:/.+ABCD";
    if clean_data
        .chars()
        .all(|c| codabar_chars.contains(c.to_ascii_uppercase()))
        && clean_data.len() <= 30
        && !clean_data.is_empty()
    {
        return (BarcodeType::Codabar, clean_data.to_string());
    }

    // Проверяем на Code93 (подмножество ASCII)
    if clean_data.is_ascii() && clean_data.len() <= 30 && !clean_data.is_empty() {
        return (BarcodeType::Code93, clean_data.to_string());
    }

    // Проверяем на Code128 - самый универсальный для произвольных ASCII данных
    // Code128 поддерживает ВСЕ ASCII символы (включая строчные буквы, которых нет в Code39)
    if clean_data.is_ascii() {
        return (BarcodeType::Code128, clean_data.to_string());
    }

    // Если содержит не-ASCII символы, но подходит для QR Code или Data Matrix
    (BarcodeType::Code128, clean_data.to_string())
}

/// Генерация штрихкода Code128
fn generate_code128_barcode(
    data: &str,
    height_px: u32,
    width_multiplier: u8,
) -> Result<Vec<u8>, Error> {
    let barcode = barcoders::sym::code128::Code128::new(data)
        .map_err(|e| Error::General(format!("Failed to create Code128 barcode: {}", e)))?;

    let encoded = barcode.encode();

    // В этой версии `barcoders` нет `png_with_scale`/`xdim`. Поэтому делаем простой fallback:
    // генерим базовый PNG и (опционально) растягиваем по X через повторение пикселей.
    let base_png = Image::png(height_px)
        .generate(&encoded[..])
        .map_err(|e| Error::General(format!("Failed to generate Code128 PNG: {}", e)))?;

    stretch_png_x(&base_png, width_multiplier)
}

/// Генерация штрихкода Code39
fn generate_code39_barcode(
    data: &str,
    height_px: u32,
    width_multiplier: u8,
) -> Result<Vec<u8>, Error> {
    let barcode = barcoders::sym::code39::Code39::new(data)
        .map_err(|e| Error::General(format!("Failed to create Code39 barcode: {}", e)))?;

    let encoded = barcode.encode();

    let base_png = Image::png(height_px)
        .generate(&encoded[..])
        .map_err(|e| Error::General(format!("Failed to generate Code39 PNG: {}", e)))?;

    stretch_png_x(&base_png, width_multiplier)
}

/// Генерация штрихкода Code93
fn generate_code93_barcode(
    data: &str,
    height_px: u32,
    width_multiplier: u8,
) -> Result<Vec<u8>, Error> {
    let barcode = barcoders::sym::code93::Code93::new(data)
        .map_err(|e| Error::General(format!("Failed to create Code93 barcode: {}", e)))?;

    let encoded = barcode.encode();

    let base_png = Image::png(height_px)
        .generate(&encoded[..])
        .map_err(|e| Error::General(format!("Failed to generate Code93 PNG: {}", e)))?;

    stretch_png_x(&base_png, width_multiplier)
}

/// Генерация штрихкода Codabar
fn generate_codabar_barcode(
    data: &str,
    height_px: u32,
    width_multiplier: u8,
) -> Result<Vec<u8>, Error> {
    // Codabar требует начинаться и заканчиваться символами A-D
    let mut codabar_data = data.to_string();

    // Если данные не начинаются с A-D, добавляем "A"
    if !codabar_data.starts_with(|c: char| matches!(c, 'A' | 'B' | 'C' | 'D')) {
        codabar_data = format!("A{}", codabar_data);
    }

    // Если данные не заканчиваются A-D, добавляем "A"
    if !codabar_data.ends_with(|c: char| matches!(c, 'A' | 'B' | 'C' | 'D')) {
        codabar_data = format!("{}A", codabar_data);
    }

    let barcode = barcoders::sym::codabar::Codabar::new(&codabar_data)
        .map_err(|e| Error::General(format!("Failed to create Codabar barcode: {}", e)))?;

    let encoded = barcode.encode();

    let base_png = Image::png(height_px)
        .generate(&encoded[..])
        .map_err(|e| Error::General(format!("Failed to generate Codabar PNG: {}", e)))?;

    stretch_png_x(&base_png, width_multiplier)
}

/// Stretch (duplicate pixels) of a PNG image along X axis.
/// This is a dependency-free fallback when the barcode generator doesn't support x scaling.
fn stretch_png_x(png_bytes: &[u8], width_multiplier: u8) -> Result<Vec<u8>, Error> {
    let mult = width_multiplier.max(1) as u32;
    if mult == 1 {
        return Ok(png_bytes.to_vec());
    }

    let img = image::load_from_memory(png_bytes)
        .map_err(|e| Error::General(format!("Failed to decode generated PNG: {}", e)))?
        .to_rgba8();

    let (w, h) = img.dimensions();
    let mut out: image::RgbaImage =
        ImageBuffer::from_pixel(w * mult, h, Rgba([255u8, 255u8, 255u8, 255u8]));

    for y in 0..h {
        for x in 0..w {
            let p = *img.get_pixel(x, y);
            let ox = x * mult;
            for i in 0..mult {
                out.put_pixel(ox + i, y, p);
            }
        }
    }

    let mut bytes = Vec::new();
    out.write_to(&mut Cursor::new(&mut bytes), image::ImageFormat::Png)
        .map_err(|e| Error::General(format!("Failed to re-encode stretched PNG: {}", e)))?;
    Ok(bytes)
}

/// Генерация штрихкода ITF14
fn generate_itf14_barcode(
    data: &str,
    height_px: u32,
    width_multiplier: u8,
) -> Result<Vec<u8>, Error> {
    // ITF14 - это Interleaved 2 of 5 с 14 цифрами
    // Проверяем, что это 14 цифр
    if !data.chars().all(|c| c.is_ascii_digit()) || data.len() != 14 {
        return Err(Error::General(
            "ITF14 requires exactly 14 digits".to_string(),
        ));
    }

    // В текущем `barcoders` может отсутствовать `itf14`. Чтобы не добавлять/не менять зависимости,
    // используем универсальный Code128 как безопасный fallback для 14-значных ITF14.
    generate_code128_barcode(data, height_px, width_multiplier)
}

/// Генерация QR Code
fn generate_qrcode_barcode(data: &str, height_px: u32) -> Result<Vec<u8>, Error> {
    // Используем библиотеку qrcode для генерации QR кода
    use image::Luma;
    use qrcode::QrCode;

    let code = QrCode::new(data.as_bytes())
        .map_err(|e| Error::General(format!("Failed to generate QR code: {}", e)))?;

    // Создаем изображение QR кода
    let image = code
        .render::<Luma<u8>>()
        .max_dimensions(height_px, height_px)
        .build();

    // Конвертируем в PNG байты
    let mut bytes = Vec::new();
    image
        .write_to(
            &mut std::io::Cursor::new(&mut bytes),
            image::ImageFormat::Png,
        )
        .map_err(|e| Error::General(format!("Failed to encode QR code as PNG: {}", e)))?;

    Ok(bytes)
}

/// Генерация Data Matrix
fn generate_datamatrix_barcode(data: &str, height_px: u32) -> Result<Vec<u8>, Error> {
    // В проекте сейчас нет зависимости `datamatrix`, поэтому вместо падения компиляции
    // используем QR Code как совместимый 2D-fallback.
    // Если реально нужен DataMatrix — добавим crate и вернем полноценную реализацию.
    generate_qrcode_barcode(data, height_px)
}

/// (Опционально) отдельная генерация картинки штрихкода
pub fn generate_code128_image(data: &str) -> Result<PathBuf, Error> {
    // ⚠️ У тебя тут было EAN13, оставляю как есть (если реально нужен EAN13).
    // Если реально нужен Code128 — скажи, заменю на code128.
    let barcode = barcoders::sym::ean13::EAN13::new(data)
        .map_err(|e| Error::General(format!("Failed to create barcode: {e}")))?;

    // Было 80 — сделаем x2 чтобы "в 2 раза больше"
    let png = Image::png(30);
    let encoded = barcode.encode();

    let bytes = png
        .generate(&encoded[..])
        .map_err(|e| Error::General(format!("Failed to generate barcode PNG: {e}")))?;

    let temp_dir = std::env::temp_dir();
    let label_file_path = temp_dir.join(format!("label_{}.png", uuid::Uuid::new_v4()));
    println!("Generated barcode image at: {}", label_file_path.display());

    let file = File::create(label_file_path.clone())
        .map_err(|e| Error::General(format!("Failed to create barcode file: {e}")))?;
    let mut writer = BufWriter::new(file);

    writer
        .write_all(&bytes[..])
        .map_err(|e| Error::General(format!("Failed to write barcode file: {e}")))?;
    writer
        .flush()
        .map_err(|e| Error::General(format!("Failed to flush barcode file: {e}")))?;

    Ok(label_file_path)
}
