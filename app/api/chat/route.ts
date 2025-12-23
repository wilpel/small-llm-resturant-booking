import { NextRequest, NextResponse } from 'next/server'

// Rate limiting
const LIMITS = {
  MAX_INPUT_WORDS: 150,
  DAILY_TOKEN_LIMIT: 10_000_000,
  ABSOLUTE_TOKEN_LIMIT: 100_000_000
}

// Global token tracking (persists across requests, resets on server restart)
// For production, use Redis or a database
const tokenUsage = {
  daily: 0,
  dailyResetDate: new Date().toDateString(),
  total: 0
}

function checkAndUpdateTokens(estimatedTokens: number): { allowed: boolean; reason?: string } {
  // Reset daily counter if new day
  const today = new Date().toDateString()
  if (tokenUsage.dailyResetDate !== today) {
    tokenUsage.daily = 0
    tokenUsage.dailyResetDate = today
  }

  // Check absolute limit
  if (tokenUsage.total >= LIMITS.ABSOLUTE_TOKEN_LIMIT) {
    return { allowed: false, reason: 'Service temporarily unavailable. Global token limit reached.' }
  }

  // Check daily limit
  if (tokenUsage.daily >= LIMITS.DAILY_TOKEN_LIMIT) {
    return { allowed: false, reason: 'Daily limit reached. Please try again tomorrow.' }
  }

  // Update counters
  tokenUsage.daily += estimatedTokens
  tokenUsage.total += estimatedTokens

  return { allowed: true }
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length
}

// Booking state
interface Booking {
  city: string | null
  date: string | null
  time: string | null
  guests: number
  restaurant: string | null
  confirmed: boolean
}

// Available cities and restaurants
const CITIES = ['paris', 'london', 'rome', 'barcelona', 'amsterdam', 'berlin', 'vienna', 'prague', 'stockholm', 'helsinki', 'copenhagen', 'oslo', 'dublin', 'lisbon', 'madrid', 'zurich']

interface RestaurantInfo {
  name: string
  price: number
  stars: number
  cuisine: string
  description: string
  signature: string
}

