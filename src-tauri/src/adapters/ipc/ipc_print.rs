use rust_decimal::prelude::*;
use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::{AppHandle, Wry, command};

use crate::{
    adapters::{dtos::LazyTableStateDTO, response::IpcResponse},
    domain::{
        entities::order_entity::{OrderColumn, OrderFilter},
        usecases::{device_config_usecase::DeviceConfigUseCase, order_usecases},
    },
    shared::{
        ctx::Ctx,
        error::{Error, Result},
        types::SortOrder,
    },
};

/// Translate payment type enum to Russian text
fn translate_payment_type(payment_type: &str) -> String {
    match payment_type.to_lowercase().as_str() {
        "cash" => "Наличные".to_string(),
        "cashlesscard" => "Безналичная карта".to_string(),
        "cashlesscontract" => "По договору".to_string(),
        "cashlessticket" => "Талон".to_string(),
        "cashlessidcard" => "ID карта".to_string(),
        "cashlessbonus" => "Бонусы".to_string(),
        "cashlessfuel" => "Топливная карта".to_string(),
        "cashlessyandex" => "Yandex".to_string(),
        "unknown" => "-".to_string(),
        _ => "-".to_string(),
    }
}

/// Shorten UUID to last 8 characters for receipt display
/// Full UUID is too long for thermal printer receipts
fn shorten_order_id(order_id: &str) -> String {
    if order_id.len() > 8 {
        // Take last 8 characters of UUID
        order_id
            .chars()
            .rev()
            .take(8)
            .collect::<String>()
            .chars()
            .rev()
            .collect()
    } else {
        order_id.to_string()
    }
}

/// Helper function to generate PowerShell print handler with text wrapping
#[cfg(target_os = "windows")]
fn get_powershell_print_handler_with_wrapping() -> &'static str {
    r#"
    param($sender, $ev)

    # Use Courier New size 9 (≈17 characters per inch like macOS cpi=17)
    $font = New-Object System.Drawing.Font("Courier New", 9)
    $brush = [System.Drawing.Brushes]::Black

    $y = 0
    $lineHeight = $font.GetHeight($ev.Graphics)
    $maxWidth = $ev.MarginBounds.Width

    while ($script:lineIndex -lt $lines.Count) {
        $line = $lines[$script:lineIndex]

        # Measure the line width
        $lineSize = $ev.Graphics.MeasureString($line, $font)

        if ($lineSize.Width -gt $maxWidth) {
            # Line is too long, need to wrap it
            $words = $line -split ' '
            $currentLine = ""

            foreach ($word in $words) {
                # Check if single word is too long
                $wordSize = $ev.Graphics.MeasureString($word, $font)
                if ($wordSize.Width -gt $maxWidth) {
                    # Word itself is too long, need to break it by characters
                    if ($currentLine) {
                        $ev.Graphics.DrawString($currentLine, $font, $brush, 0, $y)
                        $y += $lineHeight
                        if ($y + $lineHeight -gt $ev.MarginBounds.Height) {
                            $ev.HasMorePages = $true
                            return
                        }
                        $currentLine = ""
                    }

                    # Break long word into chunks
                    $chars = $word.ToCharArray()
                    $chunk = ""
                    foreach ($char in $chars) {
                        $testChunk = $chunk + $char
                        $chunkSize = $ev.Graphics.MeasureString($testChunk, $font)
                        if ($chunkSize.Width -gt $maxWidth) {
                            if ($chunk) {
                                $ev.Graphics.DrawString($chunk, $font, $brush, 0, $y)
                                $y += $lineHeight
                                if ($y + $lineHeight -gt $ev.MarginBounds.Height) {
                                    $ev.HasMorePages = $true
                                    return
                                }
                            }
                            $chunk = $char.ToString()
                        } else {
                            $chunk = $testChunk
                        }
                    }
                    if ($chunk) {
                        $currentLine = $chunk
                    }
                } else {
                    # Normal word wrapping
                    $testLine = if ($currentLine) { "$currentLine $word" } else { $word }
                    $testSize = $ev.Graphics.MeasureString($testLine, $font)

                    if ($testSize.Width -gt $maxWidth) {
                        # Print current line and start new one
                        if ($currentLine) {
                            $ev.Graphics.DrawString($currentLine, $font, $brush, 0, $y)
                            $y += $lineHeight

                            # Check if we need another page
                            if ($y + $lineHeight -gt $ev.MarginBounds.Height) {
                                $ev.HasMorePages = $true
                                return
                            }
                        }
                        $currentLine = $word
                    } else {
                        $currentLine = $testLine
                    }
                }
            }

            # Print remaining text
            if ($currentLine) {
                $ev.Graphics.DrawString($currentLine, $font, $brush, 0, $y)
                $y += $lineHeight
            }
        } else {
            # Line fits, print it normally
            $ev.Graphics.DrawString($line, $font, $brush, 0, $y)
            $y += $lineHeight
        }

        $script:lineIndex++

        # Check if we need another page
        if ($y + $lineHeight -gt $ev.MarginBounds.Height) {
            $ev.HasMorePages = $true
            return
        }
    }

    $ev.HasMorePages = $false
"#
}

