const user = supabase.auth.user();

async function pinMessage() {
  const groupId = document.getElementById('group_id').value;
  const content = document.getElementById('pin_content').value;

  if (!content) return alert("Enter content to pin");

  const { error } = await supabase.from('group_pins').insert([{
    group_id: groupId,
    user_id: user.id,
    content
  }]);

  if (error) {
    alert("❌ " + error.message);
  } else {
    document.getElementById('pin_content').value = '';
    loadPins();
  }
}

async function loadPins() {
  const groupId = document.getElementById('group_id').value;
  const { data, error } = await supabase
    .from('group_pins')
    .select('*')
    .eq('group_id', groupId)
    .order('pinned_at', { ascending: false });

  const pinList = document.getElementById('pinList');
  pinList.innerHTML = '';

  if (error) return (pinList.innerText = error.message);

  data.forEach(pin => {
    const div = document.createElement('div');
    div.className = 'pin-card';
    div.innerHTML = `
      <p>${pin.content}</p>
      <small>📌 by: ${pin.user_id} | ${new Date(pin.pinned_at).toLocaleString()}</small><br />
      <button onclick="unpinMessage('${pin.id}')">❌ Unpin</button>
    `;
    pinList.appendChild(div);
  });
}

async function unpinMessage(id) {
  await supabase.from('group_pins').delete().eq('id', id);
  loadPins();
}

window.onload = () => {
  const g = document.getElementById('group_id');
  g.addEventListener('change', loadPins);
}
