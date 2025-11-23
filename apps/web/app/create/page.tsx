"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GAME_TEMPLATES, GameTemplate } from "@/lib/game-templates";
import { getGameUrl } from "@/lib/config";
import { AlertCircle, X } from "lucide-react";
import { useAuthInfo, useRedirectFunctions } from "@propelauth/react";
import dynamic from 'next/dynamic';
import { SnakeGameWhileWaiting } from "@/app/components/SnakeGameWhileWaiting";

const Editor = dynamic(
  () => import('@monaco-editor/react'),
  { ssr: false }
);

export default function CreateGame() {
  const router = useRouter();
  
  // Try to use auth, but gracefully handle if it's not configured
  let isLoggedIn = false;
  let user = null;
  let authLoading = false;
  let redirectToSignupPage = () => {
    alert("PropelAuth not configured. Please set NEXT_PUBLIC_PROPELAUTH_AUTH_URL in your .env file.\n\nSee apps/web/PROPELAUTH_SETUP.md for instructions.");
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
  const [selectedModel, setSelectedModel] = useState("claude-sonnet-4-5-20250929");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Check games created count on mount
  useEffect(() => {
    if (!authLoading) {
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

  // Check if user needs to sign up BEFORE they start creating
  const checkCanCreate = () => {
    if (isLoggedIn && user) {
      const userPlan = (user as any).metadata?.plan || 'free';
      
      // Paid users can always create
      if (userPlan === 'paid') {
        return true;
      }
      
      // Free logged-in users check metadata count
      const userGamesCreated = (user as any).metadata?.gamesCreated || 0;
      if (userGamesCreated >= 100) {
        setShowAuthModal(true);
        return false;
      }

      return true;
    }

    // Non-logged-in users check localStorage
    if (gamesCreated >= 100) {
      setShowAuthModal(true);
      return false;
    }
    
    return true;
  };

  const handleTemplateSelect = (templateId: GameTemplate) => {
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
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate game");
      }

      const { code, suggestedName, suggestedDescription } = await res.json();
      
      if (suggestedName && !name) setName(suggestedName);
      if (suggestedDescription && !description) setDescription(suggestedDescription);
      
      setGeneratedCode(code);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleShipIt = async () => {
    setError("");
    setLoading(true);

    try {
      const codeToShip = generatedCode || GAME_TEMPLATES[selectedTemplate!].baseCode;
      
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, code: codeToShip }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create game");
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
      } else {
        // Non-logged-in users use localStorage
        const newCount = gamesCreated + 1;
        localStorage.setItem("createdGamesCount", newCount.toString());
        setGamesCreated(newCount);
      }
      
      // Redirect to game server
      window.location.href = getGameUrl(name);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auth Modal Component
  const AuthModal = () => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-8 relative">
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>
        
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎮</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">You've Hit the Free Limit!</h2>
          <p className="text-gray-400">
            You've created {gamesCreated} games. Create an account to keep building!
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✨</span>
              <div>
                <div className="font-semibold">Unlimited Games</div>
                <div className="text-sm text-gray-400">Create as many games as you want</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">💾</span>
              <div>
                <div className="font-semibold">Save Your Work</div>
                <div className="text-sm text-gray-400">Access your games from anywhere</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚀</span>
              <div>
                <div className="font-semibold">Future Features</div>
                <div className="text-sm text-gray-400">Get early access to new tools</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => redirectToSignupPage()}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-4 rounded-full hover:opacity-90 transition-opacity"
          >
            Create Free Account
          </button>

          <button
            onClick={() => setShowAuthModal(false)}
            className="w-full text-gray-400 hover:text-white py-2 text-sm"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );

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
      <div className="min-h-screen bg-black text-white p-8 font-sans">
        {showAuthModal && <AuthModal />}
        
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
              {isLoggedIn ? (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Logged in as</p>
                  <button
                    onClick={() => redirectToAccountPage()}
                    className="text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    {user?.email}
                  </button>
                  {user && (user as any).metadata?.plan === 'free' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Free Plan: {(user as any).metadata?.gamesCreated || 0}/5 games
                    </p>
                  )}
                  {user && (user as any).metadata?.plan === 'paid' && (
                    <p className="text-xs text-green-500 mt-1">
                      ⭐ Paid Plan - Unlimited
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-400 mb-2">
                    Games created: {gamesCreated}/5
                  </p>
                  <button
                    onClick={() => redirectToSignupPage()}
                    className="text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    Sign up for unlimited
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.values(GAME_TEMPLATES).map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template.id)}
                disabled={!isLoggedIn && gamesCreated >= 5}
                className="group relative p-6 bg-gray-900 border border-gray-800 rounded-xl text-left hover:border-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
    );
  }

  const template = GAME_TEMPLATES[selectedTemplate];

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
      {showAuthModal && <AuthModal />}
      
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
            <option value="gpt-4o">GPT-4o (OpenAI)</option>
            <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5 (Anthropic)</option>
          </select>
        </div>

        <div className="flex-1 flex flex-col mb-4">
          <label className="block text-sm text-gray-400 mb-2">
            Describe Your Game (AI will generate the code)
          </label>
          <textarea
            value={gameDescription}
            onChange={(e) => setGameDescription(e.target.value)}
            className="flex-1 w-full bg-gray-900 border border-gray-800 rounded p-4 text-sm focus:border-purple-500 focus:outline-none resize-none"
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

        {error && <div className="text-red-500 mb-4">{error}</div>}

        <div className="mt-auto pt-4 border-t border-gray-800">
          <button
            onClick={handleShipIt}
            disabled={loading || !name || !generatedCode}
            className="w-full bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 disabled:opacity-50 transition-all"
          >
            {loading ? "Shipping..." : "Ship It 🚀"}
          </button>
        </div>
      </div>

      {/* Right Pane: Code Preview or Snake Game */}
      <div className="w-1/2 flex flex-col bg-gray-900/50 p-6 overflow-hidden">
        {generatingCode ? (
          <SnakeGameWhileWaiting />
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4 text-gray-400">Generated Code</h2>
            <div className="flex-1 bg-black border border-gray-800 rounded overflow-hidden">
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
