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
  {
    id: 5,
    src: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    thumbnail: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
    title: "Flower Garden",
    description: "Vibrant blooms in a peaceful garden setting",
  },
  {
    id: 6,
    src: "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    thumbnail: "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
    title: "Desert Dunes",
    description: "Golden sand dunes under a clear blue sky",
  },
  {
    id: 7,
    src: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    thumbnail: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
    title: "Aurora Borealis",
    description: "Northern lights dancing across the Arctic sky",
  },
  {
    id: 8,
    src: "https://images.unsplash.com/photo-1464822759844-d150baec4b0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    thumbnail: "https://images.unsplash.com/photo-1464822759844-d150baec4b0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
    title: "Waterfall",
    description: "Majestic waterfall cascading through rocky cliffs",
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
      {/* Photo Viewer - 80% of screen */}
      <div className="flex-1 h-4/5">
        <PhotoViewer 
          photo={selectedPhoto} 
          zoomArea={zoomArea} 
          onViewerStateChange={setViewerState}
        />
      </div>

      {/* Photo Thumbnails - 20% of screen */}
      <div className="h-1/5 border-t border-border bg-card">
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
