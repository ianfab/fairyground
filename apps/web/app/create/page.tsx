"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GAME_TEMPLATES, GameTemplate } from "@/lib/game-templates";
import { getDefaultTagsForTemplate } from "@/lib/game-tags";
import { getGameUrl, getGameServerUrl, safeEncodeURIComponent } from "@/lib/config";
import { AlertCircle, ArrowRight, Code, Eye } from "lucide-react";
import { useAuthInfo, useRedirectFunctions } from "@propelauth/react";
import dynamic from 'next/dynamic';
import { EditingPanel } from "@/app/components/EditingPanel";
import { AuthModal } from "@/app/components/AuthModal";

const Editor = dynamic(
  () => import('@monaco-editor/react'),
  { ssr: false }
);

interface CodeEdit {
  find: {
    start_at: string;
    end_at: string;
  };
  replace_with: string;
}

interface GenerationResultPayload {
  code?: string;
  explanation?: string;
  reasoning?: string;
  suggestedName?: string;
  suggestedDescription?: string;
  edits?: CodeEdit[];
  type?: string;
  min_players_per_room?: number;
  max_players_per_room?: number;
  has_win_condition?: boolean;
  can_join_late?: boolean;
}

interface Draft {
  id: string;
  user_id: string;
  template: string;
  game_description: string;
  name: string | null;
  description: string | null;
  model: string;
  is_shipped: boolean;
  created_at: string;
  updated_at: string;
}

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
  const [selectedModel, setSelectedModel] = useState("gpt-5");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [explanation, setExplanation] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [minPlayersPerRoom, setMinPlayersPerRoom] = useState<number>(2);
  const [maxPlayersPerRoom, setMaxPlayersPerRoom] = useState<number>(2);
  const [hasWinCondition, setHasWinCondition] = useState<boolean>(true);
  const [canJoinLate, setCanJoinLate] = useState<boolean>(false);
  const [previewGameName, setPreviewGameName] = useState<string>("");
  const [previewRoomId, setPreviewRoomId] = useState(() => `room-${Math.random().toString(36).substring(7)}`);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // New UI state for redesigned experience
  const [leftPanelView, setLeftPanelView] = useState<'preview' | 'code' | 'editing'>('preview');
  
  // Chat state for AI editing
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string; explanation?: string; reasoning?: string }>>([]);
  const [userMessage, setUserMessage] = useState("");
  const [liveModelStream, setLiveModelStream] = useState("");
  const [liveReasoningStream, setLiveReasoningStream] = useState("");
  const explanationRef = useRef<HTMLDivElement | null>(null);

  // // Debug: log stream changes
  // useEffect(() => {
  //   if (liveModelStream) {
  //     console.log("[State] liveModelStream updated, length:", liveModelStream.length, "first 100 chars:", liveModelStream.substring(0, 100));
  //   }
  // }, [liveModelStream]);

  // useEffect(() => {
  //   if (liveReasoningStream) {
  //     console.log("[State] liveReasoningStream updated, length:", liveReasoningStream.length, "first 100 chars:", liveReasoningStream.substring(0, 100));
  //   }
  // }, [liveReasoningStream]);

  // Auto-scroll to explanation when it appears after generation
  useEffect(() => {
    if (explanation && generatedCode && !generatingCode && explanationRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        explanationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [explanation, generatedCode, generatingCode]);

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
  const [showNameDescriptionModal, setShowNameDescriptionModal] = useState(false);

  // Drafts state
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [showDraftsDropdown, setShowDraftsDropdown] = useState(false);
  const [loadingDrafts, setLoadingDrafts] = useState(false);

  // Preload background images for template selection screen
  useEffect(() => {
    const images = [
      '/game-images/chess-default.webp',
      '/game-images/2d-shooter-default.webp',
      '/game-images/3d-shooter-default.webp',
      '/game-images/tetris-default.webp',
      '/game-images/open-ended-default.webp',
    ];

    // Preload images
    images.forEach((src) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }, []);

  // Close drafts dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDraftsDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('.drafts-dropdown-container')) {
          setShowDraftsDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDraftsDropdown]);

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

        // Load drafts for logged-in users
        loadDrafts();
      } else {
        // For non-logged-in users, use localStorage
        const count = parseInt(localStorage.getItem("createdGamesCount") || "0");
        setGamesCreated(count);
      }
    }
  }, [authLoading, isLoggedIn, user]);

  // Load user's drafts
  const loadDrafts = async () => {
    if (!isLoggedIn) return;
    
    setLoadingDrafts(true);
    try {
      // Pass userId as query param in case server-side auth doesn't work
      const url = user?.userId ? `/api/drafts?userId=${user.userId}` : "/api/drafts";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setDrafts(data.drafts || []);
      }
    } catch (error) {
      console.error("Failed to load drafts:", error);
    } finally {
      setLoadingDrafts(false);
    }
  };

  // Save draft
  const saveDraft = async () => {
    if (!isLoggedIn || !selectedTemplate || !gameDescription) return;

    try {
      const response = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: selectedTemplate,
          gameDescription,
          name,
          description,
          model: selectedModel,
          userId: user?.userId, // Pass userId as fallback
        }),
      });

      if (response.ok) {
        console.log("Draft saved successfully");
        // Reload drafts
        loadDrafts();
      }
    } catch (error) {
      console.error("Failed to save draft:", error);
    }
  };

  // Load a draft into the form
  const loadDraft = (draft: Draft) => {
    setSelectedTemplate(draft.template as GameTemplate);
    setGameDescription(draft.game_description);
    setName(draft.name || "");
    setDescription(draft.description || "");
    setSelectedModel(draft.model);
    setShowDraftsDropdown(false);
  };

  // Delete a draft
  const deleteDraft = async (draftId: string) => {
    try {
      // Pass userId as query param in case server-side auth doesn't work
      const url = user?.userId 
        ? `/api/drafts?id=${draftId}&userId=${user.userId}` 
        : `/api/drafts?id=${draftId}`;
      const response = await fetch(url, {
        method: "DELETE",
      });

      if (response.ok) {
        console.log("Draft deleted successfully");
        // Reload drafts
        loadDrafts();
      }
    } catch (error) {
      console.error("Failed to delete draft:", error);
    }
  };

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

  const consumeEventStream = async (response: Response): Promise<GenerationResultPayload> => {
    console.log("[consumeEventStream] Starting stream consumption");
    if (!response.body) {
      throw new Error("Streaming is not supported in this browser.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalPayload: (GenerationResultPayload & { type?: string }) | null = null;
    let streamedText = "";
    let streamedReasoning = "";

    const processBuffer = () => {
      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const chunk = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        if (chunk.startsWith("data:")) {
          const data = chunk.slice(5).trim();
          if (data && data !== "[DONE]") {
            let parsed: any;
            try {
              parsed = JSON.parse(data);
              console.log("[consumeEventStream] Parsed event:", parsed.type);
            } catch (err) {
              console.error("Failed to parse stream chunk", err, "chunk:", chunk);
              boundary = buffer.indexOf("\n\n");
              continue;
            }

            switch (parsed.type) {
              case "token":
                if (parsed.delta) {
                  streamedText += parsed.delta;
                  console.log("[consumeEventStream] Token delta, total length:", streamedText.length);
                  setLiveModelStream(streamedText);
                }
                break;
              case "reasoning":
                if (parsed.delta) {
                  streamedReasoning += parsed.delta;
                  console.log("[consumeEventStream] Reasoning delta, total length:", streamedReasoning.length);
                  setLiveReasoningStream(streamedReasoning);
                }
                break;
              case "result":
                console.log("[consumeEventStream] Received result payload");
                finalPayload = parsed;
                break;
              case "error":
                throw new Error(parsed.error?.message || "Model error");
            }
          }
        }
        boundary = buffer.indexOf("\n\n");
      }
    };

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (value) {
          const decoded = decoder.decode(value, { stream: true });
          console.log("[consumeEventStream] Received chunk, bytes:", value.length, "decoded length:", decoded.length);
          buffer += decoded;
          processBuffer();
        }
        if (done) {
          console.log("[consumeEventStream] Stream done");
          buffer += decoder.decode();
          processBuffer();
          break;
        }
      }
    } finally {
      reader.releaseLock();
      console.log("[consumeEventStream] Stream finished, final payload:", !!finalPayload);
      // Don't clear the streams here - let them stay visible until the next generation
      // setLiveModelStream("");
      // setLiveReasoningStream("");
    }

    if (!finalPayload) {
      throw new Error("Stream ended without a result payload.");
    }

    return finalPayload as GenerationResultPayload;
  };

  const parseLLMResponse = async (response: Response): Promise<GenerationResultPayload> => {
    if (!response.ok) {
      let errorMessage = "Failed to generate game";
      const contentType = response.headers.get("content-type") || "";
      try {
        if (contentType.includes("application/json")) {
          const data = await response.json();
          errorMessage = data?.error || errorMessage;
        } else {
          const text = await response.text();
          if (text) {
            errorMessage = text;
          }
        }
      } catch {
        // ignore parsing errors
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get("content-type") || "";
    console.log("[parseLLMResponse] Content-Type:", contentType);
    console.log("[parseLLMResponse] Selected model:", selectedModel);
    
    if (contentType.includes("text/event-stream")) {
      console.log("[parseLLMResponse] Using event stream consumption");
      return consumeEventStream(response);
    }

    console.log("[parseLLMResponse] Using regular JSON parse");
    return (await response.json()) as GenerationResultPayload;
  };

  const applyEditsToCode = (originalCode: string, edits: CodeEdit[]): string => {
    let result = originalCode;

    for (const edit of edits) {
      const { start_at, end_at } = edit.find;
      if (!start_at || !end_at) continue;

      const startIndex = result.indexOf(start_at);
      if (startIndex === -1) {
        console.warn("Edit start_at not found in code:", start_at);
        continue;
      }

      const endIndex = result.indexOf(end_at, startIndex + start_at.length);
      if (endIndex === -1) {
        console.warn("Edit end_at not found in code:", end_at);
        continue;
      }

      const endOfMatch = endIndex + end_at.length;
      result = result.slice(0, startIndex) + edit.replace_with + result.slice(endOfMatch);
    }

    return result;
  };

  const applyGenerationResult = async (
    result: GenerationResultPayload,
    options: { mode: "create" | "edit"; originalCode?: string }
  ) => {
    const explanationText = result.explanation || "";
    const reasoningText = result.reasoning || "";

    let nextCode = generatedCode;

    // Normalize room configuration from model output (with safe defaults)
    const nextMinPlayers =
      typeof result.min_players_per_room === "number" && Number.isFinite(result.min_players_per_room)
        ? Math.max(1, Math.floor(result.min_players_per_room))
        : 2;
    const nextMaxPlayers =
      typeof result.max_players_per_room === "number" && Number.isFinite(result.max_players_per_room)
        ? Math.max(nextMinPlayers, Math.floor(result.max_players_per_room))
        : 2;
    const nextHasWinCondition =
      typeof result.has_win_condition === "boolean" ? result.has_win_condition : true;
    const nextCanJoinLate =
      typeof result.can_join_late === "boolean" ? result.can_join_late : false;

    if (options.mode === "create") {
      if (!result.code) {
        throw new Error("Model did not return any code.");
      }
      nextCode = result.code;

      // Only update config on create; for edit we keep existing values unless model explicitly supports them later
      setMinPlayersPerRoom(nextMinPlayers);
      setMaxPlayersPerRoom(nextMaxPlayers);
      setHasWinCondition(nextHasWinCondition);
      setCanJoinLate(nextCanJoinLate);
    } else {
      const baseCode = options.originalCode ?? generatedCode;

      if (baseCode && result.edits && result.edits.length > 0) {
        nextCode = applyEditsToCode(baseCode, result.edits);
      } else if (result.code) {
        nextCode = result.code;
      } else {
        throw new Error("Model did not return any edits or code.");
      }
    }

    setGeneratedCode(nextCode);
    setExplanation(explanationText);
    setReasoning(reasoningText);

    if (options.mode === "create") {
      if (result.suggestedName && !name) {
        setName(result.suggestedName);
      }
      if (result.suggestedDescription && !description) {
        setDescription(result.suggestedDescription);
      }

      const previewName =
        result.suggestedName ||
        `preview-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      await shipGameInPreviewMode(previewName, result.suggestedDescription || "", nextCode);
      // Switch to preview mode
      setLeftPanelView('preview');
    } else {
      setChatMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: explanationText || "I've updated the code based on your request.",
          explanation: explanationText,
          reasoning: reasoningText,
        },
      ]);

      if (previewGameName) {
        await updatePreviewGame(previewGameName, description || "", nextCode);
        setPreviewRoomId(`room-${Math.random().toString(36).substring(7)}`);
      }
    }
  };

  const handleGenerateGame = async () => {
    if (!selectedTemplate || !gameDescription) {
      setError("Please select a template and describe your game");
      return;
    }

    // Add logging and guard against duplicate calls
    console.log("[handleGenerateGame] Called at", new Date().toISOString());
    
    // If already generating, don't allow another call
    if (generatingCode) {
      console.log("[handleGenerateGame] Already generating, skipping duplicate call");
      return;
    }

    setGeneratingCode(true);
    setError("");
    setLiveModelStream("");
    setLiveReasoningStream("");

    // Save draft before generating
    await saveDraft();

    try {
      console.log("[handleGenerateGame] Starting API call");
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

      console.log("[handleGenerateGame] API call completed");
      const result = await parseLLMResponse(res);
      await applyGenerationResult(result, { mode: "create" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeneratingCode(false);
      console.log("[handleGenerateGame] Finished at", new Date().toISOString());
    }
  };

  const handleEditGame = async () => {
    if (!userMessage.trim() || generatingCode) return;

    console.log("[handleEditGame] Called at", new Date().toISOString());

    const newMessage = userMessage.trim();
    setUserMessage("");

    // Add user message to chat
    setChatMessages(prev => [...prev, { role: "user", content: newMessage }]);
    setGeneratingCode(true);
    setError("");
    setLiveModelStream("");
    setLiveReasoningStream("");

    try {
      console.log("[handleEditGame] Starting API call");
      const response = await fetch("/api/generate-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: newMessage,
          existingCode: generatedCode,
          model: selectedModel,
          userId: user?.userId,
          chatHistory: chatMessages, // Pass full conversation history for context
        }),
      });

      console.log("[handleEditGame] API call completed");
      const data = await parseLLMResponse(response);
      await applyGenerationResult(data, { mode: "edit", originalCode: generatedCode });
    } catch (err: any) {
      setError(err.message || "Failed to generate code");
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again."
      }]);
    } finally {
      setGeneratingCode(false);
      console.log("[handleEditGame] Finished at", new Date().toISOString());
    }
  };

  const shipGameInPreviewMode = async (gameName: string, gameDesc: string, code: string) => {
    try {
      const defaultTags = selectedTemplate ? getDefaultTagsForTemplate(selectedTemplate) : [];

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
          creatorUsername: user?.username,
          tags: defaultTags,
          min_players_per_room: minPlayersPerRoom,
          max_players_per_room: maxPlayersPerRoom,
          has_win_condition: hasWinCondition,
          can_join_late: canJoinLate,
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

  const updatePreviewGame = async (gameName: string, gameDesc: string, code: string) => {
    try {
      const defaultTags = selectedTemplate ? getDefaultTagsForTemplate(selectedTemplate) : [];

      const response = await fetch(`/api/games/${safeEncodeURIComponent(gameName)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: gameDesc,
          code: code,
          preview: true,
          creatorId: user?.userId,
          tags: defaultTags,
          min_players_per_room: minPlayersPerRoom,
          max_players_per_room: maxPlayersPerRoom,
          has_win_condition: hasWinCondition,
          can_join_late: canJoinLate,
        }),
      });

      if (!response.ok) {
        console.error("Failed to update preview:", await response.text());
      }
    } catch (err) {
      console.error("Failed to update preview:", err);
    }
  };

  const handleShipIt = async () => {
    setError("");
  
    // If the user hasn't provided both a name and description yet,
    // prompt them in a popup before proceeding.
    if (!name.trim() || !description.trim()) {
      setShowNameDescriptionModal(true);
      return;
    }
  
    setLoading(true);
  
    try {
      const finalName = name.trim();

      const codeToShip = generatedCode || GAME_TEMPLATES[selectedTemplate!].baseCode;
      const defaultTags = selectedTemplate ? getDefaultTagsForTemplate(selectedTemplate) : [];

      // If preview game exists, update it to non-preview
      if (previewGameName) {
        const res = await fetch(`/api/games/${safeEncodeURIComponent(previewGameName)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: finalName,
            description,
            code: codeToShip,
            preview: false,
            creatorId: user?.userId,
            tags: defaultTags,
            min_players_per_room: minPlayersPerRoom,
            max_players_per_room: maxPlayersPerRoom,
            has_win_condition: hasWinCondition,
            can_join_late: canJoinLate,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update game");
        }

        // Update preview game name to the final name for correct redirect
        setPreviewGameName(finalName);
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
            creatorUsername: user?.username,
            tags: defaultTags,
            min_players_per_room: minPlayersPerRoom,
            max_players_per_room: maxPlayersPerRoom,
            has_win_condition: hasWinCondition,
            can_join_late: canJoinLate,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create game");
        }
      }

      // Mark all drafts for this game as shipped
      if (isLoggedIn && selectedTemplate && gameDescription) {
        try {
          await fetch('/api/drafts/mark-shipped', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              template: selectedTemplate,
              gameDescription: gameDescription,
              userId: user?.userId,
            }),
          });
        } catch (e) {
          console.error('Failed to mark draft as shipped:', e);
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
            {Object.values(GAME_TEMPLATES).map((template) => {
              // Map template IDs to background images
              const backgroundImages: Record<GameTemplate, string> = {
                "chess-variant": "/game-images/chess-default.webp",
                "2d-shooter": "/game-images/2d-shooter-default.webp",
                "3d-shooter": "/game-images/3d-shooter-default.webp",
                "tetris-duels": "/game-images/tetris-default.webp",
                "open-ended": "/game-images/open-ended-default.webp",
              };

              return (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className="group relative p-6 bg-gray-900 border border-gray-800 rounded-xl text-left hover:border-purple-500 transition-all overflow-hidden cursor-pointer"
                >
                  {/* Background Image with low opacity */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity"
                    style={{ backgroundImage: `url(${backgroundImages[template.id]})` }}
                  />
                  
                  {/* Content overlay */}
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-2 group-hover:text-purple-400 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-gray-200 mb-4">{template.description}</p>
                    
                    {template.libraries.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {template.libraries.map((lib) => (
                          <span
                            key={lib}
                            className="px-2 py-1 bg-gray-800/80 text-gray-300 text-xs rounded backdrop-blur-sm"
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
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        </div>
      </div>
    );
  }

  const template = GAME_TEMPLATES[selectedTemplate];
  const canPlayAnotherGameWhileWaiting = Boolean(name.trim() && description.trim());

  // Render panel content based on view mode
  const renderPanelContent = (view: 'preview' | 'code' | 'editing', panelSide: 'left' | 'right') => {
    if (view === 'preview') {
      if (generatedCode && previewGameName) {
        // Use the same room for both previews so they stay in sync,
        // but give each iframe a distinct preview user ID so they join as separate players.
        const roomId = previewRoomId;
        const previewUserId = `preview-${panelSide}-${roomId}`;
        const searchParams = new URLSearchParams({
          hideUI: "true",
          userId: previewUserId,
          username: panelSide === "left" ? "Preview Player 1" : "Preview Player 2",
        });

        return (
          <iframe
            src={`${getGameServerUrl()}/game/${safeEncodeURIComponent(previewGameName)}/${safeEncodeURIComponent(roomId)}?${searchParams.toString()}`}
            className="w-full h-full border-0"
            title={`Game Preview ${panelSide}`}
            key={`${roomId}-${panelSide}`}
          />
        );
      } else {
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-900/50">
            {/* <p className="text-gray-500">
              Preview will appear here
            </p> */}
          </div>
        );
      }
    } else if (view === 'code') {
      return (
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
      );
    } else {
      // editing view
      return (
        <EditingPanel
          explanation={explanation}
          reasoning={reasoning}
          chatMessages={chatMessages}
          userMessage={userMessage}
          setUserMessage={setUserMessage}
          onSendMessage={handleEditGame}
          generatingCode={generatingCode}
        />
      );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans relative overflow-hidden">
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          isLoggedIn={isLoggedIn}
          gamesCreated={gamesCreated}
          onSignup={() => redirectToSignupPage()}
          onSpecialKeySubmit={handleSpecialKeySubmit}
        />

      <div className="flex flex-col h-[calc(100vh-64px)] relative">
        {/* Top Section: Dual Panels OR Generation Form */}
        <div className="flex-1 flex gap-1 min-h-0 p-1">
          {generatedCode && !generatingCode && !name.trim() ? (
            // Subtle centered name form shown after first generation and before shipping
            <div className="flex-1 flex items-center justify-center bg-gray-900 rounded-lg relative z-10">
              <div className="bg-black/80 border border-gray-800/80 rounded-lg px-6 py-5 shadow-lg max-w-md w-full mx-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-2 h-2 rounded-full ${generatedCode ? "bg-emerald-400" : "bg-emerald-400 animate-pulse"}`} />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                      {generatedCode ? "READY TO SHIP" : "GENERATING YOUR GAME"}
                    </p>
                    <h3 className="text-sm font-semibold text-gray-100 mt-1">
                      Give your creation a name so you can ship it. Description is optional.
                    </h3>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Game name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-gray-900/80 border border-gray-700 rounded-md px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                      placeholder="my-awesome-game"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Description (optional)</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-gray-900/80 border border-gray-700 rounded-md px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                      placeholder="A fun multiplayer game..."
                    />
                  </div>

                  {description && (
                    <p className="text-[10px] text-gray-500 text-right pt-1">
                      Description added
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : !generatingCode && !generatedCode ? (
            <div className="flex-1 flex items-center justify-center rounded-lg relative z-10 overflow-hidden">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src="/veo-demo.webm" type="video/webm" />
              </video>
              {/* <div className="bg-black/80 border border-gray-800/80 rounded-lg px-6 py-5 shadow-lg max-w-md w-full mx-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full bg-emerald-400 animate-pulse`} />
                  <div>
                    <p className="text-md uppercase text-white">
                      CREATE THE {template?.name} YOU'VE ALWAYS WANTED.
                    </p>
                  </div>
                </div>
              </div> */}
            </div>
          ) : generatingCode && !generatedCode ? (
            <div className="flex-1 flex items-center justify-center rounded-lg relative z-10 overflow-hidden">
              {/* Streaming code background */}
              {(liveModelStream || liveReasoningStream) ? (
                <div className="absolute inset-0 pointer-events-none opacity-20">
                  <div className="w-full h-full overflow-hidden p-4">
                    <pre className="w-full h-full text-[11px] leading-[1.2] text-emerald-400 font-mono whitespace-pre-wrap break-words animate-[scroll-code_20s_linear_infinite]">
                      {liveReasoningStream} {liveModelStream}
                    </pre>
                  </div>
                </div>
              ) : 
              <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src="/veo-demo.webm" type="video/webm" />
            </video>
              }

              <div className="bg-black/80 border border-gray-800/80 rounded-lg px-6 py-5 shadow-lg max-w-md w-full mx-4 relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white">
                      GENERATING YOUR GAME...
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Usually 1-2 minutes...</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">
                      Game title
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-gray-900/80 border border-gray-700 rounded-md px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                      placeholder="What should we call this game?"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">
                      Short description
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-gray-900/80 border border-gray-700 rounded-md px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                      placeholder="A quick sentence about your game..."
                    />
                  </div>
                </div>

                {canPlayAnotherGameWhileWaiting ? (
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <Link
                      href={`${getGameServerUrl()}/game/tetris-battle`}
                      target="_blank"
                      className="px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      🎮 Play another game while you wait
                    </Link>
                  </div>
                ) : (
                  <Link
                    href={`${getGameServerUrl()}/game/tetris-battle`}
                    className="px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl cursor-not-allowed"
                  >
                    🎮 Play another game while you wait
                  </Link>
                )}
              </div>
            </div>
          ) : (
            // Single full-width panel with view toggles
            <div className="flex-1 flex flex-col bg-gray-900 rounded-lg overflow-hidden">
              {/* Panel Controls - Only show after first generation */}
              {generatedCode && (
                <div className="p-2 bg-gray-800/50 border-b border-gray-700 flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    <button
                      onClick={() => setLeftPanelView("preview")}
                      className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                        leftPanelView === "preview"
                          ? "bg-purple-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      <Eye className="w-4 h-4 inline mr-1" />
                      Game
                    </button>
                    <button
                      onClick={() => setLeftPanelView("code")}
                      className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                        leftPanelView === "code"
                          ? "bg-purple-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      <Code className="w-4 h-4 inline mr-1" />
                      Code
                    </button>
                    <button
                      onClick={() => setLeftPanelView("editing")}
                      className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                        leftPanelView === "editing"
                          ? "bg-purple-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      💬 Edit Game
                    </button>
                  </div>

                  {/* Open second player in new tab */}
                  {previewGameName && (
                    <button
                      type="button"
                      onClick={() => {
                        const roomId = previewRoomId;
                        const previewUserId = `preview-second-${roomId}`;
                        const searchParams = new URLSearchParams({
                          hideUI: "true",
                          userId: previewUserId,
                          username: "Preview Player 2",
                        });

                        const url = `${getGameServerUrl()}/game/${safeEncodeURIComponent(
                          previewGameName
                        )}/${safeEncodeURIComponent(roomId)}?${searchParams.toString()}`;
                        window.open(url, "_blank", "noopener,noreferrer");
                      }}
                      className="ml-2 px-4 py-2 rounded-md text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap cursor-pointer"
                    >
                      🎮 Open for Player 2
                    </button>
                  )}
                </div>
              )}

              {/* Panel Content */}
              <div className="flex-1 min-h-0">
                {renderPanelContent(leftPanelView, "left")}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section: Input / Explanation Area */}
        <div className="p-4 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Template Info in Bottom Left */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <button
                  // onClick={() => setSelectedTemplate(null)}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {template.name}
                </button>
            {isLoggedIn && drafts.length > 0 && (
              <div className="relative drafts-dropdown-container">
                {!generatedCode && (<button
                  onClick={() => setShowDraftsDropdown(!showDraftsDropdown)}
                  className="px-3 py-1.5 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700 transition-colors"
                >
                  Load Draft ({drafts.length})
                </button>)}
                
                {/* Drafts Dropdown */}
                {showDraftsDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                    <div className="p-2">
                      {drafts.map((draft) => (
                        <div
                          key={draft.id}
                          className="p-3 hover:bg-gray-800 rounded cursor-pointer group relative"
                        >
                          <div onClick={() => loadDraft(draft)}>
                            <div className="text-sm text-white font-semibold mb-1">
                              {draft.name || "Untitled Draft"}
                            </div>
                            <div className="text-xs text-gray-400 mb-2 line-clamp-2">
                              {draft.game_description}
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{GAME_TEMPLATES[draft.template as GameTemplate]?.name || draft.template}</span>
                              <span>{new Date(draft.updated_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteDraft(draft.id);
                            }}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
                        {/* Room configuration controls */}
            {generatedCode && (<div className="flex flex-wrap gap-4 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <span className="uppercase tracking-[0.15em] text-gray-500">Room config</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-gray-400">Min players</label>
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={minPlayersPerRoom}
                  onChange={(e) => {
                    const value = parseInt(e.target.value || "1", 10);
                    const nextMin = Math.max(1, Math.min(16, value));
                    setMinPlayersPerRoom(nextMin);
                    setMaxPlayersPerRoom((prev) => Math.max(nextMin, prev));
                  }}
                  className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-gray-400">Max players</label>
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={maxPlayersPerRoom}
                  onChange={(e) => {
                    const value = parseInt(e.target.value || "1", 10);
                    const raw = Math.max(1, Math.min(16, value));
                    const nextMax = Math.max(minPlayersPerRoom, raw);
                    setMaxPlayersPerRoom(nextMax);
                  }}
                  className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasWinCondition}
                  onChange={(e) => setHasWinCondition(e.target.checked)}
                  className="h-3 w-3 rounded border-gray-600 bg-gray-900 text-purple-500 focus:ring-purple-500"
                />
                <span className="text-gray-400">Has win condition</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canJoinLate}
                  onChange={(e) => setCanJoinLate(e.target.checked)}
                  className="h-3 w-3 rounded border-gray-600 bg-gray-900 text-purple-500 focus:ring-purple-500"
                />
                <span className="text-gray-400">Allow late join</span>
              </label>
            </div>)}
          </div>
        </div>


            {/* Main Area: either prompt textarea or AI explanation with actions */}
            <div className="flex gap-3 items-stretch">
              {explanation && generatedCode && !generatingCode ? (
                <>
                  {/* AI Explanation replaces chat box */}
                  <div className="flex-1 relative">
                    <div
                      ref={explanationRef}
                      className="h-full bg-black/80 border border-green-500/40 rounded-lg p-4 text-sm overflow-y-auto"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-green-400 text-xs font-semibold tracking-[0.2em] uppercase">
                          AI GENERATED EXPLANATION
                        </span>
                      </div>
                      <div className="text-gray-200 whitespace-pre-wrap">
                        {explanation}
                      </div>
                      {reasoning && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-[11px] text-emerald-300 hover:text-emerald-200">
                            🧠 View reasoning
                          </summary>
                          <pre className="mt-2 text-[11px] text-emerald-200 whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">
                            {reasoning}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>

                  {/* Actions to the right of explanation */}
                  <div className="flex flex-col gap-2 w-36 shrink-0">
                    <button
                      onClick={handleShipIt}
                      disabled={!name.trim() || !generatedCode}
                      className={`w-full px-3 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer ${
                        name.trim() && generatedCode
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-gray-800 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      🚀 Ship it
                    </button>
                    <button
                      onClick={() => setLeftPanelView("editing")}
                      className="w-full px-3 py-2 rounded-md text-sm font-semibold bg-gray-800 hover:bg-gray-700 text-gray-100 transition-colors cursor-pointer"
                    >
                      ✏️ Edit game
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Textarea with Model Dropdown and Arrow Button overlaid */}
                  <div className="flex-1 relative">
                    <textarea
                      value={gameDescription}
                      onChange={(e) => setGameDescription(e.target.value)}
                      placeholder={
                        !generatedCode
                          ? "Describe your game... (e.g., 'Make a competitive multiplayer puzzle game where players build towers')"
                          : "Describe your changes... (e.g., 'Add power-ups' or 'Change the game to be 3 players')"
                      }
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 pr-16 pb-12 min-h-[100px] max-h-[250px] focus:border-purple-500 focus:outline-none resize-none"
                      disabled={generatingCode}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (!generatedCode) handleGenerateGame();
                          else handleEditGame();
                        }
                      }}
                    />

                    {/* Model Dropdown in Bottom Left Corner */}
                    <div className="absolute left-3 bottom-3">
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="px-3 py-1.5 bg-gray-900/90 border border-gray-600 rounded text-xs focus:border-purple-500 focus:outline-none cursor-pointer hover:bg-gray-900"
                        disabled={generatingCode}
                      >
                        <option value="gpt-5">GPT-5</option>
                        <option value="claude-sonnet-4-5-20250929">Claude 4.5 Sonnet</option>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                      </select>
                    </div>

                    {/* Arrow Button in Bottom Right Corner */}
                    <button
                      onClick={!generatedCode ? handleGenerateGame : handleEditGame}
                      disabled={!gameDescription.trim() || generatingCode}
                      className="absolute right-3 top-3 p-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-all group cursor-pointer"
                      title={!generatedCode ? "Generate Game" : "Apply Changes"}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Ship It Button (pre-explanation state) */}
                  {generatedCode && (
                    <button
                      onClick={handleShipIt}
                      disabled={!name.trim() || !generatedCode}
                      className={`px-6 py-3 rounded-lg font-semibold transition-all cursor-pointer ${
                        name.trim() && generatedCode
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-gray-700 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      🚀 Ship It
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
      </div>
      </div>
      
      {/* Modal to prompt for game name and description before shipping */}
      {showNameDescriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-900 border border-gray-700 rounded-xl px-6 py-5 shadow-xl max-w-md w-full mx-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white">
                Add a name and description
              </h2>
              <p className="mt-1 text-xs text-gray-400">
                Before you ship your game, give it a clear name and a short description so other players know what it is.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Game name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                  placeholder="my-awesome-game"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Short description *
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                  placeholder="A fun multiplayer game where..."
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNameDescriptionModal(false)}
                className="px-3 py-2 rounded-md text-xs font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowNameDescriptionModal(false)}
                className="px-3 py-2 rounded-md text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white cursor-pointer disabled:bg-gray-700 disabled:cursor-not-allowed"
                disabled={!name.trim() || !description.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
