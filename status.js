import { supabase } from './supabase.js'

document.getElementById('statusForm').addEventListener('submit', async (e) => {
  e.preventDefault()

  // ✅ Step 1: Confirm Consent
  const confirmed = confirm(
    "⚠️ You are about to send media.\n\nConfirm that this was requested and consensual.\n\nThis confirmation will be logged."
  )
  if (!confirmed) {
    return alert("❌ Cancelled — media not sent.")
  }

  // ✅ Step 2: Get form values
  const type = document.getElementById('type')?.value || 'text' // fallback if no dropdown
  const text = document.getElementById('textStatus').value.trim()
  const file = document.getElementById('mediaFile').files[0]

  const expiryDays = parseInt(document.getElementById('expiryDays')?.value || '7')
  const allowNSFW = document.getElementById('allowNSFW')?.checked || false

  let content = text

  // ✅ Step 3: Handle file upload
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

  // ✅ Step 4: Insert status into Supabase
  const { error } = await supabase.from('status').insert([{
    user_id: 'anonymous-mafia', // Replace with real user_id later
    type,
    content,
    expiry_days: expiryDays,
    allow_nsfw: allowNSFW,
    timestamp: new Date().toISOString()
  }])

  // ✅ Step 5: Log consent to media_logs if successful
  if (!error) {
    const ip = await getIP()

    await supabase.from('media_logs').insert([{
      sender_id: 'anonymous-mafia',     // Replace later with auth UID
      receiver_id: 'unknown',           // Optional for now
      file_url: content,
      confirmed: true,
      timestamp: new Date().toISOString(),
      ip_address: ip
    }])

    alert('✅ Status uploaded and logged successfully!')
    document.getElementById('statusForm').reset()
  } else {
    alert('❌ Error saving status: ' + error.message)
  }
})

// ✅ Step 6: Get IP address function
async function getIP() {
  try {
    const res = await fetch('https://api.ipify.org?format=json')
    const data = await res.json()
    return data.ip
  } catch {
    return 'unknown'
  }
}
