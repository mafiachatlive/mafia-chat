import { supabase } from './supabase.js'

document.getElementById('userForm').addEventListener('submit', async (e) => {
  e.preventDefault()

  const phone = document.getElementById('phone').value
  const name = document.getElementById('name').value
  const address = document.getElementById('address').value
  const website = document.getElementById('website').value
  const description = document.getElementById('description').value

  const { error } = await supabase.from('users').insert([{
    phone,
    name,
    address,
    website,
    description,
    created_at: new Date().toISOString()
  }])

  if (error) {
    alert('❌ Error: ' + error.message)
  } else {
    alert('✅ Profile Saved to Supabase!')
    document.getElementById('userForm').reset()
  }
})
