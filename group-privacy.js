const user = supabase.auth.user();

async function savePrivacy() {
  const groupId = document.getElementById('group_id').value;
  const can_post = document.getElementById('can_post').value;
  const can_see = document.getElementById('can_see_members').value;
  const show_phone = document.getElementById('show_phone').value === 'true';
  const is_searchable = document.getElementById('is_searchable').value === 'true';

  // ✅ Update group main privacy
  const { error } = await supabase
    .from('groups')
    .update({ can_post, can_see_members: can_see, show_phone, is_searchable })
    .eq('id', groupId);

  if (error) {
    document.getElementById('statusMsg').innerText = '❌ ' + error.message;
  } else {
    document.getElementById('statusMsg').innerText = '✅ Settings updated!';
  }
}
