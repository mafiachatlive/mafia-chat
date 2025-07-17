import { supabase } from './supabase.js';

async function loadVideos() {
  const listDiv = document.getElementById('videos-list');
  listDiv.innerHTML = 'Loading...';

  const { data, error } = await supabase.from('gallery_videos').select('*');

  if (error) {
    listDiv.innerHTML = `<p>Error loading videos: ${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    listDiv.innerHTML = '<p>No videos found.</p>';
    return;
  }

  listDiv.innerHTML = '';
  data.forEach(video => {
    const container = document.createElement('div');
    container.className = 'video-container';

    if (video.url.includes('youtube.com') || video.url.includes('youtu.be')) {
      const videoId = video.url.includes('watch?v=')
        ? video.url.split('watch?v=')[1]
        : video.url.split('/').pop();

      container.innerHTML = `
        <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
        <p>${video.title || ''}</p>
      `;
    } else {
      container.innerHTML = `
        <video controls src="${video.url}"></video>
        <p>${video.title || ''}</p>
      `;
    }

    listDiv.appendChild(container);
  });
}

loadVideos();
