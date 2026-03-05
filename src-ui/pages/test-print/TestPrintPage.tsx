import { Button } from "@/shared/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/shadcn/card";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/shadcn/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/shadcn/select";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Cable, FileImage, Loader2, Printer, Usb } from "lucide-react";
import { useState } from "react";

type PrinterType = "usb" | "serial";

export function TestPrintPage() {
  const [imagePath, setImagePath] = useState("");
  const [printerType, setPrinterType] = useState<PrinterType>("usb");
  const [usbPrinterName, setUsbPrinterName] = useState("Printer_POS_80");
  const [serialPortName, setSerialPortName] = useState("/dev/cu.P1_AB8C");
  const [printerWidth, setPrinterWidth] = useState("80mm");
  const [testing, setTesting] = useState(false);
  const [testingPattern, setTestingPattern] = useState(false);
  const [result, setResult] = useState<string>("");

  const handleSelectImage = async () => {
    try {
      const selected = await open({
        filters: [
          {
            name: "Image",
            extensions: ["png", "jpg", "jpeg", "bmp"],
          },
        ],
      });

      if (selected && typeof selected === "string") {
        setImagePath(selected);
        setResult("");
      }
    } catch (error) {
      console.error("Failed to select image:", error);
      setResult(`Error selecting image: ${error}`);
    }
  };

  const handleTestPrint = async () => {
    if (!imagePath) {
      setResult("❌ Please select an image first");
      return;
    }

    const portOrPrinterName =
      printerType === "usb" ? usbPrinterName : serialPortName;

    if (!portOrPrinterName) {
      setResult("❌ Please enter a printer name or port");
      return;
    }

    setTesting(true);
    setResult("🖨️ Testing image print... Check console for detailed logs");

    try {
      // Use different commands for USB vs Serial printers
      if (printerType === "usb") {
        // USB System Printer - uses test_usb_image_print
        const response = await invoke<{
          error: { message: string } | null;
          result: { data: { success: boolean; message: string } } | null;
        }>("test_usb_image_print", {
          params: {
            printer_name: usbPrinterName,
            image_path: imagePath,
            printer_width: printerWidth,
          },
        });

        if (response.error) {
          setResult(`❌ Test failed: ${response.error.message}`);
        } else if (response.result?.data) {
          setResult(`✅ ${response.result.data.message}`);
        } else {
          setResult("❓ Unknown response from test");
        }
      } else {
        // Serial Port Printer - uses test_image_print
        const response = await invoke<{
          error: { message: string } | null;
          result: { data: { success: boolean; message: string } } | null;
        }>("test_image_print", {
          params: {
            port_name: serialPortName,
            image_path: imagePath,
            printer_width: printerWidth,
          },
        });

        if (response.error) {
          setResult(`❌ Test failed: ${response.error.message}`);
        } else if (response.result?.data) {
          setResult(`✅ ${response.result.data.message}`);
        } else {
          setResult("❓ Unknown response from test");
        }
      }
    } catch (error) {
      console.error("Test error:", error);
      setResult(`❌ Test error: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  const handleTestPattern = async () => {
    const printerName = printerType === "usb" ? usbPrinterName : serialPortName;

    if (!printerName) {
      setResult("❌ Please enter a printer name");
      return;
    }

    if (printerType !== "usb") {
      setResult("❌ Pattern test only works with USB printers currently");
      return;
    }

    setTestingPattern(true);
    setResult("🔲 Testing pattern print... Check console for logs");

    try {
      const response = await invoke<{
        error: { message: string } | null;
        result: { data: { success: boolean; message: string } } | null;
      }>("test_pattern_print", {
        printerName: printerName,
      });

      if (response.error) {
        setResult(`❌ Pattern test failed: ${response.error.message}`);
      } else if (response.result?.data) {
        setResult(
          `✅ ${response.result.data.message}\n\nYou should see a checkerboard pattern printed.`
        );
      } else {
        setResult("❓ Unknown response from pattern test");
      }
    } catch (error) {
      console.error("Pattern test error:", error);
      setResult(`❌ Pattern test error: ${error}`);
    } finally {
      setTestingPattern(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-6 w-6" />
            Image Print Test
          </CardTitle>
          <CardDescription>
            Test image printing functionality on thermal printer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Selection */}
          <div className="space-y-2">
            <Label htmlFor="image-path">Image File</Label>
            <div className="flex gap-2">
              <Input
                id="image-path"
                value={imagePath}
                onChange={e => setImagePath(e.target.value)}
                placeholder="/path/to/image.png"
                className="flex-1"
              />
              <Button onClick={handleSelectImage} variant="outline">
                <FileImage className="h-4 w-4 mr-2" />
                Browse
              </Button>
            </div>
            {imagePath && (
              <p className="text-xs text-muted-foreground">
                Selected: {imagePath}
              </p>
            )}
          </div>

          {/* Printer Type Selection */}
          <div className="space-y-3">
            <Label>Printer Type</Label>
            <RadioGroup
              value={printerType}
              onValueChange={value => setPrinterType(value as PrinterType)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="usb" id="usb" />
                <Label
                  htmlFor="usb"
                  className="cursor-pointer flex items-center gap-2 font-normal"
                >
                  <Usb className="h-4 w-4" />
                  USB Printer (System Printer)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="serial" id="serial" />
                <Label
                  htmlFor="serial"
                  className="cursor-pointer flex items-center gap-2 font-normal"
                >
                  <Cable className="h-4 w-4" />
                  Serial Port Printer
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* USB Printer Name */}
          {printerType === "usb" && (
            <div className="space-y-2">
              <Label htmlFor="usb-printer-name">USB Printer Name</Label>
              <Input
                id="usb-printer-name"
                value={usbPrinterName}
                onChange={e => setUsbPrinterName(e.target.value)}
                placeholder="Printer_POS_80"
              />
              <p className="text-xs text-muted-foreground">
                System printer name (e.g., Printer_POS_80). Check with: lpstat
                -p
              </p>
            </div>
          )}

          {/* Serial Port Name */}
          {printerType === "serial" && (
            <div className="space-y-2">
              <Label htmlFor="serial-port-name">Serial Port</Label>
              <Input
                id="serial-port-name"
                value={serialPortName}
                onChange={e => setSerialPortName(e.target.value)}
                placeholder="/dev/cu.P1_AB8C"
              />
              <p className="text-xs text-muted-foreground">
                Serial port path (macOS: /dev/cu.XXX, Windows: COM3, Linux:
                /dev/ttyUSB0)
              </p>
            </div>
          )}

          {/* Printer Width */}
          <div className="space-y-2">
            <Label htmlFor="printer-width">Printer Width</Label>
            <Select value={printerWidth} onValueChange={setPrinterWidth}>
              <SelectTrigger id="printer-width">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="58mm">58mm</SelectItem>
                <SelectItem value="80mm">80mm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Test Button */}
          <Button
            onClick={handleTestPrint}
            disabled={
              testing ||
              !imagePath ||
              (printerType === "usb" ? !usbPrinterName : !serialPortName)
            }
            className="w-full"
            size="lg"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Printer className="h-4 w-4 mr-2" />
                Test Print Image
              </>
            )}
          </Button>

          {/* Pattern Test Button */}
          <Button
            onClick={handleTestPattern}
            disabled={
              testingPattern ||
              (printerType === "usb" ? !usbPrinterName : !serialPortName)
            }
            className="w-full"
            size="lg"
            variant="outline"
          >
            {testingPattern ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing Pattern...
              </>
            ) : (
              <>🔲 Test Checkerboard Pattern</>
            )}
          </Button>

          {/* Result */}
          {result && (
            <div className="p-4 bg-muted rounded-lg">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {result}
              </pre>
            </div>
          )}

          {/* Instructions */}
          <div className="border-t pt-4 space-y-2">
            <h3 className="font-semibold text-sm">Instructions:</h3>
            <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
              <li>Select a PNG/JPG image file (preferably a logo)</li>
              <li>Enter the correct serial port for your thermal printer</li>
              <li>Click "Test Print Image"</li>
              <li>
                Check your printer - you should see the image followed by test
                text
              </li>
              <li>Check the browser console for detailed debug logs</li>
            </ol>
          </div>

          {/* Debug Info */}
          <div className="border-t pt-4 space-y-2">
            <h3 className="font-semibold text-sm">Debug Information:</h3>
            <div className="text-xs space-y-1 text-muted-foreground font-mono">
              <div>• Image path: {imagePath || "(not selected)"}</div>
              <div>
                • Printer type:{" "}
                {printerType === "usb" ? "USB System Printer" : "Serial Port"}
              </div>
              <div>
                • Printer/Port:{" "}
                {printerType === "usb"
                  ? usbPrinterName || "(not set)"
                  : serialPortName || "(not set)"}
              </div>
              <div>• Width: {printerWidth}</div>
              <div>• Max pixels: {printerWidth === "58mm" ? "384" : "576"}</div>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              ⚠️{" "}
              {printerType === "usb"
                ? "Make sure printer is installed and available!"
                : "Make sure no other application is using the printer port!"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
