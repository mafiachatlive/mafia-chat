// scripts/group-voice.js

let currentUser = null;
let mediaRecorder = null;
let audioChunks = [];

async function initVoiceSystem() {
  const user = supabase.auth.user();
  if (!user) {
    alert('🔐 Login required to record voice messages.');
    return;
  }
  currentUser = user;
}
initVoiceSystem();

document.getElementById('recordBtn').addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = event => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      uploadVoiceMessage(blob);
    };

    mediaRecorder.start();
    document.getElementById('recordBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;

  } catch (error) {
    alert('❌ Microphone access denied or not available.');
  }
});

document.getElementById('stopBtn').addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    document.getElementById('recordBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
  }
});

async function uploadVoiceMessage(blob) {
  const groupId = document.getElementById('group_id').value.trim();

  if (!groupId) {
    alert('⚠️ Please enter a Group ID.');
    return;
  }

  const fileName = `voice-${Date.now()}.webm`;
  const filePath = `groups/${groupId}/voice/${fileName}`;

  const { error: uploadError } = await supabase
    .storage
    .from('group-media')
    .upload(filePath, blob);

  if (uploadError) {
    alert(`❌ Upload failed: ${uploadError.message}`);
    return;
  }

  const { publicURL } = supabase
    .storage
    .from('group-media')
    .getPublicUrl(filePath);

  // 🕒 Get current ISO timestamp
  const timestamp = new Date().toISOString();

  // 📝 Insert message into group_chats with timestamp
  const { error: dbError } = await supabase
    .from('group_chats')
    .insert([{
      group_id: groupId,
      sender_id: currentUser.id,
      type: 'voice',
      content: publicURL,
      delivered: false,
      seen: false,
      timestamp: timestamp  // ✅ This is your original timestamp line
    }]);

  if (dbError) {
    alert(`❌ Database insert failed: ${dbError.message}`);
    return;
  }

  const audio = document.createElement('audio');
  audio.controls = true;
  audio.src = publicURL;
  document.getElementById('recordingsList').appendChild(audio);

  alert('✅ Voice message sent at ' + timestamp);
}