#[derive(Debug, Deserialize)]
pub struct PrintReceiptDTO {
    pub html_content: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct PrintReceiptByOrderDTO {
    pub order_id: String,
    pub printer_width: String, // "58mm" or "80mm"
}

#[derive(Debug, Serialize)]
pub struct PrintResult {
    pub success: bool,
    pub message: String,
}

/// Print receipt using system print dialog
/// This command generates a temporary HTML file and opens it for printing
#[command]
pub async fn print_receipt(
    _app: AppHandle<Wry>,
    params: PrintReceiptDTO,
) -> IpcResponse<PrintResult> {
    match print_receipt_impl(params).await {
        Ok(result) => Ok(result).into(),
        Err(e) => Err(e).into(),
    }
}

async fn print_receipt_impl(params: PrintReceiptDTO) -> Result<PrintResult> {
    use std::fs;

    // Create a temporary directory for the print file
    let temp_dir = std::env::temp_dir();
    let print_file_path = temp_dir.join("sklad_uchot_receipt.html");

    // Write the HTML content to the temporary file
    fs::write(&print_file_path, &params.html_content)
        .map_err(|e| Error::General(format!("Failed to write print file: {}", e)))?;

    // Direct printing using system commands
    #[cfg(target_os = "macos")]
    {
        // Convert HTML to plain text manually for thermal printer
        // This gives us better control over spacing and formatting
        let txt_file_path = temp_dir.join("sklad_uchot_receipt.txt");

        // Read the HTML content and strip tags to create compact text
        let html_content = fs::read_to_string(&print_file_path)
            .map_err(|e| Error::General(format!("Failed to read HTML file: {}", e)))?;

        // Simple HTML to text conversion
        let text_content = html_content
            // Remove script and style tags with their content
            .split("<script")
            .collect::<Vec<_>>()
            .join("")
            .split("</script>")
            .collect::<Vec<_>>()
            .join("")
            .split("<style")
            .collect::<Vec<_>>()
            .join("")
            .split("</style>")
            .collect::<Vec<_>>()
            .join("")
            // Replace common HTML entities
            .replace("&nbsp;", " ")
            .replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            // Replace div/p with newlines
            .replace("</div>", "\n")
            .replace("</p>", "\n")
            .replace("<br>", "\n")
            .replace("<br/>", "\n")
            .replace("<br />", "\n")
            // Remove all remaining HTML tags
            .split('<')
            .map(|s| s.split('>').skip(1).collect::<Vec<_>>().join(""))
            .collect::<Vec<_>>()
            .join("")
            // Clean up whitespace
            .lines()
            .map(|line| line.trim())
            .filter(|line| !line.is_empty())
            .collect::<Vec<_>>()
            .join("\n");

        // Write the cleaned text to file
        fs::write(&txt_file_path, text_content)
            .map_err(|e| Error::General(format!("Failed to write text file: {}", e)))?;

        // Print the text file (lp supports text/plain)
        // Use minimal options - let the printer use its default settings
        let mut print_cmd = Command::new("lp");
        print_cmd
            .arg("-d")
            .arg("Printer_POS_80")
            .arg(&txt_file_path);

        // Log the command being executed
        println!("🖨️ Executing print command: {:?}", print_cmd);

        let print_output = print_cmd
            .output()
            .map_err(|e| Error::General(format!("Failed to execute print command: {}", e)))?;

        if !print_output.status.success() {
            let error_msg = String::from_utf8_lossy(&print_output.stderr);
            println!("❌ Print command stderr: {}", error_msg);
            return Err(Error::General(format!(
                "Print command failed: {}",
                error_msg
            )));
        }

        let success_msg = String::from_utf8_lossy(&print_output.stdout);
        println!("✅ Print command stdout: {}", success_msg);

        // Cleanup
        tokio::spawn(async move {
            tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
            let _ = std::fs::remove_file(&print_file_path);
            let _ = std::fs::remove_file(&txt_file_path);
        });
    }

    #[cfg(target_os = "windows")]
    {
        // On Windows, convert HTML to text for thermal printer
        let txt_file_path = temp_dir.join("sklad_uchot_receipt.txt");

        // Read the HTML content and strip tags
        let html_content = fs::read_to_string(&print_file_path)
            .map_err(|e| Error::General(format!("Failed to read HTML file: {}", e)))?;

        // Simple HTML to text conversion (same as macOS)
        let text_content = html_content
            .split("<script")
            .collect::<Vec<_>>()
            .join("")
            .split("</script>")
            .collect::<Vec<_>>()
            .join("")
            .split("<style")
            .collect::<Vec<_>>()
            .join("")
            .split("</style>")
            .collect::<Vec<_>>()
            .join("")
            .replace("&nbsp;", " ")
            .replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("</div>", "\n")
            .replace("</p>", "\n")
            .replace("<br>", "\n")
            .replace("<br/>", "\n")
            .replace("<br />", "\n")
            .split('<')
            .map(|s| s.split('>').skip(1).collect::<Vec<_>>().join(""))
            .collect::<Vec<_>>()
            .join("")
            .lines()
            .map(|line| line.trim())
            .filter(|line| !line.is_empty())
            .collect::<Vec<_>>()
            .join("\n");

        // Write the cleaned text to file
        fs::write(&txt_file_path, &text_content)
            .map_err(|e| Error::General(format!("Failed to write text file: {}", e)))?;

        println!(
            "🖨️ [Windows] Printing receipt with .NET PrintDocument (zero margins, thermal settings)..."
        );

        // Calculate paper width in hundredths of inch based on printer_width (default 80mm)
        let width_hundredths = 315; // 80mm ≈ 3.15 inches

        // Read receipt content
        let mut receipt_content = fs::read_to_string(&txt_file_path)
            .map_err(|e| Error::General(format!("Failed to read receipt file: {}", e)))?;

        // Add ESC/POS paper cut command for Xprinter thermal printers
        // GS V m (1D 56 00) - Full cut
        // Add some blank lines before cut to ensure content is visible
        receipt_content.push_str("\n\n\n");

        // Create PowerShell script for .NET thermal printing with zero margins and paper cut
        let ps_script = format!(
            r#"
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$content = @'
{}
'@

$printDoc = New-Object System.Drawing.Printing.PrintDocument
$printDoc.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(0, 0, 0, 0)

# Custom paper size for thermal printer (width in hundredths of inch, height will auto-calculate)
$paperSize = New-Object System.Drawing.Printing.PaperSize("ThermalReceipt", {}, 1169)
$printDoc.DefaultPageSettings.PaperSize = $paperSize

$lines = $content -split "`n"
$lineIndex = 0

$printHandler = {{{}}}

$printDoc.add_PrintPage($printHandler)

try {{
    $printDoc.Print()
    exit 0
}} catch {{
    Write-Error $_.Exception.Message
    exit 1
}}
"#,
            receipt_content.replace("'", "''"), // Escape single quotes for PowerShell
            width_hundredths,
            get_powershell_print_handler_with_wrapping()
        );

        // Write to a temp .ps1 to avoid hitting Windows command-line length limits.
        let mut ps_path = std::env::temp_dir();
        ps_path.push(format!("txu_print_receipt_{}.ps1", std::process::id()));
        fs::write(&ps_path, &ps_script)
            .map_err(|e| Error::General(format!("Failed to write PowerShell script: {}", e)))?;

        let output = std::process::Command::new("powershell")
            .args(&[
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                ps_path
                    .to_str()
                    .ok_or_else(|| Error::General("Invalid PowerShell script path".to_string()))?,
            ])
            .output()
            .map_err(|e| Error::General(format!("Failed to execute print command: {}", e)))?;

        if !output.status.success() {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            println!("❌ [Windows] Print failed: {}", error_msg);
            return Err(Error::General(format!(
                "Print command failed: {}",
                error_msg
            )));
        }

        let _ = std::fs::remove_file(&ps_path);

        println!("✅ [Windows] Print job sent with zero margins and thermal settings");

        // Send paper cut command to Xprinter
        // Wait a moment for the print job to complete
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

        // Send ESC/POS paper cut command using raw printing
        let cut_script = r#"
Add-Type -TypeDefinition @'
using System;
using System.IO;
using System.Runtime.InteropServices;

public class RawPrinterHelper {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public class DOCINFOA {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }

    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

    [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

    public static bool SendBytesToPrinter(string szPrinterName, byte[] bytes) {
        IntPtr hPrinter = IntPtr.Zero;
        DOCINFOA di = new DOCINFOA();
        di.pDocName = "Paper Cut";
        di.pDataType = "RAW";

        bool success = false;

        if (OpenPrinter(szPrinterName, out hPrinter, IntPtr.Zero)) {
            if (StartDocPrinter(hPrinter, 1, di)) {
                if (StartPagePrinter(hPrinter)) {
                    IntPtr pUnmanagedBytes = Marshal.AllocCoTaskMem(bytes.Length);
                    Marshal.Copy(bytes, 0, pUnmanagedBytes, bytes.Length);
                    int dwWritten = 0;
                    success = WritePrinter(hPrinter, pUnmanagedBytes, bytes.Length, out dwWritten);
                    Marshal.FreeCoTaskMem(pUnmanagedBytes);
                    EndPagePrinter(hPrinter);
                }
                EndDocPrinter(hPrinter);
            }
            ClosePrinter(hPrinter);
        }
        return success;
    }
}
'@

# ESC/POS paper cut command: GS V m (1D 56 00 for full cut, or 1D 56 01 for partial cut)
$cutCommand = [byte[]](0x1D, 0x56, 0x00)

# Get default printer name
$defaultPrinter = (Get-WmiObject -Query "SELECT * FROM Win32_Printer WHERE Default = TRUE").Name

[RawPrinterHelper]::SendBytesToPrinter($defaultPrinter, $cutCommand)
"#;

        // Write to a temp .ps1 to avoid hitting Windows command-line length limits.
        let mut cut_ps_path = std::env::temp_dir();
        cut_ps_path.push(format!("txu_cut_{}.ps1", std::process::id()));
        let _ = fs::write(&cut_ps_path, cut_script);

        let cut_output = std::process::Command::new("powershell")
            .args(&[
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                cut_ps_path.to_str().unwrap_or(""),
            ])
            .output();

        match cut_output {
            Ok(output) if output.status.success() => {
                println!("✅ [Windows] Paper cut command sent successfully");
            }
            Ok(output) => {
                let error_msg = String::from_utf8_lossy(&output.stderr);
                println!(
                    "⚠️ [Windows] Paper cut command failed (non-critical): {}",
                    error_msg
                );
            }
            Err(e) => {
                println!(
                    "⚠️ [Windows] Could not send paper cut command (non-critical): {}",
                    e
                );
            }
        }

        let _ = std::fs::remove_file(&cut_ps_path);

        // Cleanup
        tokio::spawn(async move {
            tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
            let _ = std::fs::remove_file(&print_file_path);
            let _ = std::fs::remove_file(&txt_file_path);
        });
    }

    #[cfg(target_os = "linux")]
    {
        // On Linux, use lp or lpr command
        let output = Command::new("lp")
            .arg("-o")
            .arg("media=Custom.80x297mm")
            .arg("-o")
            .arg("fit-to-page")
            .arg(&print_file_path)
            .output()
            .map_err(|e| Error::General(format!("Failed to execute print command: {}", e)))?;

        if !output.status.success() {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            return Err(Error::General(format!(
                "Print command failed: {}",
                error_msg
            )));
        }
    }

    Ok(PrintResult {
        success: true,
        message: "Print job sent to printer".to_string(),
    })
}

/// Direct print to thermal printer using raw printing
/// This bypasses the system dialog and sends directly to the printer
#[command]
pub async fn print_thermal_receipt(
    _app: AppHandle<Wry>,
    printer_name: String,
    html_content: String,
) -> IpcResponse<PrintResult> {
    match print_thermal_impl(printer_name, html_content).await {
        Ok(result) => Ok(result).into(),
        Err(e) => Err(e).into(),
    }
}

async fn print_thermal_impl(_printer_name: String, _html_content: String) -> Result<PrintResult> {
    // For now, return not implemented
    // We can implement ESC/POS commands later for direct thermal printing
    Err(Error::General(
        "Direct thermal printing not yet implemented. Use print_receipt instead.".to_string(),
    ))
}

/// Generate a simple ASCII logo from company name
fn generate_ascii_logo(company_name: &str, width: usize) -> String {
    if company_name.is_empty() {
        return String::new();
    }

    let border = "═".repeat(width);
    let spaces_needed = if width > company_name.len() {
        (width - company_name.len()) / 2
    } else {
        0
    };
    let centered_name = format!("{}{}", " ".repeat(spaces_needed), company_name);

    format!("{}\n{}\n{}", border, centered_name, border)
}

/// Generate ASCII QR code representation
fn generate_ascii_qr_code(url: &str, size: usize) -> String {
    if url.is_empty() {
        return String::new();
    }

    // Create a visually appealing QR-like pattern using ASCII blocks
    // For real QR code scanning, you'd use a QR code library like 'qrcode'
    let mut lines = Vec::new();

    // Top border
    let border = "█".repeat(size);
    lines.push(border.clone());

    // Create a pattern that resembles a QR code
    // QR codes have finder patterns in corners and data patterns in the middle
    for i in 0..size.min(15) {
        let pattern = if i < 3 || i >= size.min(15) - 3 {
            // Finder pattern area (corners)
            if i % 2 == 0 {
                format!("█{}█", "██   ██".repeat((size / 8).max(1)))
            } else {
                format!("█{}█", "█ █ █ █".repeat((size / 8).max(1)))
            }
        } else {
            // Data area (pseudo-random pattern)
            let pattern_str = (0..size.saturating_sub(2))
                .map(|j| {
                    if (i + j) % 3 == 0 {
                        '█'
                    } else if (i * j) % 5 == 0 {
                        '▓'
                    } else {
                        ' '
                    }
                })
                .collect::<String>();
            format!("█{}█", pattern_str)
        };
        lines.push(pattern);
    }

    // Bottom border
    lines.push(border);

    // Add a separator and the URL below the QR code
    lines.push("".to_string());

    lines.join("\n")
}

/// Convert image file to ESC/POS bitmap commands for thermal printer
/// Uses GS v 0 command for raster bit image printing
///
/// # Arguments
/// * `image_path` - Path to the PNG/JPG image file
/// * `max_width` - Maximum width in pixels (e.g., 384 for 48mm, 576 for 80mm)
///
/// # Returns
/// ESC/POS command bytes ready to be sent to the printer
fn convert_image_to_escpos(image_path: &str, max_width: u32) -> Result<Vec<u8>> {
    use image::{DynamicImage, GenericImageView, ImageReader};
    use std::path::Path;

    println!("🔧 convert_image_to_escpos - START");
    println!("   Image path: {}", image_path);
    println!("   Max width: {} pixels", max_width);

    // Load and decode the image
    let img = ImageReader::open(Path::new(image_path))
        .map_err(|e| {
            println!("❌ Failed to open image: {}", e);
            Error::General(format!("Failed to open image: {}", e))
        })?
        .decode()
        .map_err(|e| {
            println!("❌ Failed to decode image: {}", e);
            Error::General(format!("Failed to decode image: {}", e))
        })?;

    println!("✅ Image loaded successfully");
    println!("   Original dimensions: {}x{}", img.width(), img.height());

    // Convert to grayscale and resize if needed.
    // For very small logos, keep at least 1px in each dimension and use a fast filter to avoid blur.
    let mut img = img.grayscale();
    let (width, height) = img.dimensions();
    println!("   After grayscale: {}x{}", width, height);

    if width > max_width {
        let new_height = ((height as f32) * (max_width as f32 / width as f32))
            .round()
            .max(1.0) as u32;
        println!("   Resizing to {}x{}", max_width, new_height);
        let resized = image::imageops::resize(
            &img.to_luma8(),
            max_width,
            new_height,
            image::imageops::FilterType::Nearest,
        );
        img = DynamicImage::ImageLuma8(resized);
    }

    // Many ESC/POS printers are picky about raster data layout.
    // Force width to be byte-aligned (multiple of 8 pixels). Pad with white pixels on the right.
    let (mut width, height) = img.dimensions();
    if width == 0 || height == 0 {
        return Err(Error::General("Image has invalid dimensions".to_string()));
    }

    let target_width = ((width + 7) / 8) * 8;
    if target_width != width {
        println!(
            "   Padding width {} -> {} (byte aligned)",
            width, target_width
        );
        let mut padded = image::ImageBuffer::<image::Luma<u8>, Vec<u8>>::from_pixel(
            target_width,
            height,
            image::Luma([255]),
        );
        let src = img.to_luma8();
        for y in 0..height {
            for x in 0..width {
                padded.put_pixel(x, y, *src.get_pixel(x, y));
            }
        }
        img = DynamicImage::ImageLuma8(padded);
        width = target_width;
    }

    let (width, height) = img.dimensions();
    println!("✅ Final dimensions: {}x{}", width, height);

    // Convert to 1-bit monochrome using Floyd-Steinberg dithering for better quality
    let luma_img = img.to_luma8();
    let mut dithered = luma_img.clone();

    println!("🎨 Applying Floyd-Steinberg dithering...");

    // Floyd-Steinberg dithering algorithm
    for y in 0..height {
        for x in 0..width {
            let old_pixel = dithered.get_pixel(x, y)[0];
            let new_pixel = if old_pixel < 128 { 0 } else { 255 };
            dithered.put_pixel(x, y, image::Luma([new_pixel]));

            let error = old_pixel as i16 - new_pixel as i16;

            // Distribute error to neighboring pixels
            if x + 1 < width {
                let pixel = dithered.get_pixel(x + 1, y)[0];
                let new_val = (pixel as i16 + error * 7 / 16).clamp(0, 255) as u8;
                dithered.put_pixel(x + 1, y, image::Luma([new_val]));
            }
            if y + 1 < height {
                if x > 0 {
                    let pixel = dithered.get_pixel(x - 1, y + 1)[0];
                    let new_val = (pixel as i16 + error * 3 / 16).clamp(0, 255) as u8;
                    dithered.put_pixel(x - 1, y + 1, image::Luma([new_val]));
                }
                let pixel = dithered.get_pixel(x, y + 1)[0];
                let new_val = (pixel as i16 + error * 5 / 16).clamp(0, 255) as u8;
                dithered.put_pixel(x, y + 1, image::Luma([new_val]));

                if x + 1 < width {
                    let pixel = dithered.get_pixel(x + 1, y + 1)[0];
                    let new_val = (pixel as i16 + error * 1 / 16).clamp(0, 255) as u8;
                    dithered.put_pixel(x + 1, y + 1, image::Luma([new_val]));
                }
            }
        }
    }

    println!("✅ Dithering complete");

    // Convert dithered image to bitmap
    let mut bitmap_data: Vec<u8> = Vec::new();

    // ESC/POS GS v 0 format:
    // GS v 0 m xL xH yL yH d1...dk
    // m = mode (0 = normal, 1 = double width, 2 = double height, 3 = quadruple)
    // xL, xH = width in bytes (width/8)
    // yL, yH = height in dots

    let width_bytes = ((width + 7) / 8) as u16; // always >= 1 due to padding above
    println!("   Width in bytes: {}", width_bytes);

    let mut pixel_count = 0;
    let mut black_pixels = 0;

    for y in 0..height {
        let mut row_bytes: Vec<u8> = Vec::new();
        let mut byte: u8 = 0;
        let mut bit_pos: u8 = 0;

        for x in 0..width {
            let pixel = dithered.get_pixel(x, y)[0];
            pixel_count += 1;

            // Black pixel = bit 1, White pixel = bit 0
            if pixel < 128 {
                byte |= 1 << (7 - bit_pos);
                black_pixels += 1;
            }

            bit_pos += 1;
            if bit_pos == 8 {
                row_bytes.push(byte);
                byte = 0;
                bit_pos = 0;
            }
        }

        // Push remaining bits if any (shouldn't happen after byte-aligning, but keep safe)
        if bit_pos > 0 {
            row_bytes.push(byte);
        }

        // Ensure each row has exactly width_bytes bytes.
        // Some printers misbehave if the row byte-count varies.
        while row_bytes.len() < width_bytes as usize {
            row_bytes.push(0x00);
        }

        bitmap_data.extend_from_slice(&row_bytes);
    }

    println!("   Total pixels processed: {}", pixel_count);
    println!(
        "   Black pixels: {} ({:.1}%)",
        black_pixels,
        (black_pixels as f32 / pixel_count as f32) * 100.0
    );
    println!("   Bitmap data size: {} bytes", bitmap_data.len());

    // Build ESC/POS command
    let mut escpos_cmd: Vec<u8> = Vec::new();

    // Set center justification for image
    // ESC a n - where n: 0=left, 1=center, 2=right
    escpos_cmd.push(0x1B); // ESC
    escpos_cmd.push(0x61); // a
    escpos_cmd.push(0x01); // 1 = center justification

    // Use GS v 0 command for raster graphics
    // Format: GS v 0 m xL xH yL yH [data]
    // Note: Many thermal printers expect 0x30 (ASCII '0') not 0x00
    escpos_cmd.push(0x1D); // GS
    escpos_cmd.push(0x76); // v
    escpos_cmd.push(0x30); // '0' (ASCII 0x30 - most thermal printers use this)
    escpos_cmd.push(0x00); // m = 0 (normal mode: 1x size)

    // Width in bytes (little endian)
    escpos_cmd.push((width_bytes & 0xFF) as u8);
    escpos_cmd.push(((width_bytes >> 8) & 0xFF) as u8);

    // Height in dots (little endian)
    escpos_cmd.push((height & 0xFF) as u8);
    escpos_cmd.push(((height >> 8) & 0xFF) as u8);

    println!(
        "   ESC/POS header: 1D 76 30 00 {:02X} {:02X} {:02X} {:02X}",
        (width_bytes & 0xFF) as u8,
        ((width_bytes >> 8) & 0xFF) as u8,
        (height & 0xFF) as u8,
        ((height >> 8) & 0xFF) as u8
    );

    // Bitmap data
    escpos_cmd.extend_from_slice(&bitmap_data);

    println!("✅ ESC/POS command built: {} bytes total", escpos_cmd.len());

    // Add line feed after image
    escpos_cmd.push(0x0A); // LF

    // Reset to left justification (default for text)
    escpos_cmd.push(0x1B); // ESC
    escpos_cmd.push(0x61); // a
    escpos_cmd.push(0x00); // 0 = left justification

    println!("🔧 convert_image_to_escpos - COMPLETE");

    Ok(escpos_cmd)
}

/// Best-effort encode UTF-8 Rust string to what many ESC/POS printers expect for Cyrillic.
/// Most XPrinter-style devices work reliably with CP866 when ESC t 17 is selected.
#[cfg(any(target_os = "windows", target_os = "macos", target_os = "linux"))]
fn encode_cyrillic_escpos(text: &str) -> Vec<u8> {
    // Map only Cyrillic + common ASCII. Unknown characters become '?'.
    // CP866 Cyrillic block is 0x80..0xAF for U+0410..U+043F, and 0xE0..0xEF for U+0440..U+044F.
    text.chars()
        .map(|ch| match ch {
            // ASCII
            '\u{0000}'..='\u{007F}' => ch as u8,

            // Ё ё
            '\u{0401}' => 0xF0,
            '\u{0451}' => 0xF1,

            // А..П / а..п
            '\u{0410}'..='\u{043F}' => 0x80u8 + (ch as u32 - 0x0410) as u8,

            // Р..Я / р..я
            '\u{0440}'..='\u{044F}' => 0xE0u8 + (ch as u32 - 0x0440) as u8,

            // Some punctuation that often shows up in receipts
            '№' => 0xFC,
            _ => b'?',
        })
        .collect()
}

/// Convert plain receipt text into basic ESC/POS bytes.
/// Notes:
/// - Assumes printer supports code page set by default. (UTF-8 is NOT guaranteed on many ESC/POS printers.)
/// - We keep it simple: just send bytes + LF for each line.
#[cfg(target_os = "windows")]
fn convert_text_to_escpos_bytes(text: &str) -> Vec<u8> {
    let mut out = Vec::new();
    // Initialize printer
    out.extend_from_slice(&[0x1B, 0x40]); // ESC @

    for line in text.replace("\r\n", "\n").split('\n') {
        out.extend_from_slice(line.as_bytes());
        out.push(0x0A); // LF
    }

    out
}

/// ESC/POS full cut command
#[cfg(target_os = "windows")]
fn escpos_cut_full() -> Vec<u8> {
    vec![0x1D, 0x56, 0x00]
}

/// Send raw ESC/POS bytes to Windows thermal printer
#[cfg(target_os = "windows")]
fn send_raw_bytes_to_printer(doc_name: &str, bytes: &[u8]) -> Result<()> {
    send_raw_bytes_to_named_printer(None, doc_name, bytes)
}

/// Send raw ESC/POS bytes to a specific Windows printer (or default printer if None)
#[cfg(target_os = "windows")]
fn send_raw_bytes_to_named_printer(
    printer_name: Option<&str>,
    doc_name: &str,
    bytes: &[u8],
) -> Result<()> {
    use base64::Engine;

    println!(
        "🖨️ Sending {} bytes for '{}' to thermal printer",
        bytes.len(),
        doc_name
    );

    // Convert bytes to base64 for PowerShell transmission
    let bytes_base64 = base64::engine::general_purpose::STANDARD.encode(bytes);

    let ps_script = format!(
        r#"
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public class RawPrinterHelper {{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public class DOCINFOA {{
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }}

    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

    [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

    public static bool SendBytesToPrinter(string szPrinterName, byte[] bytes) {{
        IntPtr hPrinter = IntPtr.Zero;
        DOCINFOA di = new DOCINFOA();
        di.pDocName = "{}";
        di.pDataType = "RAW";

        bool success = false;

        if (OpenPrinter(szPrinterName, out hPrinter, IntPtr.Zero)) {{
            if (StartDocPrinter(hPrinter, 1, di)) {{
                if (StartPagePrinter(hPrinter)) {{
                    IntPtr pUnmanagedBytes = Marshal.AllocCoTaskMem(bytes.Length);
                    Marshal.Copy(bytes, 0, pUnmanagedBytes, bytes.Length);
                    int dwWritten = 0;
                    success = WritePrinter(hPrinter, pUnmanagedBytes, bytes.Length, out dwWritten);
                    Marshal.FreeCoTaskMem(pUnmanagedBytes);
                    EndPagePrinter(hPrinter);
                }}
                EndDocPrinter(hPrinter);
            }}
            ClosePrinter(hPrinter);
        }}
        return success;
    }}
}}
'@

$bytesBase64 = '{}'
$bytes = [Convert]::FromBase64String($bytesBase64)
$printerName = '{}'
if ([string]::IsNullOrWhiteSpace($printerName)) {{
    $printerName = (Get-WmiObject -Query "SELECT * FROM Win32_Printer WHERE Default = TRUE").Name
}}
$success = [RawPrinterHelper]::SendBytesToPrinter($printerName, $bytes)

if ($success) {{
    exit 0
}} else {{
    Write-Error "Failed to send {} to printer"
    exit 1
}}
"#,
        doc_name,
        bytes_base64,
        printer_name.unwrap_or("").replace("'", "''"),
        doc_name
    );

    // IMPORTANT: use a temp .ps1 file instead of passing the whole script via -Command.
    // The script can become huge (base64), and Windows can error with:
    // "The file name or extension is too long".
    let mut ps_path = std::env::temp_dir();
    ps_path.push(format!(
        "txu_rawprint_{}_{}.ps1",
        doc_name.replace([' ', '/', '\\'], "_"),
        std::process::id()
    ));
    std::fs::write(&ps_path, &ps_script)
        .map_err(|e| Error::General(format!("Failed to write PowerShell script: {}", e)))?;

    let output = std::process::Command::new("powershell")
        .args(&[
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            ps_path
                .to_str()
                .ok_or_else(|| Error::General("Invalid PowerShell script path".to_string()))?,
        ])
        .output()
        .map_err(|e| Error::General(format!("Failed to execute print command: {}", e)))?;

    if !output.status.success() {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        println!("❌ Failed to send {}: {}", doc_name, error_msg);
        return Err(Error::General(format!(
            "Failed to send {}: {}",
            doc_name, error_msg
        )));
    }

    let _ = std::fs::remove_file(&ps_path);

    println!("✅ {} sent successfully", doc_name);
    Ok(())
}

/// Print receipt using order ID and template
#[command]
pub async fn print_receipt_by_order(
    app: AppHandle<Wry>,
    params: PrintReceiptByOrderDTO,
) -> IpcResponse<PrintResult> {
    match print_receipt_by_order_impl(app, params).await {
        Ok(result) => Ok(result).into(),
        Err(e) => Err(e).into(),
    }
}

async fn print_receipt_by_order_impl(
    app: AppHandle<Wry>,
    params: PrintReceiptByOrderDTO,
) -> Result<PrintResult> {
    use std::fs;

    // Get context from app
    let ctx = Ctx::from_app(app.clone())?;

    // Get device config for company info and templates
    let device_config = DeviceConfigUseCase::get_device_config(&ctx).await?;

    // Fetch order from database
    let filter = LazyTableStateDTO {
        first: 0,
        rows: 1,
        page: 0,
        sort_field: OrderColumn::Id,
        sort_order: SortOrder::Asc,
        filters: OrderFilter {
            id: Some(params.order_id.clone()),
            client_id: None,
            company: None,
            order_type: None,
            d_move: None,
        },
    };

    let result = order_usecases::get_orders_usecase(&ctx, filter).await?;

    let order = result
        .items
        .first()
        .ok_or_else(|| Error::General("Order not found".to_string()))?;

    // Get the template from device config based on printer width
    let template = match params.printer_width.as_str() {
        "58mm" => device_config.receipt_template_58mm.clone().or_else(|| {
            Some(include_str!("../../../assets/templates/receipt_58mm.txt").to_string())
        }),
        "80mm" => device_config.receipt_template_80mm.clone().or_else(|| {
            Some(include_str!("../../../assets/templates/receipt_80mm.txt").to_string())
        }),
        _ => device_config.receipt_template_80mm.clone().or_else(|| {
            Some(include_str!("../../../assets/templates/receipt_80mm.txt").to_string())
        }),
    }
    .ok_or_else(|| Error::General("Receipt template not found".to_string()))?;

    // Format items with detailed information
    let items_text = order
        .items
        .iter()
        .enumerate()
        .map(|(index, item)| {
            let product_name = item
                .product
                .as_ref()
                .map(|p| p.name.clone())
                .unwrap_or_else(|| "-".to_string());

            let unit = item
                .product
                .as_ref()
                .and_then(|p| p.unit.as_ref())
                .map(|u| u.short_name.clone())
                .unwrap_or_else(|| "шт".to_string());

            // Get product barcode/SKU
            let barcode = item
                .product
                .as_ref()
                .map(|p| p.bar_code.clone())
                .unwrap_or_else(|| "".to_string());

            // Build item details
            let mut item_lines = Vec::new();

            // Line 1: Item number and product name
            item_lines.push(format!("{}. {}", index + 1, product_name));

            // Line 2: Barcode if available
            if !barcode.is_empty() {
                item_lines.push(format!("   Ш.К: {}", barcode));
            }

            // Line 3: Quantity, unit, unit price, total
            item_lines.push(format!(
                "   {} {} x {} = {}",
                item.count, unit, item.price, item.cost
            ));

            // Line 4: Show individual discounts if any
            if item.discount > rust_decimal::Decimal::ZERO {
                item_lines.push(format!("   Скидка: -{}", item.discount));
            }

            // Line 5: Show individual taxes if any
            if item.tax > rust_decimal::Decimal::ZERO {
                item_lines.push(format!("   Налог: +{}", item.tax));
            }

            item_lines.join("\n")
        })
        .collect::<Vec<_>>()
        .join("\n");

    // Get payment info - show ALL payments
    let payment_details = if order.payments.is_empty() {
        "".to_string()
    } else {
        order
            .payments
            .iter()
            .map(|p| {
                let payment_type_translated = translate_payment_type(&p.payment_type.to_string());
                format!("{}: {}", payment_type_translated, p.summ)
            })
            .collect::<Vec<_>>()
            .join("\n")
    };

    // Calculate totals
    let subtotal: Decimal = order.items.iter().map(|i| i.cost).sum();
    let discount: Decimal = order.items.iter().map(|i| i.discount).sum();
    let tax: Decimal = order.tax;
    let total: Decimal = order.summ;

    // Format date and time
    let date_time = order.d_created;
    let date = date_time.format("%Y-%m-%d").to_string();
    let time = date_time.format("%H:%M:%S").to_string();

    // Get cashier name from logged-in user context
    let cashier_name = ctx
        .get_user()
        .map(|user| user.full_name)
        .unwrap_or_else(|| "".to_string());

    // Generate logo - prefer image logo if configured, otherwise use ASCII
    let logo_width = if params.printer_width == "58mm" {
        32
    } else {
        48
    };
    let company_name = device_config
        .company_name
        .clone()
        .unwrap_or_else(|| "".to_string());

    // Check if logo_path is configured for image logo - ACTUALLY USE THIS FOR THERMAL PRINTING
    let _logo_image_escpos = if let Some(ref logo_path) = device_config.logo_path {
        if !logo_path.is_empty() && std::path::Path::new(logo_path).exists() {
            // Use image logo - convert to ESC/POS commands
            let max_width = if params.printer_width == "58mm" {
                384
            } else {
                576
            }; // pixels
            println!("🖼️ Converting logo to ESC/POS: {}", logo_path);
            match convert_image_to_escpos(logo_path, max_width) {
                Ok(escpos_bytes) => {
                    println!("✅ Logo converted: {} bytes", escpos_bytes.len());
                    Some(escpos_bytes)
                }
                Err(e) => {
                    eprintln!(
                        "❌ Failed to convert logo image: {}, falling back to ASCII",
                        e
                    );
                    None
                }
            }
        } else {
            None
        }
    } else {
        None
    };

    // For text-based receipt (macOS/Windows print), use ASCII logo as fallback
    let logo = if let Some(ref logo_path) = device_config.logo_path {
        if !logo_path.is_empty() && std::path::Path::new(logo_path).exists() {
            // Image logo configured but can't be displayed in text-based printing
            // Show a placeholder message instead
            let border = "=".repeat(logo_width);
            format!(
                "{}\n     [LOGO: Text printing cannot display image_paths]\n     Company: {}\n{}",
                border, company_name, border
            )
        } else if !company_name.is_empty() {
            generate_ascii_logo(&company_name, logo_width)
        } else {
            String::new()
        }
    } else if !company_name.is_empty() {
        generate_ascii_logo(&company_name, logo_width)
    } else {
        String::new()
    };

    // Generate QR code - both ASCII (for text receipt) and ESC/POS image (for thermal printing)
    let (qr_code, _qr_image_escpos) = if let Some(ref qr_url) = device_config.qr_code_url {
        println!("🔲 QR Code URL from config: '{}'", qr_url);
        if !qr_url.is_empty() {
            // Replace {{order_id}} in QR URL with actual order ID
            let qr_url_with_order = qr_url.replace("{{order_id}}", &params.order_id);
            println!("🔲 QR Code URL with order ID: '{}'", qr_url_with_order);

            // Generate ASCII QR code for text receipt
            let qr_size = if params.printer_width == "58mm" {
                20
            } else {
                30
            };
            let qr_ascii = generate_ascii_qr_code(&qr_url_with_order, qr_size);

            // Generate QR code image for thermal printing
            let qr_escpos = match generate_qr_code_png(&qr_url_with_order) {
                Ok(qr_path) => {
                    println!("🔲 Converting QR code to ESC/POS: {}", qr_path);
                    let max_width = if params.printer_width == "58mm" {
                        200
                    } else {
                        300
                    };
                    let escpos = convert_image_to_escpos(&qr_path, max_width).ok();
                    let _ = std::fs::remove_file(&qr_path); // Cleanup temp file

                    if let Some(ref bytes) = escpos {
                        println!("✅ QR code converted: {} bytes", bytes.len());
                    } else {
                        eprintln!("❌ Failed to convert QR code to ESC/POS");
                    }

                    escpos
                }
                Err(e) => {
                    eprintln!("❌ Failed to generate QR code image: {}", e);
                    None
                }
            };

            (qr_ascii, qr_escpos)
        } else {
            println!("⚠️ QR Code URL is empty");
            (String::new(), None)
        }
    } else {
        println!("⚠️ No QR Code URL configured in device_config");
        (String::new(), None)
    };

    // Prefix items with numbering for template
    let numbered_items_text = items_text
        .lines()
        .enumerate()
        .map(|(i, l)| format!("{}. {}", i + 1, l))
        .collect::<Vec<_>>()
        .join("\n");

    // Replace placeholders with device config and order data
    // Note: For Windows, we remove {{qr_code}} from text since we print it as a bitmap separately
    let receipt = template
        .replace("{{logo}}", &logo)
        .replace(
            "{{company_name}}",
            &device_config.company_name.unwrap_or_else(|| "".to_string()),
        )
        .replace(
            "{{company_address}}",
            &device_config
                .company_address
                .unwrap_or_else(|| "".to_string()),
        )
        .replace(
            "{{company_phone}}",
            &device_config
                .company_phone
                .unwrap_or_else(|| "".to_string()),
        )
        .replace(
            "{{company_email}}",
            &device_config
                .company_email
                .unwrap_or_else(|| "".to_string()),
        )
        .replace(
            "{{company_website}}",
            &device_config
                .company_website
                .unwrap_or_else(|| "".to_string()),
        )
        .replace(
            "{{company_tax_code}}",
            &device_config
                .company_tax_code
                .unwrap_or_else(|| "".to_string()),
        )
        .replace(
            "{{station_name}}",
            &device_config.station_name.unwrap_or_else(|| "".to_string()),
        )
        .replace(
            "{{shop_name}}",
            &device_config.shop_name.unwrap_or_else(|| "".to_string()),
        )
        .replace("{{order_id}}", &shorten_order_id(&params.order_id))
        .replace("{{date}}", &date)
        .replace("{{time}}", &time)
        .replace("{{cashier_name}}", &cashier_name)
        .replace(
            "{{customer_name}}",
            &order
                .client
                .as_ref()
                .map(|c| c.name.clone())
                .unwrap_or_else(|| "-".to_string()),
        )
        .replace("{{items}}", &numbered_items_text)
        .replace("{{subtotal}}", &subtotal.to_string())
        .replace("{{discount}}", &discount.to_string())
        .replace("{{tax}}", &tax.to_string())
        .replace("{{total}}", &total.to_string())
        .replace("{{payment_method}}", "") // Removed - included in payment_details now
        .replace("{{payment_details}}", &payment_details)
        .replace(
            "{{footer_message}}",
            &device_config
                .receipt_footer
                .unwrap_or_else(|| "".to_string()),
        )
        .replace(
            "{{qr_code}}",
            if cfg!(target_os = "windows") {
                ""
            } else {
                &qr_code
            },
        ) // Windows: bitmap only, Mac: ASCII
        .replace(
            "{{qr_code_url}}",
            &device_config
                .qr_code_url
                .clone()
                .unwrap_or_else(|| "".to_string()),
        );

    // Write to temporary file
    let temp_dir = std::env::temp_dir();
    let receipt_file_path = temp_dir.join("sklad_uchot_receipt_template.txt");

    fs::write(&receipt_file_path, &receipt)
        .map_err(|e| Error::General(format!("Failed to write receipt file: {}", e)))?;

    // Calculate approximate receipt height based on line count
    let line_count = receipt.lines().count();
    // With lpi=8, we need ~3.175mm per line (25.4mm per inch / 8 lines per inch)
    // Add some padding at top and bottom
    let estimated_height_mm = ((line_count as f32 * 3.175) + 10.0) as u32; // +10mm padding
    let width_mm = if params.printer_width == "58mm" {
        58
    } else {
        72
    }; // 80mm printer uses 72mm print width

    let custom_media = format!("Custom.{}x{}mm", width_mm, estimated_height_mm);

    println!(
        "📏 Receipt size: {} lines, estimated {}mm height, using media: {}",
        line_count, estimated_height_mm, custom_media
    );

    // Print the receipt
    #[cfg(target_os = "macos")]
    {
        let mut print_cmd = Command::new("lp");
        print_cmd
            .arg("-d")
            .arg("Printer_POS_80")
            .arg("-o")
            .arg("cpi=17") // Characters per inch
            .arg("-o")
            .arg("lpi=8") // Lines per inch
            .arg("-o")
            .arg("page-left=0")
            .arg("-o")
            .arg("page-right=0")
            .arg("-o")
            .arg("page-top=0")
            .arg("-o")
            .arg("page-bottom=0")
            .arg("-o")
            .arg(format!("media={}", custom_media)) // Custom page size based on content
            //  .arg("-o")
            // .arg("PageCutType=0NoCutPage")  // Disable auto-cut to prevent excess paper
            .arg(&receipt_file_path);

        println!("🖨️ Executing print command: {:?}", print_cmd);

        let print_output = print_cmd
            .output()
            .map_err(|e| Error::General(format!("Failed to execute print command: {}", e)))?;

        if !print_output.status.success() {
            let error_msg = String::from_utf8_lossy(&print_output.stderr);
            println!("❌ Print command stderr: {}", error_msg);
            return Err(Error::General(format!(
                "Print command failed: {}",
                error_msg
            )));
        }

        let success_msg = String::from_utf8_lossy(&print_output.stdout);
        println!("✅ Print command stdout: {}", success_msg);

        // Cleanup
        tokio::spawn(async move {
            tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
            let _ = std::fs::remove_file(&receipt_file_path);
        });
    }

    #[cfg(target_os = "windows")]
    {
        println!(
            "🖨️ [Windows] Printing receipt for order {} to thermal printer...",
            params.order_id
        );

        // STEP 1: Send logo image (if available) BEFORE text receipt
        if let Some(ref logo_bytes) = _logo_image_escpos {
            println!(
                "🖼️ [Windows] Sending logo image ({} bytes) to thermal printer...",
                logo_bytes.len()
            );
            match send_raw_bytes_to_printer("Logo Image", logo_bytes) {
                Ok(_) => println!("✅ [Windows] Logo image sent successfully"),
                Err(e) => eprintln!("⚠️ [Windows] Logo image failed (non-critical): {}", e),
            }
            // Small delay to let printer process the image
            tokio::time::sleep(tokio::time::Duration::from_millis(300)).await;
        }

        // STEP 2: Send text receipt via ESC/POS RAW in CP866.
        // This is the most reliable way to print Cyrillic on common thermal printers.
        let receipt_content = std::fs::read_to_string(&receipt_file_path)
            .map_err(|e| Error::General(format!("Failed to read receipt file: {}", e)))?;

        let mut text_bytes: Vec<u8> = Vec::new();
        text_bytes.extend_from_slice(&[0x1B, 0x40]); // ESC @
        text_bytes.extend_from_slice(&[0x1B, 0x74, 0x11]); // ESC t 17 (CP866)

        for line in receipt_content.replace("\r\n", "\n").split('\n') {
            text_bytes.extend_from_slice(&encode_cyrillic_escpos(line));
            text_bytes.push(0x0A);
        }

        println!(
            "🔤 [Windows] Sending text receipt as RAW ESC/POS ({} bytes)...",
            text_bytes.len()
        );
        send_raw_bytes_to_printer("Receipt Text", &text_bytes)?;
        println!("✅ [Windows] Text receipt sent via RAW ESC/POS");

        // STEP 3: Send QR code image (if available) AFTER text receipt
        println!("🔍 [Windows] Checking QR code image availability...");
        if let Some(ref qr_bytes) = _qr_image_escpos {
            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
            println!(
                "🔲 [Windows] Sending QR code image ({} bytes) to thermal printer...",
                qr_bytes.len()
            );
            match send_raw_bytes_to_printer("QR Code Image", qr_bytes) {
                Ok(_) => println!("✅ [Windows] QR code image sent successfully"),
                Err(e) => eprintln!("⚠️ [Windows] QR code image failed (non-critical): {}", e),
            }
        } else {
            println!("⚠️ [Windows] No QR code image to send (qr_image_escpos is None)");
        }

        // STEP 4: Send paper cut command to Xprinter
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

        let cut_script = r#"
Add-Type -TypeDefinition @'
using System;
using System.IO;
using System.Runtime.InteropServices;

public class RawPrinterHelper {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public class DOCINFOA {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }

    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

    [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

    public static bool SendBytesToPrinter(string szPrinterName, byte[] bytes) {
        IntPtr hPrinter = IntPtr.Zero;
        DOCINFOA di = new DOCINFOA();
        di.pDocName = "Paper Cut";
        di.pDataType = "RAW";

        bool success = false;

        if (OpenPrinter(szPrinterName, out hPrinter, IntPtr.Zero)) {
            if (StartDocPrinter(hPrinter, 1, di)) {
                if (StartPagePrinter(hPrinter)) {
                    IntPtr pUnmanagedBytes = Marshal.AllocCoTaskMem(bytes.Length);
                    Marshal.Copy(bytes, 0, pUnmanagedBytes, bytes.Length);
                    int dwWritten = 0;
                    success = WritePrinter(hPrinter, pUnmanagedBytes, bytes.Length, out dwWritten);
                    Marshal.FreeCoTaskMem(pUnmanagedBytes);
                    EndPagePrinter(hPrinter);
                }
                EndDocPrinter(hPrinter);
            }
            ClosePrinter(hPrinter);
        }
        return success;
    }
}
'@

$cutCommand = [byte[]](0x1D, 0x56, 0x00)
$defaultPrinter = (Get-WmiObject -Query "SELECT * FROM Win32_Printer WHERE Default = TRUE").Name
[RawPrinterHelper]::SendBytesToPrinter($defaultPrinter, $cutCommand)
"#;

        // Write to a temp .ps1 to avoid hitting Windows command-line length limits.
        let mut cut_ps_path = std::env::temp_dir();
        cut_ps_path.push(format!("txu_cut_order_{}.ps1", std::process::id()));
        let _ = std::fs::write(&cut_ps_path, cut_script);

        let cut_output = std::process::Command::new("powershell")
            .args(&[
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                cut_ps_path.to_str().unwrap_or(""),
            ])
            .output();

        match cut_output {
            Ok(output) if output.status.success() => {
                println!(
                    "✅ [Windows] Paper cut command sent for order {}",
                    params.order_id
                );
            }
            Ok(output) => {
                let error_msg = String::from_utf8_lossy(&output.stderr);
                println!(
                    "⚠️ [Windows] Paper cut failed (non-critical): {}",
                    error_msg
                );
            }
            Err(e) => {
                println!(
                    "⚠️ [Windows] Could not send paper cut (non-critical): {}",
                    e
                );
            }
        }

        let _ = std::fs::remove_file(&cut_ps_path);

        // Cleanup
        tokio::spawn(async move {
            tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
            let _ = std::fs::remove_file(&receipt_file_path);
        });
    }

    #[cfg(target_os = "linux")]
    {
        let output = Command::new("lp")
            .arg(&receipt_file_path)
            .output()
            .map_err(|e| Error::General(format!("Failed to execute print command: {}", e)))?;

        if !output.status.success() {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            return Err(Error::General(format!(
                "Print command failed: {}",
                error_msg
            )));
        }
    }

    Ok(PrintResult {
        success: true,
        message: format!("Receipt printed successfully for order {}", params.order_id),
    })
}

/// Get list of available printers
#[command]
pub async fn get_printers(_app: AppHandle<Wry>) -> IpcResponse<Vec<String>> {
    match get_printers_impl().await {
        Ok(printers) => Ok(printers).into(),
        Err(e) => Err(e).into(),
    }
}

async fn get_printers_impl() -> Result<Vec<String>> {
    #[cfg(target_os = "windows")]
    {
        let output = std::process::Command::new("powershell")
            .args(&[
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                "Get-Printer | Select-Object -ExpandProperty Name",
            ])
            .output()
            .map_err(|e| Error::General(format!("Failed to get printers: {}", e)))?;

        if !output.status.success() {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            return Err(Error::General(format!(
                "Failed to list printers: {}",
                error_msg
            )));
        }

        let printers = String::from_utf8_lossy(&output.stdout)
            .lines()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();

        Ok(printers)
    }

    #[cfg(target_os = "macos")]
    {
        let output = std::process::Command::new("lpstat")
            .args(["-p"])
            .output()
            .map_err(|e| Error::General(format!("Failed to get printers: {}", e)))?;

        if !output.status.success() {
            return Err(Error::General("Failed to list printers".to_string()));
        }

        let printers = String::from_utf8_lossy(&output.stdout)
            .lines()
            .filter_map(|line| {
                line.strip_prefix("printer ")
                    .and_then(|s| s.split_whitespace().next())
            })
            .map(|s| s.to_string())
            .collect();

        Ok(printers)
    }

    #[cfg(target_os = "linux")]
    {
        let output = std::process::Command::new("lpstat")
            .args(&["-p"])
            .output()
            .map_err(|e| Error::General(format!("Failed to get printers: {}", e)))?;

        if !output.status.success() {
            return Err(Error::General("Failed to list printers".to_string()));
        }

        let printers = String::from_utf8_lossy(&output.stdout)
            .lines()
            .filter_map(|line| {
                line.strip_prefix("printer ")
                    .and_then(|s| s.split_whitespace().next())
            })
            .map(|s| s.to_string())
            .collect();

        Ok(printers)
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        Err(Error::General(
            "Printer listing not supported on this platform".to_string(),
        ))
    }
}

/// Print receipt to a specific printer by name
#[derive(Debug, Deserialize)]
pub struct PrintToNamedPrinterDTO {
    pub printer_name: String,
    pub order_id: String,
    pub printer_width: String, // "58mm" or "80mm"
}

#[command]
pub async fn print_to_named_printer(
    app: AppHandle<Wry>,
    params: PrintToNamedPrinterDTO,
) -> IpcResponse<PrintResult> {
    match print_to_named_printer_impl(app, params).await {
        Ok(result) => Ok(result).into(),
        Err(e) => Err(e).into(),
    }
}

async fn print_to_named_printer_impl(
    app: AppHandle<Wry>,
    params: PrintToNamedPrinterDTO,
) -> Result<PrintResult> {
    // First, generate the receipt content using the existing order-based function
    let order_params = PrintReceiptByOrderDTO {
        order_id: params.order_id.clone(),
        printer_width: params.printer_width.clone(),
    };

    // Get the receipt content (we'll reuse the template generation logic)
    use std::fs;
    let ctx = Ctx::from_app(app.clone())?;
    let device_config = DeviceConfigUseCase::get_device_config(&ctx).await?;

    let filter = LazyTableStateDTO {
        first: 0,
        rows: 1,
        page: 0,
        sort_field: OrderColumn::Id,
        sort_order: SortOrder::Asc,
        filters: OrderFilter {
            id: Some(order_params.order_id.clone()),
            client_id: None,
            company: None,
            order_type: None,
            d_move: None,
        },
    };

    let result = order_usecases::get_orders_usecase(&ctx, filter).await?;
    let order = result
        .items
        .first()
        .ok_or_else(|| Error::General("Order not found".to_string()))?;

    let template = match order_params.printer_width.as_str() {
        "58mm" => device_config.receipt_template_58mm.clone().or_else(|| {
            Some(include_str!("../../../assets/templates/receipt_58mm.txt").to_string())
        }),
        "80mm" => device_config.receipt_template_80mm.clone().or_else(|| {
            Some(include_str!("../../../assets/templates/receipt_80mm.txt").to_string())
        }),
        _ => device_config.receipt_template_80mm.clone().or_else(|| {
            Some(include_str!("../../../assets/templates/receipt_80mm.txt").to_string())
        }),
    }
    .ok_or_else(|| Error::General("Receipt template not found".to_string()))?;

    // Generate receipt content (same logic as print_receipt_by_order_impl)
    // Replace the current items_text generation in print_to_named_printer_impl function
    // with this improved version:

    let items_text = order
        .items
        .iter()
        .enumerate()
        .map(|(index, item)| {
            let product_name = item
                .product
                .as_ref()
                .map(|p| p.name.clone())
                .unwrap_or_else(|| "-".to_string());

            let unit = item
                .product
                .as_ref()
                .and_then(|p| p.unit.as_ref())
                .map(|u| u.short_name.clone())
                .unwrap_or_else(|| "шт".to_string());

            let price_per_unit = item.price.round_dp(2);
            let quantity = item.count.round_dp(2);
            let total = item.cost.round_dp(2);

            // ===== Taxes: show by name (from item.taxes) =====
            // Example output:
            // "НДС 12%: 120.00; Акциз 5%: 50.00"
            let taxes_str = if !item.taxes.is_empty() {
                let joined = item
                    .taxes
                    .iter()
                    .filter(|t| t.value > Decimal::ZERO)
                    .map(|t| {
                        let rate_str = t
                            .rate
                            .map(|r| format!(" {}%", r.round_dp(2)))
                            .unwrap_or_default();
                        format!(" {}{}: {}", t.name, rate_str, t.value.round_dp(2))
                    })
                    .collect::<Vec<_>>()
                    .join(" |");

                if joined.is_empty() {
                    String::new()
                } else {
                    format!(" налоги: \n{}", joined)
                }
            } else {
                String::new()
            };

            // ===== Discounts: keep as before (or you can also do by names similarly) =====
            let discount_str = if !item.discounts.is_empty() {
                let joined = item
                    .discounts
                    .iter()
                    .filter(|d| d.value > Decimal::ZERO)
                    .map(|d| format!("{}: -{}", d.name, d.value.round_dp(2)))
                    .collect::<Vec<_>>()
                    .join("; ");

                if joined.is_empty() {
                    String::new()
                } else {
                    format!(" (скидки: {})", joined)
                }
            } else if item.discount.round_dp(2) > Decimal::ZERO {
                // fallback, if discounts list пустой, но total discount заполнен
                format!(" (скидка -{})", item.discount.round_dp(2))
            } else {
                String::new()
            };

            format!(
                "{:2}. {}\n   Кол-во: {} {}\n   Цена: {} x {} = {}\n{}\n{}",
                index + 1,
                product_name,
                quantity,
                unit,
                price_per_unit,
                quantity,
                total,
                taxes_str,
                discount_str
            )
        })
        .collect::<Vec<_>>()
        .join("\n\n"); // Add extra spacing between items

    // Also, let's create a summary section for taxes if needed
    // let tax_summary = if order.tax > Decimal::ZERO {
    //     format!("\nОбщий налог: {}", order.tax.round_dp(2))
    // } else {
    //     String::new()
    // };

    // // Add to the receipt template replacement
    // let receipt = template
    //     // ... other replacements ...
    //     .replace("{{items}}", &items_text)
    //     .replace("{{tax}}", &order.tax.round_dp(2).to_string())
    //     .replace("{{tax_summary}}", &tax_summary)  // Add this new placeholder if template supports it
    //     // ... other replacements ...

    // Get payment info - show ALL payments
    let payment_details = if order.payments.is_empty() {
        "".to_string()
    } else {
        order
            .payments
            .iter()
            .map(|p| {
                let payment_type_translated = translate_payment_type(&p.payment_type.to_string());
                format!("{}: {}", payment_type_translated, p.summ)
            })
            .collect::<Vec<_>>()
            .join("\n")
    };

    let subtotal: Decimal = order.items.iter().map(|i| i.cost).sum();
    let discount: Decimal = order.items.iter().map(|i| i.discount).sum();
    let tax: Decimal = order.tax;
    let total: Decimal = order.summ;

    use chrono::FixedOffset;

    let tz = FixedOffset::east_opt(5 * 3600).unwrap();

    let date = order
        .d_move
        .map(|dt| dt.with_timezone(&tz).format("%Y-%m-%d").to_string())
        .unwrap_or_else(|| "-".to_string());

    let time = order
        .d_move
        .map(|dt| dt.with_timezone(&tz).format("%H:%M:%S").to_string())
        .unwrap_or_else(|| "-".to_string());

    // Get cashier name from logged-in user context
    let cashier_name = ctx
        .get_user()
        .map(|user| user.full_name)
        .unwrap_or_else(|| "".to_string());

    // Generate logo + QR code (same as print_receipt_by_order_impl)
    // On Windows we print logo/QR as ESC/POS bitmaps via RAW printing.
    let logo_width = if order_params.printer_width == "58mm" {
        32
    } else {
        48
    };
    let company_name = device_config
        .company_name
        .clone()
        .unwrap_or_else(|| "".to_string());

    let _logo_image_escpos = if let Some(ref logo_path) = device_config.logo_path {
        if !logo_path.is_empty() && std::path::Path::new(logo_path).exists() {
            let max_width = if order_params.printer_width == "58mm" {
                384
            } else {
                576
            }; // pixels
            println!("🖼️ Converting logo to ESC/POS: {}", logo_path);
            match convert_image_to_escpos(logo_path, max_width) {
                Ok(bytes) => Some(bytes),
                Err(e) => {
                    eprintln!("⚠️ Failed to convert logo to ESC/POS (non-critical): {}", e);
                    None
                }
            }
        } else {
            None
        }
    } else {
        None
    };

    let logo = if let Some(ref logo_path) = device_config.logo_path {
        if !logo_path.is_empty() && std::path::Path::new(logo_path).exists() {
            let border = "=".repeat(logo_width);
            format!(
                "{}\n     [LOGO: Text printing cannot display image_paths]\n     Company: {}\n{}",
                border, company_name, border
            )
        } else if !company_name.is_empty() {
            generate_ascii_logo(&company_name, logo_width)
        } else {
            String::new()
        }
    } else if !company_name.is_empty() {
        generate_ascii_logo(&company_name, logo_width)
    } else {
        String::new()
    };

    let (qr_code, _qr_image_escpos) = if let Some(ref qr_url) = device_config.qr_code_url {
        if !qr_url.is_empty() {
            let qr_url_with_order = qr_url.replace("{{order_id}}", &order_params.order_id);
            let qr_size = if order_params.printer_width == "58mm" {
                20
            } else {
                30
            };
            let qr_ascii = generate_ascii_qr_code(&qr_url_with_order, qr_size);
            let qr_escpos = match generate_qr_code_png(&qr_url_with_order) {
                Ok(png_path) => {
                    let max_width = if order_params.printer_width == "58mm" {
                        384
                    } else {
                        576
                    };
                    match convert_image_to_escpos(&png_path, max_width) {
                        Ok(bytes) => Some(bytes),
                        Err(e) => {
                            eprintln!("⚠️ Failed to convert QR to ESC/POS (non-critical): {}", e);
                            None
                        }
                    }
                }
                Err(e) => {
                    eprintln!("⚠️ Failed to generate QR PNG (non-critical): {}", e);
                    None
                }
            };
            (qr_ascii, qr_escpos)
        } else {
            (String::new(), None)
        }
    } else {
        (String::new(), None)
    };

    let receipt = template
        .replace("{{logo}}", &logo)
        .replace(
            "{{company_name}}",
            &device_config.company_name.unwrap_or_else(|| "".to_string()),
        )
        .replace(
            "{{company_address}}",
            &device_config
                .company_address
                .unwrap_or_else(|| "".to_string()),
        )
        .replace(
            "{{company_phone}}",
            &device_config
                .company_phone
                .unwrap_or_else(|| "".to_string()),
        )
        .replace(
            "{{company_email}}",
            &device_config
                .company_email
                .unwrap_or_else(|| "".to_string()),
        )
        .replace(
            "{{company_website}}",
            &device_config
                .company_website
                .unwrap_or_else(|| "".to_string()),
        )
        .replace(
            "{{company_tax_code}}",
            &device_config
                .company_tax_code
                .unwrap_or_else(|| "".to_string()),
        )
        .replace(
            "{{station_name}}",
            &device_config.station_name.unwrap_or_else(|| "".to_string()),
        )
        .replace(
            "{{shop_name}}",
            &device_config.shop_name.unwrap_or_else(|| "".to_string()),
        )
        .replace("{{order_id}}", &shorten_order_id(&order_params.order_id))
        .replace("{{date}}", &date)
        .replace("{{time}}", &time)
        .replace("{{cashier_name}}", &cashier_name)
        .replace(
            "{{customer_name}}",
            &order
                .client
                .as_ref()
                .map(|c| c.name.clone())
                .unwrap_or_else(|| "-".to_string()),
        )
        .replace("{{items}}", &items_text)
        .replace("{{subtotal}}", &subtotal.to_string())
        .replace("{{discount}}", &discount.to_string())
        .replace("{{tax}}", &tax.to_string())
        .replace("{{total}}", &total.to_string())
        .replace("{{payment_method}}", "") // Removed - included in payment_details now
        .replace("{{payment_details}}", &payment_details)
        .replace(
            "{{footer_message}}",
            &device_config
                .receipt_footer
                .unwrap_or_else(|| "".to_string()),
        )
        .replace(
            "{{qr_code}}",
            if cfg!(target_os = "windows") {
                ""
            } else {
                &qr_code
            },
        )
        .replace(
            "{{qr_code_url}}",
            device_config.qr_code_url.as_deref().unwrap_or(""),
        );

    let temp_dir = std::env::temp_dir();
    let receipt_file_path = temp_dir.join("sklad_uchot_receipt_named.txt");
    fs::write(&receipt_file_path, &receipt)
        .map_err(|e| Error::General(format!("Failed to write receipt file: {}", e)))?;

    // Print to the specified printer
    println!(
        "🖨️ Printing to specific printer: {} with .NET PrintDocument",
        params.printer_name
    );

    #[cfg(target_os = "windows")]
    {
        // Render the entire receipt to a PNG using a system font (keeps Cyrillic intact),
        // then print that PNG via ESC/POS raster (GS v 0).
        let receipt_content = std::fs::read_to_string(&receipt_file_path)
            .map_err(|e| Error::General(format!("Failed to read receipt file: {}", e)))?;

        let qr_url_with_order: Option<String> = device_config
            .qr_code_url
            .as_deref()
            .and_then(|u| if u.is_empty() { None } else { Some(u) })
            .map(|u| u.replace("{{order_id}}", &order_params.order_id));

        let receipt_png_path = render_receipt_png(
            &receipt_content,
            device_config.logo_path.as_deref(),
            qr_url_with_order.as_deref(),
            if order_params.printer_width == "58mm" {
                384
            } else {
                576
            },
        )?;

        let escpos_image = convert_image_to_escpos(
            &receipt_png_path.to_string_lossy(),
            if order_params.printer_width == "58mm" {
                384
            } else {
                576
            },
        )?;

        // Build ONE RAW job: init + image + cut.
        let mut job: Vec<u8> = Vec::new();
        job.extend_from_slice(&[0x1B, 0x40]); // ESC @ init
        job.extend_from_slice(&[0x1B, 0x61, 0x01]); // center
        job.extend_from_slice(&escpos_image);
        job.extend_from_slice(&[0x0A, 0x0A]);
        job.extend_from_slice(&escpos_cut_full());

        println!(
            "🧾 [Windows] Printing receipt as PNG ({} bytes ESC/POS) to '{}'...",
            job.len(),
            params.printer_name
        );

        // Write job bytes to temp .bin
        let mut job_bin_path = std::env::temp_dir();
        job_bin_path.push(format!(
            "txu_receipt_png_job_{}_{}.bin",
            std::process::id(),
            chrono::Utc::now().timestamp_millis()
        ));
        std::fs::write(&job_bin_path, &job)
            .map_err(|e| Error::General(format!("Failed to write job bin: {}", e)))?;

        // PowerShell script: read .bin and send RAW to printer
        let printer_ps = params.printer_name.replace("'", "''");
        let job_path_ps = job_bin_path.to_str().unwrap_or("").replace("'", "''");

        let ps_script = format!(
            r#"
Add-Type -TypeDefinition @'
using System;
using System.IO;
using System.Runtime.InteropServices;

public class RawPrinterHelper {{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public class DOCINFOA {{
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }}

    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

    [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

    public static bool SendBytesToPrinter(string szPrinterName, string docName, byte[] bytes) {{
        IntPtr hPrinter = IntPtr.Zero;
        DOCINFOA di = new DOCINFOA();
        di.pDocName = docName;
        di.pDataType = "RAW";

        bool success = false;

        if (OpenPrinter(szPrinterName, out hPrinter, IntPtr.Zero)) {{
            if (StartDocPrinter(hPrinter, 1, di)) {{
                if (StartPagePrinter(hPrinter)) {{
                    IntPtr pUnmanagedBytes = Marshal.AllocCoTaskMem(bytes.Length);
                    Marshal.Copy(bytes, 0, pUnmanagedBytes, bytes.Length);
                    int dwWritten = 0;
                    success = WritePrinter(hPrinter, pUnmanagedBytes, bytes.Length, out dwWritten);
                    Marshal.FreeCoTaskMem(pUnmanagedBytes);
                    EndPagePrinter(hPrinter);
                }}
                EndDocPrinter(hPrinter);
            }}
            ClosePrinter(hPrinter);
        }}
        return success;
    }}
}}
'@

$printer = '{printer}'
$jobPath = '{job_path}'

try {{
    $bytes = [System.IO.File]::ReadAllBytes($jobPath)
}} catch {{
    Write-Error ("Failed to read job file: " + $_.Exception.Message)
    exit 2
}}

$ok = [RawPrinterHelper]::SendBytesToPrinter($printer, "Receipt (PNG)", $bytes)
if (-not $ok) {{
    $err = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
    Write-Error ("RAW print failed. Win32Error=" + $err)
    exit 1
}}

exit 0
"#,
            printer = printer_ps,
            job_path = job_path_ps
        );

        // Write ps1 to temp file
        let mut ps1_path = std::env::temp_dir();
        ps1_path.push(format!(
            "txu_print_named_png_{}_{}.ps1",
            std::process::id(),
            chrono::Utc::now().timestamp_millis()
        ));
        std::fs::write(&ps1_path, ps_script)
            .map_err(|e| Error::General(format!("Failed to write ps1: {}", e)))?;

        // Run PowerShell
        let output = std::process::Command::new("powershell")
            .args(&[
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                ps1_path.to_str().unwrap_or(""),
            ])
            .output()
            .map_err(|e| Error::General(format!("Failed to run PowerShell: {}", e)))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            let stdout = String::from_utf8_lossy(&output.stdout);
            println!(
                "⚠️ [Windows] PowerShell RAW print failed.\nSTDOUT:\n{}\nSTDERR:\n{}",
                stdout, stderr
            );
            return Err(Error::General("PowerShell RAW print failed".into()));
        }

        println!(
            "✅ [Windows] Printed receipt as PNG via RAW ESC/POS to '{}'",
            params.printer_name
        );

        // Cleanup
        let _ = std::fs::remove_file(&ps1_path);
        let _ = std::fs::remove_file(&job_bin_path);
        let _ = std::fs::remove_file(&receipt_png_path);
    }

    #[cfg(target_os = "macos")]
    {
        let output = std::process::Command::new("lp")
            .arg("-d")
            .arg(&params.printer_name)
            .arg(&receipt_file_path)
            .output()
            .map_err(|e| Error::General(format!("Failed to execute print command: {}", e)))?;

        if !output.status.success() {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            return Err(Error::General(format!("Print failed: {}", error_msg)));
        }
    }

    #[cfg(target_os = "linux")]
    {
        let output = std::process::Command::new("lp")
            .arg("-d")
            .arg(&params.printer_name)
            .arg(&receipt_file_path)
            .output()
            .map_err(|e| Error::General(format!("Failed to execute print command: {}", e)))?;

        if !output.status.success() {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            return Err(Error::General(format!("Print failed: {}", error_msg)));
        }
    }

    // Cleanup
    tokio::spawn(async move {
        tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
        let _ = std::fs::remove_file(&receipt_file_path);
    });

    Ok(PrintResult {
        success: true,
        message: format!(
            "Receipt printed to '{}' for order {}",
            params.printer_name, order_params.order_id
        ),
    })
}

/// Render an entire receipt (logo + text + QR) into a single PNG.
/// This avoids ESC/POS codepage issues and keeps Cyrillic intact.
#[cfg(target_os = "windows")]
fn render_receipt_png(
    receipt_text: &str,
    logo_path: Option<&str>,
    qr_url: Option<&str>,
    max_width_px: u32,
) -> Result<std::path::PathBuf> {
    use ab_glyph::{FontArc, PxScale};
    use image::{ImageBuffer, Rgba, RgbaImage};
    use imageproc::drawing::{draw_text_mut, text_size};

    // Reuse barcode module font loader if present; otherwise load a very common font.
    // We keep it self-contained here to avoid tight coupling.
    fn load_system_font_local() -> Result<FontArc> {
        // Prefer a monospaced font so the ASCII template layout stays stable.
        // Consolas supports Cyrillic on most Windows installs.
        let candidates = [
            "C:/Windows/Fonts/consola.ttf",
            "C:/Windows/Fonts/CONSOLA.TTF",
            "C:/Windows/Fonts/consolab.ttf",
            "C:/Windows/Fonts/CONSOLAB.TTF",
            // fallback (usually has Cyrillic but proportional)
            "C:/Windows/Fonts/arial.ttf",
            "C:/Windows/Fonts/ARIAL.TTF",
            "C:/Windows/Fonts/tahoma.ttf",
            "C:/Windows/Fonts/TAHOMA.TTF",
        ];
        for p in candidates {
            if std::path::Path::new(p).exists() {
                let data = std::fs::read(p)
                    .map_err(|e| Error::General(format!("Failed to read font {}: {}", p, e)))?;
                return FontArc::try_from_vec(data)
                    .map_err(|e| Error::General(format!("Failed to parse font {}: {}", p, e)));
            }
        }
        Err(Error::General(
            "No system font found (Consolas/Arial/Tahoma).".to_string(),
        ))
    }

    let font = load_system_font_local()?;

    // Basic layout
    // Keep fixed canvas width in pixels that matches printer dot width.
    // 58mm printers are typically 384 dots; 80mm ~576 dots.
    let canvas_w = max_width_px;
    let padding: u32 = 10;
    // Increase gap between text lines so printed PNG doesn't look "stuck" together.
    // Use a slightly larger gap for narrow (58mm) receipts and a bit larger for 80mm.
    let line_gap: i32 = if max_width_px <= 384 { 8 } else { 10 };
    let text_scale = PxScale::from(if max_width_px <= 384 { 20.0 } else { 22.0 });
    let black = Rgba([0, 0, 0, 255]);
    let white = Rgba([255, 255, 255, 255]);

    // Optional logo (top)
    let mut blocks: Vec<RgbaImage> = Vec::new();

    if let Some(lp) = logo_path {
        if !lp.is_empty() && std::path::Path::new(lp).exists() {
            if let Ok(img) = image::open(lp) {
                let resized = img
                    .resize(max_width_px, u32::MAX, image::imageops::FilterType::Nearest)
                    .to_rgba8();
                blocks.push(resized);
            }
        }
    }

    // Render text into its own image block.
    // IMPORTANT: to be "strictly by template", we preserve leading spaces from the template.
    // We DO NOT center each line automatically; instead we left-align to padding so the
    // template's own indentation controls alignment.
    let normalized = receipt_text.replace("\r\n", "\n");
    let raw_lines: Vec<&str> = normalized.split('\n').collect();

    // Expand tabs (just in case) and perform word-wrapping to fit the printer width.
    // Preserve leading spaces (indentation) for template alignment.
    let mut wrapped_lines: Vec<String> = Vec::new();
    // available pixel width for text after padding
    let available_px = (canvas_w.saturating_sub(padding * 2)) as i32;

    for raw in raw_lines {
        let mut line = raw.replace("\t", "    ");

        // Find prefix of leading spaces to preserve indentation
        let first_non_space = line.find(|c| c != ' ');
        let (prefix, content) = if let Some(pos) = first_non_space {
            (line[..pos].to_string(), line[pos..].to_string())
        } else {
            // Line is all spaces (or empty) - keep as-is
            wrapped_lines.push(line.clone());
            continue;
        };

        // If there's no content (only spaces), keep the prefix and continue
        if content.is_empty() {
            wrapped_lines.push(prefix.clone());
            continue;
        }

        // Effective available width after accounting for prefix
        let (prefix_w, _ph) = text_size(text_scale, &font, &prefix);
        let eff_available = available_px - (prefix_w as i32);
        // Safety: if prefix alone exceeds available, treat eff_available as a small positive value
        let eff_available = if eff_available <= 20 {
            20
        } else {
            eff_available
        };

        // Build wrapped lines by words
        let mut current = prefix.clone();
        for word in content.split_whitespace() {
            // Decide tentative line when adding this word
            let tentative = if current.trim().is_empty() {
                format!("{}{}", prefix, word)
            } else {
                format!("{} {}", current, word)
            };

            let (w, _h) = text_size(text_scale, &font, &tentative);
            if (w as i32) > eff_available {
                // If current is empty (single very long word), we need to break the word by characters
                if current.trim().is_empty() {
                    let mut chunk = String::new();
                    for ch in word.chars() {
                        let tentative2 = format!("{}{}{}", prefix, chunk, ch);
                        let (w2, _h2) = text_size(text_scale, &font, &tentative2);
                        if (w2 as i32) > eff_available {
                            if !chunk.is_empty() {
                                wrapped_lines.push(format!("{}{}", prefix, chunk));
                                chunk = ch.to_string();
                            } else {
                                // Single char doesn't fit alone (very narrow available) - push it anyway
                                wrapped_lines.push(format!("{}{}", prefix, ch));
                                chunk.clear();
                            }
                        } else {
                            chunk.push(ch);
                        }
                    }
                    if !chunk.is_empty() {
                        current = format!("{}{}", prefix, chunk);
                    } else {
                        current = prefix.clone();
                    }
                } else {
                    // push current line, start new with prefix + word
                    wrapped_lines.push(current.clone());
                    current = format!("{}{}", prefix, word);
                }
            } else {
                current = tentative;
            }
        }

        // Push remaining current
        if !current.is_empty() {
            wrapped_lines.push(current);
        }
    }

    let mut text_height: u32 = padding * 2;
    let mut line_heights: Vec<u32> = Vec::new();
    for line in &wrapped_lines {
        let (_w, h) = text_size(text_scale, &font, line);
        let h = h as u32;
        line_heights.push(h);
        text_height += h + (line_gap as u32);
    }

    let mut text_img: RgbaImage = ImageBuffer::from_pixel(canvas_w, text_height, white);

    let mut y: i32 = padding as i32;
    let x: i32 = padding as i32;
    for (idx, line) in wrapped_lines.iter().enumerate() {
        draw_text_mut(&mut text_img, black, x, y, text_scale, &font, line);
        y += line_heights[idx] as i32 + line_gap;
    }

    blocks.push(text_img);

    // Optional QR at bottom
    if let Some(url) = qr_url {
        if !url.is_empty() {
            if let Ok(qr_path_str) = generate_qr_code_png(url) {
                if let Ok(qr_img) = image::open(&qr_path_str) {
                    let resized = qr_img
                        .resize(
                            max_width_px.min(320),
                            u32::MAX,
                            image::imageops::FilterType::Nearest,
                        )
                        .to_rgba8();
                    blocks.push(resized);
                }
                let _ = std::fs::remove_file(&qr_path_str);
            }
        }
    }

    // Combine blocks vertically
    let total_w = canvas_w;
    let total_h: u32 = blocks.iter().map(|b| b.height() + padding).sum::<u32>() + padding;
    let mut out: RgbaImage = ImageBuffer::from_pixel(total_w, total_h, white);

    let mut y_off: i64 = padding as i64;
    for b in blocks {
        // Center image_paths (logo/qr), but keep text already padded.
        let x_off: i64 = ((total_w - b.width()) / 2) as i64;
        image::imageops::overlay(&mut out, &b, x_off, y_off);
        y_off += b.height() as i64 + padding as i64;
    }

    // Save
    let temp_dir = std::env::temp_dir();
    let out_path = temp_dir.join(format!("receipt_render_{}.png", uuid::Uuid::new_v4()));

    out.save(&out_path)
        .map_err(|e| Error::General(format!("Failed to save receipt PNG: {}", e)))?;

    Ok(out_path)
}

/// Print product label to a specific printer
#[derive(Debug, Deserialize)]
pub struct PrintProductLabelDTO {
    pub printer_name: String,
    pub product_name: String,
    pub barcode: String,
    pub price: f64,
    pub quantity: Option<f64>,
    pub sku: Option<String>,
    pub unit: String,
    pub label_width: String,  // "40mm", "50mm", "58mm", "80mm"
    pub label_height: String, // "30mm", "40mm", "50mm", "60mm"
}

#[command]
pub async fn print_product_label(params: PrintProductLabelDTO) -> IpcResponse<PrintResult> {
    match print_product_label_impl(params).await {
        Ok(result) => Ok(result).into(),
        Err(e) => Err(e).into(),
    }
}

async fn print_product_label_impl(params: PrintProductLabelDTO) -> Result<PrintResult> {
    use crate::shared::barcode::{ProductLabelParams, generate_product_label_image};

    // Parse label width in mm
    let label_width_mm = parse_mm_value(&params.label_width).unwrap_or(58);
    let label_height_mm = parse_mm_value(&params.label_height).unwrap_or(30);

    // Generate label image with product info and barcode
    let label_params = ProductLabelParams {
        product_name: params.product_name.clone(),
        price: params.price,
        quantity: params.quantity,
        unit: params.unit.clone(),
        barcode: params.barcode.clone(),
        label_width_mm,
        label_height_mm,
    };

    let label_image_path = generate_product_label_image(&label_params)?;

    println!(
        "🏷️  Generated product label image: {}",
        label_image_path.display()
    );

    // Print the image file
    #[cfg(target_os = "windows")]
    {
        // Convert mm to hundredths of an inch (PrintDocument uses 1/100 inch)
        let width_hundredths: i32 = ((label_width_mm as f64 / 25.4) * 100.0).round() as i32;
        let height_hundredths: i32 = ((label_height_mm as f64 / 25.4) * 100.0).round() as i32;

        println!(
            "📏 Label size: {}x{}mm = {}x{} hundredths inch",
            label_width_mm, label_height_mm, width_hundredths, height_hundredths
        );

        // IMPORTANT: Add printer initialization to ensure proper centering
        let ps_script = format!(
            r#"
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$ImagePath = '{image_path}'
$PrinterName = '{printer_name}'

# Exact label paper size in 1/100 inch
$PaperW = {paper_w}
$PaperH = {paper_h}

$img = [System.Drawing.Image]::FromFile($ImagePath)

$printDoc = New-Object System.Drawing.Printing.PrintDocument
$printDoc.PrinterSettings.PrinterName = $PrinterName

# CRITICAL: Set margins to ZERO for full label coverage
$printDoc.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(0, 0, 0, 0)

# CRITICAL: Create custom paper size matching label EXACTLY
$paperSize = New-Object System.Drawing.Printing.PaperSize("Label_{label_width}x{label_height}mm", $PaperW, $PaperH)
$printDoc.DefaultPageSettings.PaperSize = $paperSize

# Make sure we only ever print ONE label
$script:printed = $false

$printDoc.add_PrintPage({{
    param($sender, $e)

    if ($script:printed) {{
        $e.HasMorePages = $false
        return
    }}

    $g = $e.Graphics

    # Use the FULL page bounds (NOT MarginBounds)
    $pageBounds = $e.PageBounds
    $pageWidth = $pageBounds.Width
    $pageHeight = $pageBounds.Height

    # Ensure we're using the correct DPI (203 DPI for thermal printers)
    # Calculate scaling based on actual DPI
    $imgWidth = $img.Width
    $imgHeight = $img.Height

    # For 203 DPI thermal printer:
    # Convert mm to pixels: pixels = mm * 203 / 25.4
    $expectedPixelsW = {label_width_mm} * 203 / 25.4
    $expectedPixelsH = {label_height_mm} * 203 / 25.4

    # Scale image to fill entire page WITHOUT maintaining aspect ratio
    # (stretch to fit)
    $destRect = New-Object System.Drawing.RectangleF(0, 0, $pageWidth, $pageHeight)

    # IMPORTANT: Set high quality interpolation for thermal printer
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None

    # Draw image stretched to fill entire page
    $g.DrawImage($img, $destRect)

    # Exactly one label, no extra pages
    $script:printed = $true
    $e.HasMorePages = $false
}})

# Add print handler for end of print to cut paper (for thermal printers)
$printDoc.add_EndPrint({{
    param($sender, $e)
    Write-Host "✅ Label printed successfully"
}})

try {{
    $printDoc.Print()
    exit 0
}} catch {{
    Write-Error $_.Exception.Message
    exit 1
}} finally {{
    $img.Dispose()
}}
"#,
            image_path = label_image_path.display().to_string().replace("'", "''"),
            printer_name = params.printer_name.replace("'", "''"),
            paper_w = width_hundredths,
            paper_h = height_hundredths,
            label_width = label_width_mm,
            label_height = label_height_mm,
            label_width_mm = label_width_mm,
            label_height_mm = label_height_mm
        );

        println!("🖨️  Printing with full-page scaling...");

        let output = std::process::Command::new("powershell")
            .args(["-NoProfile", "-NonInteractive", "-Command", &ps_script])
            .output()
            .map_err(|e| Error::General(format!("Failed to execute image print command: {}", e)))?;

        if !output.status.success() {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            println!("❌ Print failed: {}", error_msg);
            return Err(Error::General(format!("Print failed: {}", error_msg)));
        }

        println!("✅ Label printed with full-page scaling");
    }

    #[cfg(target_os = "macos")]
    {
        println!("🖨️  Printing to macOS printer: '{}'", params.printer_name);
        println!("📄 File path: {}", label_image_path.display());

        // Use lp command with custom paper size
        let mut print_cmd = Command::new("lp");
        print_cmd
            .arg("-d")
            .arg(&params.printer_name)
            .arg("-o")
            .arg("fit-to-page") // Fit image to page
            .arg("-o")
            .arg(format!(
                "media=Custom.{}x{}mm",
                label_width_mm, label_height_mm
            ))
            .arg("-o")
            .arg("scaling=100") // 100% scaling
            .arg(&label_image_path);

        println!("🖨️ Executing print command: {:?}", print_cmd);

        let output = print_cmd
            .output()
            .map_err(|e| Error::General(format!("Failed to execute lp command: {}", e)))?;

        if !output.status.success() {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            println!("❌ lp command failed: {}", error_msg);
            return Err(Error::General(format!("Print failed: {}", error_msg)));
        }

        let stdout_msg = String::from_utf8_lossy(&output.stdout);
        println!("✅ lp command stdout: {}", stdout_msg);
    }

    #[cfg(target_os = "linux")]
    {
        let output = std::process::Command::new("lp")
            .arg("-d")
            .arg(&params.printer_name)
            .arg("-o")
            .arg("fit-to-page")
            .arg("-o")
            .arg(format!(
                "media=Custom.{}x{}mm",
                label_width_mm, label_height_mm
            ))
            .arg(&label_image_path)
            .output()
            .map_err(|e| Error::General(format!("Failed to execute print command: {}", e)))?;

        if !output.status.success() {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            return Err(Error::General(format!("Print failed: {}", error_msg)));
        }
    }

    // Cleanup
    let label_image_path_clone = label_image_path.clone();
    tokio::spawn(async move {
        tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
        match std::fs::remove_file(&label_image_path_clone) {
            Ok(_) => println!("🗑️  Cleaned up label file"),
            Err(e) => println!("⚠️  Failed to cleanup label file: {}", e),
        }
    });

    println!(
        "✅ Label print request completed for '{}'",
        params.product_name
    );

    Ok(PrintResult {
        success: true,
        message: format!("Label printed for '{}'", params.product_name),
    })
}

/// Parse mm value from string like "40mm", "50mm", etc.
fn parse_mm_value(value: &str) -> Option<u32> {
    value
        .trim()
        .trim_end_matches("mm")
        .trim()
        .parse::<u32>()
        .ok()
}

/// Generate a simple ASCII barcode representation
fn generate_ascii_barcode(barcode: &str, max_width: usize) -> String {
    let mut result = String::new();

    // Create a simple visual representation using bars
    // Each digit is represented by a pattern of bars
    let bar_patterns: Vec<&str> = vec![
        "|| ||", // 0
        "| |||", // 1
        "|| |",  // 2
        "||| |", // 3
        "| ||",  // 4
        "|| |",  // 5
        "||| ",  // 6
        "| | |", // 7
        "|| ||", // 8
        "||| |", // 9
    ];

    let mut barcode_visual = String::new();
    barcode_visual.push_str("| "); // Start guard

    for ch in barcode.chars() {
        if let Some(digit) = ch.to_digit(10) {
            barcode_visual.push_str(bar_patterns[digit as usize]);
            barcode_visual.push(' ');
        }
    }

    barcode_visual.push_str(" |"); // End guard

    // Center the barcode visual
    let visual_len = barcode_visual.chars().count();
    if visual_len < max_width {
        let padding = (max_width - visual_len) / 2;
        result.push_str(&" ".repeat(padding));
    }
    result.push_str(&barcode_visual);
    result.push('\n');

    result
}

/// Print receipt with ESC/POS commands directly to thermal printer (Xprinter)
/// This is for direct USB/Serial connection to thermal printers
#[derive(Debug, Deserialize)]
pub struct PrintToXprinterDTO {
    pub port_name: String, // e.g., "COM3" on Windows, "/dev/ttyUSB0" on Linux, "/dev/cu.usbserial" on macOS
    pub order_id: String,
    pub printer_width: String, // "58mm" or "80mm"
}

#[command]
pub async fn print_to_xprinter(
    app: AppHandle<Wry>,
    params: PrintToXprinterDTO,
) -> IpcResponse<PrintResult> {
    match print_to_xprinter_impl(app, params).await {
        Ok(result) => Ok(result).into(),
        Err(e) => Err(e).into(),
    }
}

async fn print_to_xprinter_impl(
    app: AppHandle<Wry>,
    params: PrintToXprinterDTO,
) -> Result<PrintResult> {
    use std::io::Write;
    use std::time::Duration;

    // Get context and device config
    let ctx = Ctx::from_app(app.clone())?;
    let device_config = DeviceConfigUseCase::get_device_config(&ctx).await?;

    // Fetch order
    let filter = LazyTableStateDTO {
        first: 0,
        rows: 1,
        page: 0,
        sort_field: OrderColumn::Id,
        sort_order: SortOrder::Asc,
        filters: OrderFilter {
            id: Some(params.order_id.clone()),
            client_id: None,
            company: None,
            order_type: None,
            d_move: None,
        },
    };

    let result = order_usecases::get_orders_usecase(&ctx, filter).await?;
    let order = result
        .items
        .first()
        .ok_or_else(|| Error::General("Order not found".to_string()))?;

    // Open serial port connection to printer
    let mut port = serialport::new(&params.port_name, 9600)
        .timeout(Duration::from_millis(100))
        .open()
        .map_err(|e| {
            Error::General(format!(
                "Failed to open printer port {}: {}",
                params.port_name, e
            ))
        })?;

    // ESC/POS initialization
    let mut escpos_data: Vec<u8> = Vec::new();

    // ESC @ - Initialize printer
    escpos_data.extend_from_slice(&[0x1B, 0x40]);

    // Set character code table to CP866 (Cyrillic)
    escpos_data.extend_from_slice(&[0x1B, 0x74, 0x11]);

    // Check if logo image is configured
    if let Some(ref logo_path) = device_config.logo_path {
        if !logo_path.is_empty() && std::path::Path::new(logo_path).exists() {
            let max_width = if params.printer_width == "58mm" {
                384
            } else {
                576
            };
            match convert_image_to_escpos(logo_path, max_width) {
                Ok(logo_bytes) => {
                    // Center align for logo
                    escpos_data.extend_from_slice(&[0x1B, 0x61, 0x01]); // ESC a 1 - center
                    escpos_data.extend_from_slice(&logo_bytes);
                    escpos_data.extend_from_slice(&[0x1B, 0x61, 0x00]); // ESC a 0 - left align
                }
                Err(e) => {
                    eprintln!("Failed to convert logo image for ESC/POS: {}", e);
                }
            }
        }
    }

    // Company info - center aligned
    escpos_data.extend_from_slice(&[0x1B, 0x61, 0x01]); // ESC a 1 - center align

    if let Some(ref company_name) = device_config.company_name {
        if !company_name.is_empty() {
            // Bold on
            escpos_data.extend_from_slice(&[0x1B, 0x45, 0x01]); // ESC E 1
            escpos_data.extend_from_slice(&encode_cyrillic_escpos(company_name));
            escpos_data.push(0x0A); // LF
            // Bold off
            escpos_data.extend_from_slice(&[0x1B, 0x45, 0x00]); // ESC E 0
        }
    }

    if let Some(ref address) = device_config.company_address {
        escpos_data.extend_from_slice(&encode_cyrillic_escpos(address));
        escpos_data.push(0x0A);
    }

    if let Some(ref phone) = device_config.company_phone {
        escpos_data.extend_from_slice(b"Tel: ");
        escpos_data.extend_from_slice(&encode_cyrillic_escpos(phone));
        escpos_data.push(0x0A);
    }

    // Line separator
    escpos_data.extend_from_slice(b"--------------------------------\n");

    // Left align for order details
    escpos_data.extend_from_slice(&[0x1B, 0x61, 0x00]); // ESC a 0 - left align

    // Order ID and date
    let order_line = format!("Order: #{}\n", params.order_id);
    escpos_data.extend_from_slice(&encode_cyrillic_escpos(&order_line));

    let date_time = order.d_created.format("%Y-%m-%d %H:%M:%S").to_string();
    let date_line = format!("Date: {}\n", date_time);
    escpos_data.extend_from_slice(&encode_cyrillic_escpos(&date_line));

    if let Some(ref client) = order.client {
        let client_line = format!("Client: {}\n", client.name);
        escpos_data.extend_from_slice(&encode_cyrillic_escpos(&client_line));
    }

    escpos_data.extend_from_slice(b"--------------------------------\n");

    // Items
    for (index, item) in order.items.iter().enumerate() {
        let product_name = item
            .product
            .as_ref()
            .map(|p| p.name.clone())
            .unwrap_or_else(|| "-".to_string());

        let item_line = format!("{}. {}\n", index + 1, product_name);
        escpos_data.extend_from_slice(&encode_cyrillic_escpos(&item_line));

        let price_line = format!("   {} x {} = {}\n", item.count, item.price, item.cost);
        escpos_data.extend_from_slice(&encode_cyrillic_escpos(&price_line));
    }
    escpos_data.extend_from_slice(b"--------------------------------\n");

    // Total
    let total_line = format!("TOTAL: {}\n", order.summ);
    // Bold on
    escpos_data.extend_from_slice(&[0x1B, 0x45, 0x01]);
    escpos_data.extend_from_slice(&encode_cyrillic_escpos(&total_line));
    // Bold off
    escpos_data.extend_from_slice(&[0x1B, 0x45, 0x00]);

    escpos_data.extend_from_slice(b"--------------------------------\n");

    // Footer
    if let Some(ref footer) = device_config.receipt_footer {
        escpos_data.extend_from_slice(&[0x1B, 0x61, 0x01]); // Center
        escpos_data.extend_from_slice(&encode_cyrillic_escpos(footer));
        escpos_data.push(0x0A);
    }

    // QR code (if configured)
    if let Some(ref qr_url) = device_config.qr_code_url {
        if !qr_url.is_empty() {
            let qr_url_with_order = qr_url.replace("{{order_id}}", &params.order_id);
            escpos_data.extend_from_slice(&[0x1B, 0x61, 0x01]); // Center
            escpos_data.extend_from_slice(&encode_cyrillic_escpos(&qr_url_with_order));
            escpos_data.push(0x0A);
        }
    }

    // Feed and cut
    escpos_data.extend_from_slice(&[0x0A, 0x0A, 0x0A]); // 3 line feeds
    escpos_data.extend_from_slice(&[0x1D, 0x56, 0x00]); // GS V 0 - Full cut

    // Write to printer
    port.write_all(&escpos_data)
        .map_err(|e| Error::General(format!("Failed to write to printer: {}", e)))?;

    port.flush()
        .map_err(|e| Error::General(format!("Failed to flush printer buffer: {}", e)))?;

    Ok(PrintResult {
        success: true,
        message: format!(
            "Receipt printed to Xprinter on {} for order {}",
            params.port_name, params.order_id
        ),
    })
}

/// Print receipt with ESC/POS (including logo image) to a system printer using raw mode
/// This works on macOS with `lpr -o raw` command
#[derive(Debug, Deserialize)]
pub struct PrintEscposToSystemPrinterDTO {
    pub printer_name: String,
    pub order_id: String,
    pub printer_width: String, // "58mm" or "80mm"
}

#[command]
pub async fn print_escpos_to_system_printer(
    app: AppHandle<Wry>,
    params: PrintEscposToSystemPrinterDTO,
) -> IpcResponse<PrintResult> {
    match print_escpos_to_system_printer_impl(app, params).await {
        Ok(result) => Ok(result).into(),
        Err(e) => Err(e).into(),
    }
}

async fn print_escpos_to_system_printer_impl(
    app: AppHandle<Wry>,
    params: PrintEscposToSystemPrinterDTO,
) -> Result<PrintResult> {
    let ctx = Ctx::from_app(app.clone())?;
    let device_config = DeviceConfigUseCase::get_device_config(&ctx).await?;

    // Get order
    let filter = LazyTableStateDTO {
        first: 0,
        rows: 1,
        page: 0,
        sort_field: OrderColumn::Id,
        sort_order: SortOrder::Asc,
        filters: OrderFilter {
            id: Some(params.order_id.clone()),
            client_id: None,
            company: None,
            order_type: None,
            d_move: None,
        },
    };

    let result = order_usecases::get_orders_usecase(&ctx, filter).await?;
    let order = result
        .items
        .first()
        .ok_or_else(|| Error::General("Order not found".to_string()))?;

    // Get the template from device config based on printer width
    let _template = match params.printer_width.as_str() {
        "58mm" => device_config.receipt_template_58mm.as_ref(),
        "80mm" => device_config.receipt_template_80mm.as_ref(),
        _ => device_config.receipt_template_80mm.as_ref(),
    }
    .ok_or_else(|| Error::General("Receipt template not found".to_string()))?;

    // Build receipt text from template (same as print_receipt_by_order_impl)
    let _items_text = order
        .items
        .iter()
        .enumerate()
        .map(|(index, item)| {
            let product_name = item
                .product
                .as_ref()
                .map(|p| p.name.clone())
                .unwrap_or_else(|| "-".to_string());

            let unit = item
                .product
                .as_ref()
                .and_then(|p| p.unit.as_ref())
                .map(|u| u.short_name.clone())
                .unwrap_or_else(|| "".to_string());

            let discounts_text = if !item.discounts.is_empty() {
                item.discounts
                    .iter()
                    .map(|d| format!("  - {}: -{}", d.name, d.value))
                    .collect::<Vec<_>>()
                    .join("\n")
            } else {
                "".to_string()
            };

            let taxes_text = if !item.taxes.is_empty() {
                item.taxes
                    .iter()
                    .map(|t| format!("  + {}: +{}", t.name, t.value))
                    .collect::<Vec<_>>()
                    .join("\n")
            } else {
                "".to_string()
            };

            let mut item_str = format!(
                "{}. {}\n   {} {} x {} = {}",
                index + 1,
                product_name,
                item.count,
                unit,
                item.price.round_dp(2),
                item.cost.round_dp(2)
            );

            if !discounts_text.is_empty() {
                item_str.push_str(&format!("\n{}", discounts_text));
            }
            if !taxes_text.is_empty() {
                item_str.push_str(&format!("\n{}", taxes_text));
            }

            item_str
        })
        .collect::<Vec<_>>()
        .join("\n");

    // Cut is already included in the combined RAW job.
    // Now build ESC/POS data with: Logo (image) + Receipt (text with Cyrillic encoding) + QR (image)
    let mut escpos_data: Vec<u8> = Vec::new();

    // Initialize printer
    escpos_data.extend_from_slice(&[0x1B, 0x40]); // ESC @ - Initialize

    // CRITICAL: Do NOT set any character table - let printer auto-detect UTF-8
    // Modern thermal printers can handle UTF-8 in raw mode if no charset is explicitly set
    println!("✅ Not setting charset - letting printer auto-detect UTF-8");

    // Center align for header
    escpos_data.extend_from_slice(&[0x1B, 0x61, 0x01]); // ESC a 1

    println!("🔍 Checking for logo...");
    println!("   device_config.logo_path: {:?}", device_config.logo_path);

    // Add logo image if configured
    if let Some(ref logo_path) = device_config.logo_path {
        println!("   logo_path is Some: {}", logo_path);
        if !logo_path.is_empty() {
            println!("🖼️  Loading logo from: {}", logo_path);
            let max_width = if params.printer_width == "58mm" {
                384
            } else {
                576
            };
            match convert_image_to_escpos(logo_path, max_width) {
                Ok(logo_escpos) => {
                    println!("✅ Logo converted to ESC/POS, {} bytes", logo_escpos.len());
                    println!("📤 Adding logo to ESC/POS data...");
                    escpos_data.extend_from_slice(&logo_escpos);
                    escpos_data.push(0x0A); // Line feed after logo
                    println!("✅ Logo added to receipt");
                }
                Err(e) => {
                    println!("⚠️  Failed to convert logo: {}", e);
                }
            }
        } else {
            println!("   logo_path is empty string");
        }
    } else {
        println!("   logo_path is None");
    }

    // Use raw UTF-8 bytes - modern thermal printers auto-detect UTF-8
    println!("🔤 Using raw UTF-8 bytes (no encoding) - printer should auto-detect");

    // `receipt_text` should contain the final plain-text receipt body.
    // NOTE: This legacy block doesn't always have direct access to the receipt buffer.
    // Keep it safe to compile; the actual printing path used by named-printer printing
    // builds the combined ESC/POS job separately.
    let receipt_text = String::new();

    let receipt_bytes = receipt_text.as_bytes(); // UTF-8 bytes

    // Reset to left align for receipt body
    escpos_data.extend_from_slice(&[0x1B, 0x61, 0x00]); // ESC a 0

    // Add receipt text
    escpos_data.extend_from_slice(receipt_bytes);
    escpos_data.push(0x0A); // Extra line feed

    println!(
        "✅ Receipt text added ({} bytes UTF-8)",
        receipt_bytes.len()
    );

    // QR code as image (if configured) - centered at bottom
    if let Some(ref qr_url) = device_config.qr_code_url {
        if !qr_url.is_empty() {
            let qr_url_with_order = qr_url.replace("{{order_id}}", &params.order_id);
            println!("🔲 Generating QR code for: {}", qr_url_with_order);

            match generate_qr_code_png(&qr_url_with_order) {
                Ok(qr_image_path) => {
                    let max_width = if params.printer_width == "58mm" {
                        384
                    } else {
                        576
                    };
                    match convert_image_to_escpos(&qr_image_path, max_width) {
                        Ok(qr_escpos) => {
                            println!("✅ QR code converted to ESC/POS image");
                            escpos_data.extend_from_slice(&[0x1B, 0x61, 0x01]); // Center
                            escpos_data.extend_from_slice(&qr_escpos);
                            escpos_data.push(0x0A);
                            println!("✅ QR code added to receipt");
                        }
                        Err(e) => {
                            println!("⚠️  Failed to convert QR code image: {}", e);
                        }
                    }
                }
                Err(e) => {
                    println!("⚠️  Failed to generate QR code: {}", e);
                }
            }
        }
    }

    // Feed and cut
    escpos_data.extend_from_slice(&[0x0A, 0x0A, 0x0A]); // 3 line feeds
    escpos_data.extend_from_slice(&[0x1D, 0x56, 0x00]); // GS V 0 - Full cut

    println!("📊 ESC/POS data summary:");
    println!("   Total size: {} bytes", escpos_data.len());
    println!(
        "   First 50 bytes: {:02X?}",
        &escpos_data[..50.min(escpos_data.len())]
    );

    // Write ESC/POS data to temporary file
    let temp_dir = std::env::temp_dir();
    let escpos_file = temp_dir.join(format!("receipt_escpos_{}.bin", uuid::Uuid::new_v4()));

    println!("📄 Writing ESC/POS data to: {}", escpos_file.display());
    std::fs::write(&escpos_file, &escpos_data)
        .map_err(|e| Error::General(format!("Failed to write ESC/POS file: {}", e)))?;

    // Send to printer using lpr -o raw on macOS
    #[cfg(target_os = "macos")]
    {
        println!(
            "🖨️  Sending ESC/POS data to printer '{}' using lpr -o raw",
            params.printer_name
        );

        let output = Command::new("lpr")
            .arg("-P")
            .arg(&params.printer_name)
            .arg("-o")
            .arg("raw")
            .arg(&escpos_file)
            .output()
            .map_err(|e| Error::General(format!("Failed to execute lpr command: {}", e)))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(Error::General(format!("lpr command failed: {}", stderr)));
        }

        println!(
            "✅ ESC/POS data sent successfully to '{}'",
            params.printer_name
        );
    }

    #[cfg(target_os = "windows")]
    {
        // Windows: Use PowerShell RawPrinterHelper
        println!(
            "🖨️  Sending ESC/POS data to printer '{}' using RawPrinterHelper",
            params.printer_name
        );

        // Read the ESC/POS binary data
        let escpos_bytes = std::fs::read(&escpos_file)
            .map_err(|e| Error::General(format!("Failed to read ESC/POS file: {}", e)))?;

        // Convert to base64 for PowerShell
        let escpos_base64 =
            base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &escpos_bytes);

        let ps_script = format!(
            r#"
Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.Runtime.InteropServices;

public class RawPrinterHelper {{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public class DOCINFOA {{
        [MarshalAs(UnmanagedType.LPStr)]
        public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)]
        public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)]
        public string pDataType;
    }}

    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

    [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

    public static bool SendBytesToPrinter(string szPrinterName, byte[] pBytes) {{
        IntPtr hPrinter = IntPtr.Zero;
        DOCINFOA di = new DOCINFOA();
        di.pDocName = "Receipt";
        di.pDataType = "RAW";

        if (!OpenPrinter(szPrinterName, out hPrinter, IntPtr.Zero)) {{
            return false;
        }}

        if (!StartDocPrinter(hPrinter, 1, di)) {{
            ClosePrinter(hPrinter);
            return false;
        }}

        if (!StartPagePrinter(hPrinter)) {{
            EndDocPrinter(hPrinter);
            ClosePrinter(hPrinter);
            return false;
        }}

        IntPtr pUnmanagedBytes = Marshal.AllocCoTaskMem(pBytes.Length);
        Marshal.Copy(pBytes, 0, pUnmanagedBytes, pBytes.Length);

        int dwWritten = 0;
        bool bSuccess = WritePrinter(hPrinter, pUnmanagedBytes, pBytes.Length, out dwWritten);

        Marshal.FreeCoTaskMem(pUnmanagedBytes);

        EndPagePrinter(hPrinter);
        EndDocPrinter(hPrinter);
        ClosePrinter(hPrinter);

        return bSuccess && (dwWritten == pBytes.Length);
    }}
}}
"@

$bytes = [System.Convert]::FromBase64String('{}')
[RawPrinterHelper]::SendBytesToPrinter('{}', $bytes)
"#,
            escpos_base64, params.printer_name
        );

