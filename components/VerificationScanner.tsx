"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Scan, Keyboard, Zap } from "lucide-react";
import QRCodeScanner from "./QRCodeScanner";

interface VerificationScannerProps {
  onScan?: (data: string) => void;
}

export default function VerificationScanner({ onScan }: VerificationScannerProps) {
  const [manualInput, setManualInput] = useState("");
  const [useScanner, setUseScanner] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");

  useEffect(() => {
    if (!isListening) return;

    let buffer = "";
    let timeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (buffer.trim()) {
          // Clean the scanned data - remove non-printable characters
          const cleanData = buffer.trim().replace(/[^\x20-\x7E]/g, '');
          if (cleanData) {
            console.log('Scanned data:', cleanData);
            onScan?.(cleanData);
          }
          setBarcodeInput("");
          buffer = "";
        }
        return;
      }
      
      // Handle regular characters (including special characters)
      if (e.key.length === 1) {
        buffer += e.key;
        setBarcodeInput(buffer);
        console.log('Buffer:', buffer, 'Key:', e.key, 'Code:', e.keyCode);
      }
      
      // Clear buffer after 3 seconds of inactivity
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        buffer = "";
        setBarcodeInput("");
      }, 3000);
    };

    // Use keydown instead of keypress for better character capture
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timeout);
    };
  }, [isListening, onScan]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan?.(manualInput.trim());
      setManualInput("");
    }
  };

  const handleScan = (data: string) => {
    onScan?.(data);
  };

  if (useScanner) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">QR Scanner</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setUseScanner(false)}
          >
            <Keyboard className="w-4 h-4 mr-2" />
            Manual Entry
          </Button>
        </div>
        <QRCodeScanner onScan={handleScan} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
              <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Manual Entry</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setUseScanner(true)}
          >
            <Scan className="w-4 h-4 mr-2" />
            Scanner
          </Button>
        </div>
      
      {/* DS46 Scanner Mode */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">DS4608 Scanner</span>
          <Button
            variant={isListening ? "destructive" : "default"}
            size="sm"
            onClick={() => setIsListening(!isListening)}
          >
            <Zap className="w-4 h-4 mr-2" />
            {isListening ? "Stop" : "Start"}
          </Button>
        </div>
        
        {isListening && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 text-center">
              Waiting for DS4608 scan...
            </p>
            {barcodeInput && (
              <p className="text-xs text-blue-600 mt-2 text-center font-mono">
                Input: {barcodeInput}
              </p>
            )}
          </div>
        )}
      </div>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">ou</span>
        </div>
      </div>
      
      <form onSubmit={handleManualSubmit} className="space-y-3">
        <Input
          placeholder="Enter code manually..."
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          className="text-center font-mono"
        />
        <Button type="submit" className="w-full" disabled={!manualInput.trim()}>
          Verify Part
        </Button>
      </form>
      
      <div className="text-xs text-gray-500 text-center">
        Use DS4608 scanner or enter manually
      </div>
    </div>
  );
}
