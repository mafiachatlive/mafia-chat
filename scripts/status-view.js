// scripts/status-view.js

let currentUser = null;

async function initUser() {
  const user = supabase.auth.user();
  if (!user) {
    alert("🔐 Please log in.");
    return;
  }
  currentUser = user;
}
initUser();

async function loadStatus() {
  const container = document.getElementById("statusContainer");
  container.innerHTML = "⏳ Loading...";
  const uidFilter = document.getElementById("user_id").value.trim();
  const maxDays = parseInt(document.getElementById("max_days").value);

  const cutoffDate = new Date(Date.now() - maxDays * 86400000).toISOString();

  let query = supabase
    .from("status")
    .select("*")
    .gte("timestamp", cutoffDate)
    .lte("expires_at", new Date().toISOString())
    .order("timestamp", { ascending: false });

  if (uidFilter) {
    query = query.eq("sender_id", uidFilter);
  }

  const { data, error } = await query;

  if (error) {
    container.innerHTML = "❌ Error loading status.";
    return;
  }

  container.innerHTML = "";
  data.forEach((item) => {
    const card = document.createElement("div");
    card.className = "status-card";

    const tick = getTick(item);
    const date = new Date(item.timestamp).toLocaleString();

    let media = "";
    if (item.type === "image") {
      media = `<img src="${item.content}" alt="status image" />`;
    } else if (item.type === "video") {
      media = `<video src="${item.content}" controls></video>`;
    } else if (item.type === "audio" || item.type === "voice") {
      media = `<audio src="${item.content}" controls></audio>`;
    } else if (item.type === "text") {
      media = `<div style="padding:10px;background:#eaeaea;border-radius:8px;">${item.content}</div>`;
    } else {
      media = `<a href="${item.content}" target="_blank">📁 View File</a>`;
    }

    card.innerHTML = `
      <strong>👤 ${item.sender_id}</strong><br>
      <span class="status-meta">${date} — ${tick}</span>
      ${media}
      <div class="emoji-react">❤️ 😂 😍 😭 😡</div>
    `;

    card.querySelector(".emoji-react").addEventListener("click", (e) => {
      if (e.target.tagName === "DIV") return;
      const emoji = e.target.textContent;
      alert(`You reacted with ${emoji} (coming soon)`);
      // TODO: store reaction
    });

    if (!item.seen && item.sender_id !== currentUser.id) {
      markSeen(item.id);
    }

    container.appendChild(card);
  });
}

// ✅ Tick Status Logic
function getTick(item) {
  if (item.seen) {
    return '✔✔ <span style="color:green;">Seen</span>';
  } else {
    return '✔✔ <span style="color:blue;">Delivered</span>';
  }
}

// ✅ Mark as Seen
async function markSeen(id) {
  await supabase.from("status").update({ seen: true }).eq("id", id);
}
