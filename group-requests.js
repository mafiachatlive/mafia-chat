const user = supabase.auth.user();

async function loadRequests() {
  const groupId = document.getElementById('group_id').value;
  const { data, error } = await supabase
    .from('group_requests')
    .select('*')
    .eq('group_id', groupId)
    .order('requested_at', { ascending: false });

  const container = document.getElementById('requestsList');
  container.innerHTML = '';

  if (error) return (container.innerText = error.message);
  if (data.length === 0) return (container.innerText = '✅ No pending requests.');

  data.forEach(req => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <p><strong>User:</strong> ${req.user_id}</p>
      <p><strong>Reason:</strong> ${req.reason || 'N/A'}</p>
      <p><strong>Requested At:</strong> ${new Date(req.requested_at).toLocaleString()}</p>
      <button onclick="approve('${req.id}', '${req.user_id}', '${req.group_id}')">✅ Approve</button>
      <button onclick="reject('${req.id}')">❌ Reject</button>
    `;
    container.appendChild(card);
  });
}

async function approve(reqId, userId, groupId) {
  // 1. Add to group_members
  const { error: memberErr } = await supabase.from('group_members').insert([{
    group_id: groupId,
    user_id: userId,
    role: 'member'
  }]);
  if (memberErr) return alert(memberErr.message);

  // 2. Delete the request
  await supabase.from('group_requests').delete().eq('id', reqId);
  loadRequests();
}

async function reject(reqId) {
  await supabase.from('group_requests').delete().eq('id', reqId);
  loadRequests();
}
