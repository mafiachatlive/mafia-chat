document.getElementById('groupForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const user = supabase.auth.user(); // Get logged-in user
  if (!user) return alert('Login required');

  const { data, error } = await supabase
    .from('groups')
    .insert([{
      owner_id: user.id,
      name: document.getElementById('name').value,
      description: document.getElementById('description').value,
      profile_url: document.getElementById('profile_url').value,
      banner_url: document.getElementById('banner_url').value
    }]);

  document.getElementById('result').innerText = error ? error.message : '✅ Group Created!';
});
