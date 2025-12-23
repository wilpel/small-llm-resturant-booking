/**
 * Simple booking assistant - minimal prompts for tiny LLMs
 */

import * as readline from 'readline';

// ============================================================================
// LLM - single call with minimal prompt
// ============================================================================

async function llm(prompt: string): Promise<string> {
  try {
    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma3:4b',
        prompt,
        stream: false,
        options: { temperature: 0, num_predict: 20 }
      })
    });
    const data = await res.json() as { response: string };
    return data.response.trim().split('\n')[0];
  } catch {
    return '';
  }
}

// ============================================================================
// Simple LLM Tasks - one job each, minimal examples
// ============================================================================

// What does user want? -> GREET, HOTEL, FLIGHT, CANCEL, OTHER
async function getIntent(msg: string): Promise<string> {
  const r = await llm(`"hi" -> GREET
"hotel in paris" -> HOTEL
"fly to london" -> FLIGHT
"cancel" -> CANCEL
"${msg}" ->`);
  return r.toUpperCase();
}

// Is this a date or place? -> DATE, PLACE, UNCLEAR
async function getType(msg: string): Promise<string> {
  const r = await llm(`"london" -> PLACE
"tomorrow" -> DATE
"next monday" -> DATE
"paris" -> PLACE
"${msg}" ->`);
  return r.toUpperCase();
}

// Is user asking question or giving data? -> DATA, QUESTION, CANCEL
async function getMsgType(msg: string): Promise<string> {
  const r = await llm(`"london" -> DATA
"tomorrow" -> DATA
"cancel" -> CANCEL
"why?" -> QUESTION
"i dont know" -> QUESTION
"${msg}" ->`);
  return r.toUpperCase();
}

// Yes or no? -> YES, NO, UNCLEAR
async function getYesNo(msg: string): Promise<string> {
  const r = await llm(`"yes" -> YES
"sure" -> YES
"no" -> NO
"nope" -> NO
"maybe" -> UNCLEAR
"${msg}" ->`);
  return r.toUpperCase();
}

// Is this valid? -> OK, BAD
async function isValid(value: string, type: 'date' | 'place'): Promise<boolean> {
  const examples = type === 'date'
    ? `"tomorrow" -> OK\n"yesterday" -> BAD\n"next week" -> OK`
    : `"london" -> OK\n"asdfg" -> BAD\n"paris" -> OK`;
  const r = await llm(`${examples}\n"${value}" ->`);
  return r.toUpperCase().includes('OK');
}

// Generate short response
async function respond(instruction: string): Promise<string> {
  const r = await llm(`${instruction}\nResponse:`);
  return r || "How can I help?";
}

// ============================================================================
// State
// ============================================================================

type Flow = 'IDLE' | 'FLIGHT' | 'HOTEL' | 'CONFIRM';
let flow: Flow = 'IDLE';
let slots: Record<string, string> = {};
let lastAsked: string | null = null; // Track what field we asked for

// ============================================================================
// Handler - simplified logic
// ============================================================================

