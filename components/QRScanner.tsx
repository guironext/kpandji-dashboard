'use client'
import { useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'
import { QrCode, X, CheckCircle, AlertCircle, Scan } from 'lucide-react'

interface QRScannerProps {
  onScan: (data: string) => void
  onClose: () => void
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const qrScannerRef = useRef<QrScanner | null>(null)
  const [scanMode, setScanMode] = useState<'camera' | 'barcode'>('camera')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [isListening, setIsListening] = useState(false)

  // Barcode scanner input handler (for Zebra DS4608)
  useEffect(() => {
    if (!isListening || scanMode !== 'barcode') return

    let buffer = ''
    let timeout: NodeJS.Timeout

    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Enter key (scanner sends this at end of scan)
      if (e.key === 'Enter') {
        e.preventDefault()
        if (buffer.trim()) {
          // Clean the scanned data - remove any non-printable characters
          const cleanData = buffer.trim().replace(/[^\x20-\x7E]/g, '')
          if (cleanData) {
            console.log('Scanned data:', cleanData)
            onScan(cleanData)
          }
          setBarcodeInput('')
          buffer = ''
        }
        return
      }
      
      // Handle regular characters (including special characters)
      if (e.key.length === 1) {
        // Add character to buffer
        buffer += e.key
        setBarcodeInput(buffer)
        console.log('Buffer:', buffer, 'Key:', e.key, 'Code:', e.keyCode)
      }
      
      // Clear buffer after 3 seconds of inactivity
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        buffer = ''
        setBarcodeInput('')
      }, 3000)
    }

    // Use keydown instead of keypress for better character capture
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timeout)
    }
  }, [isListening, scanMode, onScan])

  // Camera QR scanner
  useEffect(() => {
    if (scanMode !== 'camera' || !videoRef.current) return

    qrScannerRef.current = new QrScanner(
      videoRef.current,
      (result) => {
        onScan(result.data)
        qrScannerRef.current?.stop()
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
      }
    )
    qrScannerRef.current.start()

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy()
      }
    }
  }, [scanMode, onScan])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Code Scanner</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Mode Selection */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setScanMode('camera')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              scanMode === 'camera'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <QrCode className="h-4 w-4" />
            Camera QR
          </button>
          <button
            onClick={() => setScanMode('barcode')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              scanMode === 'barcode'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Scan className="h-4 w-4" />
            DS4608 Scanner
          </button>
        </div>
        
        {scanMode === 'camera' ? (
          <>
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 bg-gray-100 rounded-lg"
              />
            </div>
            <p className="text-sm text-gray-600 mt-4 text-center">
              Point camera at the QR code
            </p>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div className="text-center">
                <Scan className="h-16 w-16 text-blue-500 mx-auto mb-3" />
                <h4 className="text-lg font-medium mb-2">Zebra DS4608 Scanner</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Scan QR codes or barcodes with your DS4608 scanner
                </p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => setIsListening(!isListening)}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    isListening
                      ? 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200'
                  }`}
                >
                  {isListening ? (
                    <>
                      <AlertCircle className="h-4 w-4 inline mr-2" />
                      Stop Listening
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 inline mr-2" />
                      Start Listening
                    </>
                  )}
                </button>
                
                {isListening && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700 text-center">
                      Waiting for scan... Scan QR code or barcode with DS4608
                    </p>
                    {barcodeInput && (
                      <p className="text-xs text-blue-600 mt-2 text-center font-mono">
                        Input: {barcodeInput}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
