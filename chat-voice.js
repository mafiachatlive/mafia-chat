async function markDelivered(messageId) {
  await supabase.from('messages').update({ delivered: true }).eq('id', messageId);
}

async function markSeen(messageId) {
  await supabase.from('messages').update({ seen: true }).eq('id', messageId);
}

import { supabase } from './supabase.js'

const voiceBox = document.getElementById('voice-box')
const recordBtn = document.getElementById('recordBtn')

// Load previous voice messages
async function loadVoiceNotes() {
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('type', 'voice')
    .order('timestamp', { ascending: true })

  if (messages) {
    messages.forEach(msg => renderVoice(msg))
  }
}

function renderVoice(msg) {
  const div = document.createElement('div')
  div.className = 'msg'

  const audio = document.createElement('audio')
  audio.controls = true
  audio.src = msg.content

  div.textContent = `${msg.sender_id}: `
  div.appendChild(audio)
  voiceBox.appendChild(div)
  voiceBox.scrollTop = voiceBox.scrollHeight
}

// Realtime updates
supabase
  .channel('voice-room')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages'
  }, payload => {
    if (payload.new.type === 'voice') {
      renderVoice(payload.new)
    }
  })
  .subscribe()

// Record + Upload Voice Note
recordBtn.addEventListener('click', async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const recorder = new MediaRecorder(stream)
  const chunks = []

  recorder.ondataavailable = e => chunks.push(e.data)

  recorder.onstop = async () => {
    const blob = new Blob(chunks, { type: 'audio/webm' })
    const filename = `voice-${Date.now()}.webm`
    const { error: uploadError } = await supabase
      .storage
      .from('voice-messages')
      .upload(filename, blob)

    if (uploadError) {
      return alert('❌ Upload failed: ' + uploadError.message)
    }

    const url = `https://ltrbnjqvmtaposcbfzem.supabase.co/storage/v1/object/public/voice-messages/${filename}`

    const { error } = await supabase.from('messages').insert([{
      sender_id: 'anonymous-mafia',
      content: url,
      type: 'voice',
      timestamp: new Date().toISOString()
    }])

    if (!error) {
      alert('✅ Voice note sent!')
    }
  }

  recorder.start()
  alert('🎤 Recording for 6 seconds...')
  setTimeout(() => {
    recorder.stop()
    stream.getTracks().forEach(t => t.stop())
  }, 6000)
})

loadVoiceNotes()
