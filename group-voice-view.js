// scripts/group-voice-view.js

let currentUser = null;

// 🔄 Load all group voice messages
async function loadGroupVoice() {
  const groupId = document.getElementById('group_id').value.trim();
  const container = document.getElementById('voiceContainer');
  container.innerHTML = '';

  const user = supabase.auth.user();
  if (!user || !groupId) {
    container.innerHTML = "⚠️ Login or Group ID missing.";
    return;
  }

  currentUser = user;

  const { data, error } = await supabase
    .from('group_chats')
    .select('*')
    .eq('group_id', groupId)
    .eq('type', 'voice')
    .order('timestamp', { ascending: true });

  if (error) {
    container.innerHTML = '❌ Error loading messages.';
    return;
  }

  data.forEach((msg) => {
    const card = document.createElement('div');
    card.className = 'voice-card';

    const tickStatus = getTickStatus(msg);

    card.innerHTML = `
      <strong>👤 ${msg.sender_id}</strong><br>
      <small>${new Date(msg.timestamp).toLocaleString()}</small><br>
      <audio controls src="${msg.content}" onplay="markSeen('${msg.id}')"></audio>
      <div class="status">${tickStatus}</div>
      <div class="emoji-react">
        ❤️ 😂 😍 😭 😡
      </div>
    `;

    container.appendChild(card);

    // Auto mark as delivered (only if not sender)
    if (!msg.delivered && msg.sender_id !== currentUser.id) {
      markDelivered(msg.id);
    }

    // ➕ Drag-drop fav emoji support (optional placeholder)
    card.querySelector('.emoji-react').addEventListener('click', (e) => {
      if (e.target.tagName === 'DIV') return;
      const emoji = e.target.textContent;
      alert(`You reacted with ${emoji} (feature coming soon)`);
      // Add reaction logic later here
    });
  });
}

// ✅ Tick Logic (✔, ✔✔, ✔✔ blue)
function getTickStatus(msg) {
  if (msg.seen) {
    return '✔✔ <span style="color:green;">Seen</span>';
  } else if (msg.delivered) {
    return '✔✔ <span style="color:blue;">Delivered</span>';
  } else {
    return '✔ Sent';
  }
}

// ✅ Update delivery status
async function markDelivered(id) {
  await supabase.from('group_chats').update({ delivered: true }).eq('id', id);
}

// ✅ Update seen status
async function markSeen(id) {
  await supabase.from('group_chats').update({ seen: true }).eq('id', id);
}
