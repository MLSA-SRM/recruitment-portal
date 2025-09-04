'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, Minus, X, RotateCcw } from 'lucide-react'

interface ImageLightboxProps {
  src: string
  alt?: string
  onClose?: () => void
}

export default function ImageLightbox({ src, alt = 'image', onClose }: ImageLightboxProps) {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const isDragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.()
      if (e.key === '+') setScale(s => Math.min(5, s + 0.2))
      if (e.key === '-') setScale(s => Math.max(0.2, s - 0.2))
      if (e.key.toLowerCase() === 'r') { setScale(1); setOffset({ x: 0, y: 0 }) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setScale(s => {
      const next = Math.min(5, Math.max(0.2, s + delta))
      return next
    })
  }

  const handleMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    isDragging.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
  }
  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!isDragging.current) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    lastPos.current = { x: e.clientX, y: e.clientY }
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }))
  }
  const handleMouseUpOrLeave = () => { isDragging.current = false }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div
        className="relative max-w-[95vw] max-h-[95vh] w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="select-none pointer-events-none"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transformOrigin: 'center center',
              maxWidth: '100%',
              maxHeight: '100%',
              display: 'block',
              margin: '0 auto'
            }}
          />
        </div>

        {/* Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button onClick={onClose} className="text-white bg-black/50 hover:bg-black/70 rounded p-2"><X className="h-5 w-5" /></button>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <button onClick={() => setScale(s => Math.max(0.2, s - 0.2))} className="text-white bg-black/50 hover:bg-black/70 rounded p-2"><Minus className="h-5 w-5" /></button>
          <button onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }) }} className="text-white bg-black/50 hover:bg-black/70 rounded p-2"><RotateCcw className="h-5 w-5" /></button>
          <button onClick={() => setScale(s => Math.min(5, s + 0.2))} className="text-white bg-black/50 hover:bg-black/70 rounded p-2"><Plus className="h-5 w-5" /></button>
        </div>
      </div>
    </div>
  )
}


