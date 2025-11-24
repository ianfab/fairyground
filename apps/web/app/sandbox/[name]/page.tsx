"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Send, AlertCircle, Save, Play, Code, Eye } from "lucide-react";
import Editor from "@monaco-editor/react";
import { useAuthInfo } from "@propelauth/react";
import { Game } from "@/lib/types";
import { getGameServerUrl, getGameUrl } from "@/lib/config";

export default function SandboxPage() {
  const params = useParams();
  const router = useRouter();
  const gameName = params.name as string;

  // Auth
  let user: any = null;
  try {
    const authInfo = useAuthInfo();
    user = authInfo.user;
  } catch (e) {
    // Auth not configured
  }

  const [gameCode, setGameCode] = useState("");
  const [gameDescription, setGameDescription] = useState("");
  const [originalCode, setOriginalCode] = useState("");
  const [gameData, setGameData] = useState<Game | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string; explanation?: string; reasoning?: string }>>([]);
  const [userMessage, setUserMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [newGameName, setNewGameName] = useState("");
  const [newGameDescription, setNewGameDescription] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewRoomId, setPreviewRoomId] = useState(() => `room-${Math.random().toString(36).substring(7)}`);
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Debounced code change handler
  const handleCodeChange = useCallback((value: string | undefined) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setGameCode(value || "");
    }, 150); // 150ms debounce
  }, []);

  // Fetch game data on mount
  useEffect(() => {
    async function fetchGame() {
      try {
        const response = await fetch(`/api/games/${gameName}`);
        if (!response.ok) {
          throw new Error("Game not found");
        }
        const game = await response.json();
        setGameData(game);
        setGameCode(game.code);
        setOriginalCode(game.code);
        setGameDescription(game.description || "");
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to load game");
        setLoading(false);
      }
    }

    fetchGame();
  }, [gameName]);

  const handleSendMessage = async () => {
    if (!userMessage.trim() || generating) return;

    const newMessage = userMessage.trim();
    setUserMessage("");

    // Add user message to chat
    setChatMessages(prev => [...prev, { role: "user", content: newMessage }]);
    setGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/generate-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: newMessage,
          existingCode: gameCode,
          model: "claude-sonnet-4-5-20250929",
          userId: user?.userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate code");
      }

      const data = await response.json();

      // Add AI response to chat with explanation and reasoning
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: data.explanation || "I've updated the code based on your request.",
        explanation: data.explanation,
        reasoning: data.reasoning
      }]);

      // Update the code
      setGameCode(data.code);
    } catch (err: any) {
      setError(err.message || "Failed to generate code");
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again."
      }]);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveGame = async () => {
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/games/${gameName}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: gameCode,
          description: gameDescription,
          creatorId: user?.userId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save game");
      }

      setSuccessMessage("Game saved successfully!");
      setOriginalCode(gameCode);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save game");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsNewGame = async () => {
    if (!newGameName.trim()) {
      setError("Game name is required");
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGameName.trim(),
          description: newGameDescription.trim() || gameDescription,
          code: gameCode,
          // Send user info explicitly
          creatorId: user?.userId,
          creatorEmail: user?.email,
          creatorUsername: user?.username
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save new game");
      }

      const newGame = await response.json();
      setSuccessMessage(`New game "${newGameName}" created successfully!`);
      setShowSaveAsModal(false);
      setNewGameName("");
      setNewGameDescription("");

      // Redirect to the new game's sandbox after a brief delay
      setTimeout(() => {
        router.push(`/sandbox/${encodeURIComponent(newGame.name)}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to save new game");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = gameCode !== originalCode;

  // Check if current user is the creator
  const isCreator = user?.userId && gameData?.creator_id && user.userId === gameData.creator_id;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Editing: <span className="text-purple-400">{gameName}</span>
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Describe your changes on the left, see the code on the right
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={getGameUrl(gameName)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              Test Game
            </a>
            {isCreator && (
              <button
                onClick={handleSaveGame}
                disabled={!hasChanges || saving}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-colors ${
                  hasChanges && !saving
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : hasChanges ? "Save Changes" : "Saved"}
              </button>
            )}
            <button
              onClick={() => setShowSaveAsModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save As...
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
            <p className="text-green-200 text-sm">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        <div className="grid grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Left: Chat Window */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 flex flex-col min-h-0">
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
              <p className="text-sm text-gray-400">Describe what you want to change</p>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center text-gray-500 mt-8">
                  <p>Ask the AI to help you edit the game code.</p>
                  <p className="text-sm mt-2">
                    Example: "Add a score multiplier" or "Make the game harder"
                  </p>
                </div>
              )}
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
              {generating && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 text-gray-100 rounded-lg p-3">
                    <p className="text-sm">Generating...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Describe your changes..."
                  disabled={generating}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!userMessage.trim() || generating}
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Code Editor or Preview */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 flex flex-col min-h-0">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {showPreview ? "Game Preview" : "Game Code"}
                </h2>
                <p className="text-sm text-gray-400">
                  {showPreview ? "Test your changes" : "Edit directly or use AI to modify"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowPreview(true);
                    // Generate new room ID to force reload
                    setPreviewRoomId(`room-${Math.random().toString(36).substring(7)}`);
                  }}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    showPreview
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    !showPreview
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  <Code className="w-4 h-4" />
                  Code
                </button>
                {showPreview && (
                  <button
                    onClick={() => {
                      // Force iframe refresh by changing the room ID
                      setPreviewRoomId(`room-${Math.random().toString(36).substring(7)}`);
                    }}
                    className="px-3 py-2 rounded-lg flex items-center gap-2 bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors"
                    title="Refresh game"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              {showPreview ? (
                <iframe
                  ref={iframeRef}
                  src={`${getGameServerUrl()}/game/${gameName}/${previewRoomId}`}
                  className="w-full h-full border-0"
                  title="Game Preview"
                  key={previewRoomId}
                />
              ) : (
                <Editor
                  height="100%"
                  defaultLanguage="javascript"
                  value={gameCode}
                  onChange={handleCodeChange}
                  theme="vs-dark"
                  options={{
                    fontSize: 13,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save As Modal */}
      {showSaveAsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-4">Save As New Game</h2>
            <p className="text-gray-400 text-sm mb-6">
              Create a new game based on the current code
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Game Name *
                </label>
                <input
                  type="text"
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  placeholder="e.g., My Awesome Game"
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newGameDescription}
                  onChange={(e) => setNewGameDescription(e.target.value)}
                  placeholder="Describe your game..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveAsNewGame}
                disabled={!newGameName.trim() || saving}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                  newGameName.trim() && !saving
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                }`}
              >
                {saving ? "Creating..." : "Create Game"}
              </button>
              <button
                onClick={() => {
                  setShowSaveAsModal(false);
                  setNewGameName("");
                  setNewGameDescription("");
                }}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
