import { supabase } from './supabase.js';

const form = document.getElementById('contactGalleryForm');
const list = document.getElementById('contactGalleryList');

async function loadContactGalleries() {
  const { data, error } = await supabase
    .from('contact_galleries')
    .select('*')
    .order('id', { ascending: false });

  list.innerHTML = '';

  if (error) {
    console.error('Error loading galleries:', error.message);
    return;
  }

  data.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `Contact: ${item.contact_id} | ${item.gallery_type.toUpperCase()} | ${item.title}`;
    list.appendChild(li);
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const contact_id = document.getElementById('contact_id').value.trim();
  const gallery_type = document.getElementById('gallery_type').value;
  const title = document.getElementById('title').value.trim();

  if (!contact_id || !gallery_type || !title) {
    alert('All fields are required!');
    return;
  }

  const { error } = await supabase.from('contact_galleries').insert([
    { contact_id, gallery_type, title }
  ]);

  if (error) {
    alert('Error adding gallery: ' + error.message);
    return;
  }

  form.reset();
  loadContactGalleries();
});

loadContactGalleries();
