import { supabase } from './supabase.js';
import { auth, signInWithPhoneNumber, signInWithEmailLink, RecaptchaVerifier } from './firebase.js';

// DOM elements
const messagesDiv = document.getElementById('messages');
const chatsButton = document.querySelector('.header-buttons button:nth-child(1)');
const otherButtons = document.querySelectorAll('.header-buttons button:not(:nth-child(1))');
const floatingMafia = document.querySelector('.floating-mafia');
const contactSearchModal = document.getElementById('contactSearchModal');
const contactSearchInput = document.getElementById('contactSearchInput');
const contactResults = document.getElementById('contactResults');
const loginModal = document.getElementById('loginModal');
const loginInput = document.getElementById('loginInput');
const otpInput = document.getElementById('otpInput');
const verifyOtpButton = document.getElementById('verifyOtpButton');
const messageInput = document.getElementById('messageInput');

let chats = [];
let currentChat = null;
let recaptchaVerifier;
let confirmationResult;

// Debug: Check if DOM elements exist
console.log('Messages div:', messagesDiv ? 'Found' : 'Not found');
console.log('Chats button:', chatsButton ? 'Found' : 'Not found');
console.log('Floating Mafia button:', floatingMafia ? 'Found' : 'Not found');
console.log('Contact search modal:', contactSearchModal ? 'Found' : 'Not found');
console.log('Contact search input:', contactSearchInput ? 'Found' : 'Not found');
console.log('Contact results:', contactResults ? 'Found' : 'Not found');
console.log('Login modal:', loginModal ? 'Found' : 'Not found');

// Initialize Firebase Authentication
async function init() {
  console.log('Initializing app...');
  try {
    // Initialize reCAPTCHA verifier
    recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
      size: 'normal',
      callback: () => console.log('reCAPTCHA verified')
    }, auth);
    recaptchaVerifier.render().then(() => console.log('reCAPTCHA rendered'));
  } catch (error) {
    console.error('Error initializing reCAPTCHA:', error.message);
    alert('Failed to initialize login: ' + error.message);
  }

  const user = auth.currentUser;
  if (!user) {
    console.log('No user logged in, showing login modal');
    if (loginModal) loginModal.style.display = 'flex';
  } else {
    console.log('User logged in:', user.uid);
    await syncFirebaseUserWithSupabase(user);
    showChatList();
  }
}

// Sync Firebase user with Supabase users table
async function syncFirebaseUserWithSupabase(firebaseUser) {
  console.log('Syncing Firebase user:', firebaseUser.uid);
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', firebaseUser.uid)
      .single();
    if (error && error.code === 'PGRST116') {
      console.log('Inserting new user to Supabase');
      await supabase
        .from('users')
        .insert({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          phone: firebaseUser.phoneNumber || ''
        });
    } else if (error) {
      console.error('Error checking user in Supabase:', error.message);
      alert('Error syncing user: ' + error.message);
    } else {
      console.log('User already exists in Supabase:', data.id);
    }
  } catch (error) {
    console.error('Error in syncFirebaseUserWithSupabase:', error.message);
  }
}

// Send OTP
async function sendOTP() {
  const input = loginInput?.value.trim();
  console.log('Send OTP requested for:', input);
  if (!input) {
    alert('Please enter an email or phone number');
    return;
  }

  try {
    if (input.includes('@')) {
      console.log('Sending email link');
      await signInWithEmailLink(auth, input, {
        url: window.location.href,
        handleCodeInApp: true
      });
      alert('Sign-in link sent to your email. Check your inbox.');
      if (otpInput) otpInput.style.display = 'block';
      if (verifyOtpButton) verifyOtpButton.style.display = 'block';
    } else {
      console.log('Sending phone OTP');
      confirmationResult = await signInWithPhoneNumber(auth, input, recaptchaVerifier);
      alert('OTP sent to your phone.');
      if (otpInput) otpInput.style.display = 'block';
      if (verifyOtpButton) verifyOtpButton.style.display = 'block';
    }
  } catch (error) {
    console.error('Error sending OTP:', error.message);
    alert('Error sending OTP: ' + error.message);
  }
}

