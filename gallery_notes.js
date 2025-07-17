import { supabase } from './supabase.js'

async function addNote() {
  const title = document.getElementById('title').value.trim()
  const description = document.getElementById('description').value.trim()

  if (!title || !description) {
    alert("Title and description required")
    return
  }

  const { data, error } = await supabase
    .from('gallery_notes')
    .insert([{ title, description }])

  if (error) {
    console.error("Insert error:", error)
    alert("Failed to add note")
  } else {
    alert("Note added")
    document.getElementById('title').value = ''
    document.getElementById('description').value = ''
    loadNotes()
  }
}

async function loadNotes() {
  const { data: notes, error } = await supabase
    .from('gallery_notes')
    .select('*')
    .order('id', { ascending: false })

  const container = document.getElementById('notesContainer')
  container.innerHTML = ''

  if (error) {
    container.innerHTML = '<p>Error loading notes</p>'
    console.error(error)
    return
  }

  if (notes.length === 0) {
    container.innerHTML = '<p>No notes found</p>'
    return
  }

  notes.forEach(note => {
    const div = document.createElement('div')
    div.className = 'note'
    div.innerHTML = `<strong>${note.title}</strong><p>${note.description}</p>`
    container.appendChild(div)
  })
}

loadNotes()
