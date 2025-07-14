const confirmed = confirm(
  "⚠️ You are about to send media.\n\nConfirm that this was requested and consensual.\n\nThis confirmation will be logged."
)

if (!confirmed) {
  return alert("❌ Cancelled — media not sent.")
}

import { supabase } from './supabase.js'

document.getElementById('statusForm').addEventListener('submit', async (e) => {
  e.preventDefault()

  const type = document.getElementById('type')?.value || 'text' // fallback if no dropdown
  const text = document.getElementById('textStatus').value.trim()
  const file = document.getElementById('mediaFile').files[0]

  const expiryDays = parseInt(document.getElementById('expiryDays')?.value || '7')
  const allowNSFW = document.getElementById('allowNSFW')?.checked || false

  let content = text

  // Handle file upload (image/video/audio)
  if ((type === 'image' || type === 'video' || type === 'audio') && file) {
    const filename = `${Date.now()}-${file.name}`
    const { data, error: uploadError } = await supabase.storage
      .from('status-media')
      .upload(filename, file)

    if (uploadError) {
      return alert('❌ Upload error: ' + uploadError.message)
    }

    content = `https://ltrbnjqvmtaposcbfzem.supabase.co/storage/v1/object/public/status-media/${filename}`
  }

  // Insert status into Supabase
  const { error } = await supabase.from('status').insert([{
    user_id: 'anonymous-mafia', // Replace with real user_id when auth added
    type,
    content,
    expiry_days: expiryDays,
    allow_nsfw: allowNSFW,
    timestamp: new Date().toISOString()
  }])

  if (error) {
    alert('❌ Error saving status: ' + error.message)
  } else {
    alert('✅ Status uploaded successfully!')
    document.getElementById('statusForm').reset()
  }
})
