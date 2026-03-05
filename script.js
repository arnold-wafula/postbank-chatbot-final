let chatFlow = {};
let currentNode = "language_select";
let selectedLanguage = "en";

/* ============ Load JSON flow ============ */
fetch("faq.json")
  .then(res => res.json())
  .then(data => {
    chatFlow = data;
    showNode(currentNode);
  })
  .catch(err => console.error("Error loading JSON:", err));

/* ============ i18n strings ============ */
const i18n = {
  en: {
    didntUnderstand: "I didn’t quite get that. Are you asking about:",
    finalFallback: "I can help with accounts, mobile banking, cards/ATM, transfers, and hours/fees. What would you like to do?",
    options: ["Accounts", "Mobile Banking", "Cards & ATM", "Transfers", "Help & Hours"],
    greeting: "Hi there! How can I help you today?",
    thinkingLabel: "Thinking..."
  },
  sw: {
    didntUnderstand: "Samahani, sijakuelewa vizuri. Je, unauliza kuhusu:",
    finalFallback: "Naweza kusaidia kuhusu akaunti, huduma ya simu, kadi/ATM, uhamisho, na saa/ada. Ungependa kufanya nini?",
    options: ["Akaunti", "Huduma ya Simu", "Kadi & ATM", "Uhamisho", "Saa & Ada"],
    greeting: "Habari! Naweza kukusaidiaje leo?",
    thinkingLabel: "Fikiria..."
  }
};

