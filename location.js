import { supabase } from './supabase.js'

let map

window.getLocation = () => {
  if (!navigator.geolocation) {
    alert('❌ GPS not supported')
    return
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    const lat = position.coords.latitude
    const lng = position.coords.longitude

    alert(`✅ Location: ${lat}, ${lng}`)

    // Show Map
    if (!map) {
      map = L.map('map').setView([lat, lng], 13)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)
    }

    // Marker
    L.marker([lat, lng]).addTo(map).bindPopup('You are here').openPopup()

    // Save to Supabase (hardcoded user_id for now)
    const { error } = await supabase
      .from('users')
      .update({
        location: {
          type: 'Point',
          coordinates: [lng, lat]
        }
      })
      .eq('user_id', 'anonymous-mafia') // update this later to dynamic ID

    if (error) {
      alert('❌ Error saving to Supabase: ' + error.message)
    } else {
      alert('✅ Location saved to Supabase!')
    }
  }, (err) => {
    alert('❌ Location Error: ' + err.message)
  })
}
