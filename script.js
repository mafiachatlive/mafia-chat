// DOM elements for Mafia button
const floatingMafia = document.querySelector('.floating-mafia');
const contactSearchModal = document.getElementById('contactSearchModal');
const contactSearchInput = document.getElementById('contactSearchInput');
const contactResults = document.getElementById('contactResults');

// Debug: Check if elements are found
console.log('Floating Mafia button:', floatingMafia ? 'Found' : 'Not found');
console.log('Contact search modal:', contactSearchModal ? 'Found' : 'Not found');
console.log('Contact search input:', contactSearchInput ? 'Found' : 'Not found');
console.log('Contact results:', contactResults ? 'Found' : 'Not found');

// Open contact search modal
floatingMafia?.addEventListener('click', () => {
  console.log('Mafia button clicked at', new Date().toLocaleTimeString());
  if (contactSearchModal) {
    contactSearchModal.style.display = 'flex';
    contactSearchInput?.focus();
  } else {
    console.error('Cannot open contact search modal: Element not found');
  }
});

// Close contact search modal
function closeContactModal() {
  console.log('Closing contact search modal');
  if (contactSearchModal) {
    contactSearchModal.style.display = 'none';
    if (contactSearchInput) contactSearchInput.value = '';
    if (contactResults) contactResults.innerHTML = '';
  } else {
    console.error('Cannot close contact search modal: Element not found');
  }
}

