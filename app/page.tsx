'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'

// Mock hotel data
const CITIES: Record<string, { lat: number; lng: number; zoom: number }> = {
  paris: { lat: 48.8566, lng: 2.3522, zoom: 13 },
  london: { lat: 51.5074, lng: -0.1278, zoom: 13 },
  rome: { lat: 41.9028, lng: 12.4964, zoom: 13 },
  barcelona: { lat: 41.3851, lng: 2.1734, zoom: 13 },
  amsterdam: { lat: 52.3676, lng: 4.9041, zoom: 13 },
  berlin: { lat: 52.52, lng: 13.405, zoom: 13 },
  vienna: { lat: 48.2082, lng: 16.3738, zoom: 13 },
  prague: { lat: 50.0755, lng: 14.4378, zoom: 13 },
  stockholm: { lat: 59.3293, lng: 18.0686, zoom: 13 },
  helsinki: { lat: 60.1699, lng: 24.9384, zoom: 13 },
  copenhagen: { lat: 55.6761, lng: 12.5683, zoom: 13 },
  oslo: { lat: 59.9139, lng: 10.7522, zoom: 13 },
  dublin: { lat: 53.3498, lng: -6.2603, zoom: 13 },
  lisbon: { lat: 38.7223, lng: -9.1393, zoom: 13 },
  madrid: { lat: 40.4168, lng: -3.7038, zoom: 13 },
  zurich: { lat: 47.3769, lng: 8.5417, zoom: 13 }
}

const RESTAURANTS: Record<string, Array<{ name: string; lat: number; lng: number; price: number; stars: number; cuisine: string }>> = {
  paris: [
    { name: 'Le Cinq', lat: 48.8686, lng: 2.3018, price: 380, stars: 3, cuisine: 'French' },
    { name: 'Septime', lat: 48.8534, lng: 2.3806, price: 95, stars: 1, cuisine: 'Modern French' },
    { name: 'Le Clarence', lat: 48.8672, lng: 2.3106, price: 320, stars: 2, cuisine: 'French' }
  ],
  london: [
    { name: 'Core by Clare Smyth', lat: 51.5096, lng: -0.1941, price: 195, stars: 3, cuisine: 'British' },
    { name: 'The Clove Club', lat: 51.5265, lng: -0.0834, price: 150, stars: 1, cuisine: 'Modern British' },
    { name: 'Kitchen Table', lat: 51.5288, lng: -0.1388, price: 250, stars: 2, cuisine: 'British' }
  ],
  rome: [
    { name: 'La Pergola', lat: 41.9192, lng: 12.4556, price: 290, stars: 3, cuisine: 'Italian' },
    { name: 'Il Pagliaccio', lat: 41.8974, lng: 12.4710, price: 180, stars: 2, cuisine: 'Creative Italian' },
    { name: 'Pipero', lat: 41.9017, lng: 12.4823, price: 120, stars: 1, cuisine: 'Roman' }
  ],
  barcelona: [
    { name: 'ABaC', lat: 41.4108, lng: 2.1336, price: 210, stars: 3, cuisine: 'Catalan' },
    { name: 'Cinc Sentits', lat: 41.3879, lng: 2.1640, price: 145, stars: 1, cuisine: 'Catalan' },
    { name: 'Cocina Hermanos Torres', lat: 41.3831, lng: 2.1396, price: 195, stars: 2, cuisine: 'Modern Spanish' }
  ],
  amsterdam: [
    { name: 'De Librije Amsterdam', lat: 52.3738, lng: 4.8910, price: 225, stars: 2, cuisine: 'Dutch' },
    { name: '&moshik', lat: 52.3621, lng: 4.8912, price: 195, stars: 2, cuisine: 'Creative' }
  ],
  berlin: [
    { name: 'Rutz', lat: 52.5267, lng: 13.3900, price: 198, stars: 3, cuisine: 'Modern German' },
    { name: 'Facil', lat: 52.5094, lng: 13.3765, price: 165, stars: 2, cuisine: 'European' }
  ],
  vienna: [
    { name: 'Steirereck', lat: 48.2044, lng: 16.3817, price: 210, stars: 2, cuisine: 'Austrian' },
    { name: 'Amador', lat: 48.2112, lng: 16.3598, price: 245, stars: 3, cuisine: 'Creative' }
  ],
  prague: [
    { name: 'La Degustation', lat: 50.0901, lng: 14.4267, price: 165, stars: 1, cuisine: 'Czech' },
    { name: 'Field', lat: 50.0865, lng: 14.4189, price: 120, stars: 1, cuisine: 'Modern Czech' }
  ],
  stockholm: [
    { name: 'Frantzén', lat: 59.3345, lng: 18.0582, price: 350, stars: 3, cuisine: 'Nordic' },
    { name: 'Oaxen Krog', lat: 59.3186, lng: 18.0951, price: 225, stars: 2, cuisine: 'Swedish' }
  ],
  helsinki: [
    { name: 'Olo', lat: 60.1674, lng: 24.9528, price: 175, stars: 1, cuisine: 'Nordic' },
    { name: 'Palace', lat: 60.1668, lng: 24.9543, price: 195, stars: 1, cuisine: 'Finnish' }
  ],
  copenhagen: [
    { name: 'Noma', lat: 55.6833, lng: 12.6103, price: 450, stars: 3, cuisine: 'New Nordic' },
    { name: 'Geranium', lat: 55.7027, lng: 12.5722, price: 400, stars: 3, cuisine: 'Nordic' }
  ],
  oslo: [
    { name: 'Maaemo', lat: 59.9086, lng: 10.7603, price: 380, stars: 3, cuisine: 'Norwegian' },
    { name: 'Rest', lat: 59.9127, lng: 10.7528, price: 145, stars: 1, cuisine: 'Modern Nordic' }
  ],
  dublin: [
    { name: 'Chapter One', lat: 53.3534, lng: -6.2636, price: 135, stars: 1, cuisine: 'Irish' },
    { name: 'Liath', lat: 53.2867, lng: -6.1333, price: 175, stars: 2, cuisine: 'Modern Irish' }
  ],
  lisbon: [
    { name: 'Belcanto', lat: 38.7103, lng: -9.1410, price: 225, stars: 2, cuisine: 'Portuguese' },
    { name: 'Alma', lat: 38.7097, lng: -9.1365, price: 145, stars: 1, cuisine: 'Portuguese' }
  ],
  madrid: [
    { name: 'DiverXO', lat: 40.4573, lng: -3.6877, price: 295, stars: 3, cuisine: 'Avant-garde' },
    { name: 'Smoked Room', lat: 40.4256, lng: -3.6891, price: 180, stars: 2, cuisine: 'Creative Spanish' }
  ],
  zurich: [
    { name: 'The Restaurant', lat: 47.3667, lng: 8.5419, price: 320, stars: 2, cuisine: 'French' },
    { name: 'Ecco Zurich', lat: 47.3648, lng: 8.5504, price: 250, stars: 2, cuisine: 'Creative' }
  ]
}

