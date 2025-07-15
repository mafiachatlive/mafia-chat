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

async function uploadFile() {
  const groupId = document.getElementById('group_id').value;
  const file = document.getElementById('fileInput').files[0];

  if (!file || !groupId) return alert('Select group ID & file');

  const filePath = `groups/${groupId}/files/${Date.now()}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from('group-media')
    .upload(filePath, file);

  if (uploadError) return alert('❌ Upload failed');

  const fileURL = supabase.storage.from('group-media').getPublicUrl(filePath).publicURL;

  const { error: dbError } = await supabase
    .from('group_chats')
    .insert([{
      group_id: groupId,
      sender_id: currentUser.id,
      type: 'file',
      content: fileURL
    }]);

  if (dbError) return alert('❌ DB insert failed');

  alert('✅ File Uploaded!');
  showFiles(groupId);
}

document.getElementById('group_id').addEventListener('change', function () {
  showFiles(this.value);
});

async function showFiles(groupId) {
  const { data, error } = await supabase
    .from('group_chats')
    .select('sender_id, content, timestamp')
    .eq('group_id', groupId)
    .eq('type', 'file')
    .order('timestamp', { ascending: false });

  const list = document.getElementById('fileList');
  list.innerHTML = '';

  if (!data || error) return;

  data.forEach(f => {
    const link = document.createElement('a');
    link.href = f.content;
    link.target = '_blank';
    link.innerText = `📁 ${f.content.split('/').pop()}`;
    list.appendChild(link);
    list.appendChild(document.createElement('br'));
  });
}