// Verify OTP
async function verifyOTP() {
  const otp = otpInput?.value.trim();
  console.log('Verifying OTP:', otp);
  if (!otp) {
    alert('Please enter the OTP');
    return;
  }

  try {
    let userCredential;
    if (loginInput?.value.includes('@')) {
      alert('Email link verification should be handled via the link sent to your email.');
    } else {
      userCredential = await confirmationResult.confirm(otp);
      console.log('Phone OTP verified');
    }
    const user = userCredential.user;
    await syncFirebaseUserWithSupabase(user);
    if (loginModal) loginModal.style.display = 'none';
    showChatList();
  } catch (error) {
    console.error('Error verifying OTP:', error.message);
    alert('Error verifying OTP: ' + error.message);
  }
}

// Fetch chats from Supabase
async function fetchChats() {
  const user = auth.currentUser;
  if (!user) {
    console.error('No user logged in for fetching chats');
    return [];
  }
  console.log('Fetching chats for user:', user.uid);
  try {
    const { data, error } = await supabase
      .from('chats')
      .select(`
        id,
        last_message,
        last_message_time,
        users!chats_contact_id_fkey (name)
      `)
      .or(`user_id.eq.${user.uid},contact_id.eq.${user.uid}`);
    if (error) {
      console.error('Error fetching chats:', error.message);
      alert('Error loading chats: ' + error.message);
      return [];
    }
    console.log('Chats fetched:', data);
    return data.map(chat => ({
      id: chat.id,
      contact: chat.users.name,
      lastMessage: chat.last_message || 'No messages yet',
      time: chat.last_message_time ? new Date(chat.last_message_time).toLocaleTimeString() : '',
      messages: []
    }));
  } catch (error) {
    console.error('Error in fetchChats:', error.message);
    return [];
  }
}

// Fetch messages for a specific chat
async function fetchMessages(chatId) {
  console.log('Fetching messages for chat:', chatId);
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('text, sent_at, is_sent')
      .eq('chat_id', chatId)
      .order('sent_at', { ascending: true });
    if (error) {
      console.error('Error fetching messages:', error.message);
      return [];
    }
    console.log('Messages fetched:', data);
    return data.map(msg => ({
      text: msg.text,
      sent: msg.is_sent,
      time: new Date(msg.sent_at).toLocaleTimeString()
    }));
  } catch (error) {
    console.error('Error in fetchMessages:', error.message);
    return [];
  }
}

// Display chat list
async function showChatList() {
  console.log('Displaying chat list');
  chats = await fetchChats();
  if (messagesDiv) {
    messagesDiv.innerHTML = '';
    if (chats.length === 0) {
      messagesDiv.innerHTML = '<div>No chats available</div>';
    }
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
        console.log('Chat clicked:', chat.id);
        chat.messages = await fetchMessages(chat.id);
        showChatMessages(chat);
      });
      messagesDiv.appendChild(chatItem);
    });
  } else {
    console.error('Messages div not found');
  }
}

