'use client'
import { useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'
import { QrCode, X, AlertCircle, Scan } from 'lucide-react'

interface QRScannerProps {
  onScan: (data: string) => void
  onClose: () => void
}

function cameraErrorMessage(error: unknown): string {
  const name = error instanceof Error ? error.name : ''
  const message = error instanceof Error ? error.message : String(error ?? '')
  if (name === 'NotAllowedError' || /permission|notallowed/i.test(message)) {
    return "Accès à la caméra refusé. Autorisez la caméra dans le navigateur, ou saisissez le matricule ci-dessous."
  }
  if (name === 'NotFoundError' || /not found|no camera/i.test(message)) {
    return "Aucune caméra détectée. Utilisez le lecteur DS4608 ou saisissez le matricule."
  }
  if (/worker|content security policy|insecure|blob:/i.test(message)) {
    return "Le lecteur QR de la caméra n'a pas pu démarrer. Utilisez le lecteur DS4608 ou saisissez le matricule."
  }
  return "Impossible d'ouvrir la caméra. Utilisez le lecteur DS4608 ou saisissez le matricule."
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const onScanRef = useRef(onScan)
  const submittedRef = useRef(false)
  const [scanMode, setScanMode] = useState<'camera' | 'barcode'>('camera')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  const submitScan = (raw: string) => {
    const cleanData = raw.trim().replace(/[^\x20-\x7E]/g, '')
    if (!cleanData || submittedRef.current) return
    submittedRef.current = true
    onScanRef.current(cleanData)
  }

  useEffect(() => {
    if (scanMode !== 'camera' || !videoRef.current) return

    let cancelled = false
    let scanner: QrScanner | null = null
    setCameraError(null)
    setCameraReady(false)

    const video = videoRef.current
    const handleResult = (result: QrScanner.ScanResult | string) => {
      const data = typeof result === 'string' ? result : result.data
      submitScan(data)
      scanner?.stop()
    }

    const createScanner = (preferredCamera: 'environment' | 'user') =>
      new QrScanner(video, handleResult, {
        preferredCamera,
        highlightScanRegion: true,
        highlightCodeOutline: true,
        returnDetailedScanResult: true,
        onDecodeError: (error) => {
          const message = typeof error === 'string' ? error : error.message
          if (!message || message === QrScanner.NO_QR_CODE_FOUND) return
          if (/worker|scanner error/i.test(message)) {
            setCameraError(cameraErrorMessage(new Error(message)))
          }
        },
      })

    const start = async () => {
      scanner = createScanner('environment')
      try {
        await scanner.start()
      } catch (environmentError) {
        try {
          scanner.destroy()
        } catch {
          // Already stopped.
        }
        if (cancelled) return
        scanner = createScanner('user')
        try {
          await scanner.start()
        } catch (userError) {
          if (!cancelled) setCameraError(cameraErrorMessage(userError ?? environmentError))
          return
        }
      }

      if (cancelled) {
        try {
          scanner.destroy()
        } catch {
          // Already stopped.
        }
        return
      }
      try {
        scanner.setInversionMode('both')
      } catch {
        // Inversion is optional; native BarcodeDetector ignores it.
      }
      setCameraReady(true)
    }

    void start()

    return () => {
      cancelled = true
      scanner?.destroy()
    }
  }, [scanMode])

  useEffect(() => {
    if (scanMode === 'barcode') {
      inputRef.current?.focus()
    }
  }, [scanMode])

  // Zebra DS4608 types like a keyboard. Capture that even when the field is not focused.
  useEffect(() => {
    let buffer = ''
    let timeout: ReturnType<typeof setTimeout>

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return

      if (event.key === 'Enter') {
        event.preventDefault()
        if (buffer.trim()) submitScan(buffer)
        buffer = ''
        return
      }

      if (event.key.length !== 1) return
      buffer += event.key
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        buffer = ''
      }, 1500)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timeout)
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Scanner le code</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" type="button">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setScanMode('camera')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              scanMode === 'camera'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <QrCode className="h-4 w-4" />
            Caméra
          </button>
          <button
            type="button"
            onClick={() => setScanMode('barcode')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              scanMode === 'barcode'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Scan className="h-4 w-4" />
            Lecteur DS4608
          </button>
        </div>

        {scanMode === 'camera' ? (
          <>
            <div className="relative overflow-hidden rounded-lg bg-gray-100">
              <video
                ref={videoRef}
                className="w-full h-64 bg-gray-100 object-cover"
                muted
                playsInline
                autoPlay
              />
              {!cameraReady && !cameraError && (
                <p className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                  Ouverture de la caméra…
                </p>
              )}
            </div>
            {cameraError ? (
              <div className="mt-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{cameraError}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-600 mt-4 text-center">
                Placez le QR code devant la caméra
              </p>
            )}
          </>
        ) : (
          <div className="space-y-3 text-center">
            <Scan className="h-16 w-16 text-blue-500 mx-auto" />
            <h4 className="text-lg font-medium">Lecteur Zebra DS4608</h4>
            <p className="text-sm text-gray-600">
              Cliquez dans le champ, puis scannez. Le matricule est envoyé dès la fin du scan.
            </p>
          </div>
        )}

        <form
          className="mt-4 space-y-2"
          onSubmit={(event) => {
            event.preventDefault()
            submitScan(inputRef.current?.value ?? barcodeInput)
          }}
        >
          <label htmlFor="pointage-code" className="block text-sm font-medium text-gray-700">
            Matricule
          </label>
          <input
            id="pointage-code"
            ref={inputRef}
            value={barcodeInput}
            autoFocus={scanMode === 'barcode'}
            autoComplete="off"
            placeholder="KA0000M26"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            onChange={(event) => setBarcodeInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== 'Tab') return
              const value = (event.currentTarget as HTMLInputElement).value
              if (!value.trim()) return
              event.preventDefault()
              submitScan(value)
              setBarcodeInput('')
            }}
          />
          <p className="text-xs text-gray-500">
            Le lecteur DS4608 remplit ce champ. Vous pouvez aussi taper le matricule puis Entrée.
          </p>
        </form>
      </div>
    </div>
  )
}
