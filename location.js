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

    alert(`✅ Location detected:\nLatitude: ${lat}\nLongitude: ${lng}`)

    // Show Satellite Map
    if (!map) {
      map = L.map('map').setView([lat, lng], 17)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics'
      }).addTo(map)
    }

    // Add marker
    L.marker([lat, lng]).addTo(map).bindPopup('📍 You are here').openPopup()

    // Save to Supabase (hardcoded user for now)
    const { error } = await supabase
      .from('users')
      .update({
        location: {
          type: 'Point',
          coordinates: [lng, lat]
        }
      })
      .eq('user_id', 'anonymous-mafia') // replace later with dynamic UID

    if (error) {
      alert('❌ Error saving location: ' + error.message)
    } else {
      alert('✅ Location saved to Supabase!')
    }
  }, (err) => {
    alert('❌ Location Error: ' + err.message)
  })
}