interface Booking {
  city: string | null
  date: string | null
  time: string | null
  guests: number
  restaurant: string | null
  confirmed: boolean
}

interface Message {
  role: 'user' | 'bot'
  text: string
  responseTime?: number
}

// Map component (client-side only)
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#e8f4f8',
      color: '#666'
    }}>
      Loading map...
    </div>
  )
})

// Chat component
function Chat({ booking, onBookingUpdate, onConfirmed, onSendMessageReady }: {
  booking: Booking
  onBookingUpdate: (b: Booking) => void
  onConfirmed: (orderNumber: string) => void
  onSendMessageReady?: (sendFn: (text: string) => void) => void
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => Math.random().toString(36).slice(2))
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    // Only auto-focus on desktop, not mobile (prevents keyboard popup)
    const isMobile = window.innerWidth <= 768
    if (!loading && !isMobile) {
      inputRef.current?.focus()
    }
  }, [loading])

  useEffect(() => {
    sendMessage('hi')
  }, [])

  useEffect(() => {
    if (onSendMessageReady) {
      onSendMessageReady(sendMessage)
    }
  }, [onSendMessageReady])

  async function sendMessage(text: string) {
    if (!text.trim()) return

    if (text !== 'hi') setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    setLoading(true)

    const startTime = Date.now()
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId })
      })
      const data = await res.json()
      const responseTime = Date.now() - startTime
      setMessages(prev => [...prev, { role: 'bot', text: data.reply, responseTime }])
      onBookingUpdate(data.booking)
      if (data.orderNumber) {
        onConfirmed(data.orderNumber)
      }
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Connection error' }])
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div ref={messagesContainerRef} style={{ flex: 1, overflowY: 'auto', padding: 16, minHeight: 0 }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 10
            }}
          >
            <div style={{
              background: msg.role === 'user' ? '#374151' : '#f0f0f0',
              color: msg.role === 'user' ? 'white' : '#333',
              padding: '10px 14px',
              borderRadius: 16,
              maxWidth: '85%',
              fontSize: 14,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap'
            }}>
              {msg.text}
            </div>
            {msg.role === 'bot' && msg.responseTime && (
              <div style={{ fontSize: 10, color: '#999', marginTop: 2, marginLeft: 4 }}>
                {(msg.responseTime / 1000).toFixed(1)}s
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: '#f0f0f0', padding: '10px 14px', borderRadius: 16, color: '#999', fontSize: 14 }}>
              ...
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        padding: 12,
        gap: 8,
        borderTop: '1px solid #eee'
      }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type here..."
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 20,
            border: '1px solid #ddd',
            fontSize: 16,
            outline: 'none'
          }}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: '10px 20px',
            background: loading || !input.trim() ? '#ccc' : '#374151',
            color: 'white',
            border: 'none',
            borderRadius: 20,
            cursor: loading || !input.trim() ? 'default' : 'pointer',
            fontWeight: 500,
            fontSize: 14
          }}
        >
          Send
        </button>
      </form>
    </div>
  )
}

