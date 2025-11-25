"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GAME_TEMPLATES, GameTemplate } from "@/lib/game-templates";
import { getGameUrl, getGameServerUrl } from "@/lib/config";
import { AlertCircle, Code, Eye, Send } from "lucide-react";
import { useAuthInfo, useRedirectFunctions } from "@propelauth/react";
import dynamic from 'next/dynamic';
import { SnakeGameWhileWaiting } from "@/app/components/SnakeGameWhileWaiting";
import { AuthModal } from "@/app/components/AuthModal";

const Editor = dynamic(
  () => import('@monaco-editor/react'),
  { ssr: false }
);

export default function CreateGame() {
  const router = useRouter();
  
  // Try to use auth, but gracefully handle if it's not configured
  let isLoggedIn = false;
  let user: any = null;
  let authLoading = false;
  let redirectToSignupPage = () => {
    alert("PropelAuth not configured. Please set NEXT_PUBLIC_AUTH_URL in your .env file.\n\nSee apps/web/PROPELAUTH_SETUP.md for instructions.");
  };
  let redirectToAccountPage = () => {};

  try {
    const authInfo = useAuthInfo();
    const redirectFunctions = useRedirectFunctions();
    
    isLoggedIn = authInfo.isLoggedIn || false;
    user = authInfo.user;
    authLoading = authInfo.loading || false;
    redirectToSignupPage = redirectFunctions.redirectToSignupPage;
    redirectToAccountPage = redirectFunctions.redirectToAccountPage;
  } catch (e) {
    // Auth not configured, use defaults
    console.log("Auth not configured, using guest mode");
  }
  
  const [selectedTemplate, setSelectedTemplate] = useState<GameTemplate | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [gameDescription, setGameDescription] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [explanation, setExplanation] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [previewGameName, setPreviewGameName] = useState<string>("");
  const [previewRoomId, setPreviewRoomId] = useState(() => `room-${Math.random().toString(36).substring(7)}`);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Edit mode chat
  const [isEditMode, setIsEditMode] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string; explanation?: string; reasoning?: string }>>([]);
  const [userMessage, setUserMessage] = useState("");

  // Debounced code change handler
  const handleCodeChange = useCallback((value: string | undefined) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setGeneratedCode(value || "");
    }, 150); // 150ms debounce
  }, []);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [gamesCreated, setGamesCreated] = useState(0);
  const [hasSpecialKey, setHasSpecialKey] = useState(false);

  // Check games created count on mount
  useEffect(() => {
    if (!authLoading) {
      // Check for special key in localStorage
      const storedKey = localStorage.getItem("specialKey");
      if (storedKey) {
        // Verify the key is still valid
        fetch("/api/verify-special-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: storedKey }),
        }).then(response => {
          if (response.ok) {
            setHasSpecialKey(true);
          } else {
            // Key is no longer valid, remove it
            localStorage.removeItem("specialKey");
            setHasSpecialKey(false);
          }
        }).catch(() => {
          setHasSpecialKey(false);
        });
      }

      if (isLoggedIn && user) {
        // For logged-in users, check their plan from metadata
        const userPlan = (user as any).metadata?.plan || 'free';
        const userGamesCreated = (user as any).metadata?.gamesCreated || 0;
        
        console.log('User plan:', userPlan, 'Games created:', userGamesCreated);
        
        // Paid users have unlimited games
        if (userPlan === 'paid') {
          setGamesCreated(0); // Don't show limit for paid users
        } else {
          setGamesCreated(userGamesCreated);
        }
      } else {
        // For non-logged-in users, use localStorage
        const count = parseInt(localStorage.getItem("createdGamesCount") || "0");
        setGamesCreated(count);
      }
    }
  }, [authLoading, isLoggedIn, user]);

  // Check if user needs to sign up or upgrade
  const checkCanCreate = () => {
    // Users with special key can always create
    if (hasSpecialKey) {
      return true;
    }

    // Non-logged-in users must sign up first
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return false;
    }

    if (user) {
      const userPlan = (user as any).metadata?.plan || 'free';
      
      // Paid users can always create
      if (userPlan === 'paid') {
        return true;
      }
      
      // Free logged-in users are limited to 5 games
      const userGamesCreated = (user as any).metadata?.gamesCreated || 0;
      if (userGamesCreated >= 5) {
        setShowAuthModal(true);
        return false;
      }

      return true;
    }
    
    return false;
  };

  const handleSpecialKeySubmit = (key: string) => {
    setHasSpecialKey(true);
    // Refresh the page state
    setShowAuthModal(false);
  };

  const handleTemplateSelect = (templateId: GameTemplate) => {
    // Require signup before selecting template
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }

    if (!checkCanCreate()) {
      return;
    }
    setSelectedTemplate(templateId);
  };

  const handleGenerateGame = async () => {
    if (!selectedTemplate || !gameDescription) {
      setError("Please select a template and describe your game");
      return;
    }

    setGeneratingCode(true);
    setError("");

    try {
      const res = await fetch("/api/generate-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: selectedTemplate,
          description: gameDescription,
          name,
          model: selectedModel,
          userId: user?.userId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate game");
      }

      const { code, suggestedName, suggestedDescription, explanation, reasoning } = await res.json();
      
      if (suggestedName && !name) setName(suggestedName);
      if (suggestedDescription && !description) setDescription(suggestedDescription);
      
      setGeneratedCode(code);
      setExplanation(explanation || "");
      setReasoning(reasoning || "");
      
      // Immediately ship in preview mode
      const previewName = suggestedName || `preview-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      await shipGameInPreviewMode(previewName, suggestedDescription || "", code);
      
      setShowPreview(true); // Default to showing preview when code is generated
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleEditGame = async () => {
    if (!userMessage.trim() || generatingCode) return;

    const newMessage = userMessage.trim();
    setUserMessage("");

    // Add user message to chat
    setChatMessages(prev => [...prev, { role: "user", content: newMessage }]);
    setGeneratingCode(true);
    setError("");

    try {
      const response = await fetch("/api/generate-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: newMessage,
          existingCode: generatedCode,
          model: selectedModel,
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
      setGeneratedCode(data.code);
      setExplanation(data.explanation || "");
      setReasoning(data.reasoning || "");
      
      // Update preview
      if (previewGameName) {
        await shipGameInPreviewMode(previewGameName, description || "", data.code);
        // Force refresh preview
        setPreviewRoomId(`room-${Math.random().toString(36).substring(7)}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate code");
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again."
      }]);
    } finally {
      setGeneratingCode(false);
    }
  };

  const shipGameInPreviewMode = async (gameName: string, gameDesc: string, code: string) => {
    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: gameName,
          description: gameDesc,
          code: code,
          preview: true,
          creatorId: user?.userId,
          creatorEmail: user?.email,
          creatorUsername: user?.username
        }),
      });

      if (response.ok) {
        setPreviewGameName(gameName);
      } else {
        const data = await response.json();
        // If name is taken, generate a unique one
        if (data.error?.includes("already taken")) {
          const uniqueName = `${gameName}-${Math.random().toString(36).substring(7)}`;
          await shipGameInPreviewMode(uniqueName, gameDesc, code);
        }
      }
    } catch (err) {
      console.error("Failed to ship preview:", err);
    }
  };

  const handleShipIt = async () => {
    setError("");
    setLoading(true);

    try {
      const finalName = name || previewGameName;
      const codeToShip = generatedCode || GAME_TEMPLATES[selectedTemplate!].baseCode;
      
      // If preview game exists, update it to non-preview
      if (previewGameName) {
        const res = await fetch(`/api/games/${previewGameName}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: finalName,
            description,
            code: codeToShip,
            preview: false,
            creatorId: user?.userId,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update game");
        }
      } else {
        // Create new game (shouldn't happen normally)
        const res = await fetch("/api/games", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: finalName,
            description,
            code: codeToShip,
            preview: false,
            creatorId: user?.userId,
            creatorEmail: user?.email,
            creatorUsername: user?.username
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create game");
        }
      }

      // Increment count based on user type
      if (isLoggedIn && user) {
        const userPlan = (user as any).metadata?.plan || 'free';
        
        // Only increment for free users
        if (userPlan === 'free') {
          const currentCount = (user as any).metadata?.gamesCreated || 0;
          const newCount = currentCount + 1;
          
          // Update user metadata via API
          try {
            await fetch('/api/user/update-games-count', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ count: newCount })
            });
            
            setGamesCreated(newCount);
          } catch (e) {
            console.error('Failed to update games count:', e);
          }
        }
      }
      
      // Redirect to game server
      window.location.href = getGameUrl(finalName);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Template selection screen
  if (!selectedTemplate) {
    return (
      <div className="min-h-screen bg-black text-white font-sans">
        <div className="p-8">
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            isLoggedIn={isLoggedIn}
            gamesCreated={gamesCreated}
            onSignup={() => redirectToSignupPage()}
            onSpecialKeySubmit={handleSpecialKeySubmit}
          />
        
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                Choose Your Game Template
              </h1>
              <p className="text-gray-400">
                Select a template to get started. Each template comes with optimized libraries and AI assistance.
              </p>
            </div>
            
            <div className="text-right">
              {hasSpecialKey && (
                <p className="text-xs text-yellow-400 mb-2 font-semibold">
                  🔑 Special Key Active - Unlimited Games
                </p>
              )}
              {isLoggedIn ? (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Logged in as</p>
                  <button
                    onClick={() => redirectToAccountPage()}
                    className="text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    {user?.email}
                  </button>
                  {user && (user as any).metadata?.plan === 'free' && !hasSpecialKey && (
                    <p className="text-xs text-gray-500 mt-1">
                      Free Plan: {(user as any).metadata?.gamesCreated || 0}/5 games created
                    </p>
                  )}
                  {user && (user as any).metadata?.plan === 'paid' && (
                    <p className="text-xs text-green-500 mt-1">
                      ⭐ Paid Plan - Unlimited
                    </p>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => redirectToSignupPage()}
                  className="text-purple-400 hover:text-purple-300 font-semibold"
                >
                  Sign up to create games
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.values(GAME_TEMPLATES).map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template.id)}
                className="group relative p-6 bg-gray-900 border border-gray-800 rounded-xl text-left hover:border-purple-500 transition-all"
              >
                <h3 className="text-2xl font-bold mb-2 group-hover:text-purple-400 transition-colors">
                  {template.name}
                </h3>
                <p className="text-gray-400 mb-4">{template.description}</p>
                
                {template.libraries.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.libraries.map((lib) => (
                      <span
                        key={lib}
                        className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded"
                      >
                        {lib}
                      </span>
                    ))}
                  </div>
                )}
                
                {template.id === "open-ended" && (
                  <div className="flex items-center gap-2 text-yellow-500 text-sm">
                    <AlertCircle size={16} />
                    <span>May require more iteration</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
        </div>
      </div>
    );
  }

  const template = GAME_TEMPLATES[selectedTemplate];

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          isLoggedIn={isLoggedIn}
          gamesCreated={gamesCreated}
          onSignup={() => redirectToSignupPage()}
          onSpecialKeySubmit={handleSpecialKeySubmit}
        />

        {/* Left Pane: Game Description & Generation */}
        <div className="w-1/2 flex flex-col border-r border-gray-800 p-6 overflow-y-auto">
        <div className="mb-4">
          <button
            onClick={() => setSelectedTemplate(null)}
            className="text-gray-400 hover:text-white mb-4"
          >
            ← Back to templates
          </button>
          <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            {template.name}
          </h1>
          <p className="text-gray-400 text-sm mb-4">{template.description}</p>
          
          {template.libraries.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {template.libraries.map((lib) => (
                <span key={lib} className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded">
                  {lib}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Game Name (Unique)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded p-3 focus:border-purple-500 focus:outline-none"
            placeholder="my-awesome-game"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Short Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded p-3 focus:border-purple-500 focus:outline-none"
            placeholder="A fun multiplayer game..."
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">AI Model</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded p-3 focus:border-purple-500 focus:outline-none"
          >
            <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5 (Anthropic) - Default</option>
            <option value="gpt-5">GPT-4o (OpenAI)</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro (Google)</option>
          </select>
        </div>

        {!isEditMode ? (
          <>
            {/* Collapsible Game Description Input */}
            <details className="mb-4" open={!generatedCode}>
              <summary className="cursor-pointer p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors list-none flex items-center justify-between mb-4">
                <span className="font-semibold text-white">Game Description {generatedCode ? "✓" : ""}</span>
                <svg className="w-4 h-4 text-gray-400 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              
              <div className="flex-1 flex flex-col mb-4">
                <label className="block text-sm text-gray-400 mb-2">
                  Describe Your Game (AI will generate the code)
                </label>
                <textarea
                  value={gameDescription}
                  onChange={(e) => setGameDescription(e.target.value)}
                  className="w-full h-40 bg-gray-900 border border-gray-800 rounded p-4 text-sm focus:border-purple-500 focus:outline-none resize-none"
                  placeholder={template.prompt}
                  spellCheck={false}
                />
              </div>

              <button
                onClick={handleGenerateGame}
                disabled={generatingCode || !gameDescription}
                className="w-full bg-purple-600 text-white px-6 py-3 rounded-full font-bold hover:bg-purple-500 disabled:opacity-50 transition-all mb-4"
              >
                {generatingCode ? "Generating Code..." : "Generate Game Code 🤖"}
              </button>
            </details>

            {/* Model Explanation and Reasoning - Moved to left side */}
            {(explanation || reasoning) && generatedCode && (
              <div className="mb-4 bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
                {explanation && (
                  <div className="p-4 border-b border-gray-700">
                    <h3 className="text-sm font-semibold text-purple-400 mb-2">✨ AI Explanation</h3>
                    <p className="text-sm text-gray-300">{explanation}</p>
                  </div>
                )}
                {reasoning && (
                  <details className="group">
                    <summary className="cursor-pointer p-4 hover:bg-gray-800/50 transition-colors list-none flex items-center justify-between">
                      <span className="text-sm font-semibold text-blue-400">🧠 Model Reasoning (Click to expand)</span>
                      <svg className="w-4 h-4 text-gray-400 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="p-4 pt-0 max-h-48 overflow-y-auto">
                      <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono">{reasoning}</pre>
                    </div>
                  </details>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Edit Mode Chat Interface */}
            <div className="flex-1 bg-gray-900/50 rounded-xl border border-gray-800 flex flex-col min-h-0 mb-4">
              <div className="p-4 border-b border-gray-800">
                <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
                <p className="text-sm text-gray-400">Describe what changes you want to make</p>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
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
              <div className="p-4 border-t border-gray-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleEditGame()}
                    placeholder="Describe your changes..."
                    disabled={generatingCode}
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={handleEditGame}
                    disabled={!userMessage.trim() || generatingCode}
                    className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {error && <div className="text-red-500 mb-4">{error}</div>}

        {generatedCode && !generatingCode && (
          <div className="mt-auto pt-4 border-t border-gray-800 space-y-3">
            <button
              onClick={handleShipIt}
              disabled={loading || !name}
              className="w-full bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 disabled:opacity-50 transition-all"
            >
              {loading ? "Shipping..." : "Ship It 🚀"}
            </button>
            <button
              onClick={() => {
                setIsEditMode(!isEditMode);
                if (!isEditMode && chatMessages.length === 0) {
                  // Add initial message when entering edit mode
                  setChatMessages([{
                    role: "assistant",
                    content: "I'm ready to help you edit the game! Tell me what changes you'd like to make."
                  }]);
                }
              }}
              className="w-full bg-gray-800 text-white px-8 py-3 rounded-full font-bold hover:bg-gray-700 transition-all"
            >
              {isEditMode ? "Exit Edit Mode" : "Edit Game 💬"}
            </button>
          </div>
        )}
      </div>

      {/* Right Pane: Game Preview or Code Editor or Snake Game */}
      <div className="w-1/2 flex flex-col bg-gray-900/50 p-6 overflow-hidden">
        {generatingCode ? (
          <SnakeGameWhileWaiting />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-400">
                {showPreview ? "Game Preview" : "Generated Code"}
              </h2>
              {generatedCode && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPreview(true)}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
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
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
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
                      className="px-4 py-2 rounded-lg flex items-center gap-2 bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors"
                      title="Refresh game"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex-1 bg-black border border-gray-800 rounded overflow-hidden">
              {showPreview && generatedCode && previewGameName ? (
                <iframe
                  src={`${getGameServerUrl()}/game/${previewGameName}/${previewRoomId}?hideUI=true`}
                  className="w-full h-full border-0"
                  title="Game Preview"
                  key={previewRoomId} // Force reload on room change
                />
              ) : (
                <Editor
                  height="100%"
                  defaultLanguage="javascript"
                  value={generatedCode || "// Code will appear here after generation..."}
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
                    readOnly: false,
                  }}
                />
              )}
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
