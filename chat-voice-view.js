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
    if (
      (msg.sender_id === currentUser.id && msg.receiver_id === receiverId) ||
      (msg.sender_id === receiverId && msg.receiver_id === currentUser.id)
    ) {
      const div = document.createElement('div');
      div.className = 'voice-card';
      div.innerHTML = `
        <p><strong>Sender:</strong> ${msg.sender_id}</p>
        <p><strong>Time:</strong> ${new Date(msg.timestamp).toLocaleString()}</p>
        <audio src="${msg.content}" controls></audio>
      `;
      container.appendChild(div);
    }
  });
}
