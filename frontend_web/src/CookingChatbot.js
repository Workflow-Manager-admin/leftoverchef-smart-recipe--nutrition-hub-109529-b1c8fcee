import React, { useState, useRef } from "react";
import "./CookingChatbot.css";

/**
 * PUBLIC_INTERFACE
 * CookingChatbot provides a floating, accessible chatbot UI that connects to Cohere AI's conversational endpoint.
 * Allows ongoing user/AI cooking conversation, with full safe/error handling. 
 */
function CookingChatbot({ apiKey }) {
  // Chatbot UI state
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I'm your Cooking Chatbot. Ask me anything about recipes, leftovers, nutrition, or cooking tips!",
    },
  ]);
  const [input, setInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const chatRef = useRef(null);

  // Cohere API endpoint
  const COHERE_ENDPOINT = "https://api.cohere.ai/v1/chat";

  // Handle submit by calling Cohere chat endpoint
  async function handleSend(e) {
    e && e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setErrorMsg(null);
    setMessages((msgs) => [
      ...msgs,
      { role: "user", text: userMsg }
    ]);
    setLoading(true);
    try {
      // Prepare chat history in Cohere's expected format
      const msgs = messages
        .concat({ role: "user", text: userMsg })
        .slice(-10)
        .map(m => ({ role: m.role, message: m.text })); // Cohere: role 'user' or 'assistant'
      // Call Cohere AI
      const resp = await fetch(COHERE_ENDPOINT, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMsg,
          // Cohere docs: conversation history, max_tokens, model (defaults ok)
          stream: false,
          model: "command-r-plus",
          chat_history: msgs
        }),
      });
      if (resp.status === 429) {
        setErrorMsg(
          "You have exceeded the current API usage limit for the chatbot. Please try again later."
        );
        setMessages((msgs) => [
          ...msgs,
          {
            role: "assistant",
            text:
              "Sorry, our Cooking Chatbot is temporarily unavailable due to API limits. Please try again soon.",
          },
        ]);
      } else if (!resp.ok) {
        setErrorMsg("The chatbot could not reply right now. Please try again.");
        setMessages((msgs) => [
          ...msgs,
          {
            role: "assistant",
            text:
              "Sorry, I couldn't get a reply from Cohere AI right now. Please try again in a moment.",
          },
        ]);
      } else {
        const data = await resp.json();
        // Show the AI's reply, fallback if not available
        setMessages((msgs) => [
          ...msgs,
          {
            role: "assistant",
            text: data.text || (data.reply ?? "Sorry, I couldn't find an answer."),
          },
        ]);
      }
    } catch (err) {
      setErrorMsg(
        "A network or internal error occurred connecting to the chatbot API."
      );
      setMessages((msgs) => [
        ...msgs,
        {
          role: "assistant",
          text: "Sorry, there was an unexpected error. Please check your connection and try again.",
        },
      ]);
    } finally {
      setLoading(false);
      // scroll to bottom of chat after message delivered
      setTimeout(() => {
        if (chatRef.current) {
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
      }, 80);
    }
  }

  // Handle input field Enter key
  function handleInputKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Floating Button: toggles chat open/close */}
      <button
        className="cooking-chatbot-fab"
        onClick={() => setShowChat((v) => !v)}
        aria-label={showChat ? "Close Cooking Chatbot" : "Open Cooking Chatbot"}
        tabIndex={0}
        style={{ zIndex: 9999 }}
      >
        {showChat ? "×" : "💬"}
      </button>
      {/* Chatbot Main UI */}
      <div
        className={`cooking-chatbot-widget${showChat ? " open" : ""}`}
        aria-live="polite"
        style={{ zIndex: 9998 }}
      >
        <div className="cooking-chatbot-header">
          <span className="cooking-chatbot-title" aria-label="Cooking Chatbot">
            🍳 Cooking Chatbot
          </span>
          <button
            className="cooking-chatbot-min-btn"
            aria-label="Close"
            onClick={() => setShowChat(false)}
            title="Close chat window"
          >
            ×
          </button>
        </div>
        <div className="cooking-chatbot-messages" ref={chatRef}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={
                "cooking-msg " +
                (msg.role === "user"
                  ? "cooking-msg-user"
                  : "cooking-msg-assistant")
              }
            >
              <span className="cooking-msg-sender">
                {msg.role === "assistant" ? "Chatbot" : "You"}
              </span>
              <span className="cooking-msg-content">{msg.text}</span>
            </div>
          ))}
          {loading && (
            <div className="cooking-msg cooking-msg-assistant">
              <span className="cooking-msg-sender">Chatbot</span>
              <span className="cooking-msg-content">...</span>
            </div>
          )}
        </div>
        <form
          className="cooking-chatbot-inputbar"
          onSubmit={handleSend}
          autoComplete="off"
        >
          <input
            type="text"
            value={input}
            disabled={loading}
            placeholder="Ask about recipes, cooking, nutrition, tips..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleInputKey}
            aria-label="Type a cooking question"
            required
            maxLength={512}
            autoFocus={!!showChat}
          />
          <button
            type="submit"
            className="cooking-chatbot-sendbtn"
            aria-label="Send"
            disabled={loading || !input.trim()}
            tabIndex={0}
          >
            ▶
          </button>
        </form>
        {errorMsg && (
          <div className="cooking-chatbot-error" aria-live="assertive">
            {errorMsg}
          </div>
        )}
        <div className="cooking-chatbot-poweredby">
          Powered by <a href="https://cohere.com/" target="_blank" rel="noopener noreferrer">Cohere AI</a>
        </div>
      </div>
    </>
  );
}

export default CookingChatbot;
