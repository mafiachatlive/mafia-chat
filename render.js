// render.js

const pages = {
  contacts: 'contacts.html',
  contact_galleries: 'contact_galleries.html',
  gallery_images: 'gallery_images.html',
  gallery_videos: 'gallery_videos.html',
  gallery_files: 'gallery_files.html',
  gallery_notes: 'gallery_notes.html'
};

function loadTab(tab) {
  const path = pages[tab];
  if (!path) return;

  fetch(path)
    .then(res => res.text())
    .then(html => {
      document.getElementById('render-area').innerHTML = html;
    })
    .catch(err => {
      document.getElementById('render-area').innerHTML = `<p style="color:red">❌ Failed to load: ${tab}</p>`;
      console.error(err);
    });
}