const RESTAURANTS: Record<string, RestaurantInfo[]> = {
  paris: [
    { name: 'Le Cinq', price: 380, stars: 3, cuisine: 'French', description: 'Elegant dining at Four Seasons George V. Classic French cuisine reimagined with modern techniques.', signature: 'Brittany blue lobster, duck foie gras' },
    { name: 'Septime', price: 95, stars: 1, cuisine: 'Modern French', description: 'Hip, intimate spot in the 11th. Seasonal tasting menus with natural wines.', signature: 'Market-driven dishes, fermented vegetables' },
    { name: 'Le Clarence', price: 320, stars: 2, cuisine: 'French', description: 'Stunning 19th-century mansion. Refined French cuisine by Christophe Pelé.', signature: 'Langoustine, aged Wagyu beef' }
  ],
  london: [
    { name: 'Core by Clare Smyth', price: 195, stars: 3, cuisine: 'British', description: 'Elegant Notting Hill restaurant celebrating British produce and heritage.', signature: 'Potato and roe, lamb carrot' },
    { name: 'The Clove Club', price: 150, stars: 1, cuisine: 'Modern British', description: 'Inventive tasting menus in a former town hall in Shoreditch.', signature: 'Buttermilk fried chicken, raw Orkney scallop' },
    { name: 'Kitchen Table', price: 250, stars: 2, cuisine: 'British', description: 'Intimate 20-seat counter dining behind Bubbledogs.', signature: "Chef's choice tasting menu" }
  ],
  rome: [
    { name: 'La Pergola', price: 290, stars: 3, cuisine: 'Italian', description: 'Rooftop fine dining at Rome Cavalieri with panoramic views.', signature: 'Roman artichoke, Mediterranean red mullet' },
    { name: 'Il Pagliaccio', price: 180, stars: 2, cuisine: 'Creative Italian', description: 'Intimate restaurant with creative Mediterranean cuisine.', signature: 'Squid carbonara, suckling pig' },
    { name: 'Pipero', price: 120, stars: 1, cuisine: 'Roman', description: 'Contemporary Roman cuisine in elegant surroundings.', signature: 'Cacio e pepe, Roman-style tripe' }
  ],
  barcelona: [
    { name: 'ABaC', price: 210, stars: 3, cuisine: 'Catalan', description: 'Avant-garde Catalan cuisine by Jordi Cruz. Theatrical presentations.', signature: 'Sea urchin, Iberian pork' },
    { name: 'Cinc Sentits', price: 145, stars: 1, cuisine: 'Catalan', description: 'Modern Catalan cuisine celebrating local producers.', signature: 'Seasonal Catalan tasting menu' },
    { name: 'Cocina Hermanos Torres', price: 195, stars: 2, cuisine: 'Modern Spanish', description: 'Open kitchen concept by twin chef brothers.', signature: 'Rice dishes, Iberian ham' }
  ],
  amsterdam: [
    { name: 'De Librije Amsterdam', price: 225, stars: 2, cuisine: 'Dutch', description: 'Refined Dutch cuisine in the Waldorf Astoria.', signature: 'North Sea fish, Dutch vegetables' },
    { name: '&moshik', price: 195, stars: 2, cuisine: 'Creative', description: 'Playful, creative cuisine with unexpected flavor combinations.', signature: 'Surprise tasting menu' }
  ],
  berlin: [
    { name: 'Rutz', price: 198, stars: 3, cuisine: 'Modern German', description: 'Innovative German cuisine focused on regional ingredients.', signature: 'Brandenburg vegetables, German wines' },
    { name: 'Facil', price: 165, stars: 2, cuisine: 'European', description: 'Elegant rooftop restaurant at The Mandala Hotel.', signature: 'Seasonal European dishes' }
  ],
  vienna: [
    { name: 'Steirereck', price: 210, stars: 2, cuisine: 'Austrian', description: 'Iconic Austrian restaurant in Stadtpark. Contemporary Alpine cuisine.', signature: 'Char with beeswax, wild herbs' },
    { name: 'Amador', price: 245, stars: 3, cuisine: 'Creative', description: 'Spanish chef Juan Amador brings avant-garde techniques to Vienna.', signature: 'Creative tasting journey' }
  ],
  prague: [
    { name: 'La Degustation', price: 165, stars: 1, cuisine: 'Czech', description: 'Bohemian cuisine reimagined with French techniques.', signature: 'Czech classics modernized' },
    { name: 'Field', price: 120, stars: 1, cuisine: 'Modern Czech', description: 'Farm-to-table focus with Czech ingredients.', signature: 'Seasonal Czech produce' }
  ],
  stockholm: [
    { name: 'Frantzén', price: 350, stars: 3, cuisine: 'Nordic', description: 'Multi-floor dining experience. Swedish ingredients with global influences.', signature: 'Nordic tasting journey' },
    { name: 'Oaxen Krog', price: 225, stars: 2, cuisine: 'Swedish', description: 'Waterfront restaurant on Djurgården. Refined Nordic cuisine.', signature: 'Swedish seasonal menu' }
  ],
  helsinki: [
    { name: 'Olo', price: 175, stars: 1, cuisine: 'Nordic', description: 'Finnish ingredients showcased with Nordic creativity.', signature: 'Finnish archipelago fish, forest berries' },
    { name: 'Palace', price: 195, stars: 1, cuisine: 'Finnish', description: 'Classic Helsinki fine dining with harbor views.', signature: 'Finnish classics refined' }
  ],
  copenhagen: [
    { name: 'Noma', price: 450, stars: 3, cuisine: 'New Nordic', description: 'The legendary restaurant that defined New Nordic cuisine.', signature: 'Seasonal themes: ocean, vegetable, game & forest' },
    { name: 'Geranium', price: 400, stars: 3, cuisine: 'Nordic', description: 'Overlooking Fælledparken. Pure, aesthetic Nordic cuisine.', signature: 'Vegetable-forward tasting menu' }
  ],
  oslo: [
    { name: 'Maaemo', price: 380, stars: 3, cuisine: 'Norwegian', description: 'Pure Norwegian terroir. Ingredients from Norwegian nature.', signature: 'Norwegian landscape on a plate' },
    { name: 'Rest', price: 145, stars: 1, cuisine: 'Modern Nordic', description: 'Zero-waste philosophy with creative Nordic dishes.', signature: 'Sustainable tasting menu' }
  ],
  dublin: [
    { name: 'Chapter One', price: 135, stars: 1, cuisine: 'Irish', description: 'Basement restaurant in the Dublin Writers Museum.', signature: 'Irish beef, Atlantic seafood' },
    { name: 'Liath', price: 175, stars: 2, cuisine: 'Modern Irish', description: 'Intimate restaurant in Blackrock. Bold Irish cuisine.', signature: 'Irish ingredients reimagined' }
  ],
  lisbon: [
    { name: 'Belcanto', price: 225, stars: 2, cuisine: 'Portuguese', description: 'José Avillez flagship. Portuguese cuisine with creative flair.', signature: 'Codfish, suckling pig' },
    { name: 'Alma', price: 145, stars: 1, cuisine: 'Portuguese', description: 'Contemporary Portuguese in a historic setting.', signature: 'Seafood rice, Portuguese classics' }
  ],
  madrid: [
    { name: 'DiverXO', price: 295, stars: 3, cuisine: 'Avant-garde', description: 'Dabiz Muñoz wild, theatrical dining experience.', signature: 'Unexpected flavor explosions' },
    { name: 'Smoked Room', price: 180, stars: 2, cuisine: 'Creative Spanish', description: 'Smoke and fire cooking techniques.', signature: 'Smoked and grilled specialties' }
  ],
  zurich: [
    { name: 'The Restaurant', price: 320, stars: 2, cuisine: 'French', description: 'The Dolder Grand flagship. Classic French with Swiss precision.', signature: 'French classics, Swiss ingredients' },
    { name: 'Ecco Zurich', price: 250, stars: 2, cuisine: 'Creative', description: 'Creative European cuisine at Atlantis by Giardino.', signature: 'Innovative tasting menus' }
  ]
}

// Session storage
const sessions: Map<string, {
  booking: Booking
  lastAsked: string | null
  lastMentionedRestaurant: string | null
  lastQuestion: string | null
}> = new Map()

