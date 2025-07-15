const bucket = 'media';

async function sendMedia() {
  const receiverId = document.getElementById('receiver_id').value.trim();
  const file = document.getElementById('mediaInput').files[0];
  const type = document.getElementById('mediaType').value;

  if (!receiverId || !file || !type) return alert('Missing inputs');

  const filename = `${Date.now()}_${file.name}`;
  const { data, error: uploadError } = await supabase
    .storage
    .from(bucket)
    .upload(filename, file);

  if (uploadError) return alert('Upload error: ' + uploadError.message);

  const { data: urlData } = supabase
    .storage
    .from(bucket)
    .getPublicUrl(filename);

  const { error } = await supabase.from('messages').insert([{
    sender_id: supabase.auth.user().id,
    receiver_id: receiverId,
    type: type,
    content: urlData.publicUrl
  }]);

  if (error) return alert('Message send error: ' + error.message);

  alert('Sent!');
  loadMessages(receiverId);
}

async function markDelivered(id) {
  await supabase.from('messages').update({ delivered: true }).eq('id', id);
}

async function markSeen(id) {
  await supabase.from('messages').update({ seen: true }).eq('id', id);
}

async function loadMessages(receiverId) {
  const userId = supabase.auth.user().id;

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq('type', 'image') // Load all 3 types
    .order('timestamp', { ascending: false });

  const box = document.getElementById('mediaMessages');
  box.innerHTML = '';

  if (error) return (box.innerText = 'Error: ' + error.message);

  data.forEach(msg => {
    if (
      (msg.sender_id === userId && msg.receiver_id === receiverId) ||
      (msg.sender_id === receiverId && msg.receiver_id === userId)
    ) {
      const div = document.createElement('div');
      div.className = 'message';

      const ticks = msg.seen
        ? '✔✔ <span style="color:green;">Seen</span>'
        : msg.delivered
          ? '✔✔ <span style="color:blue;">Delivered</span>'
          : '✔ Sent';

      let mediaHtml = '';
      if (msg.type === 'image') mediaHtml = `<img src="${msg.content}" onload="markSeen('${msg.id}')">`;
      else if (msg.type === 'video') mediaHtml = `<video src="${msg.content}" controls onplay="markSeen('${msg.id}')"></video>`;
      else if (msg.type === 'voice') mediaHtml = `<audio src="${msg.content}" controls onplay="markSeen('${msg.id}')"></audio>`;

      div.innerHTML = `
        <p><strong>From:</strong> ${msg.sender_id}</p>
        ${mediaHtml}
        <p>${ticks}</p>
      `;
      box.appendChild(div);

      if (!msg.delivered && msg.receiver_id === userId) markDelivered(msg.id);
    }
  });
}

// Optional: auto-load after a few sec or use real-time later
