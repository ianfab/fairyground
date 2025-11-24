export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <main className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">
          How does game creation work?
        </h1>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">AI-Powered Game Development</h2>
            <p className="text-lg leading-relaxed">
              We use an AI agent to code both the client-side and server-side code for your game.
              Simply describe what you want to build, and our agent will generate a fully functional
              multiplayer game. The server-side code runs on our cloud infrastructure, so you can
              play with your friends anytime without needing to host anything yourself.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Manual Game Creation</h2>
            <p className="text-lg leading-relaxed mb-4">
              If you want to manually create games without vibe coding, or you want to use your own
              ChatGPT/Gemini window to code, you can follow the structure below. Games consist of
              two main parts: client code and server logic.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-purple-400 mb-3">Client-Side Structure</h3>
            <p className="text-base leading-relaxed mb-4">
              The client code defines a function called <code className="bg-gray-800 px-2 py-1 rounded">initGameClient</code> that
              initializes your game's UI and handles rendering:
            </p>
            <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm border border-gray-800">
{`function initGameClient(container, socket, roomId, emitAction) {
  // Create your game's UI elements
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  container.appendChild(canvas);

  // Set up your game rendering and input handling
  // ...

  // Create the game instance
  const gameInstance = {
    onStateUpdate: (state) => {
      // This gets called whenever the server sends a new state
      // Update your UI based on the new state
      console.log('New state:', state);
    }
  };

  // Send actions to the server
  canvas.addEventListener('click', (e) => {
    emitAction('playerAction', { x: e.clientX, y: e.clientY });
  });

  return gameInstance;
}`}
            </pre>

            <div className="mt-4 space-y-2 text-sm">
              <p><strong className="text-white">Parameters:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><code className="bg-gray-800 px-2 py-1 rounded">container</code> - The DOM element where you should render your game</li>
                <li><code className="bg-gray-800 px-2 py-1 rounded">socket</code> - Socket.io connection for real-time communication</li>
                <li><code className="bg-gray-800 px-2 py-1 rounded">roomId</code> - Unique identifier for this game room</li>
                <li><code className="bg-gray-800 px-2 py-1 rounded">emitAction(actionName, payload)</code> - Function to send actions to the server</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold text-purple-400 mb-3">Server-Side Structure</h3>
            <p className="text-base leading-relaxed mb-4">
              The server logic is an object with <code className="bg-gray-800 px-2 py-1 rounded">initialState</code> and
              a <code className="bg-gray-800 px-2 py-1 rounded">moves</code> object containing action handlers:
            </p>
            <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm border border-gray-800">
{`const serverLogic = {
  initialState: {
    players: {},
    gameData: {
      // Your game's initial state
      score: 0,
      items: []
    }
  },

  moves: {
    // Special handler called when a player joins
    playerJoined: (state, payload, playerId) => {
      state.players[playerId] = {
        x: 100,
        y: 100,
        score: 0
      };
    },

    // Your custom action handlers
    playerAction: (state, payload, playerId) => {
      // Modify state based on the action
      const player = state.players[playerId];
      if (player) {
        player.x = payload.x;
        player.y = payload.y;
      }
    },

    // Add more action handlers as needed
  }
}`}
            </pre>

            <div className="mt-4 space-y-2 text-sm">
              <p><strong className="text-white">Key Points:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><code className="bg-gray-800 px-2 py-1 rounded">initialState</code> - The starting state when a game room is created</li>
                <li><code className="bg-gray-800 px-2 py-1 rounded">moves</code> - Object containing functions that modify the state</li>
                <li><code className="bg-gray-800 px-2 py-1 rounded">playerJoined</code> - Special handler automatically called when a player connects</li>
                <li>Each move handler receives: <code className="bg-gray-800 px-2 py-1 rounded">(state, payload, playerId)</code></li>
                <li>Handlers should modify <code className="bg-gray-800 px-2 py-1 rounded">state</code> directly - changes are automatically synced to all clients</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold text-purple-400 mb-3">Complete Game Structure</h3>
            <p className="text-base leading-relaxed mb-4">
              A complete game exports an object with name, description, and code:
            </p>
            <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm border border-gray-800">
{`export default {
  name: "my-game",
  description: "A fun multiplayer game",
  code: \`
    function initGameClient(container, socket, roomId, emitAction) {
      // Client code here...
      return gameInstance;
    }

    const serverLogic = {
      initialState: { /* ... */ },
      moves: { /* ... */ }
    }
  \`
}`}
            </pre>
          </section>

          <section className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
            <h3 className="text-xl font-bold text-blue-400 mb-3">Tips</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>The server runs at 20 ticks per second, syncing state to all clients</li>
              <li>Keep your state updates efficient - they're sent to all players</li>
              <li>Use <code className="bg-gray-800 px-2 py-1 rounded">emitAction</code> sparingly to reduce network traffic</li>
              <li>Client-side prediction can make your game feel more responsive</li>
              <li>You can load external libraries (Three.js, Phaser, etc.) in your client code</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
