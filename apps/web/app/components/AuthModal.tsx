"use client";

import { X } from "lucide-react";
import { useState } from "react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  gamesCreated?: number;
  onSignup: () => void;
  onSpecialKeySubmit?: (key: string) => void;
}

export function AuthModal({ 
  isOpen, 
  onClose, 
  isLoggedIn, 
  gamesCreated = 0,
  onSignup,
  onSpecialKeySubmit
}: AuthModalProps) {
  const [specialKey, setSpecialKey] = useState("");
  const [keyError, setKeyError] = useState("");
  
  if (!isOpen) return null;

  const isAtLimit = isLoggedIn && gamesCreated >= 5;

  const handleKeySubmit = async () => {
    if (!specialKey.trim()) {
      setKeyError("Please enter a special key");
      return;
    }
    
    // Verify the key
    try {
      const response = await fetch("/api/verify-special-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: specialKey }),
      });
      
      if (response.ok) {
        localStorage.setItem("specialKey", specialKey);
        if (onSpecialKeySubmit) {
          onSpecialKeySubmit(specialKey);
        }
        onClose();
      } else {
        setKeyError("Invalid special key. Please try again.");
      }
    } catch (error) {
      setKeyError("Failed to verify key. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-5xl w-full overflow-hidden relative flex">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
        >
          <X size={24} />
        </button>
        
        {/* Left Side - Content */}
        <div className="w-1/2 p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">{isAtLimit ? "🔑" : "🎮"}</span>
            </div>
            <h2 className="text-3xl font-bold mb-2">
              {!isLoggedIn 
                ? "Create a free account!" 
                : isAtLimit 
                  ? "You've hit the free limit!" 
                  : "Upgrade to Continue"}
            </h2>
            <p className="text-gray-400">
              {!isLoggedIn 
                ? "Start creating games by adding an email and a username"
                : isAtLimit
                  ? `You've created ${gamesCreated}/5 free games. Get a special key for unlimited access!`
                  : `You've created ${gamesCreated}/5 free games. Upgrade for unlimited games!`
              }
            </p>
          </div>

          <div className="space-y-4">
            {isAtLimit ? (
              <>
                <div className="bg-gray-800 rounded-lg p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">💬</span>
                    <div className="text-left">
                      <div className="font-semibold text-white mb-1">Join our Discord</div>
                      <div className="text-sm text-gray-400 mb-2">Connect with other game creators and get help</div>
                      <a 
                        href="https://discord.gg/pkePxyNsn5" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors text-sm font-semibold"
                      >
                        Join Discord Server
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">🔑</span>
                    <div className="text-left w-full">
                      <div className="font-semibold text-white mb-1">Have a special key?</div>
                      <div className="text-sm text-gray-400 mb-2">Ask in Discord for a special key to create unlimited games</div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={specialKey}
                          onChange={(e) => {
                            setSpecialKey(e.target.value);
                            setKeyError("");
                          }}
                          onKeyPress={(e) => e.key === "Enter" && handleKeySubmit()}
                          placeholder="Enter your special key"
                          className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-purple-500"
                        />
                        <button
                          onClick={handleKeySubmit}
                          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 transition-colors text-sm font-semibold"
                        >
                          Submit
                        </button>
                      </div>
                      {keyError && (
                        <p className="text-red-400 text-xs mt-2">{keyError}</p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-full text-gray-400 hover:text-white py-2 text-sm"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <div className="bg-gray-800 rounded-lg p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">✨</span>
                    <div className="text-left">
                      <div className="font-semibold text-white mb-1">{isLoggedIn ? "Unlimited Games" : "Create 5 Free Games"}</div>
                      <div className="text-sm text-gray-400">{isLoggedIn ? "Create as many games as you want" : "Plus 100 game edits"}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">💾</span>
                    <div className="text-left">
                      <div className="font-semibold text-white mb-1">Gain clout</div>
                      <div className="text-sm text-gray-400">Your games will be featured on the homepage</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">🚀</span>
                    <div className="text-left">
                      <div className="font-semibold text-white mb-1">Future Features</div>
                      <div className="text-sm text-gray-400">Get early access to new tools</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onSignup}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-4 rounded-full hover:opacity-90 transition-opacity"
                >
                  {!isLoggedIn ? "Create Free Account" : "Upgrade to Paid"}
                </button>

                <button
                  onClick={onClose}
                  className="w-full text-gray-400 hover:text-white py-2 text-sm"
                >
                  I just want to play games (no account needed)
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Side - Video Demo or Discord Info */}
        <div className="w-1/2 bg-gradient-to-br from-purple-900/50 to-blue-900/50 flex items-center justify-center p-8">
          {isAtLimit ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center">
              <div className="text-8xl mb-6">🎮</div>
              <h3 className="text-2xl font-bold mb-4">Want to create more games?</h3>
              <p className="text-gray-300 mb-6 max-w-md">
                Join our Discord community to request a special key that gives you unlimited game creation!
              </p>
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 max-w-md">
                <p className="text-sm text-gray-400 mb-4">
                  Special keys are given to active community members who want to push the platform to its limits.
                </p>
                <ul className="text-left text-sm text-gray-300 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Unlimited game creation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Direct support from the team</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Early access to new features</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <h3 className="text-xl font-bold mb-4 text-center">Watch how easy it is!</h3>
              <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-gray-700">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src="/demo-game-creation.webm" type="video/webm" />
                  <source src="/demo-game-creation.mp4" type="video/mp4" />
                  {/* Fallback: Show placeholder */}
                  <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🎬</div>
                      <p>Game creation demo</p>
                    </div>
                  </div>
                </video>
              </div>
              <p className="text-sm text-gray-400 mt-4 text-center">
                Describe your game idea and watch AI bring it to life in seconds
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