// Handle contact search input
contactSearchInput?.addEventListener('input', async (e) => {
  console.log('Contact search input:', e.target.value);
  const query = e.target.value.trim().toLowerCase();
  if (!query) {
    contactResults.innerHTML = '';
    return;
  }
  if (contactResults) {
    contactResults.innerHTML = '';
    try {
      const filteredContacts = await searchContacts(query);
      console.log('Contacts found:', filteredContacts);
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

// Search contacts in Supabase
async function searchContacts(query) {
  console.log('Querying Supabase for contacts with:', query);
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, phone')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`);
  if (error) {
    console.error('Supabase search error:', error.message);
    throw error;
  }
  return data;
}

// Start a new chat
async function startNewChat(contact) {
  console.log('Attempting to start new chat with:', contact);
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
```

**Changes**:
- Added extensive console logs to track each step (button click, modal open, search query, chat creation).
- Improved error handling with user alerts for failed operations.
- Used optional chaining (`?.`) to prevent crashes if elements are missing.
- Added fallback messages (e.g., “No contacts found”) in the modal.

**Action**:
- Replace the Mafia button section in your `script.js` with the above code.
- Ensure the rest of `script.js` (login, chat fetching, etc.) remains as previously provided.
- Save and push to GitHub:
  ```bash
  git add script.js
  git commit -m "Update Mafia button logic with debugging logs"
  git push origin main
  ```

#### **Step 3: Verify Firebase Authentication**
The `startNewChat` function requires a logged-in user. If authentication fails, the button may not work.

1. **Test OTP Login**:
   - Visit `https://mafia-chat.vercel.app/chatroom.html`.
   - The login modal should appear.
   - Enter a phone number (e.g., `+923001234567`) or email (e.g., `john@example.com`).
   - Click **Send OTP**, complete the reCAPTCHA, and receive the OTP (SMS for phone, email link for email).
   - For phone, enter the OTP and click **Verify OTP**.
   - For email, click the link in your inbox (ensure Firebase redirect URL is `https://mafia-chat.vercel.app/chatroom.html` in Firebase Console > Authentication > Settings).
   - Check Firebase Console (**Authentication > Users**) for the user’s UID.

2. **Sync with Supabase**:
   - The `syncFirebaseUserWithSupabase` function adds the Firebase user to the Supabase `users` table.
   - Verify in Supabase (**Table Editor > users**) that the user appears with their Firebase UID, name, email, or phone.
   - Console should log “Syncing user: <uid>” and, if new, “Inserting new user to Supabase”.

#### **Step 4: Verify Supabase Setup**
The button relies on Supabase for contact search and chat creation.

1. **Check `users` Table**:
   - In Supabase (**Table Editor > users**), ensure there are test users:
     ```sql
     INSERT INTO users (id, name, email, phone) VALUES
       ('firebase-user1-uid', 'John Doe', 'john@example.com', '+923001234567'),
       ('firebase-user2-uid', 'Jane Smith', 'jane@example.com', '+923009876543');
     ```
     Replace `firebase-user1-uid` and `firebase-user2-uid` with actual Firebase UIDs from the login test.

2. **Verify RLS Policies**:
   - In Supabase (**Authentication > Policies**), ensure:
     ```sql
     CREATE POLICY "Allow authenticated users to read users" ON users
       FOR SELECT USING (true);
     CREATE POLICY "Allow authenticated users to insert chats" ON chats
       FOR INSERT WITH CHECK (auth.uid() = user_id);
     CREATE POLICY "Allow authenticated users to read chats" ON chats
       FOR SELECT USING (auth.uid() = user_id OR auth.uid() = contact_id);
     ```
   - If missing, add these policies to allow contact search and chat creation.

3. **Test Supabase Queries**:
   - The `searchContacts` function queries the `users` table. Check console logs for “Querying Supabase for contacts” and “Contacts found”.
   - If no contacts appear, ensure the `users` table has data and RLS allows access.

#### **Step 5: Test the Mafia Button**
1. **Access the App**:
   - Visit `https://mafia-chat.vercel.app` (redirects to `chatroom.html`).
   - Log in using OTP.

2. **Click Mafia Button**:
   - Click the yellow “Mafia” button (bottom-right).
   - The contact search modal should open, and the input field should be focused.
   - Check console for “Mafia button clicked at <time>”.

3. **Search Contacts**:
   - Type a name, email, or phone (e.g., “John” or “+92300”).
   - Contacts should appear in the modal. Check console for “Contact search input” and “Contacts found”.
   - If “No contacts found” appears, verify the `users` table has data.

4. **Start a Chat**:
   - Click a contact to start a new chat.
   - The modal should close, and the chat should appear in the chat list.
   - Check console for “Starting chat with” and “New chat created”.
   - Verify in Supabase (**Table Editor > chats**) that the new chat is added.

5. **Check Console Logs**:
   - Open **Developer Tools > Console** in your browser.
   - Look for:
     - `Floating Mafia button: Found`
     - `Mafia button clicked at <time>`
     - `Contact search input: <query>`
     - `Contacts found: [...]`
     - `Starting chat with: <name>`
     - `New chat created: {...}`
   - Note any errors (e.g., “Floating Mafia button: Not found” or “Supabase search error”).

#### **StepTribal Council**

**Common Issues and Fixes**:
1. **Button Doesn’t Respond**:
   - **Cause**: DOM element not found or JavaScript error.
   - **Fix**: Ensure `floating-mafia` class is correct in `chatroom.html`. Check console for errors like “Floating Mafia button: Not found”.
   - **Test**: Reload the page and click the button.

2. **Modal Opens but Search Fails**:
   - **Cause**: Empty `users` table or RLS restrictions.
   - **Fix**: Add test users to Supabase (as shown above). Verify RLS policy for `users` table.
   - **Test**: Search for a known user and check console for “Contacts found”.

3. **Chat Creation Fails**:
   - **Cause**: Authentication issue or RLS restrictions on `chats` table.
   - **Fix**: Ensure user is logged in (check Firebase UID). Add RLS policy for `chats` table (as above).
   - **Test**: Start a chat and check Supabase `chats` table.

4. **JavaScript Errors**:
   - **Cause**: Module import issues or browser compatibility.
   - **Fix**: Ensure `type="module"` in script tags. Test in Chrome/Firefox.

#### **Step 6: Update Vercel**
1. **Push Changes**:
   - If you updated `script.js`, commit and push:
     ```bash
     git add script.js
     git commit -m "Fix Mafia button with enhanced debugging"
     git push origin main
     ```

2. **Redeploy**:
   - Vercel should auto-deploy. Manually redeploy if needed via Vercel’s dashboard.

3. **Verify Environment Variables**:
   - In Vercel **Settings > Environment Variables**, ensure:
     - `SUPABASE_URL`: `ttps://ltrbnjqvmtaposcbfzem.supabase.co`
     - `SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cmJuanF2bXRhcG9zY2JmemVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTg2NjksImV4cCI6MjA2Nzk5NDY2OX0.WVKje-Zecelx8FN7JrZSaSriOkUeVvX90QQ-O9pJCpc`
     - `FIREBASE_API_KEY`: `AIzaSyB3qEXB3nh8CHCTQ2PBPLA-CgUDLyN0f4M`

#### **Step 7: Final Testing**
1. **Clear Browser Cache**:
   - Clear your browser cache to ensure the latest `script.js` is loaded.

2. **Test Workflow**:
   - Log in via OTP.
   - Click the "Mafia" button.
   - Search for a contact and start a chat.
   - Verify the chat appears in the chat list and Supabase.

3. **Share Console Errors**:
   - If the button still doesn’t work, share the console logs from **Developer Tools > Console**.
   - Note specific behaviors (e.g., modal doesn’t open, search fails, etc.).

---

### **Notes**
- **Security**: For production, move sensitive keys to environment variables:
  - Update `firebase.js` and `supabase.js` to use `import.meta.env.VITE_FIREBASE_API_KEY` and `import.meta.env.VITE_SUPABASE_ANON_KEY`.
  - Add to Vercel’s environment variables.
- **Firebase OTP**: Ensure SMS quotas are sufficient. Email links require correct redirect URL.
- **Supabase Data**: Add multiple test users to make contact search functional.
- **Real-Time Updates**: Consider adding Supabase subscriptions for real-time chat updates:
  ```javascript
  supabase
    .channel('messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
      if (payload.new.chat_id === currentChat?.id) {
        currentChat.messages.push({
          text: payload.new.text,
          sent: payload.new.sender_id === auth.currentUser.uid,
          time: new Date(payload.new.sent_at).toLocaleTimeString()
        });
        showChatMessages(currentChat);
      }
    })
    .subscribe();
  ```

---

This updated `script.js` includes robust debugging to identify why the "Mafia" button isn’t working. Update the file, redeploy, and test again. If issues persist, share the console logs or specific behavior (e.g., “modal doesn’t open” or “search returns no results”), and I’ll provide a targeted fix.