async function handle(msg: string): Promise<string> {
  console.log(`  [flow=${flow}, lastAsked=${lastAsked}, slots=${JSON.stringify(slots)}]`);
  const clean = msg.trim().toLowerCase();

  // IDLE: figure out what user wants
  if (flow === 'IDLE') {
    const intent = await getIntent(msg);
    console.log(`  [intent: ${intent}]`);

    if (intent.includes('GREET')) {
      return "Hi! I can help book flights or hotels.";
    }
    if (intent.includes('HOTEL')) {
      flow = 'HOTEL';
      // Try to extract city from initial message
      const type = await getType(msg);
      if (type.includes('PLACE')) {
        const words = clean.replace(/[^a-z ]/g, '').split(' ');
        const place = words.find(w => w.length > 2 && !['hotel', 'want', 'need', 'book'].includes(w));
        if (place) slots.city = place;
      }
      lastAsked = slots.city ? 'checkin' : 'city';
      return slots.city
        ? `${slots.city}. When do you want to check in?`
        : "What city?";
    }
    if (intent.includes('FLIGHT')) {
      flow = 'FLIGHT';
      lastAsked = 'from';
      return "Where from?";
    }
    if (intent.includes('CANCEL')) {
      return "Nothing to cancel.";
    }
    // Unknown - chat
    return await respond(`User said "${msg}". You are a booking assistant. Reply briefly.`);
  }

  // In a flow: check message type
  const msgType = await getMsgType(msg);
  console.log(`  [msgType: ${msgType}]`);

  if (msgType.includes('CANCEL')) {
    const what = flow === 'HOTEL' ? 'hotel' : 'flight';
    flow = 'IDLE';
    slots = {};
    lastAsked = null;
    return `Cancelled ${what} booking. What else?`;
  }

  if (msgType.includes('QUESTION')) {
    return await respond(`Booking ${flow.toLowerCase()}. User asks: "${msg}". Answer briefly, then ask for ${lastAsked}.`);
  }

  // DATA: user is giving us info
  // If we asked for something, assume the response IS that thing
  if (lastAsked && flow === 'HOTEL') {
    if (lastAsked === 'city') {
      const valid = await isValid(clean, 'place');
      if (!valid) return "I don't recognize that city. Which city?";
      slots.city = clean;
      lastAsked = 'checkin';
      return `${slots.city}. Check-in date?`;
    }
    if (lastAsked === 'checkin') {
      const valid = await isValid(clean, 'date');
      if (!valid) return "That doesn't look like a valid date. When do you want to check in?";
      slots.checkin = clean;
      lastAsked = 'checkout';
      return "Check-out date?";
    }
    if (lastAsked === 'checkout') {
      const valid = await isValid(clean, 'date');
      if (!valid) return "That doesn't look like a valid date. When do you want to check out?";
      if (clean === slots.checkin) return "Check-out must be after check-in. When do you want to check out?";
      slots.checkout = clean;
      flow = 'CONFIRM';
      lastAsked = null;
      return `Hotel in ${slots.city} (${slots.checkin} - ${slots.checkout})

1. Grand Hotel $150/night
2. Budget Inn $80/night

Book? (yes/no)`;
    }
  }

  if (lastAsked && flow === 'FLIGHT') {
    if (lastAsked === 'from') {
      // Check for "X to Y" pattern
      const toMatch = clean.match(/(.+?)\s+to\s+(.+)/);
      if (toMatch) {
        slots.from = toMatch[1].trim();
        slots.to = toMatch[2].trim();
        lastAsked = 'date';
        return `${slots.from} → ${slots.to}. What date?`;
      }
      const valid = await isValid(clean, 'place');
      if (!valid) return "I don't recognize that place. Where from?";
      slots.from = clean;
      lastAsked = 'to';
      return `From ${slots.from}. Where to?`;
    }
    if (lastAsked === 'to') {
      const valid = await isValid(clean, 'place');
      if (!valid) return "I don't recognize that place. Where to?";
      if (clean === slots.from) return "Destination must be different from origin. Where to?";
      slots.to = clean;
      lastAsked = 'date';
      return `${slots.from} → ${slots.to}. What date?`;
    }
    if (lastAsked === 'date') {
      const valid = await isValid(clean, 'date');
      if (!valid) return "That doesn't look like a valid date. What date?";
      slots.date = clean;
      flow = 'CONFIRM';
      lastAsked = null;
      return `${slots.from} → ${slots.to} on ${slots.date}

1. $299 - 8am departure
2. $349 - 2pm departure

Book? (yes/no)`;
    }
  }

  // CONFIRM flow
  if (flow === 'CONFIRM') {
    const yn = await getYesNo(msg);
    console.log(`  [yesNo: ${yn}]`);

    if (yn.includes('YES')) {
      const conf = Math.random().toString(36).slice(2, 7).toUpperCase();
      const desc = slots.city ? `hotel in ${slots.city}` : `flight ${slots.from} → ${slots.to}`;
      flow = 'IDLE';
      slots = {};
      return `Booked! ${desc}. Confirmation: ${conf}. Anything else?`;
    }
    if (yn.includes('NO')) {
      flow = 'IDLE';
      slots = {};
      return "No problem. What else can I help with?";
    }
    // Unclear
    return await respond(`User said "${msg}" when asked to confirm booking. Help them decide or ask yes/no again.`);
  }

  return "I can help with flights or hotels.";
}

// ============================================================================
// Main
// ============================================================================

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
console.log('Booking Assistant\n');

(function prompt() {
  rl.question('You: ', async (input) => {
    if (input === 'exit') { rl.close(); return; }
    console.log(`\nBot: ${await handle(input)}\n`);
    prompt();
  });
})();
