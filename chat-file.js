const bucket = 'media';

async function uploadFile() {
  const receiverId = document.getElementById("receiver_id").value.trim();
  const file = document.getElementById("fileInput").files[0];
  const status = document.getElementById("status");

  if (!receiverId || !file) return alert("⚠️ Fill all fields");

  const filename = `${Date.now()}_${file.name}`;
  const { data, error: uploadError } = await supabase
    .storage
    .from(bucket)
    .upload(filename, file);

  if (uploadError) return (status.textContent = "❌ Upload failed");

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename);

  const { error } = await supabase.from("messages").insert([{
    sender_id: supabase.auth.user().id,
    receiver_id: receiverId,
    type: "file",
    content: urlData.publicUrl,
    timestamp: new Date().toISOString()
  }]);

  if (error) return (status.textContent = "❌ DB error");

  status.textContent = "✅ File uploaded!";
  loadFiles(receiverId);
}

async function markDelivered(id) {
  await supabase.from('messages').update({ delivered: true }).eq('id', id);
}

async function markSeen(id) {
  await supabase.from('messages').update({ seen: true }).eq('id', id);
}

async function loadFiles(receiverId) {
  const userId = supabase.auth.user().id;

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq('type', 'file')
    .order('timestamp', { ascending: true });

  const box = document.getElementById("fileMessages");
  box.innerHTML = '';

  if (error) return (box.innerText = '❌ Error loading');

  data.forEach(msg => {
    if (
      (msg.sender_id === userId && msg.receiver_id === receiverId) ||
      (msg.sender_id === receiverId && msg.receiver_id === userId)
    ) {
      const div = document.createElement("div");
      div.className = "message";

      const ticks = msg.seen
        ? '✔✔ <span style="color:green;">Seen</span>'
        : msg.delivered
          ? '✔✔ <span style="color:blue;">Delivered</span>'
          : '✔ Sent';

      div.innerHTML = `
        <p><strong>${msg.sender_id === userId ? 'You' : msg.sender_id}</strong> ${msg.sender_id === userId ? ticks : ''}</p>
        <a href="${msg.content}" target="_blank">${msg.content.split('/').pop()}</a>
      `;

      box.appendChild(div);

      if (!msg.delivered && msg.receiver_id === userId) markDelivered(msg.id);
      if (msg.receiver_id === userId) markSeen(msg.id);
    }
  });

  box.scrollTop = box.scrollHeight;
}
