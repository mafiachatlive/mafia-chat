import { supabase } from './supabase.js'

const userId = localStorage.getItem('user_id') || 'anonymous_user'

async function uploadImages() {
  const input = document.getElementById('imageInput')
  const files = input.files

  if (!files.length) {
    alert('Please select images')
    return
  }

  for (const file of files) {
    const filePath = `${userId}/images/${Date.now()}_${file.name}`

    const { data, error } = await supabase.storage
      .from('gallery_images')
      .upload(filePath, file)

    if (error) {
      console.error('Upload error:', error)
    } else {
      const publicUrl = supabase
        .storage
        .from('gallery_images')
        .getPublicUrl(filePath).data.publicUrl

      await saveImageMetadata(publicUrl)
    }
  }

  loadGalleryImages()
}

async function saveImageMetadata(imageUrl) {
  await supabase
    .from('gallery_images')
    .insert([{ user_id: userId, image_url: imageUrl }])
}

async function loadGalleryImages() {
  const { data, error } = await supabase
    .from('gallery_images')
    .select('*')
    .eq('user_id', userId)
    .order('id', { ascending: false })

  const galleryDiv = document.getElementById('imageGallery')
  galleryDiv.innerHTML = ''

  if (error) {
    console.error('Fetch error:', error)
    return
  }

  data.forEach(img => {
    const imgTag = document.createElement('img')
    imgTag.src = img.image_url
    imgTag.style.width = '200px'
    imgTag.style.margin = '10px'
    galleryDiv.appendChild(imgTag)
  })
}

loadGalleryImages()
