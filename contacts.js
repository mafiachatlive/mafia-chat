import { supabase } from './supabase.js';

const contactForm = document.getElementById('contact-form');
const contactsList = document.getElementById('contacts-list');

// Add contact
contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();

  const { error } = await supabase.from('contacts').insert([{ name, phone, email }]);

  if (error) {
    alert('Error adding contact: ' + error.message);
  } else {
    alert('Contact added!');
    contactForm.reset();
    fetchContacts();
  }
});

// Fetch contacts
async function fetchContacts() {
  const { data, error } = await supabase.from('contacts').select('*').order('id', { ascending: false });

  contactsList.innerHTML = '';

  if (error) {
    contactsList.innerHTML = '<li>Error fetching contacts.</li>';
    return;
  }

  data.forEach((contact) => {
    const li = document.createElement('li');
    li.textContent = `${contact.name} - ${contact.phone} - ${contact.email || 'No email'}`;
    contactsList.appendChild(li);
  });
}

// Load contacts on page load
fetchContacts();