function getSession(id: string) {
  if (!sessions.has(id)) {
    sessions.set(id, {
      booking: { city: null, date: null, time: null, guests: 0, restaurant: null, confirmed: false },
      lastAsked: null,
      lastMentionedRestaurant: null,
      lastQuestion: null
    })
  }
  return sessions.get(id)!
}

function emptyBooking(): Booking {
  return { city: null, date: null, time: null, guests: 0, restaurant: null, confirmed: false }
}

// LLM Provider Configuration
type LLMProvider = 'ollama' | 'groq'

const LLM_CONFIG = {
  provider: (process.env.LLM_PROVIDER || 'groq') as LLMProvider,
  ollama: {
    url: 'http://localhost:11434/api/generate',
    model: 'gemma3:4b'
  },
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.1-8b-instant',
    apiKey: process.env.GROQ_API_KEY || ''
  }
}

async function callGroq(prompt: string, maxTokens: number = 50): Promise<string> {
  const res = await fetch(LLM_CONFIG.groq.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LLM_CONFIG.groq.apiKey}`
    },
    body: JSON.stringify({
      model: LLM_CONFIG.groq.model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Be concise but complete.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0,
      max_tokens: maxTokens
    })
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

async function callOllama(prompt: string): Promise<string> {
  const res = await fetch(LLM_CONFIG.ollama.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: LLM_CONFIG.ollama.model,
      prompt,
      stream: false,
      options: { temperature: 0, num_predict: 30 }
    })
  })
  const data = await res.json()
  return data.response?.trim().split('\n')[0] || ''
}

async function llm(prompt: string, maxTokens: number = 50): Promise<string> {
  try {
    if (LLM_CONFIG.provider === 'groq') {
      return await callGroq(prompt, maxTokens)
    }
    return await callOllama(prompt)
  } catch {
    return ''
  }
}

async function llmChat(prompt: string): Promise<string> {
  return llm(prompt, 200)
}

// Intent types
type DateStepIntent = 'PROVIDE_DATE' | 'GO_BACK_RESTAURANT' | 'GO_BACK_CITY' | 'PROVIDE_GUESTS' | 'CANCEL' | 'OTHER'
type TimeStepIntent = 'PROVIDE_TIME' | 'GO_BACK_RESTAURANT' | 'GO_BACK_CITY' | 'GO_BACK_DATE' | 'CANCEL' | 'OTHER'
type GuestStepIntent = 'PROVIDE_GUESTS' | 'GO_BACK_RESTAURANT' | 'GO_BACK_CITY' | 'GO_BACK_DATE' | 'CONFIRM_YES' | 'CONFIRM_NO' | 'CANCEL' | 'OTHER'
type RestaurantStepIntent = 'SELECT_RESTAURANT' | 'ASK_ABOUT_RESTAURANT' | 'CHANGE_CITY' | 'CANCEL' | 'OTHER'
type ConfirmStepIntent = 'CONFIRM_YES' | 'CONFIRM_NO' | 'CHANGE_SOMETHING' | 'OTHER'

async function getDateStepIntent(msg: string, lastQuestion?: string): Promise<DateStepIntent> {
  const context = lastQuestion ? `AI just asked: "${lastQuestion}"\n` : ''
  const r = await llm(`${context}User replied: "${msg}"

What does the user want? Pick ONE action:
- PROVIDE_DATE: giving a date (e.g., "dec 30", "january 5", "tomorrow", "next friday")
- GO_BACK_RESTAURANT: wants different restaurant
- GO_BACK_CITY: wants different city
- PROVIDE_GUESTS: giving number of guests like "5", "2 people"
- CANCEL: wants to cancel
- OTHER: uncertain, asking questions ("i dont know", "not sure")

Reply with ONE action name only.`)
  const valid: DateStepIntent[] = ['PROVIDE_DATE', 'GO_BACK_RESTAURANT', 'GO_BACK_CITY', 'PROVIDE_GUESTS', 'CANCEL', 'OTHER']
  for (const v of valid) {
    if (r.includes(v)) return v
  }
  return 'OTHER'
}

async function getTimeStepIntent(msg: string, lastQuestion?: string): Promise<TimeStepIntent> {
  const context = lastQuestion ? `AI just asked: "${lastQuestion}"\n` : ''
  const r = await llm(`${context}User replied: "${msg}"

What does the user want? Pick ONE action:
- PROVIDE_TIME: giving a time (e.g., "7pm", "8:30", "19:00", "dinner time", "evening")
- GO_BACK_RESTAURANT: wants different restaurant
- GO_BACK_CITY: wants different city
- GO_BACK_DATE: wants to change the date
- CANCEL: wants to cancel
- OTHER: uncertain, asking questions

Reply with ONE action name only.`)
  const valid: TimeStepIntent[] = ['PROVIDE_TIME', 'GO_BACK_RESTAURANT', 'GO_BACK_CITY', 'GO_BACK_DATE', 'CANCEL', 'OTHER']
  for (const v of valid) {
    if (r.includes(v)) return v
  }
  return 'OTHER'
}

async function getGuestStepIntent(msg: string, lastQuestion?: string): Promise<GuestStepIntent> {
  const context = lastQuestion ? `AI just asked: "${lastQuestion}"\n` : ''
  const r = await llm(`${context}User replied: "${msg}"

What does the user want? Pick ONE action:
- PROVIDE_GUESTS: giving a number of guests ("2", "4", "just me", "me and wife", "3 people")
- GO_BACK_RESTAURANT: wants different restaurant
- GO_BACK_CITY: wants different city
- GO_BACK_DATE: wants to change date/time
- CONFIRM_YES: confirming like "yes", "correct", "right"
- CONFIRM_NO: denying like "no", "wrong"
- CANCEL: wants to cancel
- OTHER: asking questions ("why?", "what's the max?")

"2"=PROVIDE_GUESTS, "4"=PROVIDE_GUESTS.
Reply with ONE action name only.`)
  const valid: GuestStepIntent[] = ['PROVIDE_GUESTS', 'GO_BACK_RESTAURANT', 'GO_BACK_CITY', 'GO_BACK_DATE', 'CONFIRM_YES', 'CONFIRM_NO', 'CANCEL', 'OTHER']
  for (const v of valid) {
    if (r.includes(v)) return v
  }
  return 'OTHER'
}

async function getRestaurantStepIntent(msg: string, restaurantNames: string, lastQuestion?: string): Promise<RestaurantStepIntent> {
  const context = lastQuestion ? `AI just asked: "${lastQuestion}"\n` : ''
  const r = await llm(`${context}User replied: "${msg}"
Available restaurants: ${restaurantNames}

What does the user want? Pick ONE action:
- ASK_ABOUT_RESTAURANT: asking for info/details about a restaurant ("tell me about X", "tell me more about X", "what's X like?", "more info on X", "describe X")
- SELECT_RESTAURANT: wants to BOOK a restaurant NOW ("book X", "reserve X", "I'll take X", "yes", "book it", "let's go with X")
- CHANGE_CITY: mentions a different city/country
- CANCEL: wants to cancel
- OTHER: comparing restaurants, general questions ("which is best?", "recommend one", "cheapest?")

IMPORTANT:
- "tell me more about X" = ASK_ABOUT_RESTAURANT (asking for info, NOT booking)
- "tell me about X" = ASK_ABOUT_RESTAURANT
- "book X" = SELECT_RESTAURANT (explicit booking)
- "I want X" = SELECT_RESTAURANT
Reply with ONE action name only.`)
  const valid: RestaurantStepIntent[] = ['SELECT_RESTAURANT', 'ASK_ABOUT_RESTAURANT', 'CHANGE_CITY', 'CANCEL', 'OTHER']
  for (const v of valid) {
    if (r.includes(v)) return v
  }
  return 'OTHER'
}

async function getConfirmStepIntent(msg: string, lastQuestion?: string): Promise<ConfirmStepIntent> {
  const context = lastQuestion ? `AI just asked: "${lastQuestion}"\n` : ''
  const r = await llm(`${context}User replied: "${msg}"

What does the user want? Pick ONE action:
- CONFIRM_YES: confirming the reservation ("yes", "confirm", "book it")
- CONFIRM_NO: rejecting/cancelling ("no", "cancel")
- CHANGE_SOMETHING: wants to change something
- OTHER: uncertain, asking questions

Reply with ONE action name only.`)
  const valid: ConfirmStepIntent[] = ['CONFIRM_YES', 'CONFIRM_NO', 'CHANGE_SOMETHING', 'OTHER']
  for (const v of valid) {
    if (r.includes(v)) return v
  }
  return 'OTHER'
}

// Match restaurant by name
async function whichRestaurant(msg: string, restaurants: RestaurantInfo[]): Promise<RestaurantInfo | null> {
  const names = restaurants.map(r => r.name).join(', ')
  const r = await llm(`User said: "${msg}"
Restaurants: ${names}

Which restaurant is user referring to?
Reply with the EXACT restaurant name from the list, or NONE.`)

  for (const rest of restaurants) {
    if (r.includes(rest.name)) return rest
  }
  return null
}

// Match city
async function matchCity(msg: string): Promise<string | null> {
  const msgLower = msg.toLowerCase()

  // Direct match first - check if message contains a city name
  for (const city of CITIES) {
    if (msgLower.includes(city)) return city
  }

  // Quick check for common country names
  const countryMap: Record<string, string> = {
    'france': 'paris', 'french': 'paris',
    'finland': 'helsinki', 'finnish': 'helsinki',
    'spain': 'madrid', 'spanish': 'madrid',
    'italy': 'rome', 'italian': 'rome',
    'uk': 'london', 'england': 'london', 'britain': 'london', 'british': 'london',
    'germany': 'berlin', 'german': 'berlin',
    'austria': 'vienna', 'austrian': 'vienna',
    'czech': 'prague', 'czechia': 'prague',
    'sweden': 'stockholm', 'swedish': 'stockholm',
    'denmark': 'copenhagen', 'danish': 'copenhagen',
    'norway': 'oslo', 'norwegian': 'oslo',
    'ireland': 'dublin', 'irish': 'dublin',
    'portugal': 'lisbon', 'portuguese': 'lisbon',
    'netherlands': 'amsterdam', 'dutch': 'amsterdam', 'holland': 'amsterdam',
    'switzerland': 'zurich', 'swiss': 'zurich'
  }

  for (const [term, city] of Object.entries(countryMap)) {
    if (msgLower.includes(term)) return city
  }

  // Use LLM to detect cities from landmarks, misspellings, or context
  const cityList = CITIES.join(', ')
  const r = await llm(`User said: "${msg}"

Which city is the user referring to? Available: ${cityList}

Detect from:
- City names (even misspelled): "prauge"→prague, "cophenhagen"→copenhagen
- Country names (even misspelled): "swizerland"→zurich, "switerland"→zurich, "itally"→rome, "frace"→paris
- Landmark NAMES: "eiffel tower"→paris, "colosseum"→rome, "big ben"→london
- Landmark DESCRIPTIONS: "large clock tower"→london (Big Ben), "tall iron tower"→paris (Eiffel)
- Context: "near the louvre"→paris, "by the vatican"→rome

Think about what the user means, even with typos.
If no city/landmark/country mentioned, reply NONE.
Reply with just the city name in lowercase, or NONE.`)

  const rClean = r.toLowerCase().trim().split(/[\s,.:!?]/)[0]
  if (rClean === 'none' || rClean.includes('none')) return null
  for (const city of CITIES) {
    if (rClean === city || rClean.includes(city)) return city
  }
  return null
}

// Check for unsupported location
async function isUnsupportedLocation(msg: string): Promise<string | null> {
  const r = await llm(`User said: "${msg}"

SUPPORTED cities & countries (reply NONE for these):
- Paris (France)
- London (UK/England)
- Rome (Italy)
- Barcelona, Madrid (Spain)
- Amsterdam (Netherlands)
- Berlin (Germany)
- Vienna (Austria)
- Prague (Czech Republic)
- Stockholm (Sweden)
- Helsinki (Finland)
- Copenhagen (Denmark)
- Oslo (Norway)
- Dublin (Ireland)
- Lisbon (Portugal)
- Zurich (Switzerland)

Is user asking for an UNSUPPORTED location?
UNSUPPORTED: "tokyo"→Tokyo, "japan"→Japan, "new york"→New York
SUPPORTED: "switzerland"→NONE, "swizerland"→NONE, "france"→NONE

Reply with unsupported location name, or NONE if supported/unclear.`)

  if (!r || r.includes('NONE') || r.length > 20) return null
  return r.trim()
}

// Get today's date
function getTodayStr(): string {
  const d = new Date()
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear()
}

// Extract date
async function extractDate(msg: string, lastQuestion?: string): Promise<string | null> {
  const today = getTodayStr()
  const context = lastQuestion ? `AI just asked: "${lastQuestion}"\n` : ''
  const r = await llm(`${context}Today: ${today}
User said: "${msg}"
Extract the date if provided.
"22 dec"→"Dec 22", "jan 1"→"Jan 1", "tomorrow"→add 1 day to today, "next friday"→find next Friday.
Reply ONLY the date like "Dec 22" or "Jan 27" or NONE.`)

  if (!r || r.includes('NONE') || r.length > 15) return null
  return r.trim()
}

// Extract time
async function extractTime(msg: string, lastQuestion?: string): Promise<string | null> {
  const context = lastQuestion ? `AI just asked: "${lastQuestion}"\n` : ''
  const r = await llm(`${context}User said: "${msg}"
Extract the time if provided.
"7pm"→"7:00 PM", "8:30"→"8:30 PM", "19:00"→"7:00 PM", "evening"→"7:00 PM", "dinner"→"7:30 PM", "lunch"→"12:30 PM"
Reply ONLY the time like "7:00 PM" or "8:30 PM" or NONE.`)

  if (!r || r.includes('NONE') || r.length > 15) return null
  return r.trim()
}

// Extract guests
async function extractGuests(msg: string, lastQuestion?: string): Promise<number> {
  const context = lastQuestion ? `AI just asked: "${lastQuestion}"\n` : ''
  const r = await llm(`${context}User replied: "${msg}"

How many guests? Extract the number.
"2"→2, "4"→4, "just me"→1, "me and wife"→2, "5 people"→5.
Reply with JUST the number, or NO if not about guests.`)

  if (!r || r.includes('NO')) return -1
  const match = r.match(/\d+/)
  if (match) return Number(match[0])
  return -1
}

// Response type
interface ChatResponse {
  reply: string
  booking: Booking
  restaurants?: RestaurantInfo[]
  orderNumber?: string
}

// Main chat handler
async function handleChat(sessionId: string, msg: string): Promise<ChatResponse> {
  const session = getSession(sessionId)
  const { booking, lastAsked } = session

  // First message
  if (!lastAsked && !booking.city) {
    session.lastAsked = 'city'
    return { reply: "Welcome! I can help you book Michelin-starred restaurants across Europe. Which city would you like to dine in?", booking }
  }

  // CITY
  if (lastAsked === 'city') {
    // Check for greetings first
    const greetings = ['hi', 'hey', 'hello', 'hola', 'hej', 'howdy', 'yo', 'sup', 'greetings']
    const msgLower = msg.toLowerCase().trim()
    if (greetings.some(g => msgLower === g || msgLower.startsWith(g + ' ') || msgLower.startsWith(g + '!'))) {
      return { reply: "Hey there! Ready to find you a great Michelin restaurant. Which European city would you like to dine in?", booking }
    }

    const city = await matchCity(msg)
    if (city) {
      booking.city = city
      session.lastAsked = 'restaurant'
      const restaurants = RESTAURANTS[city] || []
      const cityName = city[0].toUpperCase() + city.substring(1)
      let list = ''
      for (const r of restaurants) {
        list += `• ${r.name} - ${'★'.repeat(r.stars)} - €${r.price} - ${r.cuisine}\n`
      }
      return { reply: `${cityName}! We have ${restaurants.length} Michelin restaurants:\n\n${list}\nClick a restaurant card or tell me which one interests you.`, booking, restaurants }
    }

    const unsupported = await isUnsupportedLocation(msg)
    if (unsupported) {
      return { reply: `Sorry, we don't have restaurants in ${unsupported} yet. We cover Paris, London, Rome, Barcelona, Amsterdam, Berlin, Vienna, Prague, Stockholm, Helsinki, Copenhagen, Oslo, Dublin, Lisbon, Madrid, and Zurich. Which city interests you?`, booking }
    }

    // Check if user is asking for help with something completely unrelated
    const unrelatedCheck = await llm(`User: "${msg}"

Is this asking you to DO a task unrelated to restaurants/dining/travel?
UNRELATED examples: "write code for me", "solve 2+2", "what's the weather", "translate this", "create an app"
RELATED examples: "hey", "hello", "can we do X", "i want X", "how about X", "switzerland", "swizerland", "paris", "near the tower"

Greetings = RELATED
Locations/countries/cities/landmarks = RELATED
"can we do [place]" = RELATED
Wanting/asking about places = RELATED
Asking for non-restaurant tasks = UNRELATED

Reply RELATED or UNRELATED only.`)

    if (unrelatedCheck.toUpperCase().includes('UNRELATED')) {
      return { reply: "I'm a Michelin restaurant booking assistant - I can only help with restaurant reservations across Europe. Which city would you like to dine in?", booking }
    }

    const reply = await llmChat(`You are a friendly Michelin restaurant booking assistant.
User said: "${msg}"
Respond naturally and briefly. Then ask which European city they'd like to dine in. Keep response to 1-2 sentences max.`)
    return { reply: reply || "Which European city would you like to dine in?", booking }
  }

  // RESTAURANT
  if (lastAsked === 'restaurant') {
    const restaurants = RESTAURANTS[booking.city!] || []
    const names = restaurants.map(r => r.name).join(', ')
    const intent = await getRestaurantStepIntent(msg, names, session.lastQuestion || undefined)

    if (intent === 'CANCEL') {
      sessions.delete(sessionId)
      return { reply: "No problem! Let's start fresh. Which city interests you?", booking: emptyBooking() }
    }

    if (intent === 'CHANGE_CITY') {
      const newCity = await matchCity(msg)
      if (newCity && newCity !== booking.city) {
        booking.city = newCity
        booking.restaurant = null
        const newRestaurants = RESTAURANTS[newCity] || []
        const cityName = newCity[0].toUpperCase() + newCity.substring(1)
        let list = ''
        for (const r of newRestaurants) {
          list += `• ${r.name} - ${'★'.repeat(r.stars)} - €${r.price} - ${r.cuisine}\n`
        }
        return { reply: `Switching to ${cityName}!\n\n${list}\nWhich restaurant interests you?`, booking, restaurants: newRestaurants }
      }
      const unsupported = await isUnsupportedLocation(msg)
      if (unsupported) {
        return { reply: `Sorry, we don't have restaurants in ${unsupported}. Which restaurant in ${booking.city!.charAt(0).toUpperCase() + booking.city!.slice(1)} would you like?`, booking }
      }
    }

    if (intent === 'SELECT_RESTAURANT') {
      if (session.lastMentionedRestaurant) {
        const rest = restaurants.find(r => r.name === session.lastMentionedRestaurant)
        if (rest) {
          booking.restaurant = rest.name
          session.lastMentionedRestaurant = null
          session.lastAsked = 'date'
          return { reply: `Excellent! ${rest.name} - ${'★'.repeat(rest.stars)} Michelin.\n\nWhat date would you like to dine?`, booking }
        }
      }
      const match = await whichRestaurant(msg, restaurants)
      if (match) {
        booking.restaurant = match.name
        session.lastMentionedRestaurant = null
        session.lastAsked = 'date'
        return { reply: `Great choice! ${match.name} - ${'★'.repeat(match.stars)} Michelin, €${match.price} tasting menu.\n\nWhat date would you like to reserve?`, booking }
      }
    }

    if (intent === 'ASK_ABOUT_RESTAURANT') {
      const match = await whichRestaurant(msg, restaurants)
      if (match) {
        session.lastMentionedRestaurant = match.name
        const answer = await llmChat(`User asked: "${msg}"

Restaurant: ${match.name}
Stars: ${'★'.repeat(match.stars)} Michelin
Price: €${match.price} per person
Cuisine: ${match.cuisine}
Description: ${match.description}
Signature: ${match.signature}

Answer the question about THIS restaurant. Be concise. Ask if they'd like to book.`)
        return { reply: answer, booking }
      }
    }

    // For OTHER intent or any fallthrough, use LLM to respond naturally
    const details = restaurants.map(r => `${r.name}: ${'★'.repeat(r.stars)}, €${r.price}, ${r.cuisine} - ${r.description}`).join('\n')
    const answer = await llmChat(`You are a Michelin restaurant booking assistant.
City: ${booking.city}
Available restaurants:
${details}

User said: "${msg}"

Answer their question or respond naturally using the restaurant info above. Be helpful. Then ask which restaurant they'd like to book.`)
    return { reply: answer, booking }
  }

  // DATE
  if (lastAsked === 'date') {
    const intent = await getDateStepIntent(msg, session.lastQuestion || undefined)

    if (intent === 'CANCEL') {
      sessions.delete(sessionId)
      return { reply: "No problem! Let's start fresh. Which city interests you?", booking: emptyBooking() }
    }

    if (intent === 'GO_BACK_RESTAURANT') {
      booking.restaurant = null
      session.lastAsked = 'restaurant'
      const restaurants = RESTAURANTS[booking.city!] || []
      let list = ''
      for (const r of restaurants) {
        list += `• ${r.name} - ${'★'.repeat(r.stars)} - €${r.price}\n`
      }
      return { reply: `No problem! Here are the restaurants:\n\n${list}\nWhich one interests you?`, booking, restaurants }
    }

    if (intent === 'GO_BACK_CITY') {
      booking.city = null
      booking.restaurant = null
      session.lastAsked = 'city'
      return { reply: "Sure! Which city would you like instead?", booking }
    }

    if (intent === 'PROVIDE_DATE') {
      const date = await extractDate(msg, session.lastQuestion || undefined)
      if (date) {
        booking.date = date
        session.lastAsked = 'time'
        return { reply: `${date}. What time would you like to dine? (e.g., 7pm, 8:30pm)`, booking }
      }
    }

    if (intent === 'PROVIDE_GUESTS') {
      const guests = await extractGuests(msg, session.lastQuestion || undefined)
      if (guests > 0 && guests <= 10) {
        booking.guests = guests
        return { reply: `Noted, ${guests} guests. What date would you like?`, booking }
      }
    }

    // For OTHER or fallthrough, use LLM
    const answer = await llmChat(`You are a Michelin restaurant booking assistant.
Current: ${booking.restaurant} in ${booking.city}.
User said: "${msg}"
Answer naturally, then ask for the date they'd like to dine.`)
    return { reply: answer, booking }
  }

  // TIME
  if (lastAsked === 'time') {
    const intent = await getTimeStepIntent(msg, session.lastQuestion || undefined)

    if (intent === 'CANCEL') {
      sessions.delete(sessionId)
      return { reply: "No problem! Let's start fresh. Which city interests you?", booking: emptyBooking() }
    }

    if (intent === 'GO_BACK_DATE') {
      booking.date = null
      session.lastAsked = 'date'
      return { reply: "Okay, what date would you prefer?", booking }
    }

    if (intent === 'PROVIDE_TIME') {
      const time = await extractTime(msg, session.lastQuestion || undefined)
      if (time) {
        booking.time = time
        session.lastAsked = 'guests'
        return { reply: `${booking.date} at ${time}. How many guests?`, booking }
      }
    }

    // For OTHER or fallthrough, use LLM
    const answer = await llmChat(`You are a Michelin restaurant booking assistant.
Current: ${booking.restaurant} on ${booking.date}.
User said: "${msg}"
Answer naturally, then ask what time they'd like to dine.`)
    return { reply: answer, booking }
  }

  // GUESTS
  if (lastAsked === 'guests') {
    const intent = await getGuestStepIntent(msg, session.lastQuestion || undefined)

    if (intent === 'CANCEL') {
      sessions.delete(sessionId)
      return { reply: "No problem! Let's start fresh. Which city interests you?", booking: emptyBooking() }
    }

    if (intent === 'CONFIRM_YES' && booking.guests > 0) {
      session.lastAsked = 'confirm'
      const restaurants = RESTAURANTS[booking.city!] || []
      const rest = restaurants.find(r => r.name === booking.restaurant)
      const cityName = booking.city!.charAt(0).toUpperCase() + booking.city!.slice(1)
      return {
        reply: `Perfect! Here's your reservation:\n\n${booking.restaurant} - ${cityName}\n${'★'.repeat(rest?.stars || 1)} Michelin\n${booking.date} at ${booking.time}\n${booking.guests} guest${booking.guests > 1 ? 's' : ''}\n€${rest?.price}/person\n\nShall I confirm this reservation?`,
        booking
      }
    }

    if (intent === 'CONFIRM_NO' && booking.guests > 0) {
      booking.guests = 0
      return { reply: "No problem! How many guests will be dining?", booking }
    }

    if (intent === 'PROVIDE_GUESTS') {
      const guests = await extractGuests(msg, session.lastQuestion || undefined)
      if (guests > 10) {
        return { reply: `For parties larger than 10, please contact the restaurant directly. How many guests (up to 10)?`, booking }
      }
      if (guests > 0) {
        booking.guests = guests
        session.lastAsked = 'confirm'
        const restaurants = RESTAURANTS[booking.city!] || []
        const rest = restaurants.find(r => r.name === booking.restaurant)
        const cityName = booking.city!.charAt(0).toUpperCase() + booking.city!.slice(1)
        return {
          reply: `Perfect! Here's your reservation:\n\n${booking.restaurant} - ${cityName}\n${'★'.repeat(rest?.stars || 1)} Michelin\n${booking.date} at ${booking.time}\n${guests} guest${guests > 1 ? 's' : ''}\n€${rest?.price}/person\n\nShall I confirm this reservation?`,
          booking
        }
      }
    }

    // For OTHER or fallthrough, use LLM
    const answer = await llmChat(`You are a Michelin restaurant booking assistant.
Current: ${booking.restaurant}, ${booking.date} at ${booking.time}.
User said: "${msg}"
Answer naturally, then ask how many guests will be dining (up to 10).`)
    return { reply: answer, booking }
  }

  // CONFIRM
  if (lastAsked === 'confirm') {
    const intent = await getConfirmStepIntent(msg, session.lastQuestion || undefined)

    if (intent === 'CONFIRM_NO') {
      sessions.delete(sessionId)
      return { reply: "No problem, reservation cancelled. Would you like to start a new search?", booking: emptyBooking() }
    }

    if (intent === 'CONFIRM_YES') {
      booking.confirmed = true
      const orderNumber = await llm('Generate a random 6 character alphanumeric code in uppercase. Reply with just the code.')
      sessions.delete(sessionId)
      return { reply: `Reservation confirmed! Reference: #${orderNumber}\n\nEnjoy your dining experience!`, booking, orderNumber }
    }

    if (intent === 'CHANGE_SOMETHING') {
      const changeWhat = await llm(`Query: "${msg}"
Booking: Restaurant=${booking.restaurant}, Date=${booking.date}, Time=${booking.time}, Guests=${booking.guests}

What to change? RESTAURANT, DATE, TIME, GUESTS, or OTHER?`)

      if (changeWhat.includes('RESTAURANT')) {
        booking.restaurant = null
        booking.date = null
        booking.time = null
        session.lastAsked = 'restaurant'
        const restaurants = RESTAURANTS[booking.city!] || []
        let list = ''
        for (const r of restaurants) {
          list += `• ${r.name} - ${'★'.repeat(r.stars)} - €${r.price}\n`
        }
        return { reply: `No problem!\n\n${list}\nWhich restaurant would you like?`, booking, restaurants }
      }
      if (changeWhat.includes('DATE')) {
        booking.date = null
        booking.time = null
        session.lastAsked = 'date'
        return { reply: "What date would you prefer?", booking }
      }
      if (changeWhat.includes('TIME')) {
        booking.time = null
        session.lastAsked = 'time'
        return { reply: "What time would you prefer?", booking }
      }
      if (changeWhat.includes('GUESTS')) {
        booking.guests = 0
        session.lastAsked = 'guests'
        return { reply: "How many guests will be dining?", booking }
      }
      return { reply: "What would you like to change - restaurant, date, time, or number of guests?", booking }
    }

    // For OTHER or fallthrough, use LLM
    const restaurants = RESTAURANTS[booking.city!] || []
    const rest = restaurants.find(r => r.name === booking.restaurant)
    const answer = await llmChat(`You are a Michelin restaurant booking assistant.
Reservation: ${booking.restaurant}, ${booking.date} at ${booking.time}, ${booking.guests} guests.
Price: €${rest?.price}/person.
User said: "${msg}"
Answer naturally, then ask if they'd like to confirm the reservation.`)
    return { reply: answer, booking }
  }

  return { reply: "Welcome! Which European city would you like to dine in?", booking }
}

