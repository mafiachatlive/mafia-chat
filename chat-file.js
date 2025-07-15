// chat-file.js
async function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  if (!file) return alert("⚠️ Select a file first.");

  const fileName = `${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage.from('file-uploads').upload(fileName, file);

  const status = document.getElementById("status");
  if (error) {
    status.textContent = "❌ Upload failed.";
    console.error(error);
  } else {
    status.textContent = `✅ File uploaded: ${fileName}`;
    // Optional: Save file link in messages table
    await supabase.from("messages").insert([{
      sender_id: supabase.auth.user().id,
      receiver_id: "receiver-uid", // Replace with actual receiver
      type: "file",
      content: data.Key,
      timestamp: Date.now()
    }]);
  }
}
