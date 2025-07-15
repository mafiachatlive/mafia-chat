import { supabase } from './supabase.js'

const chatBox = document.getElementById('chat-box')
const form = document.getElementById('message-form')
const input = document.getElementById('message')

// Fake current user ID (replace with real auth later)
const currentUserId = 'anonymous-mafia'

// Mark delivered
async function markDelivered(messageId) {
  await supabase.from('messages').update({ delivered: true }).eq('id', messageId)
}

// Mark seen
async function markSeen(messageId) {
  await supabase.from('messages').update({ seen: true }).eq('id', messageId)
}

// Load old messages
async function loadMessages() {
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('type', 'text')
    .order('timestamp', { ascending: true })

  if (messages) {
    messages.forEach(msg => renderMessage(msg))
  }
}

// Render single message
function renderMessage(msg) {
  const div = document.createElement('div')
  div.className = 'msg'

  // Tick logic
  let ticks = '✔'
  if (msg.seen) ticks = '✔✔ <span style="color:green;">Seen</span>'
  else if (msg.delivered) ticks = '✔✔ <span style="color:blue;">Delivered</span>'

  div.innerHTML = `<strong>${msg.sender_id}</strong>: ${msg.content}
    <span class="tick">${ticks}</span>`

  chatBox.appendChild(div)
  chatBox.scrollTop = chatBox.scrollHeight

  // If not delivered or seen and not our own msg
  if (msg.sender_id !== currentUserId) {
    if (!msg.delivered) markDelivered(msg.id)
    if (!msg.seen) markSeen(msg.id)
  }
}

// Realtime listener
supabase
  .channel('chat-text-channel')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages'
  }, payload => {
    if (payload.new.type === 'text') {
      renderMessage(payload.new)
    }
  })
  .subscribe()

// Send message
form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const text = input.value.trim()
  if (!text) return

  const { error } = await supabase.from('messages').insert([{
    sender_id: currentUserId,
    content: text,
    type: 'text',
    timestamp: new Date().toISOString(),
    delivered: false,
    seen: false
  }])

  if (!error) input.value = ''
})

loadMessages()