function extractQuestion(reply: string): string | null {
  const sentences = reply.split(/[.!]\s*/)
  for (let i = sentences.length - 1; i >= 0; i--) {
    const s = sentences[i].trim()
    if (s.endsWith('?')) return s
  }
  return null
}

export async function POST(req: NextRequest) {
  const { message, sessionId } = await req.json()
  const sid = sessionId || 'default'

  // Check input word limit
  const wordCount = countWords(message || '')
  if (wordCount > LIMITS.MAX_INPUT_WORDS) {
    return NextResponse.json({
      reply: `Message too long (${wordCount} words). Please keep messages under ${LIMITS.MAX_INPUT_WORDS} words.`,
      booking: getSession(sid).booking
    })
  }

  // Estimate tokens for this request (~1.3 tokens per word + overhead for prompts)
  const estimatedTokens = Math.ceil(wordCount * 1.3) + 200

  // Check global limits
  const limitCheck = checkAndUpdateTokens(estimatedTokens)
  if (!limitCheck.allowed) {
    return NextResponse.json({
      reply: limitCheck.reason,
      booking: getSession(sid).booking
    })
  }

  const session = getSession(sid)
  const result = await handleChat(sid, message)

  if (sessions.has(sid)) {
    session.lastQuestion = extractQuestion(result.reply)
  }

  return NextResponse.json(result)
}
