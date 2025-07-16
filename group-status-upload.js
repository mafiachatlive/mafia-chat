// scripts/group-status-upload.js

let currentUser = null;
let voiceBlob = null;
let mediaRecorder = null;
let audioChunks = [];

initUser();

async function initUser() {
  const user = supabase.auth.user();
  if (!user) {
    alert("🔐 Login required.");
    return;
  }
  currentUser = user;
}

// 🎙️ Voice Recording Logic
document.getElementById('recordBtn').addEventListener('click', async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];

  mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
  mediaRecorder.onstop = () => {
    voiceBlob = new Blob(audioChunks, { type: 'audio/webm' });
    document.getElementById('voicePreview').src = URL.createObjectURL(voiceBlob);
  };

  mediaRecorder.start();
  document.getElementById('recordBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;
});

document.getElementById('stopBtn').addEventListener('click', () => {
  mediaRecorder.stop();
  document.getElementById('recordBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
});

async function uploadStatus() {
  const groupId = document.getElementById('group_id').value.trim();
  const text = document.getElementById('textStatus').value.trim();
  const file = document.getElementById('mediaInput').files[0];
  const expiryDays = parseInt(document.getElementById('expiry').value);

  if (!groupId) return alert("⚠️ Group ID required.");

  const timestamp = new Date();
  const expires_at = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();

  let uploadedURL = null;
  let fileType = "text";

  if (file) {
    const ext = file.name.split('.').pop().toLowerCase();
    const mediaPath = `group-status/${groupId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('status-stories').upload(mediaPath, file);
    if (error) return alert("❌ File upload failed.");

    uploadedURL = supabase.storage.from('status-stories').getPublicUrl(mediaPath).publicURL;

    if (ext.match(/(jpg|jpeg|png|gif)/)) fileType = "image";
    else if (ext.match(/(mp4|mov|webm)/)) fileType = "video";
    else if (ext.match(/(mp3|wav)/)) fileType = "audio";
    else fileType = "file";
  }

  if (voiceBlob) {
    const voicePath = `group-status/${groupId}/voice-${Date.now()}.webm`;
    const { error } = await supabase.storage.from('status-stories').upload(voicePath, voiceBlob);
    if (error) return alert("❌ Voice upload failed.");

    uploadedURL = supabase.storage.from('status-stories').getPublicUrl(voicePath).publicURL;
    fileType = "voice";
  }

  const finalContent = uploadedURL || text;
  if (!finalContent) return alert("⚠️ Please enter text, record voice, or upload a file.");

  const { error: dbError } = await supabase.from('status')
    .insert([{
      group_id: groupId,
      sender_id: currentUser.id,
      type: fileType,
      content: finalContent,
      timestamp: timestamp.toISOString(),
      expires_at: expires_at
    }]);

  if (dbError) return alert("❌ Failed to save status.");

  alert("✅ Status uploaded!");
  // Reset
  document.getElementById('textStatus').value = '';
  document.getElementById('mediaInput').value = '';
  document.getElementById('voicePreview').src = '';
  voiceBlob = null;
}
