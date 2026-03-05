import * as React from "react";
import { Button } from "@/shared/ui/shadcn/button";
import { X, ImagePlus } from "lucide-react";
import { cn } from "@/shared/lib/utils";

// Tauri v2:
import { open } from "@tauri-apps/plugin-dialog";

// Для превью локального файла:
import { convertFileSrc } from "@tauri-apps/api/core";

type ImagesPickerProps = {
  value?: string[]; // сохраняем ТОЛЬКО пути
  onChange: (paths: string[]) => void;
  maxFiles?: number;
};

function uniqStable(list: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of list) {
    const key = String(x ?? "").trim();
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function stripFileScheme(p: string) {
  // на iOS может быть file://..., иногда и на desktop встречается
  return p.startsWith("file://") ? p.replace(/^file:\/\//, "") : p;
}

function normalizePath(p: string) {
  // Windows backslashes -> slashes
  return stripFileScheme(p).replace(/\\/g, "/");
}

function toPreviewSrc(path: string) {
  // convertFileSrc ждёт реальный путь (без file://)
  return convertFileSrc(normalizePath(path));
}

export function ImagesPicker({
  value = [],
  onChange,
  maxFiles = 10,
}: ImagesPickerProps) {
  const [loading, setLoading] = React.useState(false);

  const pickImages = async () => {
    try {
      setLoading(true);

      const selected = await open({
        multiple: true,
        filters: [
          { name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "gif", "bmp", "svg"] },
        ],
      });

      if (!selected) return;

      const incoming = Array.isArray(selected) ? selected : [selected];
      const normalized = incoming.map((p) => normalizePath(String(p)));

      const merged = uniqStable([...value, ...normalized]).slice(0, maxFiles);
      onChange(merged);
    } finally {
      setLoading(false);
    }
  };

  const removeAt = (idx: number) => onChange(value.filter((_, i) => i !== idx));
  const clearAll = () => onChange([]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => void pickImages()}
          className="gap-2"
          disabled={loading || value.length >= maxFiles}
        >
          <ImagePlus className="h-4 w-4" />
          {loading ? "Выбор..." : "Загрузить фото"}
        </Button>

        <div className="text-xs text-muted-foreground">
          {value.length}/{maxFiles}
        </div>

        {value.length > 0 && (
          <Button type="button" variant="ghost" onClick={clearAll} disabled={loading}>
            Очистить
          </Button>
        )}
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {value.map((path, idx) => {
            const src = toPreviewSrc(path);

            return (
              <div key={`${path}-${idx}`} className="relative rounded-md overflow-hidden border">
                <img
                  src={src}
                  alt={path}
                  className={cn("h-24 w-full object-cover")}
                  onError={(e) => {
                    console.error("IMG PREVIEW ERROR", { path, src });
                    // можно временно показать "битую" миниатюру:
                    (e.currentTarget as HTMLImageElement).style.opacity = "0.35";
                  }}
                />

                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute top-1 right-1 h-7 w-7"
                  onClick={() => removeAt(idx)}
                  title="Удалить"
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                </Button>

                <div className="px-2 py-1 text-[10px] truncate bg-background/80">
                  {path}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
