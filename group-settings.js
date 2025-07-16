// /mafiachat/scripts/group-settings.js

let currentUser = null;

async function initUser() {
  const user = supabase.auth.user();
  if (!user) {
    document.getElementById("status").textContent = "🔐 Please log in first.";
    return;
  }
  currentUser = user;
}
initUser();

async function updateGroupInfo() {
  const group_id = document.getElementById("group_id").value.trim();
  const name = document.getElementById("group_name").value.trim();
  const desc = document.getElementById("group_description").value.trim();
  const profile = document.getElementById("group_profile").value.trim();
  const banner = document.getElementById("group_banner").value.trim();

  if (!group_id || !name) {
    return showStatus("❌ Group ID and Name are required");
  }

  const { error } = await supabase.from("groups").update({
    name,
    description: desc,
    profile_image: profile,
    banner_image: banner,
    updated_at: new Date().toISOString()
  }).eq("id", group_id);

  if (error) return showStatus("❌ Failed to update group info");

  showStatus("✅ Group info updated!");
}

async function updateGroupSettings() {
  const group_id = document.getElementById("group_id").value.trim();
  const can_post = document.getElementById("can_post").value;
  const can_see = document.getElementById("can_see_members").value;

  if (!group_id) return showStatus("❌ Group ID required");

  const { error } = await supabase.from("groups").update({
    permissions: {
      can_post,
      can_see_members: can_see
    },
    updated_at: new Date().toISOString()
  }).eq("id", group_id);

  if (error) return showStatus("❌ Failed to save group settings");

  showStatus("✅ Settings saved!");
}

// Utility: Show status
function showStatus(msg) {
  document.getElementById("status").innerHTML = msg;
}
