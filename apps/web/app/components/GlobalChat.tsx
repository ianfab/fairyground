"use client";

import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, X } from "lucide-react";
import { useAuthInfo } from "@propelauth/react";

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: string;
}

// Generate unique anonymous name for guests
function generateGuestName(): string {
  const adjectives = [
    "Happy", "Clever", "Brave", "Swift", "Bright", "Cool", "Epic",
    "Lucky", "Mighty", "Noble", "Quick", "Wise", "Cosmic", "Stellar"
  ];
  const nouns = [
    "Panda", "Dragon", "Phoenix", "Tiger", "Wolf", "Eagle", "Lion",
    "Falcon", "Bear", "Hawk", "Fox", "Shark", "Raven", "Wizard"
  ];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 100);

  return `${adjective}${noun}${number}`;
}

export function GlobalChat() {
  const [isOpen, setIsOpen] = useState(false); // Closed by default
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auth
  let user: any = null;
  try {
    const authInfo = useAuthInfo();
    user = authInfo.user;
  } catch (e) {
    // Auth not configured
  }

  // Generate and persist guest name in localStorage
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    } else {
      // Check if we already have a guest name in localStorage
      let guestName = localStorage.getItem("guestChatName");
      if (!guestName) {
        guestName = generateGuestName();
        localStorage.setItem("guestChatName", guestName);
      }
      setUsername(guestName);
    }
  }, [user]);

  // Fetch messages periodically
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch("/api/chat");
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    // Fetch immediately
    fetchMessages();

    // Poll every 2 seconds
    const interval = setInterval(fetchMessages, 2000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    setIsSending(true);
    setError("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          message: inputMessage.trim(),
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages((prev) => [...prev, newMessage]);
        setInputMessage("");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-lg transition-all z-50 flex items-center gap-2"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="font-semibold">Global Chat</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-gray-900 border border-gray-800 rounded-xl shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold">Global Chat</h3>
              <p className="text-xs text-gray-400">Discuss games with others</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 text-sm mt-8">
                No messages yet. Be the first to say hello!
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-purple-400 text-sm font-semibold">
                    {msg.username}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-gray-200 text-sm mt-1 break-words">
                  {msg.message}
                </p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-800">
            {error && (
              <div className="mb-2 text-xs text-red-400 bg-red-900/20 px-3 py-2 rounded">
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  setError("");
                }}
                onKeyPress={handleKeyPress}
                placeholder={`Message as ${username}...`}
                className="flex-1 px-3 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-500 text-sm border border-gray-700 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
