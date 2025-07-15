const user = supabase.auth.user();

async function loadBanList() {
  const groupId = document.getElementById('group_id').value;
  const { data, error } = await supabase
    .from('group_bans')
    .select('*')
    .eq('group_id', groupId)
    .order('banned_at', { ascending: false });

  const container = document.getElementById('banList');
  container.innerHTML = '';

  if (error) return (container.innerText = error.message);

  if (data.length === 0) return (container.innerText = '✅ No banned users.');

  data.forEach(user => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <p><strong>User:</strong> ${user.user_id}</p>
      <p><strong>By:</strong> ${user.banned_by}</p>
      <p><strong>Reason:</strong> ${user.reason || 'N/A'}</p>
      <p><strong>Time:</strong> ${new Date(user.banned_at).toLocaleString()}</p>
      <button onclick="unbanUser('${user.id}')">🟢 Unban</button>
    `;
    container.appendChild(card);
  });
}

async function unbanUser(banId) {
  const { error } = await supabase.from('group_bans').delete().eq('id', banId);
  if (!error) loadBanList();
  else alert(error.message);
}