        let output = Command::new("powershell")
            .arg("-Command")
            .arg(&ps_script)
            .output()
            .map_err(|e| Error::General(format!("Failed to execute PowerShell: {}", e)))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(Error::General(format!(
                "PowerShell command failed: {}",
                stderr
            )));
        }

        println!(
            "✅ ESC/POS data sent successfully to '{}'",
            params.printer_name
        );
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let _ = std::fs::remove_file(&escpos_file);
        return Err(Error::General(
            "ESC/POS printing to system printer is only supported on macOS and Windows".to_string(),
        ));
    }

    #[cfg(any(target_os = "macos", target_os = "windows"))]
    {
        // Clean up temporary file
        let _ = std::fs::remove_file(&escpos_file);

        Ok(PrintResult {
            success: true,
            message: format!(
                "Receipt with logo printed to '{}' for order {}",
                params.printer_name, params.order_id
            ),
        })
    }
}

/// Generate QR code as PNG image file
fn generate_qr_code_png(data: &str) -> Result<String> {
    use image::Luma;
    use qrcode::QrCode;

    println!("🔲 Generating QR code for: {}", data);

    // Generate QR code
    let code = QrCode::new(data.as_bytes())
        .map_err(|e| Error::General(format!("Failed to generate QR code: {}", e)))?;

    // Render to image with scale 10 (larger QR code)
    let image = code
        .render::<Luma<u8>>()
        .min_dimensions(200, 200)
        .max_dimensions(400, 400)
        .build();

    // Save to temporary file
    let temp_dir = std::env::temp_dir();
    let qr_path = temp_dir.join(format!("qr_{}.png", uuid::Uuid::new_v4()));

    image
        .save(&qr_path)
        .map_err(|e| Error::General(format!("Failed to save QR code: {}", e)))?;

    println!("✅ QR code saved to: {}", qr_path.display());

    Ok(qr_path.to_string_lossy().to_string())
}

