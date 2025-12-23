'use client'

import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, useMap, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icon
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const selectedIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

L.Marker.prototype.options.icon = defaultIcon

interface Restaurant {
  name: string
  lat: number
  lng: number
  price: number
  stars: number
  cuisine: string
}

interface CityData {
  lat: number
  lng: number
  zoom: number
}

interface MapProps {
  center: [number, number]
  zoom: number
  hotels: Restaurant[]
  selectedHotel: string | null
  cities?: Record<string, CityData>
  onHotelSelect?: (name: string) => void
}

// Component to handle map updates
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()

  useEffect(() => {
    // Disable React interference during animation
    map.flyTo(center, zoom, { duration: 1.2, easeLinearity: 0.5 })
  }, [center[0], center[1], zoom])

  return null
}

export default function MapComponent({ center, zoom, hotels, selectedHotel, cities, onHotelSelect }: MapProps) {
  // Use target zoom prop directly - no state tracking during animation
  const showCityMarkers = zoom < 8 && cities
  const showHotelCards = !showCityMarkers && hotels.length > 0

  // Memoize cards to prevent re-renders during map animation
  const hotelCards = useMemo(() => {
    if (!showHotelCards) return null
    return (
      <div style={{
        position: 'absolute',
        bottom: 12,
        left: 12,
        right: 12,
        zIndex: 1000,
        display: 'flex',
        gap: 8,
        overflowX: 'auto'
      }}>
        {hotels.map((restaurant) => (
          <button
            key={restaurant.name}
            onClick={() => onHotelSelect?.(restaurant.name)}
            style={{
              background: 'white',
              borderRadius: 8,
              padding: '10px 14px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              cursor: 'pointer',
              minWidth: 160,
              flexShrink: 0,
              border: '2px solid #eee',
              textAlign: 'left'
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 13, color: '#111', marginBottom: 4 }}>
              {restaurant.name}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              {'★'.repeat(restaurant.stars)} · €{restaurant.price}
            </div>
          </button>
        ))}
      </div>
    )
  }, [hotels, showHotelCards, onHotelSelect])

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <MapUpdater center={center} zoom={zoom} />

        {/* Show city markers when zoomed out */}
        {showCityMarkers && Object.entries(cities).map(([cityName, cityData]) => (
          <CircleMarker
            key={cityName}
            center={[cityData.lat, cityData.lng]}
            radius={8}
            pathOptions={{
              fillColor: '#374151',
              fillOpacity: 0.9,
              color: '#fff',
              weight: 2
            }}
          />
        ))}

        {/* Show hotel markers when zoomed in */}
        {!showCityMarkers && hotels.map((hotel) => (
          <Marker
            key={hotel.name}
            position={[hotel.lat, hotel.lng]}
            icon={selectedHotel === hotel.name ? selectedIcon : defaultIcon}
          />
        ))}
      </MapContainer>

      {hotelCards}
    </div>
  )
}
