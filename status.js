import { supabase } from './supabase.js'

document.getElementById('statusForm').addEventListener('submit', async (e) => {
  e.preventDefault()

  const type = document.getElementById('type').value
  const text = document.getElementById('textStatus').value.trim()
  const file = document.getElementById('mediaFile').files[0]

  let content = text

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

  const { error } = await supabase.from('status').insert([{
    user_id: 'anonymous-mafia',
    type,
    content,
    timestamp: new Date().toISOString()
  }])

  if (error) {
    alert('❌ Error saving status: ' + error.message)
  } else {
    alert('✅ Status uploaded successfully!')
    document.getElementById('statusForm').reset()
  }
})
