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
    content: urlData.publicUrl,
    timestamp: new Date().toISOString()
  }]);

  if (error) return alert('Message send error: ' + error.message);

  alert('✅ Sent!');
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
    .in('type', ['image', 'video', 'voice']) // All media types
    .order('timestamp', { ascending: true });

  const box = document.getElementById('mediaMessages');
  box.innerHTML = '';

  if (error) return (box.innerText = '❌ Error: ' + error.message);

  data.forEach(msg => {
    const isMyMessage = msg.sender_id === userId;
    const isToMe = msg.receiver_id === userId;

    // Only show between the 2
    if (
      (isMyMessage && msg.receiver_id === receiverId) ||
      (isToMe && msg.sender_id === receiverId)
    ) {
      const div = document.createElement('div');
      div.className = 'message';

      // Tick display
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
        <p><strong>${isMyMessage ? 'You' : msg.sender_id}</strong> 
          <span class="tick">${isMyMessage ? ticks : ''}</span>
        </p>
        ${mediaHtml}
      `;

      box.appendChild(div);

      // If receiver is me and not delivered
      if (!msg.delivered && isToMe) markDelivered(msg.id);
    }
  });

  box.scrollTop = box.scrollHeight;
}
