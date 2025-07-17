import { supabase } from './supabase.js'

document.getElementById('fileForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const contact_id = document.getElementById('contact_id').value.trim();
  const title = document.getElementById('title').value.trim();
  const fileInput = document.getElementById('file');
  const file = fileInput.files[0];

  if (!file) return alert('Please select a file.');

  const filePath = `gallery_files/${Date.now()}_${file.name}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('gallery_files')
    .upload(filePath, file);

  if (uploadError) {
    console.error(uploadError);
    return alert('File upload failed.');
  }

  const { data, error } = await supabase
    .from('gallery_files')
    .insert([{ contact_id, title, file_url: uploadData.path }]);

  if (error) {
    console.error(error);
    alert('Database insert failed.');
  } else {
    alert('File uploaded successfully!');
    fileInput.value = '';
    document.getElementById('title').value = '';
    fetchFiles();
  }
});

async function fetchFiles() {
  const { data, error } = await supabase
    .from('gallery_files')
    .select('*')
    .order('id', { ascending: false });

  const container = document.getElementById('filesContainer');
  container.innerHTML = '';

  if (error) {
    container.innerHTML = `<p>Error fetching files</p>`;
    return;
  }

  data.forEach(item => {
    const url = supabase.storage.from('gallery_files').getPublicUrl(item.file_url).data.publicUrl;
    container.innerHTML += `
      <div>
        <p><strong>${item.title}</strong> (Contact ID: ${item.contact_id})</p>
        <a href="${url}" target="_blank">Download/View</a>
        <hr>
      </div>
    `;
  });
}

fetchFiles();
