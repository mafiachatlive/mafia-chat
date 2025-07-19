import { supabase } from './supabase.js';

// DOM elements
const messagesDiv = document.getElementById('messages');
const chatsButton = document.querySelector('.header-buttons button:nth-child(1)');
const otherButtons = document.querySelectorAll('.header-buttons button:not(:nth-child(1))');
const floatingMafia = document.querySelector('.floating-mafia');
const contactSearchModal = document.getElementById('contactSearchModal');
const contactSearchInput = document.getElementById('contactSearchInput');
const contactResults = document.getElementById('contactResults');
const loginModal = document.getElementById('loginModal');
const messageInput = document.getElementById('messageInput');

let chats = [];
let currentChat = null;

// Check if user is logged in
async function init() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    loginModal.style.display = 'flex';
  } else {
    showChatList();
  }
}

// Login function
async function login() {
  const email = document.getElementById('emailInput').value;
  const password = document.getElementById('passwordInput').value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('Login error:', error.message);
    alert('Login failed: ' + error.message);
    return;
  }
  loginModal.style.display = 'none';
  showChatList();
}

// Fetch chats from Supabase
async function fetchChats() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('No user logged in');
    return [];
  }
  const { data, error } = await supabase
    .from('chats')
    .select(`
      id,
      last_message,
      last_message_time,
      users!chats_contact_id_fkey (name)
    `)
    .or(`user_id.eq.${user.id},contact_id.eq.${user.id}`);
  if (error) {
    console.error('Error fetching chats:', error.message);
    return [];
  }
  return data.map(chat => ({
    id: chat.id,
    contact: chat.users.name,
    lastMessage: chat.last_message || 'No messages yet',
    time: chat.last_message_time ? new Date(chat.last_message_time).toLocaleTimeString() : '',
    messages: [],
  }));
}

// Fetch messages for a specific chat
async function fetchMessages(chatId) {
  const { data, error } = await supabase
    .from('messages')
    .select('text, sent_at, is_sent')
    .eq('chat_id', chatId)
    .order('sent_at', { ascending: true });
  if (error) {
    console.error('Error fetching messages:', error.message);
    return [];
  }
  return data.map(msg => ({
    text: msg.text,
    sent: msg.is_sent,
    time: new Date(msg.sent_at).toLocaleTimeString(),
  }));
}

// Display chat list
async function showChatList() {
  chats = await fetchChats();
  messagesDiv.innerHTML = '';
  chats.forEach((chat) => {
    const chatItem = document.createElement('div');
    chatItem.classList.add('chat-item');
    chatItem.innerHTML = `
      <div style="padding: 10px; cursor: pointer; border-bottom: 1px solid #333;">
        <strong>${chat.contact}</strong>
        <p>${chat.lastMessage}</p>
        <small>${chat.time}</small>
      </div>
    `;
    chatItem.addEventListener('click', async () => {
      chat.messages = await fetchMessages(chat.id);
      showChatMessages(chat);
    });
    messagesDiv.appendChild(chatItem);
  });
}

// Display messages for a chat
function showChatMessages(chat) {
  currentChat = chat;
  messagesDiv.innerHTML = '';
  chat.messages.forEach((msg) => {
    const message = document.createElement('div');
    message.classList.add('message', msg.sent ? 'sent' : 'received');
    message.innerHTML = `${msg.text} <small>${msg.time}</small>`;
    messagesDiv.appendChild(message);
  });
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Chats button click handler
chatsButton.addEventListener('click', () => {
  otherButtons.forEach((btn) => btn.classList.remove('active'));
  chatsButton.classList.add('active');
  showChatList();
});

// Search contacts in Supabase
async function searchContacts(query) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, phone')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`);
  if (error) {
    console.error('Error searching contacts:', error.message);
    return [];
  }
  return data;
}

// Start a new chat
async function startNewChat(contact) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('No user logged in');
    return;
  }
  const { data, error } = await supabase
    .from('chats')
    .insert({
      user_id: user.id,
      contact_id: contact.id,
      last_message: 'Chat started',
      last_message_time: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) {
    console.error('Error starting chat:', error.message);
    return;
  }
  const newChat = {
    id: data.id,
    contact: contact.name,
    lastMessage: 'Chat started',
    time: new Date().toLocaleTimeString(),
    messages: [{ text: `Started chat with ${contact.name}`, sent: true, time: new Date().toLocaleTimeString() }],
  };
  chats.push(newChat);
  closeContactModal();
  showChatMessages(newChat);
}

// Open contact search modal
floatingMafia.addEventListener('click', () => {
  contactSearchModal.style.display = 'flex';
  contactSearchInput.focus();
});

// Close contact search modal
function closeContactModal() {
  contactSearchModal.style.display = 'none';
  contactSearchInput.value = '';
  contactResults.innerHTML = '';
}

// Handle contact search input
contactSearchInput.addEventListener('input', async (e) => {
  const query = e.target.value.toLowerCase();
  contactResults.innerHTML = '';
  const filteredContacts = await searchContacts(query);
  filteredContacts.forEach((contact) => {
    const result = document.createElement('div');
    result.classList.add('contact-result');
    result.innerHTML = `<strong>${contact.name}</strong> (${contact.email || contact.phone})`;
    result.addEventListener('click', () => startNewChat(contact));
    contactResults.appendChild(result);
  });
});

// Send a message
async function sendMessage() {
  const text = messageInput.value.trim();
  if (text && currentChat) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No user logged in');
      return;
    }
    const { error } = await supabase
      .from('messages')
      .insert({
        chat_id: currentChat.id,
        sender_id: user.id,
        text,
        sent_at: new Date().toISOString(),
        is_sent: true,
      });
    if (error) {
      console.error('Error sending message:', error.message);
      return;
    }
    await supabase
      .from('chats')
      .update({
        last_message: text,
        last_message_time: new Date().toISOString(),
      })
      .eq('id', currentChat.id);
    currentChat.messages.push({ text, sent: true, time: new Date().toLocaleTimeString() });
    messageInput.value = '';
    showChatMessages(currentChat);
  }
}

// Initialize on page load
init();
