// scripts/group-file.js

let currentUser = null;

// ✅ Init user session
async function initUser() {
  const user = supabase.auth.user();
  if (!user) {
    alert('🔐 Login required to upload.');
    return;
  }
  currentUser = user;
}
initUser();

// 📤 Upload file to group
async function uploadFile() {
  const groupId = document.getElementById('group_id').value.trim();
  const file = document.getElementById('fileInput').files[0];

  if (!groupId || !file) {
    alert("⚠️ Group ID and file required.");
    return;
  }

  const filePath = `groups/${groupId}/files/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase
    .storage
    .from('group-media')
    .upload(filePath, file);

  if (uploadError) {
    alert('❌ File upload failed.');
    return;
  }

  const { publicURL } = supabase.storage
    .from('group-media')
    .getPublicUrl(filePath);

  const timestamp = new Date().toISOString();

  const { error: dbError } = await supabase
    .from('group_chats')
    .insert([{
      group_id: groupId,
      sender_id: currentUser.id,
      type: 'file',
      content: publicURL,
      delivered: false,
      seen: false,
      timestamp: timestamp
    }]);

  if (dbError) {
    alert('❌ Database insert failed.');
    return;
  }

  alert('✅ File uploaded!');
  loadFiles(groupId);
}

// 🔽 Load files
async function loadFiles(groupId) {
  const container = document.getElementById('fileList');
  container.innerHTML = '';

  const { data, error } = await supabase
    .from('group_chats')
    .select('*')
    .eq('group_id', groupId)
    .eq('type', 'file')
    .order('timestamp', { ascending: true });

  if (error) {
    container.innerHTML = '❌ Error loading files.';
    return;
  }

  data.forEach(msg => {
    const card = document.createElement('div');
    card.className = 'file-card';

    const tick = getTick(msg);
    const fileName = msg.content.split('/').pop().split('?')[0];
    const fileLink = `<a href="${msg.content}" target="_blank">${fileName}</a>`;

    card.innerHTML = `
      <strong>👤 ${msg.sender_id}</strong><br>
      <small>${new Date(msg.timestamp).toLocaleString()}</small><br>
      📎 ${fileLink}
      <div class="status">${tick}</div>
      <div class="emoji-react">❤️ 😂 😍 😭 😡</div>
    `;

    card.querySelector('.emoji-react').addEventListener('click', e => {
      if (e.target.tagName === 'DIV') return;
      const emoji = e.target.textContent;
      alert(`You reacted with ${emoji} (coming soon)`);
      // reaction logic goes here
    });

    container.appendChild(card);

    if (!msg.delivered && msg.sender_id !== currentUser.id) {
      markDelivered(msg.id);
    }
  });
}

// ✅ Tick Status Logic
function getTick(msg) {
  if (msg.seen) {
    return '✔✔ <span style="color:green;">Seen</span>';
  } else if (msg.delivered) {
    return '✔✔ <span style="color:blue;">Delivered</span>';
  } else {
    return '✔ Sent';
  }
}

// ✅ Mark as Delivered
async function markDelivered(id) {
  await supabase.from('group_chats').update({ delivered: true }).eq('id', id);
}

// ✅ Mark as Seen (you can extend this on file click)
