const user = supabase.auth.user();

function generateToken(length = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  while (length--) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

async function generateInvite() {
  const groupId = document.getElementById('group_id').value;
  const inviteFor = document.getElementById('invite_for_user').value || null;
  const token = generateToken();

  const { error } = await supabase.from('group_invites').insert([{
    token,
    group_id: groupId,
    invited_by: user.id,
    for_user: inviteFor
  }]);

  if (error) return alert('Error: ' + error.message);

  const link = `${location.origin}/group-invite.html?token=${token}`;
  document.getElementById('inviteLink').innerHTML = `🔗 <a href="${link}" target="_blank">${link}</a>`;
}

async function joinWithInvite() {
  const token = document.getElementById('invite_token').value;

  const { data, error } = await supabase.from('group_invites').select('*').eq('token', token).single();
  if (error || !data) return document.getElementById('joinStatus').innerText = 'Invalid or expired invite.';

  // Optional: Check if already in group
  const { data: existing } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', data.group_id)
    .eq('user_id', user.id);

  if (existing.length) {
    document.getElementById('joinStatus').innerText = 'Already a member.';
    return;
  }

  const { error: joinError } = await supabase.from('group_members').insert([{
    group_id: data.group_id,
    user_id: user.id,
    role: 'member'
  }]);

  document.getElementById('joinStatus').innerText = joinError ? joinError.message : '✅ Joined Group Successfully';
}
