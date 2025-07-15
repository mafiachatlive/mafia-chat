import { supabase } from './supabase.js'

const bucket = 'media';
const recordBtn = document.getElementById('recordBtn');
const voiceBox = document.getElementById('voice-box');
let mediaRecorder, audioChunks = [];

recordBtn.addEventListener('click', async () => {
  const receiverId = document.getElementById('receiver_id').value.trim();
  if (!receiverId) return alert("Enter receiver ID first");

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];

  mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
  mediaRecorder.onstop = async () => {
    const blob = new Blob(audioChunks, { type: 'audio/webm' });
    const filename = `${Date.now()}_voice.webm`;

    const { data, error: uploadError } = await supabase
      .storage.from(bucket)
      .upload(filename, blob);

    if (uploadError) return alert("❌ Upload failed");

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename);

    const { error } = await supabase.from("messages").insert([{
      sender_id: supabase.auth.user().id,
      receiver_id: receiverId,
      type: "voice",
      content: urlData.publicUrl,
      timestamp: new Date().toISOString()
    }]);

    if (!error) loadVoiceMessages(receiverId);
  };

  mediaRecorder.start();
  recordBtn.textContent = "⏹️ Stop Recording";

  setTimeout(() => {
    mediaRecorder.stop();
    recordBtn.textContent = "🎙️ Record Voice Note";
  }, 6000); // auto-stop after 6 seconds
});

async function markDelivered(id) {
  await supabase.from('messages').update({ delivered: true }).eq('id', id);
}

async function markSeen(id) {
  await supabase.from('messages').update({ seen: true }).eq('id', id);
}

async function loadVoiceMessages(receiverId) {
  const userId = supabase.auth.user().id;

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq('type', 'voice')
    .order('timestamp', { ascending: true });

  voiceBox.innerHTML = '';

  if (error) return (voiceBox.textContent = '❌ Error loading messages');

  data.forEach(msg => {
    if (
      (msg.sender_id === userId && msg.receiver_id === receiverId) ||
      (msg.sender_id === receiverId && msg.receiver_id === userId)
    ) {
      const div = document.createElement('div');
      div.className = 'msg';

      const ticks = msg.seen
        ? '✔✔ <span style="color:green;">Seen</span>'
        : msg.delivered
          ? '✔✔ <span style="color:blue;">Delivered</span>'
          : '✔ Sent';

      div.innerHTML = `
        <p><strong>${msg.sender_id === userId ? 'You' : msg.sender_id}</strong> ${msg.sender_id === userId ? ticks : ''}</p>
        <audio src="${msg.content}" controls onplay="markSeen('${msg.id}')"></audio>
      `;
      voiceBox.appendChild(div);

      if (!msg.delivered && msg.receiver_id === userId) markDelivered(msg.id);
    }
  });

  voiceBox.scrollTop = voiceBox.scrollHeight;
}

// Optional auto-load
setTimeout(() => {
  const receiverId = document.getElementById('receiver_id').value.trim();
  if (receiverId) loadVoiceMessages(receiverId);
}, 1000);
