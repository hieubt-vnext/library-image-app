"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Download } from "lucide-react"

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
}

export function PhotoViewer({ photo, zoomArea }: PhotoViewerProps) {
  const [isZoomed, setIsZoomed] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [zoomTransform, setZoomTransform] = useState<string>("")

  useEffect(() => {
    if (zoomArea) {
      setIsZoomed(true)
      // Calculate transform to zoom into the selected area
      const scale = zoomArea.zoomLevel
      
      if (zoomArea.width === 1 && zoomArea.height === 1) {
        // Full image zoom - no translation needed
        setZoomTransform(`scale(${scale})`)
      } else {
        // Partial area zoom - center the selected area
        // Calculate the center of the selected area
        const centerX = zoomArea.x + zoomArea.width / 2
        const centerY = zoomArea.y + zoomArea.height / 2
        
        // Calculate translation to center the area
        const translateX = (0.5 - centerX) * 100
        const translateY = (0.5 - centerY) * 100
        
        setZoomTransform(`scale(${scale}) translate(${translateX}%, ${translateY}%)`)
      }
    } else {
      setIsZoomed(false)
      setZoomTransform("")
    }
  }, [zoomArea])

  const toggleZoom = () => {
    if (!zoomArea) {
      setIsZoomed(!isZoomed)
      setZoomTransform(isZoomed ? "" : "scale(1.5)")
    }
  }

  const handleDownload = () => {
    // In a real app, this would trigger a download
    console.log("Downloading photo:", photo.title)
  }

  return (
    <div
      className="relative w-full h-full bg-muted flex items-center justify-center overflow-hidden"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Main Photo */}
      <img
        src={photo.src || "/placeholder.svg"}
        alt={photo.title}
        className={`max-w-full max-h-full object-contain transition-transform duration-300 ${
          isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
        }`}
        style={{
          transform: zoomTransform || (isZoomed && !zoomArea ? "scale(1.5)" : "scale(1)"),
          transformOrigin: "center",
        }}
        onClick={toggleZoom}
      />

      {/* Overlay Controls */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
        {/* Top Controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white">
            <h2 className="font-semibold text-lg text-balance">{photo.title}</h2>
            <p className="text-sm opacity-90 text-pretty">{photo.description}</p>
          </div>

          <div className="flex gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="bg-black/50 backdrop-blur-sm border-0 text-white hover:bg-black/70"
              onClick={toggleZoom}
            >
              {isZoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="bg-black/50 backdrop-blur-sm border-0 text-white hover:bg-black/70"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Zoom Indicator */}
        {isZoomed && (
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm">
            {zoomArea ? `Zoom vùng chọn: ${(zoomArea.zoomLevel * 100).toFixed(0)}%` : "Zoom thủ công: 150%"}
          </div>
        )}
      </div>
    </div>
  )
}
