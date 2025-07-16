// emoji-picker.js

let allEmojis = [];
let favEmojis = JSON.parse(localStorage.getItem("favEmojis") || "[]");

const emojiSearch = document.getElementById("emojiSearch");
const emojiList = document.getElementById("emojiList");
const favList = document.getElementById("favList");

// Load emoji data
fetch("emoji-data.json")
  .then(res => res.json())
  .then(data => {
    allEmojis = data;
    renderEmojiList();
    renderFavList();
  });

function renderEmojiList(filter = "") {
  emojiList.innerHTML = "";
  allEmojis
    .filter(e => e.includes(filter))
    .forEach(emoji => {
      const btn = document.createElement("button");
      btn.textContent = emoji;
      btn.className = "emoji-btn";
      btn.onclick = () => {
        insertEmoji(emoji);
        addToFavs(emoji);
      };
      emojiList.appendChild(btn);
    });
}

function insertEmoji(emoji) {
  const chatInput = parent.document.getElementById("message");
  if (chatInput) {
    chatInput.value += emoji;
    chatInput.focus();
  }
}

function addToFavs(emoji) {
  if (!favEmojis.includes(emoji)) {
    favEmojis.unshift(emoji);
    if (favEmojis.length > 25) favEmojis.pop();
    localStorage.setItem("favEmojis", JSON.stringify(favEmojis));
    renderFavList();
  }
}

function renderFavList() {
  favList.innerHTML = "";
  favEmojis.forEach(emoji => {
    const btn = document.createElement("button");
    btn.textContent = emoji;
    btn.className = "emoji-btn fav";
    btn.draggable = true;
    btn.ondragstart = e => e.dataTransfer.setData("text/plain", emoji);
    btn.ondragover = e => e.preventDefault();
    btn.ondrop = e => {
      e.preventDefault();
      const dragged = e.dataTransfer.getData("text");
      const fromIndex = favEmojis.indexOf(dragged);
      const toIndex = favEmojis.indexOf(emoji);
      favEmojis.splice(fromIndex, 1);
      favEmojis.splice(toIndex, 0, dragged);
      localStorage.setItem("favEmojis", JSON.stringify(favEmojis));
      renderFavList();
    };
    btn.onclick = () => insertEmoji(emoji);
    favList.appendChild(btn);
  });
}

emojiSearch.addEventListener("input", () => {
  renderEmojiList(emojiSearch.value);
});
