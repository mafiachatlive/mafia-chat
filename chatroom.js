document.addEventListener('DOMContentLoaded', () => {
  const messages = document.getElementById('messages');
  const messageInput = document.getElementById('messageInput');
  const headerButtons = document.querySelectorAll('.header-buttons button');
  const bottomTabs = document.querySelectorAll('.bottom-tabs button');
  const floatingMafia = document.querySelector('.floating-mafia');

  // Send message functionality
  window.sendMessage = function() {
    const text = messageInput.value.trim();
    if (text === '') return;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'message sent';
    msgDiv.textContent = text;
    messages.appendChild(msgDiv);
    messageInput.value = '';
    messages.scrollTop = messages.scrollHeight;
  };

  // Handle header buttons (Chats, Status, Groups, Calls)
  headerButtons.forEach(button => {
    button.addEventListener('click', () => {
      headerButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      // Placeholder for future functionality
      console.log(`Switched to ${button.textContent}`);
    });
  });

  // Handle bottom tabs (All, Family, Friends, Business)
  bottomTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      bottomTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      // Placeholder for future functionality
      console.log(`Switched to ${tab.textContent} tab`);
    });
  });

  // Floating Mafia button click handler
  floatingMafia.addEventListener('click', () => {
    console.log('Mafia button clicked');
    // Placeholder for future functionality
    alert('Mafia button clicked!');
  });

  // Allow sending message with Enter key
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
});
