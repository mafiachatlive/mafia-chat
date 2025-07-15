import { supabase } from './supabase.js';

async function markDelivered(id) {
  await supabase.from('messages').update({ delivered: true }).eq('id', id);
}

async function markSeen(id) {
  await supabase.from('messages').update({ seen: true }).eq('id', id);
}

async function loadVoiceMessages() {
  const receiverId = document.getElementById('receiver_id').value.trim();
  const currentUser = supabase.auth.user();

  if (!receiverId || !currentUser) return alert('Receiver ID ya Login missing');

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
    .eq('type', 'voice')
    .order('timestamp', { ascending: false });

  const container = document.getElementById('voiceContainer');
  container.innerHTML = '';

  if (error) return (container.innerText = '❌ ' + error.message);
  if (!data || data.length === 0) return (container.innerText = 'No voice messages found.');

  data.forEach((msg) => {
    const isOwn = msg.sender_id === currentUser.id;
    const isRelevant =
      (isOwn && msg.receiver_id === receiverId) ||
      (msg.sender_id === receiverId && msg.receiver_id === currentUser.id);

    if (!isRelevant) return;

    const div = document.createElement('div');
    div.className = 'voice-card';

    const ticks = msg.seen
      ? '✔✔ <span style="color:green;">Seen</span>'
      : msg.delivered
        ? '✔✔ <span style="color:blue;">Delivered</span>'
        : '✔ Sent';

    div.innerHTML = `
      <p><strong>Sender:</strong> ${msg.sender_id}</p>
      <p><strong>Time:</strong> ${new Date(msg.timestamp).toLocaleString()}</p>
      <audio src="${msg.content}" controls onplay="markSeen('${msg.id}')"></audio>
      <p class="status">${ticks}</p>
      <div class="emoji-section">
        ❤️ 😂 😍 😭 👍 🔥 😡 😱 🙏 💯
      </div>
    `;

    container.appendChild(div);

    if (!msg.delivered && msg.receiver_id === currentUser.id) markDelivered(msg.id);
  });
}
window.loadVoiceMessages = loadVoiceMessages;