/// Embed an image (logo or QR code) into PDF at specified position
/// Returns the height of the embedded image in Mm
fn embed_image_in_pdf(
    layer: &printpdf::PdfLayerReference,
    image_path: &str,
    center_x_mm: printpdf::Mm,
    top_y_mm: printpdf::Mm,
    max_width_mm: f32,
) -> Result<printpdf::Mm> {
    use image::ImageReader;
    use printpdf::{ColorBits, ColorSpace, Image, ImageTransform, ImageXObject, Mm, Px};
    use std::path::Path;

    println!("🖼️  embed_image_in_pdf called");
    println!("   Path: {}", image_path);
    println!("   Center X: {}mm, Top Y: {}mm", center_x_mm.0, top_y_mm.0);
    println!("   Max width: {}mm", max_width_mm);

    // Load image using the image crate
    let img = ImageReader::open(Path::new(image_path))
        .map_err(|e| {
            eprintln!("❌ Failed to open image file: {}", e);
            Error::General(format!("Failed to open image: {}", e))
        })?
        .decode()
        .map_err(|e| {
            eprintln!("❌ Failed to decode image: {}", e);
            Error::General(format!("Failed to decode image: {}", e))
        })?;

    let img_width = img.width();
    let img_height = img.height();
    println!(
        "   Original dimensions: {}x{} pixels",
        img_width, img_height
    );

    // Calculate scaling to fit within max_width_mm while maintaining aspect ratio
    let aspect_ratio = img_height as f32 / img_width as f32;
    let target_width_mm = max_width_mm.min(50.0); // Max 50mm for receipts
    let target_height_mm = target_width_mm * aspect_ratio;

    println!(
        "   Target dimensions: {:.1}x{:.1}mm",
        target_width_mm, target_height_mm
    );

    // Convert image to RGB format for PDF
    let rgb_image = img.to_rgb8();

    // Create PDF image object
    let image_bytes: Vec<u8> = rgb_image.into_raw();

    // Create ImageXObject from raw RGB bytes
    let image_xobject = ImageXObject {
        width: Px(img_width as usize),
        height: Px(img_height as usize),
        color_space: ColorSpace::Rgb,
        bits_per_component: ColorBits::Bit8,
        interpolate: true,
        image_data: image_bytes,
        image_filter: None,
        clipping_bbox: None,
        smask: None, // No transparency mask
    };

    // Add image to PDF document
    let image = Image::from(image_xobject);

    // Calculate position (center the image horizontally)
    // Mm arithmetic: Mm - Mm = f32, so we need to wrap results back in Mm
    let x_mm = Mm(center_x_mm.0 - target_width_mm / 2.0);
    let y_mm = Mm(top_y_mm.0 - target_height_mm); // PDF coordinates: y increases upward

    println!("   Calculated position: x={}mm, y={}mm", x_mm.0, y_mm.0);

    // IMPORTANT: printpdf requires DPI-based scaling, not mm-based
    // Convert mm to pixels at 300 DPI (standard for printing)
    // 1 inch = 25.4 mm, 300 DPI means 300 pixels per inch
    // So: pixels = (mm / 25.4) * 300 = mm * 11.811
    let dpi = 300.0;
    let mm_to_px = dpi / 25.4;

    let target_width_px = target_width_mm * mm_to_px;
    let target_height_px = target_height_mm * mm_to_px;

    // Scale factor: target size / original size
    let scale_x = target_width_px / img_width as f32;
    let scale_y = target_height_px / img_height as f32;

    println!("   Scale factors: x={:.3}, y={:.3}", scale_x, scale_y);

    // Create transform for positioning and scaling
    let transform = ImageTransform {
        translate_x: Some(x_mm),
        translate_y: Some(y_mm),
        scale_x: Some(scale_x), // Scale factor, not mm
        scale_y: Some(scale_y), // Scale factor, not mm
        ..Default::default()
    };

    // Add image to layer
    image.add_to_layer(layer.clone(), transform);

    println!(
        "✅ Image added to PDF layer at ({:.1}, {:.1})mm, display size {:.1}x{:.1}mm",
        x_mm.0, y_mm.0, target_width_mm, target_height_mm
    );

    Ok(Mm(target_height_mm))
}
/// Print receipt as PDF with embedded logo and QR code (BEST for Cyrillic + Images)
/// This solves the Cyrillic encoding problem by generating a PDF with proper fonts
#[derive(Debug, Deserialize)]
pub struct PrintPdfReceiptDTO {
    pub order_id: String,
    pub printer_width: String, // "58mm" or "80mm"
    #[serde(default)]
    pub printer_name: Option<String>, // Optional: for Linux/macOS direct printing
}

