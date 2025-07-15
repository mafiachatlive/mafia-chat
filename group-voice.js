let currentUser;
let mediaRecorder;
let audioChunks = [];

async function init() {
  const user = supabase.auth.user();
  if (!user) {
    alert('Login required');
    return;
  }
  currentUser = user;
}
init();

document.getElementById('recordBtn').addEventListener('click', async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];

  mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
  mediaRecorder.onstop = () => uploadVoice(new Blob(audioChunks, { type: 'audio/webm' }));

  mediaRecorder.start();
  document.getElementById('recordBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;
});

document.getElementById('stopBtn').addEventListener('click', () => {
  if (mediaRecorder) mediaRecorder.stop();
  document.getElementById('recordBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
});

async function uploadVoice(blob) {
  const groupId = document.getElementById('group_id').value;
  if (!groupId) return alert('Enter Group ID');

  const fileName = `voice-${Date.now()}.webm`;
  const filePath = `groups/${groupId}/voice/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('group-media')
    .upload(filePath, blob);

  if (uploadError) return alert('Upload failed');

  const fileURL = supabase.storage.from('group-media').getPublicUrl(filePath).publicURL;

  const { error: dbError } = await supabase
    .from('group_chats')
    .insert([{
      group_id: groupId,
      sender_id: currentUser.id,
      type: 'voice',
      content: fileURL
    }]);

  if (dbError) return alert('DB insert failed');

  const audio = document.createElement('audio');
  audio.controls = true;
  audio.src = fileURL;
  document.getElementById('recordingsList').appendChild(audio);

  alert('✅ Voice sent!');
}
