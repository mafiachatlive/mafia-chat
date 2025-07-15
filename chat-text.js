async function markDelivered(messageId) {
  await supabase.from('messages').update({ delivered: true }).eq('id', messageId);
}

async function markSeen(messageId) {
  await supabase.from('messages').update({ seen: true }).eq('id', messageId);
}

import { supabase } from './supabase.js'

const chatBox = document.getElementById('chat-box')
const form = document.getElementById('message-form')
const input = document.getElementById('message')

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

function renderMessage(msg) {
  const div = document.createElement('div')
  div.className = 'msg'
  div.textContent = `${msg.sender_id}: ${msg.content}`
  chatBox.appendChild(div)
  chatBox.scrollTop = chatBox.scrollHeight
}

// Realtime incoming messages
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

// Form submit
form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const text = input.value.trim()
  if (!text) return

  const { error } = await supabase.from('messages').insert([{
    sender_id: 'anonymous-mafia',
    content: text,
    type: 'text',
    timestamp: new Date().toISOString()
  }])

  if (!error) input.value = ''
})

loadMessages()
