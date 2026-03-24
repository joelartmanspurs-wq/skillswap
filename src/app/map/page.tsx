'use client'
import { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const dummyProfiles = [
  { id: '1', name: 'Alice', gives: ['Spanish', 'Cooking'], latitude: 51.51, longitude: -0.1 },
  { id: '2', name: 'Bob', gives: ['Cooking'], latitude: 51.52, longitude: -0.08 },
  { id: '3', name: 'Sara', gives: ['Spanish'], latitude: 51.50, longitude: -0.11 },
]

export default function NeighborhoodMapPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null)

  useEffect(() => {
    if (!mapContainer.current) return
    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return
    if (map.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-0.09, 51.505],
      zoom: 12
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    dummyProfiles.forEach(profile => {
      const el = document.createElement('div')
      el.className = 'w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shadow-lg cursor-pointer'
      el.innerHTML = `<span style="font-size:12px;font-weight:bold">${profile.name.charAt(0)}</span>`
      el.addEventListener('click', () => setSelectedProfile(profile))
      new mapboxgl.Marker(el).setLngLat([profile.longitude, profile.latitude]).addTo(map.current!)
    })
  }, [])

  return (
    <div className="flex flex-col h-screen w-full relative">
      <div className="absolute top-0 left-0 right-0 p-6 z-10 pointer-events-none">
        <div className="pointer-events-auto max-w-sm">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 bg-white/90 dark:bg-zinc-900/90 dark:text-zinc-50 p-4 rounded-2xl shadow-lg backdrop-blur-md border border-zinc-200 dark:border-zinc-800">
            Neighborhood
          </h1>
        </div>
      </div>

      <div className="flex-1 w-full relative z-0">
        {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-zinc-50 dark:bg-zinc-900">
            <h2 className="text-xl font-bold mb-2">Mapbox Token Required</h2>
            <p className="text-zinc-500 max-w-md">Add <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> to your <code>.env.local</code> to enable the map.</p>
          </div>
        ) : (
          <>
            <div ref={mapContainer} className="w-full h-full" />
            {selectedProfile && (
              <div className="absolute bottom-24 md:bottom-12 left-1/2 -translate-x-1/2 z-20 bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-xl w-72 border border-zinc-200 dark:border-zinc-800">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{selectedProfile.name}</h3>
                  <button onClick={() => setSelectedProfile(null)} className="text-zinc-400 hover:text-zinc-600">✕</button>
                </div>
                <p className="text-xs font-semibold text-zinc-500 uppercase mb-1">Offers</p>
                <div className="flex flex-wrap gap-1">
                  {selectedProfile.gives?.map((skill: string) => (
                    <span key={skill} className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-medium">{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}