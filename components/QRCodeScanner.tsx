"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Camera, CheckCircle } from "lucide-react";
import { BrowserMultiFormatReader, Result, Exception } from "@zxing/library";

interface QRCodeScannerProps {
  onScan: (data: string) => void;
}

export default function QRCodeScanner({ onScan }: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    codeReader.current = new BrowserMultiFormatReader();
    
    return () => {
      if (codeReader.current) {
        codeReader.current.reset();
      }
    };
  }, []);

  const startScanning = async () => {
    if (!codeReader.current || !videoRef.current) return;
    
    try {
      setError(null);
      setIsScanning(true);
      
      await codeReader.current.decodeFromVideoDevice(
        null, // Use default camera
        videoRef.current,
        (result: Result | null, error: Exception | undefined) => {
          if (result) {
            const data = result.getText();
            setScannedData(data);
            onScan(data);
            stopScanning();
          }
          if (error && error.name !== 'NotFoundException') {
            setError('Scanning error occurred');
          }
        }
      );
    } catch (err) {
      setError('Failed to start camera');
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (codeReader.current) {
      codeReader.current.reset();
      setIsScanning(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          QR Code Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={isScanning ? stopScanning : startScanning}
          className="w-full"
        >
          {isScanning ? (
            <>
              <Camera className="w-4 h-4 mr-2 animate-pulse" />
              Stop Scan
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 mr-2" />
              Start Scan
            </>
          )}
        </Button>
        
        <div className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />
          {!isScanning && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center text-gray-500">
                <QrCode className="w-16 h-16 mx-auto mb-2 opacity-50" />
                <p>Camera will activate here</p>
              </div>
            </div>
          )}
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800">
            {error}
          </div>
        )}
        
        {scannedData && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">Scanned: {scannedData}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
