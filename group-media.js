let currentUser;

async function init() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return alert('Login required');
  currentUser = user;
}
init();

document.getElementById('group_id').addEventListener('change', function () {
  loadGroupMedia(this.value);
  initEmojiPicker(); // for this group
});

async function uploadMedia() {
  const groupId = document.getElementById('group_id').value;
  const file = document.getElementById('fileInput').files[0];
  if (!groupId || !file) return alert('❌ Select file & group ID');

  const filePath = `groups/${groupId}/${Date.now()}_${file.name}`;

  const { data: uploaded, error: uploadError } = await supabase
    .storage
    .from('group-media')
    .upload(filePath, file);

  if (uploadError) return alert('❌ Upload failed');

  const fileURL = supabase.storage.from('group-media').getPublicUrl(filePath).publicURL;

  const fileType = file.type.startsWith('image') ? 'image'
                : file.type.startsWith('video') ? 'video'
                : file.type.startsWith('audio') ? 'voice'
                : 'file';

  const { error: dbError } = await supabase
    .from('group_chats')
    .insert([{
      group_id: groupId,
      sender_id: currentUser.id,
      type: fileType,
      content: fileURL,
      delivered: false,
      seen: false,
      timestamp: new Date().toISOString()
    }]);

  if (dbError) return alert('❌ DB insert failed');
  
  alert('✅ Uploaded!');
  loadGroupMedia(groupId);
}

async function markDelivered(id) {
  await supabase.from('group_chats').update({ delivered: true }).eq('id', id);
}

async function markSeen(id) {
  await supabase.from('group_chats').update({ seen: true }).eq('id', id);
}

async function loadGroupMedia(groupId) {
  const { data, error } = await supabase
    .from('group_chats')
    .select('*')
    .eq('group_id', groupId)
    .in('type', ['image', 'video', 'voice', 'file'])
    .order('timestamp', { ascending: true });

  const box = document.getElementById('mediaBox');
  box.innerHTML = '';

  if (!data || error) return;

  data.forEach(msg => {
    const ticks = msg.seen
      ? '✔✔ <span style="color:green;">Seen</span>'
      : msg.delivered
        ? '✔✔ <span style="color:blue;">Delivered</span>'
        : '✔ Sent';

    let mediaHTML = '';
    if (msg.type === 'image') {
      mediaHTML = `<img src="${msg.content}" width="200" onload="markSeen('${msg.id}')">`;
    } else if (msg.type === 'video') {
      mediaHTML = `<video controls width="250" onplay="markSeen('${msg.id}')"><source src="${msg.content}"></video>`;
    } else if (msg.type === 'voice') {
      mediaHTML = `<audio controls src="${msg.content}" onplay="markSeen('${msg.id}')"></audio>`;
    } else {
      mediaHTML = `<a href="${msg.content}" target="_blank" onclick="markSeen('${msg.id}')">📁 Download File</a>`;
    }

    const bubble = `
      <div class="media-msg">
        <strong>${msg.sender_id}</strong><br/>
        ${mediaHTML}
        <div class="tick">${ticks}</div>
      </div>
    `;
    box.innerHTML += bubble;

    if (!msg.delivered && msg.sender_id !== currentUser.id) {
      markDelivered(msg.id);
    }
  });
}
