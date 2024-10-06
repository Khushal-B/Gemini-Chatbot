document.getElementById("sendBtn").addEventListener("click", sendMessage);

async function sendMessage() {
  const userInput = document.getElementById("userInput").value;
  
  if (!userInput) return;

  // Display user's message
  displayMessage(userInput, "user-message");
  
  // Clear input field
  document.getElementById("userInput").value = "";

  // Send input to backend
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: userInput })
  });
  
  const data = await response.json();
  const botMessage = data.response;

  // Display AI's message
  displayMessage(botMessage, "bot-message");
}

function displayMessage(text, className) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", className);
  messageElement.textContent = text;

  const chatBox = document.getElementById("chat-box");
  chatBox.appendChild(messageElement);

  // Scroll to the bottom
  chatBox.scrollTop = chatBox.scrollHeight;
}