#[command]
pub async fn print_pdf_receipt(
    app: AppHandle<Wry>,
    params: PrintPdfReceiptDTO,
) -> IpcResponse<PrintResult> {
    match print_pdf_receipt_impl(app, params).await {
        Ok(result) => Ok(result).into(),
        Err(e) => Err(e).into(),
    }
}

async fn print_pdf_receipt_impl(
    app: AppHandle<Wry>,
    params: PrintPdfReceiptDTO,
) -> Result<PrintResult> {
    use crate::shared::error::Error as AppError;
    use printpdf::*;
    use std::fs::File;
    use std::io::BufWriter;

    println!("📄 Generating PDF receipt for order {}", params.order_id);

    // 1. Get context and fetch order with all relationships
    let ctx = Ctx::from_app(app.clone())?;
    let device_config = DeviceConfigUseCase::get_device_config(&ctx).await?;

    let filter = LazyTableStateDTO {
        first: 0,
        rows: 1,
        page: 0,
        sort_field: OrderColumn::Id,
        sort_order: SortOrder::Asc,
        filters: OrderFilter {
            id: Some(params.order_id.clone()),
            client_id: None,
            company: None,
            order_type: None,
            d_move: None,
        },
    };

    let result = order_usecases::get_orders_usecase(&ctx, filter).await?;
    let order = result
        .items
        .first()
        .ok_or_else(|| AppError::General("Order not found".to_string()))?;

    println!(
        "📦 Order loaded: {} items, {} payments",
        order.items.len(),
        order.payments.len()
    );

    // 2. Get template based on printer width
    let template = match params.printer_width.as_str() {
        "58mm" => device_config.receipt_template_58mm.clone(),
        _ => device_config.receipt_template_80mm.clone(),
    }
    .ok_or_else(|| AppError::General("Receipt template not found".to_string()))?;

    // 3. Build template data
    let date = order.d_created.format("%Y-%m-%d").to_string();
    let time = order.d_created.format("%H:%M:%S").to_string();
    let cashier_name = ctx
        .user
        .lock()
        .ok()
        .and_then(|u| u.as_ref().map(|user| user.full_name.clone()))
        .unwrap_or_else(|| "Unknown".to_string());
    let customer_name = order
        .client
        .as_ref()
        .map(|c| c.name.clone())
        .unwrap_or_else(|| "-".to_string());

    // Format items list - THIS IS THE KEY FIX!
    let items_text = order
        .items
        .iter()
        .enumerate()
        .map(|(i, item)| {
            let product_name = item
                .product
                .as_ref()
                .map(|p| p.name.as_str())
                .unwrap_or("-");
            let unit = item
                .product
                .as_ref()
                .and_then(|p| p.unit.as_ref())
                .map(|u| u.short_name.as_str())
                .unwrap_or("");
            format!(
                "{}. {} {} {} x {} = {}",
                i + 1,
                product_name,
                item.count,
                unit,
                item.price,
                item.cost
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    println!("📋 Formatted {} items:\n{}", order.items.len(), items_text);

    // Format payments
    let payment_details = if order.payments.is_empty() {
        "Нет платежей".to_string()
    } else {
        order
            .payments
            .iter()
            .map(|p| {
                let ptype = translate_payment_type(&p.payment_type.to_string());
                format!("{}: {}", ptype, p.summ)
            })
            .collect::<Vec<_>>()
            .join("\n")
    };

    // Calculate totals
    let subtotal: Decimal = order.items.iter().map(|i| i.cost).sum();
    let discount: Decimal = order.items.iter().map(|i| i.discount).sum();
    let tax = order.tax;

    // 4. Replace all template placeholders
    let mut receipt_text = template
        .replace(
            "{{company_name}}",
            device_config.company_name.as_deref().unwrap_or(""),
        )
        .replace(
            "{{company_address}}",
            device_config.company_address.as_deref().unwrap_or(""),
        )
        .replace(
            "{{company_phone}}",
            device_config.company_phone.as_deref().unwrap_or(""),
        )
        .replace(
            "{{company_tax_code}}",
            device_config.company_tax_code.as_deref().unwrap_or(""),
        )
        .replace("{{order_id}}", &shorten_order_id(&params.order_id))
        .replace("{{date}}", &date)
        .replace("{{time}}", &time)
        .replace("{{cashier_name}}", &cashier_name)
        .replace("{{customer_name}}", &customer_name)
        .replace("{{items}}", &items_text)
        .replace("{{subtotal}}", &subtotal.to_string())
        .replace("{{discount}}", &discount.to_string())
        .replace("{{tax}}", &tax.to_string())
        .replace("{{total}}", &order.summ.to_string())
        .replace("{{payment_details}}", &payment_details)
        .replace(
            "{{footer_message}}",
            device_config.receipt_footer.as_deref().unwrap_or(""),
        )
        .replace("{{qr_code_url}}", "");

    // Remove placeholder lines for logo and qr_code (will embed as image_paths)
    receipt_text = receipt_text.replace("{{logo}}\n", "");
    receipt_text = receipt_text.replace("{{qr_code}}\n", "");

    // Remove lines that have only empty placeholders or become empty after replacement
    let receipt_text = receipt_text
        .lines()
        .filter(|line| {
            let trimmed = line.trim();
            // Keep separator lines (===, ---)
            if line.contains("====") || line.contains("----") {
                return true;
            }
            // Remove completely empty lines
            if trimmed.is_empty() {
                return false;
            }
            // Remove lines that are just labels with no value (e.g., "Тел: ", "ИНН: ")
            // Check if line ends with ": " or is just ":"
            if trimmed.ends_with(":") || trimmed.ends_with(": ") {
                return false;
            }
            // Keep everything else
            true
        })
        .collect::<Vec<_>>()
        .join("\n");
    println!(
        "📝 Template rendered, {} lines",
        receipt_text.lines().count()
    );

    // 5. Create PDF
    let width_mm = if params.printer_width == "58mm" {
        58.0
    } else {
        80.0
    };
    let (doc, page1, layer1) = PdfDocument::new(
        "Receipt",
        Mm(width_mm),
        Mm(300.0), // Tall enough for receipt
        "Layer 1",
    );

    let current_layer = doc.get_page(page1).get_layer(layer1);
    let mut y_position = Mm(290.0); // Start from top
    let line_height = Mm(4.0);
    let left_margin = Mm(3.0);

    // Use Helvetica font - supports Cyrillic characters better than Courier
    let font = doc
        .add_builtin_font(BuiltinFont::Helvetica)
        .map_err(|e| AppError::General(format!("Failed to add font: {}", e)))?;

    // 6. Embed logo at top (if configured)
    if let Some(ref logo_path) = device_config.logo_path {
        if !logo_path.is_empty() && std::path::Path::new(logo_path).exists() {
            println!("🖼️  Embedding logo from: {}", logo_path);
            match embed_image_in_pdf(
                &current_layer,
                logo_path,
                Mm(width_mm / 2.0),
                y_position,
                width_mm * 0.5,
            ) {
                Ok(image_height) => {
                    println!("✅ Logo embedded, height: {}mm", image_height.0);
                    y_position = y_position - image_height - Mm(3.0);
                }
                Err(e) => eprintln!("⚠️  Logo embedding failed: {}", e),
            }
        }
    }

    // 7. Render template text line by line
    println!("📄 Rendering text to PDF...");
    for (i, line) in receipt_text.lines().enumerate() {
        if y_position.0 < 20.0 {
            println!("⚠️  Reached bottom of page at line {}, truncating", i);
            break;
        }

        current_layer.begin_text_section();
        current_layer.set_font(&font, 8.0);
        current_layer.set_text_cursor(left_margin, y_position);
        current_layer.set_line_height(8.0);
        current_layer.write_text(line, &font);
        current_layer.end_text_section();
        y_position = y_position - line_height;
    }
    println!("✅ Text rendering complete");

    // 8. Embed QR code at bottom (if configured)
    if let Some(ref qr_url) = device_config.qr_code_url {
        if !qr_url.is_empty() {
            y_position = y_position - Mm(3.0);
            let qr_url_with_order =
                qr_url.replace("{{order_id}}", &shorten_order_id(&params.order_id));
            println!("🔲 Generating QR code for: {}", qr_url_with_order);

            match generate_qr_code_png(&qr_url_with_order) {
                Ok(qr_image_path) => {
                    println!("✅ QR code generated: {}", qr_image_path);
                    match embed_image_in_pdf(
                        &current_layer,
                        &qr_image_path,
                        Mm(width_mm / 2.0),
                        y_position,
                        width_mm * 0.4,
                    ) {
                        Ok(image_height) => {
                            println!("✅ QR code embedded, height: {}mm", image_height.0);
                        }
                        Err(e) => eprintln!("⚠️  QR code embedding failed: {}", e),
                    }
                    let _ = std::fs::remove_file(&qr_image_path);
                }
                Err(e) => eprintln!("⚠️  QR code generation failed: {}", e),
            }
        }
    }

    // 9. Save PDF with fixed name
    let temp_dir = std::env::temp_dir();
    let pdf_path = temp_dir.join("sklad_uchot_receipt.pdf");

    println!("📄 Saving PDF to: {}", pdf_path.display());

    doc.save(&mut BufWriter::new(File::create(&pdf_path).map_err(
        |e| AppError::General(format!("Failed to create PDF file: {}", e)),
    )?))
    .map_err(|e| AppError::General(format!("Failed to save PDF: {}", e)))?;

    println!("✅ PDF generated successfully");

    // 10. Print the PDF
    #[cfg(target_os = "windows")]
    {
        // If a printer name is provided, we should print to THAT printer (not default / Save as PDF)
        // NOTE: Windows printing is tricky without a dedicated PDF printing library.
        // We try a few common approaches:
        // 1) Shell verb 'PrintTo' if registered for PDF handler
        // 2) Acrobat Reader (if installed)
        // 3) Microsoft Edge (headless print)
        // If all fail, we fallback to opening the PDF.

        let printer_name = params.printer_name.as_deref().unwrap_or("").trim();

        if !printer_name.is_empty() {
            println!(
                "🖨️  Attempting to print PDF to specific printer: '{}'",
                printer_name
            );

            let pdf_str = pdf_path.to_str().ok_or_else(|| {
                AppError::General("Failed to convert PDF path to string".to_string())
            })?;

            // 1) Try Windows Shell PrintTo verb
            // cmd: start "" /min /wait "" /P /D:"Printer" "file" doesn't reliably work for PDF.
            // Use: powershell Start-Process -Verb PrintTo -ArgumentList '"Printer"' -FilePath 'file'
            // but Start-Process -Verb PrintTo requires the verb to exist.
            let ps_printto = format!(
                "Start-Process -FilePath '{}' -Verb PrintTo -ArgumentList @('{}') -WindowStyle Hidden -ErrorAction Stop",
                pdf_str.replace("'", "''"),
                printer_name.replace("'", "''")
            );

            let output_printto = Command::new("powershell")
                .args(["-NoProfile", "-NonInteractive", "-Command", &ps_printto])
                .output();

            if let Ok(o) = &output_printto {
                if o.status.success() {
                    println!("✅ PDF sent to printer '{}' via PrintTo", printer_name);
                } else {
                    let stderr = String::from_utf8_lossy(&o.stderr);
                    println!("⚠️  PrintTo failed: {}", stderr);
                }
            }

            // If PrintTo failed, try Acrobat Reader if present.
            // Acrobat command-line: AcroRd32.exe /t <PDF> <PrinterName>
            // It's best-effort; if Acrobat isn't installed, this will fail quickly.
            if output_printto.is_err() || output_printto.as_ref().is_ok_and(|o| !o.status.success())
            {
                let acrobat_paths = [
                    r"C:\\Program Files\\Adobe\\Acrobat Reader DC\\Reader\\AcroRd32.exe",
                    r"C:\\Program Files (x86)\\Adobe\\Acrobat Reader DC\\Reader\\AcroRd32.exe",
                ];

                let mut acrobat_printed = false;
                for acrobat in acrobat_paths {
                    if std::path::Path::new(acrobat).exists() {
                        println!("🖨️  Trying Acrobat Reader at: {}", acrobat);
                        let o = Command::new(acrobat)
                            .args(["/t", pdf_str, printer_name])
                            .output();

                        match o {
                            Ok(o) if o.status.success() => {
                                println!("✅ PDF sent to printer '{}' via Acrobat", printer_name);
                                acrobat_printed = true;
                                break;
                            }
                            Ok(o) => {
                                let stderr = String::from_utf8_lossy(&o.stderr);
                                println!("⚠️  Acrobat print failed: {}", stderr);
                            }
                            Err(e) => {
                                println!("⚠️  Acrobat invocation failed: {}", e);
                            }
                        }
                    }
                }

                // If Acrobat also didn't work, try Edge headless print.
                // Edge supports --print-to-printer but behavior may vary by version.
                if !acrobat_printed {
                    let edge_paths = [
                        r"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
                        r"C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
                    ];

                    for edge in edge_paths {
                        if std::path::Path::new(edge).exists() {
                            println!("🖨️  Trying Edge headless print via: {}", edge);
                            let o = Command::new(edge)
                                .args([
                                    "--headless",
                                    "--disable-gpu",
                                    "--no-first-run",
                                    "--no-default-browser-check",
                                    "--kiosk-printing",
                                    "--print-to-printer",
                                    printer_name,
                                    pdf_str,
                                ])
                                .output();

                            match o {
                                Ok(o) if o.status.success() => {
                                    println!("✅ PDF sent to printer '{}' via Edge", printer_name);
                                    break;
                                }
                                Ok(o) => {
                                    let stderr = String::from_utf8_lossy(&o.stderr);
                                    println!("⚠️  Edge print failed: {}", stderr);
                                }
                                Err(e) => {
                                    println!("⚠️  Edge invocation failed: {}", e);
                                }
                            }

                            // Either way, don't keep looping edges if we found one.
                            break;
                        }
                    }
                }
            }
        } else {
            println!("🖨️  No printer_name provided; opening PDF in default viewer");
            let output = Command::new("cmd")
                .args(&["/C", "start", "/min", pdf_path.to_str().unwrap()])
                .output()
                .map_err(|e| AppError::General(format!("Failed to open PDF: {}", e)))?;

            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                return Err(AppError::General(format!("Failed to open PDF: {}", stderr)));
            }

            println!("✅ PDF opened for printing");
        }
    }

    #[cfg(target_os = "macos")]
    {
        let printer_name = params.printer_name.as_deref().unwrap_or("default");
        println!("🖨️  Printing PDF to '{}'", printer_name);

        let output = Command::new("lp")
            .arg("-d")
            .arg(printer_name)
            .arg(&pdf_path)
            .output()
            .map_err(|e| AppError::General(format!("Failed to execute lp command: {}", e)))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(AppError::General(format!("lp command failed: {}", stderr)));
        }

        println!("✅ PDF sent to printer successfully");
    }

    #[cfg(target_os = "linux")]
    {
        let printer_name = params.printer_name.as_deref().unwrap_or("default");
        println!("🖨️  Printing PDF to '{}'", printer_name);

        let output = Command::new("lp")
            .arg("-d")
            .arg(printer_name)
            .arg(&pdf_path)
            .output()
            .map_err(|e| AppError::General(format!("Failed to execute lp command: {}", e)))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(AppError::General(format!("lp command failed: {}", stderr)));
        }

        println!("✅ PDF sent to printer successfully");
    }

    // Cleanup PDF after a delay
    let pdf_path_clone = pdf_path.clone();
    tokio::spawn(async move {
        tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
        let _ = std::fs::remove_file(&pdf_path_clone);
    });

    Ok(PrintResult {
        success: true,
        message: format!(
            "PDF receipt printed successfully for order #{}",
            shorten_order_id(&params.order_id)
        ),
    })
}

