let chatFlow = {};
let currentNode = "language_select";
let selectedLanguage = "en";

// Load JSON flow
fetch("faq.json")
  .then(res => res.json())
  .then(data => {
    chatFlow = data;
    showNode(currentNode);
  })
  .catch(err => console.error("Error loading JSON:", err));

// --------------------
// Core functions
// --------------------

// Show message + options for a node
function showNode(nodeKey) {
  const node = chatFlow[nodeKey];
  if (!node) return;

  // Show typing first
  showTypingIndicator();

  setTimeout(() => {
    removeTypingIndicator();

    // Show bot message
    const messageText = node.message[selectedLanguage];
    showMessage(messageText, "bot");

    // Show options if available
    if (node.options) {
      showOptions(node.options);
    }
  }, 600); // short delay to simulate typing
}

// Display a message
function showMessage(text, sender = "bot") {
  const messagesDiv = document.getElementById("messages");

  const wrapper = document.createElement("div");
  wrapper.className = "message-wrapper " + (sender === "user" ? "user-wrapper" : "");

  const avatar = document.createElement("div");
  avatar.className = "avatar " + (sender === "user" ? "user-avatar" : "bot-avatar");
  avatar.textContent = sender === "user" ? "You" : "Bot";

  const bubble = document.createElement("div");
  bubble.className = "message " + (sender === "user" ? "user-message" : "bot-message");
  bubble.textContent = text;

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  messagesDiv.appendChild(wrapper);

  // Scroll to bottom
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Typing indicator
function showTypingIndicator() {
  const messagesDiv = document.getElementById("messages");

  const wrapper = document.createElement("div");
  wrapper.className = "message-wrapper";
  wrapper.id = "typing";

  const avatar = document.createElement("div");
  avatar.className = "avatar bot-avatar";
  avatar.textContent = "Bot";

  const bubble = document.createElement("div");
  bubble.className = "message typing";
  bubble.innerHTML = '<span></span><span></span><span></span> Thinking...';

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  messagesDiv.appendChild(wrapper);

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function removeTypingIndicator() {
  const typing = document.getElementById("typing");
  if (typing) typing.remove();
}

// Show options as clickable buttons
function showOptions(options) {
  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt.label[selectedLanguage];
    btn.onclick = () => {
      handleOption(opt);
    };
    optionsDiv.appendChild(btn);
  });
}

// Handle option click
function handleOption(option) {
  // Show user's choice
  showMessage(option.label[selectedLanguage], "user");

  // Clear options after selection
  document.getElementById("options").innerHTML = "";

  // Change language if needed
  if (option.setLanguage) {
    selectedLanguage = option.setLanguage;
  }

  // Move to next node
  if (option.next) {
    setTimeout(() => {
      showNode(option.next);
    }, 300);
  }
}

// Handle manual input from the text box
const input = document.getElementById("messageInput");
input.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  // Show user's message
  showMessage(text, "user");
  input.value = "";

  // Clear options
  document.getElementById("options").innerHTML = "";

  // You can integrate backend logic here
  showTypingIndicator();

  setTimeout(() => {
    removeTypingIndicator();
    showMessage("Sorry, I didn't understand that. Please choose an option.", "bot");
  }, 800);
}