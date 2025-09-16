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
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null)
  const [lastTouchCenter, setLastTouchCenter] = useState({ x: 0, y: 0 })
  const [velocity, setVelocity] = useState({ x: 0, y: 0 })
  const [lastMoveTime, setLastMoveTime] = useState(0)
  const [lastMovePosition, setLastMovePosition] = useState({ x: 0, y: 0 })
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const animationFrameRef = useRef<number | null>(null)

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

  const applyMomentum = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    const momentum = () => {
      const friction = 0.95 // Friction coefficient
      const minVelocity = 0.01 // Minimum velocity to continue momentum
      
      if (Math.abs(velocity.x) < minVelocity && Math.abs(velocity.y) < minVelocity) {
        setVelocity({ x: 0, y: 0 })
        setIsAnimating(false)
        return
      }

      const container = containerRef.current
      if (container) {
        const containerRect = container.getBoundingClientRect()
        const deltaXPercent = (velocity.x / containerRect.width) * 100 * 10 // Scale factor
        const deltaYPercent = (velocity.y / containerRect.height) * 100 * 10

        const newPanX = panOffset.x + deltaXPercent
        const newPanY = panOffset.y + deltaYPercent

        // Apply constraints to prevent over-panning
        const maxPan = 50 // Maximum pan percentage
        const constrainedPanX = Math.max(-maxPan, Math.min(maxPan, newPanX))
        const constrainedPanY = Math.max(-maxPan, Math.min(maxPan, newPanY))

        setPanOffset({ x: constrainedPanX, y: constrainedPanY })
        updateTransform(zoomLevel, constrainedPanX, constrainedPanY)
      }

      // Apply friction and continue momentum
      setVelocity(prev => ({
        x: prev.x * friction,
        y: prev.y * friction
      }))

      animationFrameRef.current = requestAnimationFrame(momentum)
    }

    setIsAnimating(true)
    animationFrameRef.current = requestAnimationFrame(momentum)
  }, [velocity, panOffset, zoomLevel])

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
      setVelocity({ x: 0, y: 0 })
      setLastMoveTime(Date.now())
      setLastMovePosition({ x: e.clientX, y: e.clientY })
      
      // Stop any ongoing momentum
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      setIsAnimating(false)
    }
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && isZoomed) {
      e.preventDefault()
      
      const currentTime = Date.now()
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      
      // Check if mouse has moved enough to consider it a drag
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        setHasMoved(true)
      }
      
      // Calculate velocity for momentum
      if (lastMoveTime > 0) {
        const timeDelta = currentTime - lastMoveTime
        if (timeDelta > 0) {
          const velocityX = (e.clientX - lastMovePosition.x) / timeDelta
          const velocityY = (e.clientY - lastMovePosition.y) / timeDelta
          setVelocity({ x: velocityX, y: velocityY })
        }
      }
      
      setLastMoveTime(currentTime)
      setLastMovePosition({ x: e.clientX, y: e.clientY })
      
      const container = containerRef.current
      if (container) {
        const containerRect = container.getBoundingClientRect()
        // Calculate movement as percentage of container size with sensitivity multiplier
        const sensitivity = 1.2 // Increase sensitivity for faster movement
        const deltaXPercent = (deltaX / containerRect.width) * 100 * sensitivity
        const deltaYPercent = (deltaY / containerRect.height) * 100 * sensitivity
        
        const newPanX = panOffset.x + deltaXPercent
        const newPanY = panOffset.y + deltaYPercent
        
        // Apply constraints to prevent over-panning
        const maxPan = 50 // Maximum pan percentage
        const constrainedPanX = Math.max(-maxPan, Math.min(maxPan, newPanX))
        const constrainedPanY = Math.max(-maxPan, Math.min(maxPan, newPanY))
        
        setPanOffset({ x: constrainedPanX, y: constrainedPanY })
        updateTransform(zoomLevel, constrainedPanX, constrainedPanY)
        setDragStart({ x: e.clientX, y: e.clientY })
      }
    }
  }, [isDragging, isZoomed, dragStart, panOffset, zoomLevel, lastMoveTime, lastMovePosition])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setHasMoved(false)
    
    // Apply momentum scrolling if velocity is significant
    if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1) {
      applyMomentum()
    }
    
    // Reset velocity
    setVelocity({ x: 0, y: 0 })
    setLastMoveTime(0)
  }, [velocity, applyMomentum])

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - pan
      if (isZoomed) {
        e.preventDefault()
        e.stopPropagation()
        const touch = e.touches[0]
        setIsDragging(true)
        setHasMoved(false)
        setDragStart({ x: touch.clientX, y: touch.clientY })
        setVelocity({ x: 0, y: 0 })
        setLastMoveTime(Date.now())
        setLastMovePosition({ x: touch.clientX, y: touch.clientY })
        
        // Stop any ongoing momentum
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
        setIsAnimating(false)
      }
    } else if (e.touches.length === 2) {
      // Two touches - pinch zoom
      e.preventDefault()
      e.stopPropagation()
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      
      const centerX = (touch1.clientX + touch2.clientX) / 2
      const centerY = (touch1.clientY + touch2.clientY) / 2
      
      setLastTouchDistance(distance)
      setLastTouchCenter({ x: centerX, y: centerY })
    }
  }, [isZoomed])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging && isZoomed) {
      // Single touch pan
      e.preventDefault()
      const touch = e.touches[0]
      
      const currentTime = Date.now()
      const deltaX = touch.clientX - dragStart.x
      const deltaY = touch.clientY - dragStart.y
      
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        setHasMoved(true)
      }
      
      // Calculate velocity for momentum
      if (lastMoveTime > 0) {
        const timeDelta = currentTime - lastMoveTime
        if (timeDelta > 0) {
          const velocityX = (touch.clientX - lastMovePosition.x) / timeDelta
          const velocityY = (touch.clientY - lastMovePosition.y) / timeDelta
          setVelocity({ x: velocityX, y: velocityY })
        }
      }
      
      setLastMoveTime(currentTime)
      setLastMovePosition({ x: touch.clientX, y: touch.clientY })
      
      const container = containerRef.current
      if (container) {
        const containerRect = container.getBoundingClientRect()
        const sensitivity = 1.2
        const deltaXPercent = (deltaX / containerRect.width) * 100 * sensitivity
        const deltaYPercent = (deltaY / containerRect.height) * 100 * sensitivity
        
        const newPanX = panOffset.x + deltaXPercent
        const newPanY = panOffset.y + deltaYPercent
        
        const maxPan = 50
        const constrainedPanX = Math.max(-maxPan, Math.min(maxPan, newPanX))
        const constrainedPanY = Math.max(-maxPan, Math.min(maxPan, newPanY))
        
        setPanOffset({ x: constrainedPanX, y: constrainedPanY })
        updateTransform(zoomLevel, constrainedPanX, constrainedPanY)
        setDragStart({ x: touch.clientX, y: touch.clientY })
      }
    } else if (e.touches.length === 2) {
      // Two touch pinch zoom
      e.preventDefault()
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      
      if (lastTouchDistance) {
        const scale = distance / lastTouchDistance
        const newZoomLevel = Math.max(0.5, Math.min(5, zoomLevel * scale))
        setZoomLevel(newZoomLevel)
        setIsZoomed(newZoomLevel > 1)
        updateTransform(newZoomLevel, panOffset.x, panOffset.y)
      }
      
      setLastTouchDistance(distance)
    }
  }, [isDragging, isZoomed, dragStart, panOffset, zoomLevel, lastTouchDistance, lastMoveTime, lastMovePosition])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    setHasMoved(false)
    setLastTouchDistance(null)
    
    // Apply momentum scrolling if velocity is significant
    if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1) {
      applyMomentum()
    }
    
    // Reset velocity
    setVelocity({ x: 0, y: 0 })
    setLastMoveTime(0)
  }, [velocity, applyMomentum])

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

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

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
      className="relative w-full h-full bg-muted flex items-center justify-center overflow-hidden touch-none select-none"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main Photo */}
      <img
        ref={imageRef}
        src={photo.src || "/placeholder.svg"}
        alt={photo.title}
        className={`max-w-full max-h-full object-contain select-none ${
          isZoomed ? "cursor-move" : "cursor-zoom-in"
        } ${isDragging ? "" : "transition-transform duration-200 ease-out"}`}
        style={{
          transform: zoomTransform || (isZoomed && !zoomArea ? "scale(1.5)" : "scale(1)"),
          transformOrigin: "center",
        }}
        onClick={hasMoved ? undefined : toggleZoom}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        draggable={false}
      />

      {/* Overlay Controls */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
        {/* Photo Info */}
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-black/50 backdrop-blur-sm rounded-lg p-2 sm:p-3 text-white max-w-[calc(100%-1rem)] sm:max-w-none">
          <h2 className="font-semibold text-sm sm:text-lg text-balance">{photo.title}</h2>
          <p className="text-xs sm:text-sm opacity-90 text-pretty hidden sm:block">{photo.description}</p>
        </div>

        {/* Zoom Indicator */}
        {isZoomed && (
          <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 sm:px-3 sm:py-2 text-white text-xs sm:text-sm">
            {zoomArea ? `Zoom vùng chọn: ${(zoomArea.zoomLevel * 100).toFixed(0)}%` : `Zoom: ${(zoomLevel * 100).toFixed(0)}%`}
            <div className="text-[10px] sm:text-xs opacity-75 mt-1">
              <span className="hidden sm:inline">Kéo để di chuyển ảnh</span>
              <span className="sm:hidden">Chạm và kéo để di chuyển</span>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!isZoomed && (
          <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 sm:px-3 sm:py-2 text-white text-xs sm:text-sm">
            <div className="text-[10px] sm:text-xs opacity-75">
              <span className="hidden sm:inline">• Click để zoom • Cuộn chuột để zoom • Kéo để di chuyển</span>
              <span className="sm:hidden">• Chạm để zoom • Pinch để zoom • Kéo để di chuyển</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