// Display messages for a chat
function showChatMessages(chat) {
  console.log('Displaying messages for chat:', chat.id);
  currentChat = chat;
  if (messagesDiv) {
    messagesDiv.innerHTML = '';
    chat.messages.forEach((msg) => {
      const message = document.createElement('div');
      message.classList.add('message', msg.sent ? 'sent' : 'received');
      message.innerHTML = `${msg.text} <small>${msg.time}</small>`;
      messagesDiv.appendChild(message);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  } else {
    console.error('Messages div not found');
  }
}

// Chats button click handler
if (chatsButton) {
  chatsButton.addEventListener('click', () => {
    console.log('Chats button clicked');
    otherButtons.forEach((btn) => btn.classList.remove('active'));
    chatsButton.classList.add('active');
    showChatList();
  });
} else {
  console.error('Chats button not found');
}

// Search contacts in Supabase
async function searchContacts(query) {
  console.log('Searching contacts with query:', query);
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`);
    if (error) {
      console.error('Supabase search error:', error.message);
      alert('Error searching contacts: ' + error.message);
      throw error;
    }
    console.log('Contacts found:', data);
    return data;
  } catch (error) {
    console.error('Error in searchContacts:', error.message);
    return [];
  }
}

// Start a new chat
async function startNewChat(contact) {
  console.log('Starting new chat with:', contact);
  const user = auth.currentUser;
  if (!user) {
    console.error('No user logged in');
    alert('Please log in to start a chat');
    return;
  }
  try {
    const { data, error } = await supabase
      .from('chats')
      .insert({
        user_id: user.uid,
        contact_id: contact.id,
        last_message: 'Chat started',
        last_message_time: new Date().toISOString()
      })
      .select()
      .single();
    if (error) {
      console.error('Error starting chat:', error.message);
      alert('Failed to start chat: ' + error.message);
      return;
    }
    console.log('New chat created:', data);
    const newChat = {
      id: data.id,
      contact: contact.name,
      lastMessage: 'Chat started',
      time: new Date().toLocaleTimeString(),
      messages: [{ text: `Started chat with ${contact.name}`, sent: true, time: new Date().toLocaleTimeString() }]
    };
    chats.push(newChat);
    closeContactModal();
    showChatMessages(newChat);
  } catch (error) {
    console.error('Error in startNewChat:', error.message);
    alert('Error starting chat: ' + error.message);
  }
}

// Open contact search modal
if (floatingMafia) {
  floatingMafia.addEventListener('click', () => {
    console.log('Mafia button clicked at', new Date().toLocaleTimeString());
    if (contactSearchModal) {
      contactSearchModal.style.display = 'flex';
      if (contactSearchInput) contactSearchInput.focus();
      console.log('Contact search modal opened');
    } else {
      console.error('Contact search modal not found');
      alert('Cannot open contact search: Modal not found');
    }
  });
} else {
  console.error('Floating Mafia button not found');
  alert('Mafia button not found');
}

// Close contact search modal
function closeContactModal() {
  console.log('Closing contact search modal');
  if (contactSearchModal) {
    contactSearchModal.style.display = 'none';
    if (contactSearchInput) contactSearchInput.value = '';
    if (contactResults) contactResults.innerHTML = '';
  } else {
    console.error('Contact search modal not found');
  }
}

// Handle contact search input
if (contactSearchInput) {
  contactSearchInput.addEventListener('input', async (e) => {
    console.log('Contact search input:', e.target.value);
    const query = e.target.value.trim().toLowerCase();
    if (!query) {
      if (contactResults) contactResults.innerHTML = '';
      return;
    }
    if (contactResults) {
      contactResults.innerHTML = '';
      try {
        const filteredContacts = await searchContacts(query);
        if (filteredContacts.length === 0) {
          contactResults.innerHTML = '<div>No contacts found</div>';
        } else {
          filteredContacts.forEach((contact) => {
            const result = document.createElement('div');
            result.classList.add('contact-result');
            result.innerHTML = `<strong>${contact.name}</strong> (${contact.email || contact.phone || 'No contact info'})`;
            result.addEventListener('click', () => {
              console.log('Starting chat with:', contact.name);
              startNewChat(contact);
            });
            contactResults.appendChild(result);
          });
        }
      } catch (error) {
        console.error('Error during contact search:', error.message);
        contactResults.innerHTML = '<div>Error loading contacts</div>';
      }
    } else {
      console.error('Contact results element not found');
    }
  });
} else {
  console.error('Contact search input not found');
}

// Send a message
async function sendMessage() {
  const text = messageInput?.value.trim();
  console.log('Sending message:', text);
  if (text && currentChat) {
    const user = auth.currentUser;
    if (!user) {
      console.error('No user logged in');
      alert('Please log in to send messages');
      return;
    }
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: currentChat.id,
          sender_id: user.uid,
          text,
          sent_at: new Date().toISOString(),
          is_sent: true
        });
      if (error) {
        console.error('Error sending message:', error.message);
        alert('Error sending message: ' + error.message);
        return;
      }
      await supabase
        .from('chats')
        .update({
          last_message: text,
          last_message_time: new Date().toISOString()
        })
        .eq('id', currentChat.id);
      currentChat.messages.push({ text, sent: true, time: new Date().toLocaleTimeString() });
      if (messageInput) messageInput.value = '';
      showChatMessages(currentChat);
    } catch (error) {
      console.error('Error in sendMessage:', error.message);
      alert('Error sending message: ' + error.message);
    }
  } else {
    console.log('No message text or chat selected');
  }
}

// Initialize on page load
init();
