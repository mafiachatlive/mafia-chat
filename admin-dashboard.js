const user = supabase.auth.user();

async function loadReports() {
  const groupId = document.getElementById('group_id').value;
  if (!groupId) return alert('Group ID required');

  await loadFlaggedMessages(groupId);
  await loadMediaLogs(groupId);
}

async function loadFlaggedMessages(groupId) {
  const { data, error } = await supabase
    .from('group_chats')
    .select('*')
    .eq('group_id', groupId)
    .eq('flagged', true);

  const container = document.getElementById('flaggedMessages');
  container.innerHTML = '';
  if (error) return (container.innerText = error.message);

  data.forEach(msg => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <p><strong>Sender:</strong> ${msg.sender_id}</p>
      <p><strong>Type:</strong> ${msg.type}</p>
      <p><strong>Content:</strong> ${msg.content}</p>
      <p><strong>Time:</strong> ${new Date(msg.timestamp).toLocaleString()}</p>
      <button onclick="deleteMessage('${msg.id}')">🗑 Delete</button>
      <button onclick="unflagMessage('${msg.id}')">✅ Unflag</button>
    `;
    container.appendChild(card);
  });
}

async function deleteMessage(id) {
  const { error } = await supabase.from('group_chats').delete().eq('id', id);
  if (!error) loadReports(); else alert(error.message);
}

async function unflagMessage(id) {
  const { error } = await supabase.from('group_chats').update({ flagged: false }).eq('id', id);
  if (!error) loadReports(); else alert(error.message);
}

async function loadMediaLogs(groupId) {
  const { data, error } = await supabase
    .from('media_logs')
    .select('*')
    .like('file_url', `%${groupId}%`)
    .order('timestamp', { ascending: false });

  const container = document.getElementById('mediaLogs');
  container.innerHTML = '';
  if (error) return (container.innerText = error.message);

  data.forEach(log => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <p><strong>Sender:</strong> ${log.sender_id}</p>
      <p><strong>Receiver:</strong> ${log.receiver_id}</p>
      <p><strong>IP:</strong> ${log.ip_address}</p>
      <p><strong>URL:</strong> <a href="${log.file_url}" target="_blank">Open File</a></p>
      <p><strong>Time:</strong> ${new Date(log.timestamp).toLocaleString()}</p>
    `;
    container.appendChild(card);
  });
}