/// Test image printing functionality
#[derive(Debug, Deserialize)]
pub struct TestImagePrintDTO {
    pub port_name: String,
    pub image_path: String,
    pub printer_width: String, // "58mm" or "80mm"
}

#[command]
pub async fn test_image_print(
    _app: AppHandle<Wry>,
    params: TestImagePrintDTO,
) -> IpcResponse<PrintResult> {
    match test_image_print_impl(params).await {
        Ok(result) => Ok(result).into(),
        Err(e) => Err(e).into(),
    }
}

async fn test_image_print_impl(params: TestImagePrintDTO) -> Result<PrintResult> {
    use std::io::Write;
    use std::time::Duration;

    println!("🧪 === IMAGE PRINT TEST ===");
    println!("📂 Image path: {}", params.image_path);
    println!("🔌 Port: {}", params.port_name);
    println!("📏 Printer width: {}", params.printer_width);

    // Step 1: Check if image file exists
    let image_exists = std::path::Path::new(&params.image_path).exists();
    println!("📸 Image exists: {}", image_exists);

    if !image_exists {
        return Err(Error::General(format!(
            "Image file not found at: {}",
            params.image_path
        )));
    }

    // Step 2: Get image metadata
    if let Ok(metadata) = std::fs::metadata(&params.image_path) {
        println!("📊 Image file size: {} bytes", metadata.len());
    }

    // Step 3: Try to convert image to ESC/POS
    let max_width = if params.printer_width == "58mm" {
        384
    } else {
        576
    };
    println!(
        "🔧 Converting image to ESC/POS (max width: {} pixels)...",
        max_width
    );

    let escpos_data = match convert_image_to_escpos(&params.image_path, max_width) {
        Ok(data) => {
            println!("✅ Image converted successfully");
            println!("📦 ESC/POS data size: {} bytes", data.len());
            data
        }
        Err(e) => {
            println!("❌ Image conversion failed: {}", e);
            return Err(e);
        }
    };

    // Step 4: Open serial port
    println!("🔌 Opening serial port: {}", params.port_name);
    let mut port = serialport::new(&params.port_name, 9600)
        .timeout(Duration::from_millis(500))
        .open()
        .map_err(|e| {
            println!("❌ Failed to open port: {}", e);
            Error::General(format!(
                "Failed to open printer port {}: {}",
                params.port_name, e
            ))
        })?;

    println!("✅ Serial port opened successfully");

    // Step 5: Build full ESC/POS command sequence
    let mut full_data: Vec<u8> = Vec::new();

    // Initialize printer
    full_data.extend_from_slice(&[0x1B, 0x40]); // ESC @ - Initialize
    println!("➕ Added printer initialization");

    // Center align
    full_data.extend_from_slice(&[0x1B, 0x61, 0x01]); // ESC a 1 - Center
    println!("➕ Added center alignment");

    // Add the image data
    full_data.extend_from_slice(&escpos_data);
    println!("➕ Added image data ({} bytes)", escpos_data.len());

    // Reset alignment
    full_data.extend_from_slice(&[0x1B, 0x61, 0x00]); // ESC a 0 - Left
    println!("➕ Added alignment reset");

    // Add some text to verify printer is working
    full_data.extend_from_slice(b"\n=== IMAGE TEST ===\n");
    full_data.extend_from_slice(b"If you see this text,\n");
    full_data.extend_from_slice(b"the printer is working!\n");
    full_data.extend_from_slice(b"Check if image appears above.\n\n");
    println!("➕ Added test text");

    // Feed and cut
    full_data.extend_from_slice(&[0x0A, 0x0A, 0x0A]); // 3 line feeds
    full_data.extend_from_slice(&[0x1D, 0x56, 0x00]); // GS V 0 - Full cut
    println!("➕ Added paper feed and cut commands");

    println!("📤 Total data size: {} bytes", full_data.len());

    // Step 6: Write to printer
    println!("🖨️  Sending data to printer...");
    port.write_all(&full_data).map_err(|e| {
        println!("❌ Failed to write to printer: {}", e);
        Error::General(format!("Failed to write to printer: {}", e))
    })?;

    println!("✅ Data written successfully");

    port.flush().map_err(|e| {
        println!("❌ Failed to flush printer buffer: {}", e);
        Error::General(format!("Failed to flush printer buffer: {}", e))
    })?;

    println!("✅ Buffer flushed successfully");
    println!("🎉 === TEST COMPLETE ===");

    Ok(PrintResult {
        success: true,
        message: format!(
            "Test print sent to {} - Check printer for output",
            params.port_name
        ),
    })
}