/* ============ NLU-lite intents ============ */
const intents = [
  {
    name: "greeting",
    match: /^(hi|hello|hey|habari|sasa|mambo|vipi)\b/i,
    action: () => {
      showMessage(i18n[selectedLanguage].greeting, "bot");
      showChips(i18n[selectedLanguage].options);
    }
  },
  { name: "hours", match: /\b(hours?|open|opening|saa|weekend)\b/i, action: () => routeToNode("branches_hours") },
  {
    name: "fees",
    match: /\b(fees?|charges?|tariffs?|ada)\b/i,
    action: () => {
      if (chatFlow["cards_fees"]) routeToNode("cards_fees");
      else {
        showMessage(
          "Common fees:\n• ATM card: KSh 600\n• ATM withdrawal: KSh 40\n• Over‑the‑counter: KSh 70\n• Mobile banking: KSh 50–60\n• PIN re‑issue: KSh 168",
          "bot"
        );
        showChips(["Cards & ATM", "Mobile Banking", "Help & Hours"]);
      }
    }
  },
  { name: "transfers", match: /\b(transfer|send|mpesa|m-pesa|paybill|swift|interbank)\b/i, action: () => routeToNode("transfers_menu") },
  { name: "accounts", match: /\b(account|akaunti|open account|savings|saye|fixed|company|helb)\b/i, action: () => routeToNode("accounts_menu") },
  { name: "mobile", match: /\b(mobile|app|ussd|\*498#|invalid device|blocked|register)\b/i, action: () => routeToNode("mobile_menu") },
  { name: "cards", match: /\b(card|atm|pin|limit|withheld|lost)\b/i, action: () => routeToNode("cards_menu") },
  {
    name: "help",
    match: /\b(help|msaada|support|agent|hours|fees)\b/i,
    action: () => {
      showMessage(i18n[selectedLanguage].finalFallback, "bot");
      showChips(i18n[selectedLanguage].options);
    }
  }
];

/* ============ Core rendering ============ */
function showNode(nodeKey) {
  const node = chatFlow[nodeKey];
  if (!node) return;

  showTypingIndicator();

  setTimeout(() => {
    removeTypingIndicator();

    const messageText = pickMessage(node.message);
    showMessage(messageText, "bot");

    if (node.options) showOptions(node.options);
  }, 600);
}

function pickMessage(messageObj) {
  if (!messageObj) return "";
  return messageObj[selectedLanguage] || messageObj.en || messageObj.sw || "";
}

/* Rich text: turn • / - / * lines into bullets; keep line breaks */
function renderRichText(text) {
  if (!text) return "";
  const lines = text.split(/\r?\n/);
  let html = "", inList = false;

  for (const raw of lines) {
    const line = raw.trim();

    // Markdown-style bold (optional)
    // Replace **text** with <strong>text</strong>
    const safe = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    if (/^([•\-\*]\s+)/.test(safe)) {
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${safe.replace(/^([•\-\*]\s+)/, "")}</li>`;
      continue;
    }
    if (inList) { html += "</ul>"; inList = false; }

    if (safe === "") { html += "<br/>"; continue; }
    html += `${safe}<br/>`;
  }
  if (inList) html += "</ul>";
  return html;
}

let lastSender = null;
function showMessage(text, sender = "bot") {
  const messagesDiv = document.getElementById("messages");

  const wrapper = document.createElement("div");
  wrapper.className = "message-wrapper " + (sender === "user" ? "user" : "");

  if (lastSender === sender) wrapper.classList.add("compact");
  lastSender = sender;

  const avatar = document.createElement("div");
  avatar.className = "avatar " + (sender === "user" ? "user-avatar" : "bot-avatar");

  const bubble = document.createElement("div");
  bubble.className = "bubble " + (sender === "user" ? "user-message" : "bot-message");
  bubble.innerHTML = renderRichText(text);

  if (sender !== "user") wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  messagesDiv.appendChild(wrapper);

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/* Typing indicator */
function showTypingIndicator() {
  const messagesDiv = document.getElementById("messages");
  const wrapper = document.createElement("div");
  wrapper.className = "message-wrapper";
  wrapper.id = "typing";

  const avatar = document.createElement("div");
  avatar.className = "avatar bot-avatar";

  const bubble = document.createElement("div");
  bubble.className = "bubble typing";
  const thinking = (i18n[selectedLanguage] && i18n[selectedLanguage].thinkingLabel) || "Thinking...";
  bubble.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span> ${thinking}`;

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  messagesDiv.appendChild(wrapper);

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
function removeTypingIndicator() {
  const typing = document.getElementById("typing");
  if (typing) typing.remove();
}

/* ============ Options (structured) ============ */
function showOptions(options) {
  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = (opt.label && (opt.label[selectedLanguage] || opt.label.en || opt.label.sw)) || "";
    btn.onclick = () => handleOption(opt);
    optionsDiv.appendChild(btn);
  });
}

/* Chips (ad‑hoc quick replies) */
function showChips(labels) {
  const chipsDiv = document.getElementById("chips");
  chipsDiv.innerHTML = "";
  labels.forEach(label => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = label;
    b.addEventListener('click', () => {
      // treat chip click like user input
      showMessage(label, "user");
      chipsDiv.innerHTML = "";
      document.getElementById("options").innerHTML = "";
      nluRoute(label);
    });
    chipsDiv.appendChild(b);
  });
}

function handleOption(option) {
  const chosen = (option.label && (option.label[selectedLanguage] || option.label.en || option.label.sw)) || "";
  showMessage(chosen, "user");

  document.getElementById("options").innerHTML = "";
  document.getElementById("chips").innerHTML = "";

  if (option.setLanguage) selectedLanguage = option.setLanguage;

  if (option.next) setTimeout(() => showNode(option.next), 300);
}

/* ============ Input handling ============ */
const input = document.getElementById("messageInput");
function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  showMessage(text, "user");
  input.value = "";

  document.getElementById("options").innerHTML = "";
  document.getElementById("chips").innerHTML = "";

  nluRoute(text);
}

/* ============ Routing (intents → nodes) ============ */
function nluRoute(userText) {
  // 1) Try quick intents
  const matched = intents.find(it => it.match.test(userText));
  if (matched) {
    showTypingIndicator();
    setTimeout(() => { removeTypingIndicator(); matched.action(); }, 400);
    return;
  }
  // 2) Try guess → node
  const key = guessNodeKey(userText);
  if (key) { routeToNode(key); return; }

  // 3) Clarify using chips
  smartFallback();
}

function routeToNode(nodeKey) {
  showTypingIndicator();
  setTimeout(() => {
    removeTypingIndicator();
    if (chatFlow[nodeKey]) showNode(nodeKey);
    else {
      showMessage(i18n[selectedLanguage].finalFallback, "bot");
      showChips(i18n[selectedLanguage].options);
    }
  }, 400);
}

/* Map loose keywords to node keys */
function guessNodeKey(t) {
  const text = t.toLowerCase();

  // language
  if (/\b(english|kiswahili|swahili)\b/.test(text)) {
    selectedLanguage = /(kiswahili|swahili)/.test(text) ? "sw" : "en";
    return "main_menu";
  }

  if (/\b(transfer|m-?pesa|mpesa)\b/.test(text)) return "transfers_menu";
  if (/\b(paybill|200999)\b/.test(text)) return "transfer_paybill";
  if (/\b(swift|international)\b/.test(text)) return "transfer_swift";
  if (/\b(wrong|reversal)\b/.test(text)) return "transfer_wrong";

  if (/\b(card|atm|pin|limit|withheld|lost)\b/.test(text)) return "cards_menu";
  if (/\b(fees?|charges?)\b/.test(text)) return "cards_fees";

  if (/\b(mobile|app|ussd|\*498#|invalid device|blocked)\b/.test(text)) return "mobile_menu";
  if (/\b(register|self-?register)\b/.test(text)) return "mobile_registration";
  if (/\b(invalid device)\b/.test(text)) return "mobile_invalid_device";
  if (/\b(blocked|pin)\b/.test(text)) return "mobile_pin_blocked";
  if (/\b(app|download)\b/.test(text)) return "mobile_app_download";

  if (/\b(account|akaunti|saye|helb|company|dormant|reactivation)\b/.test(text)) return "accounts_menu";
  if (/\b(saye)\b/.test(text)) return "saye_account";
  if (/\b(helb)\b/.test(text)) return "open_helb";
  if (/\b(company)\b/.test(text)) return "open_company";
  if (/\b(dormant|reactivation)\b/.test(text)) return "dormant_account";
  if (/\b(number|namba)\b/.test(text)) return "account_number";

  if (/\b(branch|hours|saa)\b/.test(text)) return "branches_hours";
  if (/\b(loan|mikopo)\b/.test(text)) return "loans_menu";

  return null;
}

/* Clarify → suggest chips */
function smartFallback() {
  showTypingIndicator();
  setTimeout(() => {
    removeTypingIndicator();
    showMessage(i18n[selectedLanguage].didntUnderstand, "bot");
    showChips(i18n[selectedLanguage].options);
  }, 500);
}