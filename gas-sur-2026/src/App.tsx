import { Map, NavigationControl, GeolocateControl } from "mapcn"
import "maplibre-gl/dist/maplibre-gl.css"

function App() {
  return (
    <div className="w-screen h-screen flex flex-col bg-zinc-950 text-zinc-50 font-sans m-0 p-0 overflow-hidden">
      {/* Barra de Navegación superior */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-4 backdrop-blur-md z-10">
        <h1 className="text-xl font-semibold tracking-tight text-emerald-400">
          Gas del Sur 2026
        </h1>
        <p className="text-xs text-zinc-400">Sistema de Monitoreo Geográfico</p>
      </header>

      {/* Contenedor del Mapa con componentes declarativos de mapcn */}
      <main className="flex-1 relative w-full h-[calc(100vh-73px)] bg-zinc-900">
        <Map
          initialViewState={{
            longitude: -72.6004,
            latitude: -38.7396,
            zoom: 12,
          }}
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          className="absolute inset-0 w-full h-full"
        >
          <NavigationControl position="top-right" />
          <GeolocateControl position="top-right" />
        </Map>
      </main>
    </div>
  )
}

export default App