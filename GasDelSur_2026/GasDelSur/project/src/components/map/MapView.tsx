import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'

export interface MarkerData {
  id?: string           // para identificar marcadores actualizables
  lat: number
  lng: number
  label?: string
  color?: string
  type?: 'pin' | 'truck' | 'destination'  // tipo de ícono
}

interface MapViewProps {
  center?: [number, number]
  zoom?: number
  markers?: MarkerData[]
  className?: string
  interactive?: boolean
  onClick?: (lat: number, lng: number) => void  // para geocoding inverso
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

function makeMarkerEl(color: string, type: MarkerData['type'] = 'pin'): HTMLElement {
  const el = document.createElement('div')

  if (type === 'truck') {
    // Ícono de camión — círculo con emoji para distinguirlo bien
    el.style.cssText = `
      width: 40px; height: 40px;
      background: ${color};
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 3px 10px rgba(0,0,0,.4);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
      cursor: pointer;
      transition: transform 0.3s ease;
    `
    el.innerHTML = '🚚'
  } else if (type === 'destination') {
    // Pin de destino — más grande y con pulso
    el.style.cssText = `
      width: 36px; height: 36px;
      background: ${color};
      border-radius: 50%;
      border: 4px solid white;
      box-shadow: 0 3px 12px rgba(0,0,0,.4);
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
    `
    el.innerHTML = '📍'
  } else {
    // Pin estándar
    el.style.cssText = `
      width: 28px; height: 36px;
      background: ${color};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,.35);
    `
    const dot = document.createElement('div')
    dot.style.cssText = `
      width: 9px; height: 9px;
      background: white; border-radius: 50%;
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%,-50%) rotate(45deg);
    `
    el.appendChild(dot)
  }

  return el
}

export function MapView({
  center = [-72.5904, -38.7359],
  zoom = 13,
  markers = [],
  className = '',
  interactive = true,
  onClick,
}: MapViewProps) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const mapRef        = useRef<maplibregl.Map | null>(null)
  const markersRef    = useRef<Map<string, maplibregl.Marker>>(new Map())
  const markerKeyRef  = useRef(0)

  // Inicializar mapa una sola vez
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

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

    if (onClick) {
      map.on('click', (e) => onClick(e.lngLat.lat, e.lngLat.lng))
      map.getCanvas().style.cursor = 'crosshair'
    }

    mapRef.current = map

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current.clear()
      map.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line

  // Actualizar marcadores cuando cambien — reusar por id para no parpadear
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const render = () => {
      const incoming = new Map<string, MarkerData>()
      markers.forEach((m, i) => {
        const key = m.id ?? `__marker_${i}`
        incoming.set(key, m)
      })

      // Eliminar los que ya no están
      markersRef.current.forEach((marker, key) => {
        if (!incoming.has(key)) {
          marker.remove()
          markersRef.current.delete(key)
        }
      })

      // Agregar o mover los que están
      incoming.forEach((data, key) => {
        const { lat, lng, label, color = '#003f87', type = 'pin' } = data
        const existing = markersRef.current.get(key)
        if (existing) {
          // Solo mover — no recrear el elemento (evita parpadeo)
          existing.setLngLat([lng, lat])
        } else {
          const el     = makeMarkerEl(color, type)
          const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat])
          if (label) marker.setPopup(new maplibregl.Popup({ offset: 30 }).setText(label))
          marker.addTo(map)
          markersRef.current.set(key, marker)
        }
      })
    }

    if (map.loaded()) render()
    else map.once('load', render)
  }, [markers])

  // Mover el centro del mapa si cambia desde el exterior
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.loaded()) return
    map.easeTo({ center, duration: 600 })
  }, [center[0], center[1]]) // eslint-disable-line

  return (
    <div className={`relative ${className}`} style={{ minHeight: '100%' }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
    </div>
  )
}
