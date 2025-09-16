"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface Photo {
  id: number
  src: string
  thumbnail: string
  title: string
  description: string
}

interface PhotoViewerProps {
  photo: Photo
  zoomArea?: {
    x: number
    y: number
    width: number
    height: number
    zoomLevel: number
  } | null
  onViewerStateChange?: (state: {
    isZoomed: boolean
    zoomLevel: number
    panOffset: { x: number; y: number }
  }) => void
}

export function PhotoViewer({ photo, zoomArea, onViewerStateChange }: PhotoViewerProps) {
  const [isZoomed, setIsZoomed] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [zoomTransform, setZoomTransform] = useState<string>("")
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [zoomLevel, setZoomLevel] = useState(1)
  const [hasMoved, setHasMoved] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (zoomArea) {
      setIsZoomed(true)
      setZoomLevel(zoomArea.zoomLevel)
      // Calculate transform to zoom into the selected area
      const scale = zoomArea.zoomLevel
      
      if (zoomArea.width === 1 && zoomArea.height === 1) {
        // Full image zoom - no translation needed
        setZoomTransform(`scale(${scale})`)
        setPanOffset({ x: 0, y: 0 })
      } else {
        // Partial area zoom - center the selected area
        // Calculate the center of the selected area
        const centerX = zoomArea.x + zoomArea.width / 2
        const centerY = zoomArea.y + zoomArea.height / 2
        
        // Calculate translation to center the area
        const translateX = (0.5 - centerX) * 100
        const translateY = (0.5 - centerY) * 100
        
        setZoomTransform(`scale(${scale}) translate(${translateX}%, ${translateY}%)`)
        setPanOffset({ x: translateX, y: translateY })
      }
    } else {
      setIsZoomed(false)
      setZoomTransform("")
      setZoomLevel(1)
      setPanOffset({ x: 0, y: 0 })
    }
  }, [zoomArea])

  const toggleZoom = () => {
    if (!zoomArea) {
      const newZoomed = !isZoomed
      setIsZoomed(newZoomed)
      if (newZoomed) {
        setZoomLevel(1.5)
        setZoomTransform("scale(1.5)")
      } else {
        setZoomLevel(1)
        setZoomTransform("")
        setPanOffset({ x: 0, y: 0 })
      }
    }
  }

  const updateTransform = (zoom: number, panX: number, panY: number) => {
    if (zoom === 1) {
      setZoomTransform("")
    } else {
      setZoomTransform(`scale(${zoom}) translate(${panX}%, ${panY}%)`)
    }
  }

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoomLevel = Math.max(0.5, Math.min(5, zoomLevel * delta))
    setZoomLevel(newZoomLevel)
    setIsZoomed(newZoomLevel > 1)
    updateTransform(newZoomLevel, panOffset.x, panOffset.y)
  }, [zoomLevel, panOffset])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isZoomed) {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
      setHasMoved(false)
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && isZoomed) {
      e.preventDefault()
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      
      // Check if mouse has moved enough to consider it a drag
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        setHasMoved(true)
      }
      
      const container = containerRef.current
      if (container) {
        const containerRect = container.getBoundingClientRect()
        // Calculate movement as percentage of container size
        const deltaXPercent = (deltaX / containerRect.width) * 100
        const deltaYPercent = (deltaY / containerRect.height) * 100
        
        const newPanX = panOffset.x + deltaXPercent
        const newPanY = panOffset.y + deltaYPercent
        
        setPanOffset({ x: newPanX, y: newPanY })
        updateTransform(zoomLevel, newPanX, newPanY)
        setDragStart({ x: e.clientX, y: e.clientY })
      }
    }
  }, [isDragging, isZoomed, dragStart, panOffset, zoomLevel])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setHasMoved(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Notify parent component of state changes
  useEffect(() => {
    if (onViewerStateChange) {
      onViewerStateChange({
        isZoomed,
        zoomLevel,
        panOffset,
      })
    }
  }, [isZoomed, zoomLevel, panOffset, onViewerStateChange])


  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-muted flex items-center justify-center overflow-hidden"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
    >
      {/* Main Photo */}
      <img
        ref={imageRef}
        src={photo.src || "/placeholder.svg"}
        alt={photo.title}
        className={`max-w-full max-h-full object-contain transition-transform duration-300 select-none ${
          isZoomed ? "cursor-move" : "cursor-zoom-in"
        }`}
        style={{
          transform: zoomTransform || (isZoomed && !zoomArea ? "scale(1.5)" : "scale(1)"),
          transformOrigin: "center",
        }}
        onClick={hasMoved ? undefined : toggleZoom}
        onMouseDown={handleMouseDown}
        draggable={false}
      />

      {/* Overlay Controls */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
        {/* Photo Info */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white">
          <h2 className="font-semibold text-lg text-balance">{photo.title}</h2>
          <p className="text-sm opacity-90 text-pretty">{photo.description}</p>
        </div>

        {/* Zoom Indicator */}
        {isZoomed && (
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm">
            {zoomArea ? `Zoom vùng chọn: ${(zoomArea.zoomLevel * 100).toFixed(0)}%` : `Zoom: ${(zoomLevel * 100).toFixed(0)}%`}
            <div className="text-xs opacity-75 mt-1">
              Kéo để di chuyển ảnh
            </div>
          </div>
        )}

        {/* Instructions */}
        {!isZoomed && (
          <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm">
            <div className="text-xs opacity-75">
              • Click để zoom • Cuộn chuột để zoom • Kéo để di chuyển
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
