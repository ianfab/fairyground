"use client";

import { useEffect, useRef, useState } from "react";

export function SnakeGameWhileWaiting() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const gameStateRef = useRef({
    isRunning: false,
    gameOver: false,
    dinoY: 0,
    dinoVelocity: 0,
    obstacles: [] as { x: number; height: number }[],
    score: 0,
    frameCount: 0
  });

  // Show intro message for 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Don't start game until intro is done
    if (showIntro) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load high score from localStorage
    const savedHighScore = parseInt(localStorage.getItem('dinoHighScore') || '0');
    setHighScore(savedHighScore);

    const GRAVITY = 0.3;
    const JUMP_STRENGTH = -12;
    const GROUND_Y = canvas.height - 60;
    const DINO_SIZE = 40;
    const OBSTACLE_WIDTH = 20;
    const GAME_SPEED = 2;

    const state = gameStateRef.current;
    state.dinoY = GROUND_Y;
    state.isRunning = true;
    state.gameOver = false;

    const jump = () => {
      if (state.gameOver) {
        // Reset game
        state.gameOver = false;
        state.dinoY = GROUND_Y;
        state.dinoVelocity = 0;
        state.obstacles = [];
        state.score = 0;
        state.frameCount = 0;
        setScore(0);
        return;
      }

      if (Math.abs(state.dinoY - GROUND_Y) < 1) {
        state.dinoVelocity = JUMP_STRENGTH;
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };

    const handleClick = () => {
      jump();
    };

    window.addEventListener('keydown', handleKeyPress);
    canvas.addEventListener('click', handleClick);

    let animationFrameId: number;
    
    const gameLoop = () => {
      if (!canvas || !ctx || !state.isRunning) return;

      // Clear canvas
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!state.gameOver) {
        state.frameCount++;

        // Update dino
        state.dinoVelocity += GRAVITY;
        state.dinoY += state.dinoVelocity;

        if (state.dinoY > GROUND_Y) {
          state.dinoY = GROUND_Y;
          state.dinoVelocity = 0;
        }

        // Spawn obstacles
        if (state.frameCount % 120 === 0) {
          const height = 30 + Math.random() * 30;
          state.obstacles.push({ x: canvas.width, height });
        }

        // Update obstacles
        state.obstacles = state.obstacles.filter(obs => {
          obs.x -= GAME_SPEED;
          return obs.x > -OBSTACLE_WIDTH;
        });

        // Check collisions
        const dinoRect = {
          x: 50,
          y: state.dinoY,
          width: DINO_SIZE,
          height: DINO_SIZE
        };

        for (const obs of state.obstacles) {
          const obsRect = {
            x: obs.x,
            y: GROUND_Y + DINO_SIZE - obs.height,
            width: OBSTACLE_WIDTH,
            height: obs.height
          };

          if (
            dinoRect.x < obsRect.x + obsRect.width &&
            dinoRect.x + dinoRect.width > obsRect.x &&
            dinoRect.y < obsRect.y + obsRect.height &&
            dinoRect.y + dinoRect.height > obsRect.y
          ) {
            state.gameOver = true;
            if (state.score > highScore) {
              setHighScore(state.score);
              localStorage.setItem('dinoHighScore', state.score.toString());
            }
          }
        }

        // Update score
        state.score = Math.floor(state.frameCount / 10);
        setScore(state.score);
      }

      // Draw ground
      ctx.fillStyle = '#666';
      ctx.fillRect(0, GROUND_Y + DINO_SIZE, canvas.width, 2);

      // Draw dino (emoji)
      ctx.font = `${DINO_SIZE}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('🦖', 50, state.dinoY);

      // Draw obstacles
      ctx.fillStyle = '#888';
      for (const obs of state.obstacles) {
        ctx.fillRect(obs.x, GROUND_Y + DINO_SIZE - obs.height, OBSTACLE_WIDTH, obs.height);
      }

      // Draw game over
      if (state.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '18px sans-serif';
        ctx.fillText('Score: ' + state.score, canvas.width / 2, canvas.height / 2 + 20);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#888';
        ctx.fillText('Press SPACE or click to restart', canvas.width / 2, canvas.height / 2 + 50);
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      state.isRunning = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyPress);
      canvas.removeEventListener('click', handleClick);
    };
  }, [showIntro]);

  if (showIntro) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-400">Generating Code...</h2>
        </div>
        <div className="flex-1 bg-black border border-gray-800 rounded overflow-hidden relative flex flex-col items-center justify-center p-8">
          <div className="text-center animate-fade-in">
            <div className="text-4xl mb-6">🦖</div>
            <h3 className="text-2xl font-bold text-white mb-4">Game Generating</h3>
            <p className="text-lg text-gray-400">
              Play a dino game while you wait!
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-purple-500"></div>
              <span className="text-sm text-gray-500">AI is generating your code...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-400">Generating Code...</h2>
        <div className="text-sm text-gray-500">
          Play while you wait! 🦖
        </div>
      </div>
      <div className="flex-1 bg-black border border-gray-800 rounded overflow-hidden relative flex flex-col items-center justify-center p-8">
        <div className="mb-4 flex gap-8 text-gray-400">
          <div className="text-center">
            <div className="text-sm text-gray-500">Score</div>
            <div className="text-2xl font-bold">{score}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">High Score</div>
            <div className="text-2xl font-bold text-purple-400">{highScore}</div>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          width={600}
          height={300}
          className="border border-gray-700 rounded"
        />
        <div className="mt-4 text-sm text-gray-500">
          Press SPACE or click to jump
        </div>
        <div className="absolute top-4 left-4 bg-black/80 px-3 py-2 rounded-lg text-xs text-gray-400 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-600 border-t-purple-500"></div>
            <span>AI is generating your code...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