// Get restaurant details by name and city
function getRestaurantDetails(city: string, restaurantName: string) {
  const restaurants = RESTAURANTS[city.toLowerCase()] || []
  return restaurants.find(r => r.name === restaurantName)
}

// Booking page shown when restaurant is selected
function BookingPage({ booking }: { booking: Booking }) {
  const restaurant = booking.city && booking.restaurant
    ? getRestaurantDetails(booking.city, booking.restaurant)
    : null
  const cityName = booking.city ? booking.city.charAt(0).toUpperCase() + booking.city.slice(1) : ''

  return (
    <div style={{
      height: '100%',
      background: '#FAFAFA',
      display: 'flex',
      flexDirection: 'column',
      padding: 20,
      overflow: 'auto'
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid #E5E7EB',
        paddingBottom: 16,
        marginBottom: 20
      }}>
        <div style={{ fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
          Your Reservation
        </div>
        <h2 style={{
          color: '#111827',
          fontSize: 20,
          fontWeight: 600,
          margin: 0
        }}>
          {restaurant?.name || 'Selecting restaurant...'}
        </h2>
        {cityName && (
          <div style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>
            {cityName} · {restaurant?.cuisine}
          </div>
        )}
      </div>

      {/* Restaurant Info */}
      {restaurant && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: 'white',
          borderRadius: 8,
          border: '1px solid #E5E7EB',
          marginBottom: 20
        }}>
          <div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>Tasting Menu</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#111827' }}>
              €{restaurant.price}<span style={{ fontSize: 14, fontWeight: 400, color: '#6B7280' }}>/person</span>
            </div>
          </div>
          <div style={{
            background: '#FEF3C7',
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 14,
            color: '#92400E'
          }}>
            {'★'.repeat(restaurant.stars)} Michelin
          </div>
        </div>
      )}

      {/* Booking Details */}
      <div style={{
        background: 'white',
        borderRadius: 8,
        border: '1px solid #E5E7EB',
        flex: 1
      }}>
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #E5E7EB',
          fontSize: 12,
          fontWeight: 600,
          color: '#6B7280',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Details
        </div>

        <div style={{ padding: '8px 0' }}>
          {/* Date */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #F3F4F6'
          }}>
            <div style={{ fontSize: 14, color: '#6B7280' }}>Date</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: booking.date ? '#111827' : '#9CA3AF' }}>
              {booking.date || '—'}
            </div>
          </div>

          {/* Time */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #F3F4F6'
          }}>
            <div style={{ fontSize: 14, color: '#6B7280' }}>Time</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: booking.time ? '#111827' : '#9CA3AF' }}>
              {booking.time || '—'}
            </div>
          </div>

          {/* Guests */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px'
          }}>
            <div style={{ fontSize: 14, color: '#6B7280' }}>Guests</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: booking.guests > 0 ? '#111827' : '#9CA3AF' }}>
              {booking.guests > 0 ? `${booking.guests} guest${booking.guests > 1 ? 's' : ''}` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmed Status */}
      {booking.confirmed && (
        <div style={{
          marginTop: 16,
          padding: 16,
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          borderRadius: 8,
          textAlign: 'center'
        }}>
          <div style={{ color: '#065F46', fontWeight: 600, fontSize: 15 }}>Reservation Confirmed</div>
          <div style={{ color: '#047857', fontSize: 13, marginTop: 2 }}>
            Enjoy your dining experience!
          </div>
        </div>
      )}
    </div>
  )
}

