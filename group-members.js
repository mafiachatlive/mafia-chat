const groupIdInput = document.getElementById('group_id');

document.getElementById('addMemberForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const group_id = groupIdInput.value;
  const user_id = document.getElementById('user_id').value;
  const role = document.getElementById('role').value;
  const show_number = document.getElementById('show_number').checked;

  const { error } = await supabase
    .from('group_members')
    .insert([{
      group_id,
      user_id,
      role,
      show_number
    }]);

  if (error) {
    alert('❌ ' + error.message);
  } else {
    alert('✅ Member added!');
    loadMembers(group_id);
  }
});

async function loadMembers(group_id) {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      user_id,
      role,
      show_number,
      users ( name, phone, username )
    `)
    .eq('group_id', group_id);

  const list = document.getElementById('memberList');
  list.innerHTML = '';

  if (error) {
    list.innerHTML = '❌ Error loading members';
    return;
  }

  data.forEach((m) => {
    const u = m.users || {};
    const name = u.name || 'Unknown';
    const username = u.username || '@user';
    const phone = m.show_number ? (u.phone || 'hidden') : '🔒 Hidden';

    list.innerHTML += `
      <div>
        <strong>${name}</strong> (${username}) - ${m.role} - ${phone}
      </div><hr>
    `;
  });
}

groupIdInput.addEventListener('change', () => {
  loadMembers(groupIdInput.value);
});
