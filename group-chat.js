import { supabase } from './supabase.js';

const chatBox = document.getElementById('chat-box');
const form = document.getElementById('message-form');
const input = document.getElementById('message');
const groupInput = document.getElementById('group_id');
const emojiPicker = document.getElementById('emojiPicker');

let currentUser;
let groupId;

const emojiList = ['😂', '❤️', '🔥', '😍', '😎', '😭', '👌', '👍', '🎉', '💔'];
emojiList.forEach(emoji => {
  const span = document.createElement('span');
  span.textContent = emoji;
  span.style.cursor = 'pointer';
  span.style.margin = '5px';
  span.onclick = () => {
    input.value += emoji;
    toggleEmojiPicker(false);
  };
  emojiPicker.appendChild(span);
});

function toggleEmojiPicker(force = null) {
  emojiPicker.style.display = (force === false || emojiPicker.style.display === 'block') ? 'none' : 'block';
}

async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) console.error(error);
  currentUser = data?.user;
}

async function loadMessages() {
  groupId = groupInput.value.trim();
  if (!groupId) return alert('Enter group ID');

  const { data: messages, error } = await supabase
    .from('group_messages')
    .select('*')
    .eq('group_id', groupId)
    .order('timestamp', { ascending: true });

  if (messages) {
    chatBox.innerHTML = '';
    messages.forEach(renderMessage);
  }
}

function renderMessage(msg) {
  const div = document.createElement('div');
  div.className = 'msg';

  const ticks = msg.seen
    ? '✔✔ <span style="color:green;">Seen</span>'
    : msg.delivered
    ? '✔✔ <span style="color:blue;">Delivered</span>'
    : '✔ Sent';

  div.innerHTML = `
    <strong>${msg.sender_id}</strong>: ${msg.content}<br>
    <span class="tick">${ticks}</span>
  `;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  groupId = groupInput.value.trim();
  if (!text || !groupId || !currentUser) return;

  const { error } = await supabase.from('group_messages').insert([{
    group_id: groupId,
    sender_id: currentUser.id,
    content: text,
    type: 'text',
    delivered: true,
    seen: false,
    timestamp: new Date().toISOString()
  }]);

  if (!error) input.value = '';
});

supabase
  .channel('group-chat-realtime')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'group_messages'
  }, payload => {
    const msg = payload.new;
    if (msg.group_id === groupInput.value.trim()) {
      renderMessage(msg);
    }
  })
  .subscribe();

getCurrentUser();
