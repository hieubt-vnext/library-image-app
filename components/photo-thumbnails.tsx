"use client"

import type React from "react"
import { useRef, useState } from "react"

interface Photo {
  id: number
  src: string
  thumbnail: string
  title: string
  description: string
}

interface PhotoThumbnailsProps {
  photos: Photo[]
  selectedPhoto: Photo
  onPhotoSelect: (photo: Photo) => void
  onZoomAreaChange: (
    zoomArea: { x: number; y: number; width: number; height: number; zoomLevel: number } | null,
  ) => void
}

export function PhotoThumbnails({ photos, selectedPhoto, onPhotoSelect, onZoomAreaChange }: PhotoThumbnailsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [magnifierState, setMagnifierState] = useState<{
    isActive: boolean
    photoId: number | null
    lensPosition: { x: number; y: number }
    zoomLevel: number
  }>({
    isActive: false,
    photoId: null,
    lensPosition: { x: 0, y: 0 },
    zoomLevel: 2,
  })

  const handleMouseEnter = (photoId: number) => {
    setMagnifierState((prev) => ({
      ...prev,
      isActive: true,
      photoId,
    }))
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>, photoId: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setMagnifierState((prev) => ({
      ...prev,
      lensPosition: { x, y },
      photoId,
    }))

    if (photoId === selectedPhoto.id) {
      const normalizedX = x / rect.width
      const normalizedY = y / rect.height
      const baseLensSize = 0.4 // Base lens size at 1x zoom
      const lensSize = magnifierState.zoomLevel <= 1 ? 1 : Math.max(0.1, baseLensSize / magnifierState.zoomLevel) // Full image when zoom <= 1

      onZoomAreaChange({
        x: magnifierState.zoomLevel <= 1 ? 0 : Math.max(0, Math.min(1 - lensSize, normalizedX - lensSize / 2)),
        y: magnifierState.zoomLevel <= 1 ? 0 : Math.max(0, Math.min(1 - lensSize, normalizedY - lensSize / 2)),
        width: lensSize,
        height: lensSize,
        zoomLevel: magnifierState.zoomLevel,
      })
    }
  }

  const handleMouseLeave = () => {
    setMagnifierState((prev) => ({
      ...prev,
      isActive: false,
      photoId: null,
    }))
    onZoomAreaChange(null)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const newZoomLevel = Math.max(1, Math.min(5, magnifierState.zoomLevel + (e.deltaY > 0 ? -0.2 : 0.2)))
    setMagnifierState((prev) => ({
      ...prev,
      zoomLevel: newZoomLevel,
    }))

    if (magnifierState.isActive && magnifierState.photoId === selectedPhoto.id) {
      const rect = (e.target as HTMLElement).getBoundingClientRect()
      const x = magnifierState.lensPosition.x / rect.width
      const y = magnifierState.lensPosition.y / rect.height
      const baseLensSize = 0.4
      const lensSize = newZoomLevel <= 1 ? 1 : Math.max(0.1, baseLensSize / newZoomLevel)

      onZoomAreaChange({
        x: newZoomLevel <= 1 ? 0 : Math.max(0, Math.min(1 - lensSize, x - lensSize / 2)),
        y: newZoomLevel <= 1 ? 0 : Math.max(0, Math.min(1 - lensSize, y - lensSize / 2)),
        width: lensSize,
        height: lensSize,
        zoomLevel: newZoomLevel,
      })
    }
  }

  return (
    <div className="h-full p-4">
      <div
        ref={containerRef}
        className="flex gap-3 h-full overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-accent scrollbar-track-muted"
      >
        {photos.map((photo) => (
          <div
            key={photo.id}
            className={`flex-shrink-0 relative cursor-pointer transition-all duration-200 ${
              selectedPhoto.id === photo.id
                ? "ring-2 ring-accent ring-offset-2 ring-offset-background"
                : "hover:ring-2 hover:ring-primary hover:ring-offset-2 hover:ring-offset-background"
            }`}
            onClick={() => onPhotoSelect(photo)}
          >
            <div className="relative overflow-hidden rounded-lg">
              <img
                src={photo.thumbnail || "/placeholder.svg"}
                alt={photo.title}
                className="w-24 h-24 sm:w-28 sm:h-28 object-cover border border-border"
                onMouseEnter={() => handleMouseEnter(photo.id)}
                onMouseMove={(e) => handleMouseMove(e, photo.id)}
                onMouseLeave={handleMouseLeave}
                onWheel={handleWheel}
              />

              {magnifierState.isActive && magnifierState.photoId === photo.id && (
                <>
                  <div
                    className="absolute pointer-events-none border-2 border-accent bg-accent/20  shadow-lg"
                    style={{
                      width: `${magnifierState.zoomLevel <= 1 ? 112 : Math.max(20, 60 / magnifierState.zoomLevel)}px`,
                      height: `${magnifierState.zoomLevel <= 1 ? 112 : Math.max(20, 60 / magnifierState.zoomLevel)}px`,
                      left: magnifierState.zoomLevel <= 1 ? 0 : Math.max(
                        0,
                        Math.min(
                          magnifierState.lensPosition.x - Math.max(10, 30 / magnifierState.zoomLevel),
                          112 - Math.max(20, 60 / magnifierState.zoomLevel),
                        ),
                      ),
                      top: magnifierState.zoomLevel <= 1 ? 0 : Math.max(
                        0,
                        Math.min(
                          magnifierState.lensPosition.y - Math.max(10, 30 / magnifierState.zoomLevel),
                          112 - Math.max(20, 60 / magnifierState.zoomLevel),
                        ),
                      ),
                      transition: "all 0.1s ease-out",
                      // boxShadow: "0 0 0 2px rgba(255,255,255,0.8), inset 0 0 0 1px rgba(0,0,0,0.3)",
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-accent/60"></div>
                      <div className="absolute w-0.5 h-full bg-accent/60"></div>
                    </div>
                  </div>

                  {/* Magnified Preview */}
                  <div
                    className="absolute z-50 pointer-events-none border-2 border-accent rounded-lg overflow-hidden shadow-2xl bg-background"
                    style={{
                      width: "120px",
                      height: "120px",
                      left: magnifierState.lensPosition.x > 60 ? "-130px" : "120px",
                      top: Math.max(-60, Math.min(magnifierState.lensPosition.y - 60, 20)),
                    }}
                  >
                    <img
                      src={photo.src || "/placeholder.svg"}
                      alt={`${photo.title} magnified`}
                      className="w-full h-full object-cover"
                      style={{
                        transform: `scale(${magnifierState.zoomLevel})`,
                        transformOrigin: `${(magnifierState.lensPosition.x / 112) * 100}% ${(magnifierState.lensPosition.y / 112) * 100}%`,
                      }}
                    />

                    {/* Zoom Level Indicator */}
                    <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                      {magnifierState.zoomLevel.toFixed(1)}x
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Label */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm text-white text-xs p-1 rounded-b-lg">
              <p className="truncate text-center">{photo.title}</p>
            </div>
          </div>
        ))}
      </div>

      {magnifierState.isActive && (
        <div className="absolute bottom-2 left-4 bg-black/80 text-white text-xs px-2 py-1 rounded">
          Di chuột để chọn vùng • Cuộn để zoom • Hiện tại: {magnifierState.zoomLevel.toFixed(1)}x • Vùng chọn:{" "}
          {magnifierState.zoomLevel <= 1 ? 100 : Math.round((0.4 / magnifierState.zoomLevel) * 100)}%
        </div>
      )}
    </div>
  )
}
