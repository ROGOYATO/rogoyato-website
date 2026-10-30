import { useCallback, useEffect, useRef, useState } from 'react'
import { UploadError, isBoardPort, openSerial, pickPort, realBoardSupported, uploadToBoard } from './realBoard'

const MAX_SERIAL_CHARS = 20_000

// A real Uno on this computer's USB: the port it is on, uploads to it and
// its Serial Monitor, which closes for an upload (the port takes one user at
// a time) and opens again after.
export default function useRealBoard() {
  const supported = realBoardSupported()
  const [port, setPort] = useState(null)
  const portRef = useRef(null)
  // { state: 'idle' | 'uploading' | 'done' | 'error', progress, message, bytes, seconds }
  const [upload, setUpload] = useState({ state: 'idle' })
  const [serial, setSerial] = useState('')
  const serialBuffer = useRef('')
  const [monitor, setMonitor] = useState(null) // { baud } while open
  const monitorRef = useRef(null)

  const choose = useCallback((next) => {
    portRef.current = next
    setPort(next)
  }, [])

  const closeMonitor = useCallback(async () => {
    const open = monitorRef.current
    monitorRef.current = null
    setMonitor(null)
    await open?.close()
  }, [])

  // The board this site was allowed before, if it is plugged in; and the
  // board coming out of (or back into) the USB socket. Other devices coming
  // and going (a wireless mouse's receiver, say) are left alone.
  useEffect(() => {
    if (!supported) return undefined
    pickPort().then((known) => known && !portRef.current && choose(known))
    const lost = (event) => {
      if (event.target !== portRef.current) return
      closeMonitor()
      choose(null)
    }
    const found = (event) => {
      if (!portRef.current && isBoardPort(event.target)) choose(event.target)
    }
    navigator.serial.addEventListener('disconnect', lost)
    navigator.serial.addEventListener('connect', found)
    return () => {
      navigator.serial.removeEventListener('disconnect', lost)
      navigator.serial.removeEventListener('connect', found)
      monitorRef.current?.close()
    }
  }, [supported, choose, closeMonitor])

  // The browser's port picker; it opens only from a click. Null if closed
  // without a choice.
  const askPort = useCallback(async () => {
    try {
      const next = await pickPort(true)
      if (next !== portRef.current) await closeMonitor()
      choose(next)
      return next
    } catch {
      return null
    }
  }, [choose, closeMonitor])

  const openMonitor = useCallback(
    async (baud) => {
      const target = portRef.current
      if (!target) return
      await closeMonitor()
      try {
        const open = await openSerial(target, baud, (text) => {
          serialBuffer.current = (serialBuffer.current + text).slice(-MAX_SERIAL_CHARS)
          setSerial(serialBuffer.current)
        })
        monitorRef.current = open
        setMonitor({ baud })
        open.ended.then(() => {
          if (monitorRef.current !== open) return
          monitorRef.current = null
          setMonitor(null)
        })
      } catch {
        setMonitor(null)
      }
    },
    [closeMonitor],
  )

  // Writes `hex` to the board, then opens its Serial Monitor at `baud`.
  const uploadHex = useCallback(
    async (hex, baud) => {
      const target = portRef.current
      if (!target) return false
      await closeMonitor()
      const started = performance.now()
      setUpload({ state: 'uploading', progress: 0 })
      try {
        const { bytes } = await uploadToBoard(target, hex, (progress) => setUpload({ state: 'uploading', progress }))
        setUpload({ state: 'done', bytes, seconds: (performance.now() - started) / 1000 })
      } catch (error) {
        setUpload({ state: 'error', message: error instanceof UploadError ? error.message : `Yükleme başarısız: ${error.message}` })
        return false
      }
      serialBuffer.current = ''
      setSerial('')
      await openMonitor(baud)
      return true
    },
    [closeMonitor, openMonitor],
  )

  return {
    supported,
    port,
    askPort,
    upload,
    uploading: upload.state === 'uploading',
    uploadHex,
    serial,
    monitor,
    openMonitor,
    closeMonitor,
    sendSerial: (text) => monitorRef.current?.send(text),
    clearSerial: () => {
      serialBuffer.current = ''
      setSerial('')
    },
    forget: () => setUpload({ state: 'idle' }),
  }
}
