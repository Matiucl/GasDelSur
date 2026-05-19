import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'

export interface MarkerData {
  lat: number
  lng: number
  label?: string
  color?: string
}

interface MapViewProps {
  center?: [number, number]
  zoom?: number
  markers?: MarkerData[]
  className?: string
  interactive?: boolean
}

const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxzoom: 19,
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
}

export function MapView({
  center = [-72.5904, -38.7359], // Temuco, Chile
  zoom = 13,
  markers = [],
  className = '',
  interactive = true,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])

  useEffect(() => {
    if (!containerRef.current) return
    if (mapRef.current) return // already initialized

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center,
      zoom,
      interactive,
      attributionControl: false,
    })

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    if (interactive) {
      map.addControl(new maplibregl.NavigationControl(), 'top-right')
    }

    mapRef.current = map

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Add/update markers whenever they change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const render = () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []

      markers.forEach(({ lat, lng, label, color = '#003f87' }) => {
        const el = document.createElement('div')
        el.style.cssText = `
          width:28px;height:36px;
          background:${color};
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,.35);
        `
        const dot = document.createElement('div')
        dot.style.cssText = `
          width:9px;height:9px;
          background:white;border-radius:50%;
          position:absolute;top:50%;left:50%;
          transform:translate(-50%,-50%) rotate(45deg);
        `
        el.appendChild(dot)

        const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat])
        if (label) marker.setPopup(new maplibregl.Popup({ offset: 30 }).setText(label))
        marker.addTo(map)
        markersRef.current.push(marker)
      })
    }

    if (map.loaded()) render()
    else map.once('load', render)
  }, [markers])

  return (
    // wrapper div con posición relativa y tamaño explícito garantizado
    <div className={`relative ${className}`} style={{ minHeight: '100%' }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
    </div>
  )
}
