let currentUser;

async function init() {
  const user = supabase.auth.user();
  if (!user) {
    alert('Login required');
    return;
  }
  currentUser = user;
}
init();

document.getElementById('group_id').addEventListener('change', function () {
  loadGroupMedia(this.value);
});

async function uploadMedia() {
  const groupId = document.getElementById('group_id').value;
  const file = document.getElementById('fileInput').files[0];
  if (!groupId || !file) return alert('Select file & group ID');

  const filePath = `groups/${groupId}/${Date.now()}_${file.name}`;

  // Upload to Supabase Storage
  const { data: uploaded, error: uploadError } = await supabase
    .storage
    .from('group-media')
    .upload(filePath, file);

  if (uploadError) return alert('❌ Upload failed');

  const fileURL = supabase.storage.from('group-media').getPublicUrl(filePath).publicURL;

  const fileType = file.type.startsWith('image') ? 'image' :
                   file.type.startsWith('video') ? 'video' :
                   file.type.startsWith('audio') ? 'voice' : 'file';

  const { error: dbError } = await supabase
    .from('group_chats')
    .insert([{
      group_id: groupId,
      sender_id: currentUser.id,
      type: fileType,
      content: fileURL
    }]);

  if (dbError) return alert('❌ DB insert failed');
  
  alert('✅ Uploaded!');
  loadGroupMedia(groupId);
}

async function loadGroupMedia(groupId) {
  const { data, error } = await supabase
    .from('group_chats')
    .select('type, content, sender_id, timestamp')
    .eq('group_id', groupId)
    .in('type', ['image', 'video', 'voice', 'file'])
    .order('timestamp', { ascending: true });

  const box = document.getElementById('mediaBox');
  box.innerHTML = '';

  if (!data || error) return;

  data.forEach(msg => {
    let el = '';
    if (msg.type === 'image') {
      el = `<img src="${msg.content}" width="200">`;
    } else if (msg.type === 'video') {
      el = `<video controls width="250"><source src="${msg.content}"></video>`;
    } else if (msg.type === 'voice') {
      el = `<audio controls src="${msg.content}"></audio>`;
    } else {
      el = `<a href="${msg.content}" target="_blank">📁 Download File</a>`;
    }

    box.innerHTML += `<div class="media-msg"><strong>${msg.sender_id}</strong><br>${el}</div><hr>`;
  });
}
