/**
 * Сохранение файла через Tauri или браузер
 */
export async function saveFile(blob: Blob, filename: string): Promise<void> {
  try {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeFile } = await import("@tauri-apps/plugin-fs");

    const filePath = await save({
      defaultPath: filename,
      filters: [{
        name: "Document",
        extensions: [filename.split(".").pop() || "docx"]
      }]
    });

    if (filePath) {
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      await writeFile(filePath, uint8Array);
    }
  } catch (error) {
    // Браузерный fallback
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }
}
