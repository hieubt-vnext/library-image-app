"use client"

import { useState } from "react"
import { PhotoViewer } from "@/components/photo-viewer"
import { PhotoThumbnails } from "@/components/photo-thumbnails"

// Sample photo data with real images from Unsplash
const samplePhotos = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
    title: "Mountain Landscape",
    description: "Beautiful snow-capped mountains at sunset",
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2073&q=80",
    thumbnail: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
    title: "Ocean Beach",
    description: "Peaceful waves washing onto the shore",
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    thumbnail: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
    title: "City Skyline",
    description: "Urban lights illuminating the night sky",
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80",
    thumbnail: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
    title: "Forest Path",
    description: "Sunlight filtering through dense forest canopy",
  },

]

export default function PhotoLibrary() {
  const [selectedPhoto, setSelectedPhoto] = useState(samplePhotos[0])
  const [zoomArea, setZoomArea] = useState<{
    x: number
    y: number
    width: number
    height: number
    zoomLevel: number
  } | null>(null)
  const [viewerState, setViewerState] = useState<{
    isZoomed: boolean
    zoomLevel: number
    panOffset: { x: number; y: number }
  }>({
    isZoomed: false,
    zoomLevel: 1,
    panOffset: { x: 0, y: 0 },
  })

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Photo Viewer - Responsive height allocation */}
      <div className="flex-1 h-[70vh] sm:h-4/5">
        <PhotoViewer 
          photo={selectedPhoto} 
          zoomArea={zoomArea} 
          onViewerStateChange={setViewerState}
        />
      </div>

      {/* Photo Thumbnails - More space on mobile */}
      <div className="border-t border-border bg-card h-[30vh] sm:h-1/5 flex-shrink-0">
        <PhotoThumbnails
          photos={samplePhotos}
          selectedPhoto={selectedPhoto}
          onPhotoSelect={setSelectedPhoto}
          onZoomAreaChange={setZoomArea}
          viewerState={viewerState}
        />
      </div>
    </div>
  )
}
