"use client";

import { useState } from "react";
import { Send } from "lucide-react";

interface EditingPanelProps {
  explanation: string;
  reasoning: string;
  chatMessages: Array<{ role: string; content: string; explanation?: string; reasoning?: string }>;
  userMessage: string;
  setUserMessage: (message: string) => void;
  onSendMessage: () => void;
  generatingCode: boolean;
}

export function EditingPanel({
  explanation,
  reasoning,
  chatMessages,
  userMessage,
  setUserMessage,
  onSendMessage,
  generatingCode,
}: EditingPanelProps) {
  return (
    <div className="h-full flex flex-col bg-gray-900/95 backdrop-blur-sm">
      {/* Model Explanation Section */}
      {explanation && (
        <div className="border-b border-gray-700 p-6">
          <h3 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
            <span className="text-2xl">✨</span>
            AI Explanation
          </h3>
          <p className="text-base text-gray-100 leading-relaxed">{explanation}</p>
          
          {reasoning && (
            <details className="mt-4 group">
              <summary className="cursor-pointer text-sm font-semibold text-blue-400 flex items-center gap-2 hover:text-blue-300 transition-colors">
                <span>🧠</span>
                View Model Reasoning (Advanced)
                <svg className="w-4 h-4 text-gray-400 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-3 p-4 bg-gray-800/50 rounded-lg max-h-48 overflow-y-auto">
                <pre className="text-xs text-blue-300 whitespace-pre-wrap font-mono leading-relaxed">{reasoning}</pre>
              </div>
            </details>
          )}
        </div>
      )}

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="text-sm text-gray-400 text-center mb-4">
          Ask the AI to make changes to your game
        </div>
        
        {chatMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg overflow-hidden ${
                msg.role === "user"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-100"
              }`}
            >
              <div className="p-3">
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === "assistant" && msg.reasoning && (
                <details className="group border-t border-gray-700">
                  <summary className="cursor-pointer p-2 px-3 hover:bg-gray-700/50 transition-colors list-none flex items-center justify-between text-xs text-gray-400">
                    <span>Model Reasoning</span>
                    <svg className="w-3 h-3 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="p-3 pt-2 max-h-32 overflow-y-auto bg-gray-900/50">
                    <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono">{msg.reasoning}</pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        ))}
        
        {generatingCode && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-100 rounded-lg p-3">
              <p className="text-sm">Generating...</p>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-gray-700 bg-gray-800/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !generatingCode && userMessage.trim()) {
                onSendMessage();
              }
            }}
            placeholder="Describe your changes..."
            disabled={generatingCode}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-900 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={onSendMessage}
            disabled={!userMessage.trim() || generatingCode}
            className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

