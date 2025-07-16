// /mafiachat/scripts/admin-dashboard.js

async function loadReports() {
  const groupId = document.getElementById("group_id").value.trim();
  const flaggedContainer = document.getElementById("flaggedMessages");
  const mediaContainer = document.getElementById("mediaLogs");

  flaggedContainer.innerHTML = '';
  mediaContainer.innerHTML = '';

  if (!groupId) {
    return flaggedContainer.innerHTML = '❌ Group ID is required.';
  }

  // 🔍 Load flagged messages
  const { data: flagged, error: flagErr } = await supabase
    .from("group_chats")
    .select("*")
    .eq("group_id", groupId)
    .eq("flagged", true)
    .order("timestamp", { ascending: false });

  if (flagErr) {
    flaggedContainer.innerHTML = '❌ Failed to load flagged messages.';
    return;
  }

  flagged.forEach(msg => {
    const card = document.createElement('div');
    card.className = 'card';

    const tick = msg.seen
      ? '✔✔ <span style="color:green;">Seen</span>'
      : msg.delivered
        ? '✔✔ <span style="color:blue;">Delivered</span>'
        : '✔ Sent';

    card.innerHTML = `
      <strong>👤 ${msg.sender_id}</strong><br>
      <small>${new Date(msg.timestamp).toLocaleString()}</small><br>
      <p>${msg.type === 'text' ? injectEmoji(msg.content) : '📎 ' + msg.type + ' file'}</p>
      <div class="status">${tick}</div>
    `;
    flaggedContainer.appendChild(card);
  });

  // 📁 Load recent media logs
  const { data: media, error: mediaErr } = await supabase
    .from("group_chats")
    .select("*")
    .eq("group_id", groupId)
    .in("type", ["image", "video", "voice", "file"])
    .order("timestamp", { ascending: false })
    .limit(20);

  if (mediaErr) {
    mediaContainer.innerHTML = '❌ Failed to load media logs.';
    return;
  }

  media.forEach(msg => {
    const card = document.createElement('div');
    card.className = 'card';
    let mediaHTML = '';

    switch (msg.type) {
      case 'image':
        mediaHTML = `<img src="${msg.content}" style="max-width:100%; border-radius:8px;" />`;
        break;
      case 'video':
        mediaHTML = `<video controls src="${msg.content}" style="width:100%; border-radius:8px;"></video>`;
        break;
      case 'voice':
      case 'audio':
        mediaHTML = `<audio controls src="${msg.content}" style="width:100%;"></audio>`;
        break;
      default:
        mediaHTML = `<a href="${msg.content}" target="_blank">📁 Download File</a>`;
    }

    card.innerHTML = `
      <strong>👤 ${msg.sender_id}</strong><br>
      <small>${new Date(msg.timestamp).toLocaleString()}</small><br>
      ${mediaHTML}
      <div class="status">${msg.seen ? '✔✔ <span style="color:green;">Seen</span>' : msg.delivered ? '✔✔ <span style="color:blue;">Delivered</span>' : '✔ Sent'}</div>
    `;
    mediaContainer.appendChild(card);
  });
}

// 🟡 Emoji injection (text → with emoji icons)
function injectEmoji(text) {
  if (!text) return '';
  // Replace :) or ❤️ with emoji icons (optional)
  return text
    .replace(/:\)/g, '😊')
    .replace(/:\(/g, '😢')
    .replace(/<3/g, '❤️')
    .replace(/:fire:/g, '🔥');
}
