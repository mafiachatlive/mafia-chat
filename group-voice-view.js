async function loadGroupVoice() {
  const groupId = document.getElementById('group_id').value.trim();
  if (!groupId) return alert('Enter Group ID');

  const { data, error } = await supabase
    .from('group_chats')
    .select('*')
    .eq('group_id', groupId)
    .eq('type', 'voice')
    .order('timestamp', { ascending: false });

  const container = document.getElementById('voiceContainer');
  container.innerHTML = '';

  if (error) return (container.innerText = '❌ ' + error.message);
  if (!data || data.length === 0) return (container.innerText = 'No voice messages found.');

  data.forEach((msg) => {
    const div = document.createElement('div');
    div.className = 'voice-card';
    div.innerHTML = `
      <p><strong>Sender:</strong> ${msg.sender_id}</p>
      <p><strong>Time:</strong> ${new Date(msg.timestamp).toLocaleString()}</p>
      <audio src="${msg.content}" controls></audio>
    `;
    container.appendChild(div);
  });
}