// Confirmation screen
function ConfirmationScreen({ booking, orderNumber, onNewBooking }: {
  booking: Booking
  orderNumber: string
  onNewBooking: () => void
}) {
  const restaurant = booking.city && booking.restaurant
    ? getRestaurantDetails(booking.city, booking.restaurant)
    : null
  const cityName = booking.city ? booking.city.charAt(0).toUpperCase() + booking.city.slice(1) : ''

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a5f 0%, #0c1929 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24
    }}>
      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: 40,
        maxWidth: 500,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Success Icon */}
        <div style={{
          width: 80,
          height: 80,
          background: '#ECFDF5',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: 40
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 600, color: '#111827', margin: '0 0 8px' }}>
          Reservation Confirmed
        </h1>
        <p style={{ color: '#6B7280', fontSize: 15, margin: '0 0 32px' }}>
          Your table has been successfully reserved
        </p>

        {/* Reference Number */}
        <div style={{
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          padding: 16,
          marginBottom: 24
        }}>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Confirmation Number</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', letterSpacing: '2px' }}>
            #{orderNumber}
          </div>
        </div>

        {/* Booking Details */}
        <div style={{
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          padding: 20,
          textAlign: 'left',
          marginBottom: 32
        }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
            {restaurant?.name}
          </div>
          <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>
            {cityName} · {restaurant?.cuisine} · {'★'.repeat(restaurant?.stars || 0)} Michelin
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280', fontSize: 14 }}>Date</span>
              <span style={{ color: '#111827', fontSize: 14, fontWeight: 500 }}>{booking.date}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280', fontSize: 14 }}>Time</span>
              <span style={{ color: '#111827', fontSize: 14, fontWeight: 500 }}>{booking.time}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280', fontSize: 14 }}>Guests</span>
              <span style={{ color: '#111827', fontSize: 14, fontWeight: 500 }}>
                {booking.guests} guest{booking.guests > 1 ? 's' : ''}
              </span>
            </div>
            {restaurant && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: 12,
                borderTop: '1px solid #E5E7EB',
                marginTop: 4
              }}>
                <span style={{ color: '#6B7280', fontSize: 14 }}>Tasting Menu</span>
                <span style={{ color: '#111827', fontSize: 14, fontWeight: 600 }}>€{restaurant.price}/person</span>
              </div>
            )}
          </div>
        </div>

        {/* New Booking Button */}
        <button
          onClick={onNewBooking}
          style={{
            width: '100%',
            padding: '14px 24px',
            background: '#374151',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          Make Another Reservation
        </button>
      </div>
    </div>
  )
}

