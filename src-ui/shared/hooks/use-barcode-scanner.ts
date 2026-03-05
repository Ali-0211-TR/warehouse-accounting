import { useEffect, useRef, useState } from "react";

export interface BarcodeScannerOptions {
  /**
   * Minimum length of a valid barcode
   * @default 3
   */
  minLength?: number;

  /**
   * Maximum time between key presses to consider it a barcode scan (in ms)
   * Barcode scanners typically input very fast (< 50ms between chars)
   * @default 100
   */
  scanTimeout?: number;

  /**
   * Keys that end a barcode scan (usually Enter)
   * @default ["Enter"]
   */
  endKeys?: string[];

  /**
   * Callback when a barcode is scanned
   */
  onScan: (barcode: string) => void;

  /**
   * Only listen when this condition is true
   * @default true
   */
  enabled?: boolean;

  /**
   * Prevent scanning when typing in input fields
   * @default true
   */
  ignoreInputFields?: boolean;
}

/**
 * Hook to detect barcode scanner input
 * Barcode scanners typically input characters very quickly (< 100ms between chars)
 * and end with Enter key
 */
export function useBarcodeScanner({
  minLength = 3,
  scanTimeout = 100,
  endKeys = ["Enter"],
  onScan,
  enabled = true,
  ignoreInputFields = true,
}: BarcodeScannerOptions) {
  const [barcode, setBarcode] = useState("");
  const barcodeRef = useRef("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we should ignore this input (e.g., user typing in a text field)
      if (ignoreInputFields) {
        const target = event.target as HTMLElement;
        const tagName = target.tagName.toLowerCase();
        const isInput =
          tagName === "input" ||
          tagName === "textarea" ||
          target.isContentEditable;

        // Only ignore if it's a text-type input (not buttons, checkboxes, etc.)
        if (isInput) {
          const inputType = (target as HTMLInputElement).type?.toLowerCase();
          if (
            !inputType ||
            inputType === "text" ||
            inputType === "number" ||
            inputType === "search" ||
            inputType === "email" ||
            inputType === "tel" ||
            inputType === "url" ||
            inputType === "password"
          ) {
            return;
          }
        }
      }

      const currentTime = Date.now();
      const timeSinceLastKey = currentTime - lastKeyTimeRef.current;

      // Check if this is an end key (usually Enter)
      if (endKeys.includes(event.key)) {
        event.preventDefault();
        event.stopPropagation();

        const scannedCode = barcodeRef.current.trim();

        if (scannedCode.length >= minLength) {
          onScan(scannedCode);
        }

        // Reset
        barcodeRef.current = "";
        setBarcode("");
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        return;
      }

      // If too much time has passed, reset and start fresh
      if (timeSinceLastKey > scanTimeout && barcodeRef.current.length > 0) {
        barcodeRef.current = "";
      }

      // Only process printable characters
      if (event.key.length === 1) {
        event.preventDefault();
        event.stopPropagation();

        barcodeRef.current += event.key;
        setBarcode(barcodeRef.current);
        lastKeyTimeRef.current = currentTime;

        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Set timeout to reset if no more input
        timeoutRef.current = setTimeout(() => {
          if (barcodeRef.current.length > 0) {
            barcodeRef.current = "";
            setBarcode("");
          }
        }, scanTimeout * 2);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, minLength, scanTimeout, endKeys, onScan, ignoreInputFields]);

  return { barcode };
}