/// Test image printing to USB system printer (e.g., Printer_POS_80)
/// This is different from serial port printing - uses system print queue
#[derive(Debug, Deserialize)]
pub struct TestUsbImagePrintDTO {
    pub printer_name: String,
    pub image_path: String,
    pub printer_width: String, // "58mm" or "80mm"
}

/// Test ESC/POS bitmap with a simple checkerboard pattern
/// This helps verify the ESC/POS GS v 0 command works correctly
#[command]
pub async fn test_pattern_print(printer_name: String) -> IpcResponse<PrintResult> {
    match test_pattern_print_impl(printer_name).await {
        Ok(result) => Ok(result).into(),
        Err(e) => Err(e).into(),
    }
}

async fn test_pattern_print_impl(printer_name: String) -> Result<PrintResult> {
    println!("🔲 === PATTERN PRINT TEST ===");
    println!("🖨️  Printer: {}", printer_name);

    // Create a simple test pattern: 48x48 checkerboard
    let width: u32 = 48;
    let height: u32 = 48;
    let width_bytes = (width + 7) / 8; // 6 bytes per row

    println!(
        "📏 Pattern: {}x{} pixels ({} bytes per row)",
        width, height, width_bytes
    );

    let mut bitmap_data: Vec<u8> = Vec::new();

    // Create checkerboard pattern (8x8 pixel blocks)
    for y in 0..height {
        let mut row_bytes: Vec<u8> = Vec::new();
        let mut byte: u8 = 0;
        let mut bit_pos: u8 = 0;

        for x in 0..width {
            // Checkerboard: alternating 8x8 blocks
            let block_x = x / 8;
            let block_y = y / 8;
            let is_black = (block_x + block_y) % 2 == 0;

            if is_black {
                byte |= 1 << (7 - bit_pos);
            }

            bit_pos += 1;
            if bit_pos == 8 {
                row_bytes.push(byte);
                byte = 0;
                bit_pos = 0;
            }
        }

        // Push remaining bits if any
        if bit_pos > 0 {
            row_bytes.push(byte);
        }

        bitmap_data.extend_from_slice(&row_bytes);
    }

    println!("✅ Pattern generated: {} bytes", bitmap_data.len());

    // Build ESC/POS command using GS v 0
    let mut escpos_cmd: Vec<u8> = Vec::new();

    // GS v 0 m xL xH yL yH [data]
    escpos_cmd.push(0x1D); // GS
    escpos_cmd.push(0x76); // v
    escpos_cmd.push(0x30); // 0 (ASCII '0' - some printers prefer this)
    escpos_cmd.push(0x00); // m = 0 (normal mode)

    // Width in bytes (little endian)
    escpos_cmd.push((width_bytes & 0xFF) as u8);
    escpos_cmd.push(((width_bytes >> 8) & 0xFF) as u8);

    // Height in dots (little endian)
    escpos_cmd.push((height & 0xFF) as u8);
    escpos_cmd.push(((height >> 8) & 0xFF) as u8);

    println!(
        "📋 ESC/POS header: 1D 76 30 00 {:02X} {:02X} {:02X} {:02X}",
        (width_bytes & 0xFF) as u8,
        ((width_bytes >> 8) & 0xFF) as u8,
        (height & 0xFF) as u8,
        ((height >> 8) & 0xFF) as u8
    );

    // Add bitmap data
    escpos_cmd.extend_from_slice(&bitmap_data);

    println!("✅ ESC/POS command: {} bytes total", escpos_cmd.len());

    // Build full print document
    let mut full_data: Vec<u8> = Vec::new();

    // Initialize printer
    full_data.extend_from_slice(&[0x1B, 0x40]); // ESC @ - Initialize

    // Center align
    full_data.extend_from_slice(&[0x1B, 0x61, 0x01]); // ESC a 1 - Center

    // Title
    full_data.extend_from_slice(b"\n=== PATTERN TEST ===\n\n");

    // The pattern
    full_data.extend_from_slice(&escpos_cmd);

    // Reset alignment
    full_data.extend_from_slice(&[0x1B, 0x61, 0x00]); // ESC a 0 - Left

    // Footer
    full_data.extend_from_slice(b"\n\nYou should see a");
    full_data.extend_from_slice(b"\ncheckerboard pattern above\n\n");

    // Feed and cut
    full_data.extend_from_slice(&[0x0A, 0x0A, 0x0A]); // 3 line feeds
    full_data.extend_from_slice(&[0x1D, 0x56, 0x00]); // GS V 0 - Full cut

    println!("📤 Total document: {} bytes", full_data.len());

    // Send to printer
    #[cfg(target_os = "macos")]
    {
        let temp_file = std::env::temp_dir().join("pattern_test_print.bin");
        fs::write(&temp_file, &full_data)
            .map_err(|e| Error::General(format!("Failed to write temp file: {}", e)))?;

        println!("📁 Temp file: {:?}", temp_file);
        println!("🚀 Sending to printer via lpr...");

        let output = std::process::Command::new("lpr")
            .arg("-P")
            .arg(&printer_name)
            .arg("-o")
            .arg("raw")
            .arg(&temp_file)
            .output()
            .map_err(|e| Error::General(format!("Failed to execute lpr: {}", e)))?;

        // Clean up temp file
        let _ = fs::remove_file(&temp_file);

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(Error::General(format!("lpr failed: {}", stderr)));
        }

        println!("✅ Print job sent successfully!");

        Ok(PrintResult {
            success: true,
            message: "Pattern test print sent successfully!".to_string(),
        })
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err(Error::General(
            "Pattern test only supported on macOS currently".to_string(),
        ))
    }
}