// Main page
export default function Home() {
  const [booking, setBooking] = useState<Booking>({
    city: null,
    date: null,
    time: null,
    guests: 0,
    restaurant: null,
    confirmed: false
  })
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [sendMessage, setSendMessage] = useState<((text: string) => void) | null>(null)
  const mapCardRef = useRef<HTMLDivElement>(null)
  const prevBookingRef = useRef<Booking | null>(null)

  const cityData = booking.city ? CITIES[booking.city.toLowerCase()] : null
  const restaurants = booking.city ? RESTAURANTS[booking.city.toLowerCase()] || [] : []

  // Scroll to map card on mobile when booking changes
  useEffect(() => {
    const prev = prevBookingRef.current
    const isMobile = window.innerWidth <= 768

    if (isMobile && mapCardRef.current && prev) {
      // Scroll to map when city or restaurant changes
      if (booking.city !== prev.city || booking.restaurant !== prev.restaurant || booking.confirmed !== prev.confirmed) {
        mapCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }

    prevBookingRef.current = { ...booking }
  }, [booking])

  const handleRestaurantSelect = (restaurantName: string) => {
    if (sendMessage) {
      sendMessage(`book ${restaurantName}`)
    }
  }

  return (
    <div className="main-container" style={{
      background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
      boxSizing: 'border-box'
    }}>
      <div className="inner-container" style={{ textAlign: 'center', width: '100%', maxWidth: 1000, margin: '0 auto', paddingTop: 80 }}>
        <h1 className="main-title" style={{
          color: 'white',
          fontWeight: 600,
          marginBottom: 8,
          marginTop: 0,
          textShadow: '0 2px 10px rgba(0,0,0,0.3)'
        }}>
          Small Model (1B) Restaurant Agent
        </h1>
        <p className="main-subtitle" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 24, fontSize: 14, marginTop: 0 }}>
          Michelin Restaurant Reservations · Powered by Llama 3.2 1B
        </p>

        <div className="cards-container">
          {/* Left Card: Map, Booking Page, or Confirmation */}
          <div ref={mapCardRef} className="card-left" style={{
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {orderNumber && booking.confirmed ? (
              <div style={{
                height: '100%',
                background: '#FAFAFA',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  background: '#ECFDF5',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#111', marginBottom: 4 }}>Reservation Confirmed</div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>Confirmation #{orderNumber}</div>

                <div style={{
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: 8,
                  padding: 16,
                  width: '100%',
                  maxWidth: 280
                }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 2 }}>
                    {booking.restaurant}
                  </div>
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
                    {booking.city?.charAt(0).toUpperCase()}{booking.city?.slice(1)}
                  </div>
                  <div style={{ fontSize: 13, color: '#444', lineHeight: 1.6 }}>
                    <div>{booking.date} at {booking.time}</div>
                    <div>{booking.guests} guest{booking.guests > 1 ? 's' : ''}</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setBooking({
                      city: null,
                      date: null,
                      time: null,
                      guests: 0,
                      restaurant: null,
                      confirmed: false
                    })
                    setOrderNumber(null)
                  }}
                  style={{
                    marginTop: 20,
                    padding: '10px 20px',
                    background: '#374151',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  New Reservation
                </button>
              </div>
            ) : booking.restaurant ? (
              <BookingPage booking={booking} />
            ) : (
              <MapComponent
                center={cityData ? [cityData.lat, cityData.lng] : [50, 10]}
                zoom={cityData ? cityData.zoom : 4}
                hotels={restaurants}
                selectedHotel={booking.restaurant}
                cities={CITIES}
                onHotelSelect={handleRestaurantSelect}
              />
            )}
          </div>

          {/* Right Card: Chat */}
          <div className="card-right" style={{
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #eee',
              fontWeight: 600,
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              Reservation Assistant
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
              <Chat booking={booking} onBookingUpdate={setBooking} onConfirmed={setOrderNumber} onSendMessageReady={(fn) => setSendMessage(() => fn)} />
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="about-section" style={{
          marginTop: 64,
          marginBottom: 48,
          textAlign: 'left'
        }}>
          {/* Header */}
          <div style={{
            marginBottom: 32,
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between'
          }}>
            <h2 style={{ fontWeight: 600, color: '#fff', fontSize: 20, margin: 0 }}>About</h2>
            <div style={{ fontSize: 12, color: '#666' }}>
              by William Peltomäki
            </div>
          </div>

          {/* Two column layout */}
          <div style={{ display: 'flex', gap: 48, marginBottom: 40 }}>
            {/* Left column - Main concept */}
            <div style={{ flex: 1 }}>
              <h3 style={{ color: '#888', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px' }}>
                The Idea
              </h3>
              <p style={{ color: '#999', fontSize: 14, lineHeight: 1.8, margin: 0 }}>
                You don't need expensive flagship models for every AI task. For structured workflows like booking, forms, and support,
                <strong style={{ color: '#ddd' }}> small models (1-8B parameters)</strong> work remarkably well when you decompose the problem into focused subtasks.
              </p>
            </div>

            {/* Right column - How it works */}
            <div style={{ flex: 1 }}>
              <h3 style={{ color: '#888', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px' }}>
                How It Works
              </h3>
              <p style={{ color: '#999', fontSize: 14, lineHeight: 1.8, margin: 0 }}>
                Each LLM call has one job: classify an intent, extract a date, or match a name. This is
                <strong style={{ color: '#ddd' }}> 100x cheaper</strong> than GPT-4o and fast enough for real-time conversational UX.
              </p>
            </div>
          </div>

          {/* Flow diagram */}
          <div style={{
            marginBottom: 32,
            overflowX: 'auto'
          }}>
            <h3 style={{ color: '#888', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 20px' }}>
              Architecture
            </h3>

            <svg width="900" height="160" style={{ display: 'block' }}>
              {/* Box 1: User Input */}
              <rect x="0" y="35" width="150" height="55" rx="6" fill="transparent" stroke="#333" strokeWidth="1" />
              <text x="75" y="58" fill="#888" fontSize="11" textAnchor="middle">I want the reservation</text>
              <text x="75" y="73" fill="#888" fontSize="11" textAnchor="middle">for 24th of December</text>

              {/* Arrow 1 */}
              <line x1="150" y1="62" x2="175" y2="62" stroke="#444" strokeWidth="1.5" />
              <polygon points="175,58 183,62 175,66" fill="#444" />

              {/* Box 2: Detect Intent */}
              <rect x="188" y="10" width="125" height="130" rx="6" fill="transparent" stroke="#333" strokeWidth="1" />
              <text x="250" y="30" fill="#aaa" fontSize="11" textAnchor="middle" fontWeight="500">Detect Intent</text>
              <line x1="198" y1="38" x2="303" y2="38" stroke="#333" strokeWidth="1" />

              {/* Intent list */}
              <text x="203" y="56" fill="#555" fontSize="9" fontFamily="monospace">SELECT_RESTAURANT</text>
              <text x="203" y="72" fill="#aaa" fontSize="9" fontFamily="monospace" fontWeight="500">PROVIDE_DATE</text>
              <text x="203" y="88" fill="#555" fontSize="9" fontFamily="monospace">PROVIDE_TIME</text>
              <text x="203" y="104" fill="#555" fontSize="9" fontFamily="monospace">PROVIDE_GUESTS</text>
              <text x="203" y="120" fill="#555" fontSize="9" fontFamily="monospace">CONFIRM</text>
              <text x="203" y="136" fill="#555" fontSize="9" fontFamily="monospace">OTHER</text>

              {/* Arrow 2 */}
              <line x1="313" y1="62" x2="338" y2="62" stroke="#444" strokeWidth="1.5" />
              <polygon points="338,58 346,62 338,66" fill="#444" />

              {/* Box 3: Extract Date */}
              <rect x="351" y="25" width="120" height="75" rx="6" fill="transparent" stroke="#333" strokeWidth="1" />
              <text x="411" y="45" fill="#aaa" fontSize="11" textAnchor="middle" fontWeight="500">Extract Date</text>
              <line x1="361" y1="53" x2="461" y2="53" stroke="#333" strokeWidth="1" />
              <text x="411" y="78" fill="#777" fontSize="13" textAnchor="middle" fontFamily="monospace">2024-12-24</text>

              {/* Arrow 3 */}
              <line x1="471" y1="62" x2="496" y2="62" stroke="#444" strokeWidth="1.5" />
              <polygon points="496,58 504,62 496,66" fill="#444" />

              {/* Box 4: Update State */}
              <rect x="509" y="25" width="130" height="75" rx="6" fill="transparent" stroke="#333" strokeWidth="1" />
              <text x="574" y="45" fill="#aaa" fontSize="11" textAnchor="middle" fontWeight="500">Update State</text>
              <line x1="519" y1="53" x2="629" y2="53" stroke="#333" strokeWidth="1" />
              <text x="574" y="72" fill="#555" fontSize="10" textAnchor="middle" fontFamily="monospace">booking.date =</text>
              <text x="574" y="88" fill="#777" fontSize="11" textAnchor="middle" fontFamily="monospace">2024-12-24</text>

              {/* Arrow 4 */}
              <line x1="639" y1="62" x2="664" y2="62" stroke="#444" strokeWidth="1.5" />
              <polygon points="664,58 672,62 664,66" fill="#444" />

              {/* Box 5: Bot Reply */}
              <rect x="677" y="25" width="160" height="75" rx="6" fill="transparent" stroke="#333" strokeWidth="1" />
              <text x="757" y="45" fill="#aaa" fontSize="11" textAnchor="middle" fontWeight="500">Bot Reply</text>
              <line x1="687" y1="53" x2="827" y2="53" stroke="#333" strokeWidth="1" />
              <text x="757" y="72" fill="#777" fontSize="10" textAnchor="middle">Got it – December 24.</text>
              <text x="757" y="88" fill="#777" fontSize="10" textAnchor="middle">What time would you like to dine?</text>
            </svg>
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex',
            gap: 40,
            fontSize: 13,
            color: '#555',
            borderTop: '1px solid #222',
            paddingTop: 24
          }}>
            <div><span style={{ color: '#888', fontWeight: 500 }}>~80</span> tokens/request</div>
            <div><span style={{ color: '#888', fontWeight: 500 }}>$0.000004</span> per interaction</div>
            <div><span style={{ color: '#888', fontWeight: 500 }}>100x</span> cheaper than GPT-4o</div>
          </div>
        </div>
      </div>
    </div>
  )
}
