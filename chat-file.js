const receiver_id = "REPLACE_RECEIVER_ID"; // ⛔ Replace this with actual receiver UID

async function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  if (!file) return alert("⚠️ Select a file first.");

  const fileName = `${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage
    .from('file-uploads')
    .upload(fileName, file);

  const status = document.getElementById("status");

  if (error) {
    status.textContent = "❌ Upload failed.";
    console.error(error);
    return;
  }

  status.textContent = `✅ File uploaded: ${fileName}`;

  await supabase.from("messages").insert([{
    sender_id: supabase.auth.user().id,
    receiver_id: receiver_id,
    type: "file",
    content: fileName,
    delivered: false,
    seen: false
  }]);
}

// ✅ Load messages with ticks
async function loadMessages() {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("sender_id", supabase.auth.user().id)
    .or("type.eq.file")
    .order("timestamp", { ascending: false });

  const container = document.getElementById("fileMessages");
  container.innerHTML = "";

  data.forEach(msg => {
    const ticks = msg.seen
      ? '✔✔ <span style="color:green;">Seen</span>'
      : msg.delivered
        ? '✔✔ <span style="color:blue;">Delivered</span>'
        : '✔ Sent';

    const div = document.createElement("div");
    div.innerHTML = `
      <p><strong>File:</strong> <a href="https://ltrbnjqvmtaposcbfzem.supabase.co/storage/v1/object/public/file-uploads/${msg.content}" target="_blank">${msg.content}</a></p>
      <p>Status: ${ticks}</p>
      <hr/>
    `;
    container.appendChild(div);
  });
}

// ✅ Tick update functions
async function markDelivered(messageId) {
  await supabase.from('messages').update({ delivered: true }).eq('id', messageId);
}

async function markSeen(messageId) {
  await supabase.from('messages').update({ seen: true }).eq('id', messageId);
}

loadMessages();
