const user = supabase.auth.user();

async function updateGroupInfo() {
  const groupId = document.getElementById('group_id').value;
  const name = document.getElementById('group_name').value;
  const desc = document.getElementById('group_description').value;
  const profile = document.getElementById('group_profile').value;
  const banner = document.getElementById('group_banner').value;

  const { error } = await supabase
    .from('groups')
    .update({
      name: name,
      description: desc,
      profile_url: profile,
      banner_url: banner
    })
    .eq('id', groupId)
    .eq('owner_id', user.id);

  document.getElementById('status').innerText = error ? error.message : 'Group Info Updated';
}

async function updateGroupSettings() {
  const groupId = document.getElementById('group_id').value;
  const postRule = document.getElementById('can_post').value;
  const viewRule = document.getElementById('can_see_members').value;

  const { error } = await supabase
    .from('groups')
    .update({
      can_post: postRule,
      can_see_members: viewRule
    })
    .eq('id', groupId)
    .eq('owner_id', user.id);

  document.getElementById('status').innerText = error ? error.message : 'Settings Updated';
}
