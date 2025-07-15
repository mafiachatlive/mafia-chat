async function loadStatus() {
  const userId = document.getElementById('user_id').value.trim();

  let query = supabase
    .from('status')
    .select('*')
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  const container = document.getElementById('statusContainer');
  container.innerHTML = '';

  if (error) return (container.innerText = '❌ ' + error.message);
  if (!data || data.length === 0) return (container.innerText = 'No status found.');

  const now = new Date();

  data.forEach((status) => {
    const created = new Date(status.created_at);
    const expiry = status.expiry_days || 1; // fallback default
    const hoursDiff = (now - created) / (1000 * 60 * 60);

    if (hoursDiff > expiry * 24) return; // expired

    const card = document.createElement('div');
    card.className = 'status-card';

    card.innerHTML = `
      <p><strong>By:</strong> ${status.user_id}</p>
      <p><strong>Type:</strong> ${status.type}</p>
      <p><strong>Expires in:</strong> ${expiry} day(s)</p>
      <p><strong>Posted:</strong> ${created.toLocaleString()}</p>
    `;

    if (status.type === 'text') {
      card.innerHTML += `<p>${status.content}</p>`;
    } else if (status.type === 'image') {
      card.innerHTML += `<img src="${status.media_url}" alt="Status Image" />`;
    } else if (status.type === 'video') {
      card.innerHTML += `<video src="${status.media_url}" controls></video>`;
    }

    container.appendChild(card);
  });
}
