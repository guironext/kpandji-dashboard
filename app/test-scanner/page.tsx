'use client'
import { useState } from 'react'
import { QRScanner } from '@/components/QRScanner'
import VerificationScanner from '@/components/VerificationScanner'

export default function TestScannerPage() {
  const [scannedData, setScannedData] = useState<string>('')
  const [showQRScanner, setShowQRScanner] = useState(false)

  const handleScan = (data: string) => {
    setScannedData(data)
    console.log('Scanned data:', data)
    console.log('Data length:', data.length)
    console.log('Data bytes:', Array.from(data).map(c => c.charCodeAt(0)))
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Test Scanner DS4608</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Verification Scanner */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">VerificationScanner Component</h2>
          <VerificationScanner onScan={handleScan} />
        </div>

        {/* QR Scanner Modal */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">QRScanner Component</h2>
          <button
            onClick={() => setShowQRScanner(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Open QR Scanner
          </button>
        </div>
      </div>

      {/* Scanned Data Display */}
      {scannedData && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Scanned Data:</h3>
          <div className="space-y-2">
            <p className="font-mono text-green-700 text-lg">{scannedData}</p>
            <div className="text-xs text-gray-600">
              <p><strong>Length:</strong> {scannedData.length} characters</p>
              <p><strong>Raw bytes:</strong> {Array.from(scannedData).map(c => c.charCodeAt(0)).join(', ')}</p>
            </div>
          </div>
          <button
            onClick={() => setScannedData('')}
            className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            Clear
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-blue-700">
          <li>Connect your Zebra DS4608 scanner via USB</li>
          <li>Click &quot;Start&quot; in the VerificationScanner section</li>
          <li>Scan QR codes or barcodes with the DS4608</li>
          <li>The scanned data should appear above</li>
        </ol>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner 
          onScan={handleScan} 
          onClose={() => setShowQRScanner(false)} 
        />
      )}
    </div>
  )
}