#[command]
pub async fn test_usb_image_print(params: TestUsbImagePrintDTO) -> IpcResponse<PrintResult> {
    match test_usb_image_print_impl(params).await {
        Ok(result) => Ok(result).into(),
        Err(e) => Err(e).into(),
    }
}

async fn test_usb_image_print_impl(params: TestUsbImagePrintDTO) -> Result<PrintResult> {
    println!("🖼️  === USB IMAGE PRINT TEST ===");
    println!("🖨️  Printer: {}", params.printer_name);
    println!("📁 Image: {}", params.image_path);
    println!("📏 Width: {}", params.printer_width);

    // Step 1: Validate image file exists
    if !std::path::Path::new(&params.image_path).exists() {
        return Err(Error::General(format!(
            "Image file not found: {}",
            params.image_path
        )));
    }

    // Step 2: Convert image to ESC/POS
    let max_width = if params.printer_width == "58mm" {
        384
    } else {
        576
    };
    println!(
        "🔄 Converting image to ESC/POS (max width: {} pixels)...",
        max_width
    );

    let escpos_image_data = convert_image_to_escpos(&params.image_path, max_width)?;
    println!(
        "✅ Image converted successfully ({} bytes)",
        escpos_image_data.len()
    );

    // Step 3: Build full ESC/POS document
    let mut full_data: Vec<u8> = Vec::new();

    // Initialize printer
    full_data.extend_from_slice(&[0x1B, 0x40]); // ESC @ - Initialize

    // Center align
    full_data.extend_from_slice(&[0x1B, 0x61, 0x01]); // ESC a 1 - Center

    // Add the image
    full_data.extend_from_slice(&escpos_image_data);

    // Reset alignment
    full_data.extend_from_slice(&[0x1B, 0x61, 0x00]); // ESC a 0 - Left

    // Add test text
    full_data.extend_from_slice(b"\n=== USB IMAGE TEST ===\n");
    full_data.extend_from_slice(b"Printer: ");
    full_data.extend_from_slice(params.printer_name.as_bytes());
    full_data.extend_from_slice(b"\n");
    full_data.extend_from_slice(b"If you see this text,\n");
    full_data.extend_from_slice(b"the printer is working!\n");
    full_data.extend_from_slice(b"Check if image appears above.\n\n");

    // Feed and cut
    full_data.extend_from_slice(&[0x0A, 0x0A, 0x0A]); // 3 line feeds
    full_data.extend_from_slice(&[0x1D, 0x56, 0x00]); // GS V 0 - Full cut

    println!("📤 Total ESC/POS data: {} bytes", full_data.len());

    // Step 4: Send to system printer using lpr (macOS) or raw printing (Windows)
    #[cfg(target_os = "macos")]
    {
        // Write ESC/POS data to temporary file
        let temp_file = std::env::temp_dir().join("usb_test_print.bin");
        fs::write(&temp_file, &full_data)
            .map_err(|e| Error::General(format!("Failed to write temp file: {}", e)))?;

        println!("🖨️  Sending to macOS printer via lpr...");

        // Use lpr with raw mode
        let output = Command::new("lpr")
            .arg("-P")
            .arg(&params.printer_name)
            .arg("-o")
            .arg("raw")
            .arg(&temp_file)
            .output()
            .map_err(|e| Error::General(format!("Failed to execute lpr: {}", e)))?;

        // Clean up temp file
        let _ = fs::remove_file(&temp_file);

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(Error::General(format!("lpr command failed: {}", stderr)));
        }

        println!("✅ Print job sent successfully via lpr");
    }

    #[cfg(target_os = "windows")]
    {
        // Use raw printing via Windows API
        // Use the new base64 engine API (Engine::encode) to avoid deprecated warning
        use base64::Engine as _;
        let escpos_base64 = base64::engine::general_purpose::STANDARD.encode(&full_data);

        let ps_script = format!(
            r#"
Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.Runtime.InteropServices;

public class RawPrinterHelper {{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public class DOCINFOA {{
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }}

    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

    [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

    public static bool SendBytesToPrinter(string szPrinterName, byte[] pBytes) {{
        IntPtr hPrinter = IntPtr.Zero;
        DOCINFOA di = new DOCINFOA();
        di.pDocName = "USB Test Print";
        di.pDataType = "RAW";

        if (!OpenPrinter(szPrinterName, out hPrinter, IntPtr.Zero))
            return false;

        if (!StartDocPrinter(hPrinter, 1, di))
        {{
            ClosePrinter(hPrinter);
            return false;
        }}

        if (!StartPagePrinter(hPrinter))
        {{
            EndDocPrinter(hPrinter);
            ClosePrinter(hPrinter);
            return false;
        }}

        IntPtr pUnmanagedBytes = Marshal.AllocCoTaskMem(pBytes.Length);
        Marshal.Copy(pBytes, 0, pUnmanagedBytes, pBytes.Length);

        int dwWritten = 0;
        bool bSuccess = WritePrinter(hPrinter, pUnmanagedBytes, pBytes.Length, out dwWritten);

        Marshal.FreeCoTaskMem(pUnmanagedBytes);
        EndPagePrinter(hPrinter);
        EndDocPrinter(hPrinter);
        ClosePrinter(hPrinter);

        return bSuccess && (dwWritten == pBytes.Length);
    }}
}}
"@

$bytes = [System.Convert]::FromBase64String('{}')
[RawPrinterHelper]::SendBytesToPrinter('{}', $bytes)
"#,
            escpos_base64, params.printer_name
        );

        let output = Command::new("powershell")
            .arg("-Command")
            .arg(&ps_script)
            .output()
            .map_err(|e| Error::General(format!("Failed to execute PowerShell: {}", e)))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(Error::General(format!(
                "PowerShell command failed: {}",
                stderr
            )));
        }

        println!("✅ Print job sent successfully via Windows raw printing");
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        return Err(Error::General(
            "USB printer testing is only supported on macOS and Windows".to_string(),
        ));
    }

    #[cfg(any(target_os = "macos", target_os = "windows"))]
    {
        println!("🎉 === TEST COMPLETE ===");

        Ok(PrintResult {
            success: true,
            message: format!(
                "Test image sent to USB printer '{}' - Check for output!",
                params.printer_name
            ),
        })
    }
}
