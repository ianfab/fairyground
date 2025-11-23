export default {
    name: "shooter",
    description: "First-Person 3D Shooter - WASD to move, mouse to look, click to shoot",
    code: `
function initGameClient(container, socket, roomId, emitAction) {
  // Load Three.js from CDN
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const gameContainer = document.createElement('div');
  gameContainer.style.cssText = 'width: 100%; height: 100vh; position: relative; overflow: hidden;';
  container.appendChild(gameContainer);

  const statusDiv = document.createElement('div');
  statusDiv.style.cssText = 'position: absolute; top: 20px; left: 20px; color: #fff; font-size: 18px; z-index: 100; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); font-family: monospace;';
  gameContainer.appendChild(statusDiv);

  const crosshair = document.createElement('div');
  crosshair.style.cssText = 'position: absolute; top: 50%; left: 50%; width: 20px; height: 20px; margin: -10px 0 0 -10px; border: 2px solid #fff; border-radius: 50%; pointer-events: none; z-index: 100;';
  gameContainer.appendChild(crosshair);

  const loadingDiv = document.createElement('div');
  loadingDiv.textContent = 'Loading Three.js...';
  loadingDiv.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #fff; font-size: 24px; z-index: 101;';
  gameContainer.appendChild(loadingDiv);

  let THREE, scene, camera, renderer;
  let myPlayerId = null;
  let keys = {};
  let mouseMovement = { x: 0, y: 0 };
  let playerMeshes = {};
  let bulletMeshes = {};

  loadScript('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js').then(() => {
    loadingDiv.style.display = 'none';
    THREE = window.THREE;

    // Setup scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 0, 200);

    // Setup camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 0);

    // Setup renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    gameContainer.insertBefore(renderer.domElement, statusDiv);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -100;
    dirLight.shadow.camera.right = 100;
    dirLight.shadow.camera.top = 100;
    dirLight.shadow.camera.bottom = -100;
    scene.add(dirLight);

    // Add ground
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x7cfc00 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(200, 40, 0x000000, 0x000000);
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Input handling
    document.addEventListener('keydown', (e) => {
      keys[e.code] = true;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });

    document.addEventListener('keyup', (e) => {
      keys[e.code] = false;
    });

    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === renderer.domElement) {
        mouseMovement.x = e.movementX || 0;
        mouseMovement.y = e.movementY || 0;
      }
    });

    // Request pointer lock on click
    renderer.domElement.addEventListener('click', () => {
      if (document.pointerLockElement !== renderer.domElement) {
        renderer.domElement.requestPointerLock();
      } else {
        emitAction('shoot', {});
      }
    });

    // Show instructions when not locked
    const instructionsDiv = document.createElement('div');
    instructionsDiv.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #fff; font-size: 24px; z-index: 102; text-align: center; background: rgba(0,0,0,0.8); padding: 40px; border-radius: 10px; pointer-events: none;';
    instructionsDiv.innerHTML = 'Click to start<br><span style="font-size: 16px; color: #aaa;">WASD to move, Mouse to look, Click to shoot</span>';
    gameContainer.appendChild(instructionsDiv);

    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === renderer.domElement) {
        instructionsDiv.style.display = 'none';
      } else {
        instructionsDiv.style.display = 'block';
      }
    });

    // Game loop
    function animate() {
      requestAnimationFrame(animate);

      // Send player input to server
      if (myPlayerId) {
        const movement = {
          forward: keys['KeyW'] ? 1 : 0,
          backward: keys['KeyS'] ? 1 : 0,
          left: keys['KeyA'] ? 1 : 0,
          right: keys['KeyD'] ? 1 : 0,
          rotX: mouseMovement.x,
          rotY: mouseMovement.y
        };
        mouseMovement.x = 0;
        mouseMovement.y = 0;

        if (movement.forward || movement.backward || movement.left || movement.right || movement.rotX || movement.rotY) {
          emitAction('move', movement);
        }
      }

      renderer.render(scene, camera);
    }
    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }).catch(err => {
    loadingDiv.textContent = 'Error loading game. Please refresh.';
    console.error('Failed to load Three.js:', err);
  });

  return {
    onStateUpdate: (state) => {
      if (!THREE || !scene) return;

      myPlayerId = socket.id;

      // Update players
      if (state.players) {
        Object.entries(state.players).forEach(([id, player]) => {
          // Don't render the local player's mesh in first person
          if (id === myPlayerId) {
            // Update camera for first-person view
            const eyeHeight = 1.6;
            camera.position.set(player.x, eyeHeight, player.z);

            // Set camera rotation based on player rotation
            camera.rotation.order = 'YXZ';
            camera.rotation.y = player.rotation;
            camera.rotation.x = player.pitch || 0;

            // Remove local player mesh if it exists
            if (playerMeshes[id]) {
              scene.remove(playerMeshes[id]);
              delete playerMeshes[id];
            }
          } else {
            // Render other players
            if (!playerMeshes[id]) {
              // Create player mesh (cube)
              const geometry = new THREE.BoxGeometry(1, 2, 1);
              const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
              const mesh = new THREE.Mesh(geometry, material);
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              scene.add(mesh);
              playerMeshes[id] = mesh;
            }

            // Update player position and rotation
            const mesh = playerMeshes[id];
            mesh.position.set(player.x, 1, player.z);
            mesh.rotation.y = player.rotation;
          }
        });

        // Remove disconnected players
        Object.keys(playerMeshes).forEach(id => {
          if (!state.players[id]) {
            scene.remove(playerMeshes[id]);
            delete playerMeshes[id];
          }
        });
      }

      // Update bullets
      if (state.bullets) {
        Object.entries(state.bullets).forEach(([id, bullet]) => {
          if (!bulletMeshes[id]) {
            // Create bullet mesh (sphere)
            const geometry = new THREE.SphereGeometry(0.2, 8, 8);
            const material = new THREE.MeshStandardMaterial({ color: 0xffff00 });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            scene.add(mesh);
            bulletMeshes[id] = mesh;
          }

          // Update bullet position
          const mesh = bulletMeshes[id];
          mesh.position.set(bullet.x, bullet.y, bullet.z);
        });

        // Remove old bullets
        Object.keys(bulletMeshes).forEach(id => {
          if (!state.bullets[id]) {
            scene.remove(bulletMeshes[id]);
            delete bulletMeshes[id];
          }
        });
      }

      // Update enemies
      if (state.enemies) {
        Object.entries(state.enemies).forEach(([id, enemy]) => {
          const enemyId = 'enemy_' + id;
          if (!playerMeshes[enemyId]) {
            // Create enemy mesh (purple cube)
            const geometry = new THREE.BoxGeometry(1, 2, 1);
            const material = new THREE.MeshStandardMaterial({ color: 0x800080 });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            playerMeshes[enemyId] = mesh;
          }

          // Update enemy position
          const mesh = playerMeshes[enemyId];
          mesh.position.set(enemy.x, 1, enemy.z);
        });

        // Remove dead enemies
        Object.keys(playerMeshes).forEach(id => {
          if (id.startsWith('enemy_')) {
            const enemyId = id.replace('enemy_', '');
            if (!state.enemies[enemyId]) {
              scene.remove(playerMeshes[id]);
              delete playerMeshes[id];
            }
          }
        });
      }

      // Update status display
      const myPlayer = state.players ? state.players[myPlayerId] : null;
      if (myPlayer) {
        statusDiv.innerHTML =
          'Health: ' + (myPlayer.health || 100) + '<br>' +
          'Score: ' + (myPlayer.score || 0) + '<br>' +
          'Enemies: ' + (state.enemies ? Object.keys(state.enemies).length : 0);
      }
    }
  };
}

const serverLogic = {
  initialState: {
    players: {},
    bullets: {},
    enemies: {},
    nextBulletId: 0,
    nextEnemyId: 0,
    lastSpawnTime: Date.now()
  },
  moves: {
    playerJoined: (state, payload, playerId) => {
      // Spawn player at random position
      state.players[playerId] = {
        x: (Math.random() - 0.5) * 40,
        z: (Math.random() - 0.5) * 40,
        rotation: 0,
        pitch: 0,
        health: 100,
        score: 0
      };
    },

    move: (state, payload, playerId) => {
      const player = state.players[playerId];
      if (!player || player.health <= 0) return;

      const speed = 0.3;
      const rotSpeed = 0.002;  // Reduced from 0.05 for lower sensitivity
      const pitchSpeed = 0.002;  // Reduced from 0.03 for lower sensitivity

      // Update rotation (horizontal)
      player.rotation -= payload.rotX * rotSpeed;

      // Update pitch (vertical look) and clamp it
      if (payload.rotY) {
        player.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, player.pitch - payload.rotY * pitchSpeed));
      }

      // Calculate movement direction based on rotation
      // Fixed: Negative Math.sin for forward movement (W key moves in -z direction in camera space)
      const forward = {
        x: -Math.sin(player.rotation),
        z: -Math.cos(player.rotation)
      };
      const right = {
        x: Math.cos(player.rotation),
        z: -Math.sin(player.rotation)
      };

      // Apply movement
      if (payload.forward) {
        player.x += forward.x * speed;
        player.z += forward.z * speed;
      }
      if (payload.backward) {
        player.x -= forward.x * speed;
        player.z -= forward.z * speed;
      }
      if (payload.right) {
        player.x += right.x * speed;
        player.z += right.z * speed;
      }
      if (payload.left) {
        player.x -= right.x * speed;
        player.z -= right.z * speed;
      }

      // Clamp to arena bounds
      player.x = Math.max(-95, Math.min(95, player.x));
      player.z = Math.max(-95, Math.min(95, player.z));
    },

    shoot: (state, payload, playerId) => {
      const player = state.players[playerId];
      if (!player || player.health <= 0) return;

      // Create bullet - use same forward direction as movement
      const bulletId = state.nextBulletId++;
      state.bullets[bulletId] = {
        x: player.x,
        y: 1.5,
        z: player.z,
        vx: -Math.sin(player.rotation) * 2,  // Fixed to match movement direction
        vz: -Math.cos(player.rotation) * 2,  // Fixed to match movement direction
        ownerId: playerId,
        createdAt: Date.now()
      };
    },

    tick: (state) => {
      const now = Date.now();

      // Update bullets
      Object.entries(state.bullets).forEach(([id, bullet]) => {
        bullet.x += bullet.vx;
        bullet.z += bullet.vz;

        // Remove bullets that are out of bounds or too old
        if (Math.abs(bullet.x) > 100 || Math.abs(bullet.z) > 100 || now - bullet.createdAt > 3000) {
          delete state.bullets[id];
          return;
        }

        // Check collision with enemies
        Object.entries(state.enemies).forEach(([enemyId, enemy]) => {
          const dx = bullet.x - enemy.x;
          const dz = bullet.z - enemy.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          if (dist < 1) {
            // Hit enemy
            delete state.enemies[enemyId];
            delete state.bullets[id];

            // Award points to shooter
            if (state.players[bullet.ownerId]) {
              state.players[bullet.ownerId].score += 10;
            }
          }
        });

        // Check collision with players
        Object.entries(state.players).forEach(([playerId, player]) => {
          if (playerId === bullet.ownerId || player.health <= 0) return;

          const dx = bullet.x - player.x;
          const dz = bullet.z - player.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          if (dist < 1) {
            // Hit player
            player.health -= 20;
            delete state.bullets[id];

            if (player.health <= 0) {
              // Award points for kill
              if (state.players[bullet.ownerId]) {
                state.players[bullet.ownerId].score += 50;
              }
            }
          }
        });
      });

      // Update enemies (move towards nearest player)
      Object.entries(state.enemies).forEach(([enemyId, enemy]) => {
        let nearestPlayer = null;
        let nearestDist = Infinity;
        let nearestPlayerId = null;

        Object.entries(state.players).forEach(([playerId, player]) => {
          if (player.health <= 0) return;
          const dx = player.x - enemy.x;
          const dz = player.z - enemy.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestPlayer = player;
            nearestPlayerId = playerId;
          }
        });

        if (nearestPlayer) {
          const dx = nearestPlayer.x - enemy.x;
          const dz = nearestPlayer.z - enemy.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          // Check for collision with player (deal damage)
          if (dist < 1.5) {
            // Enemy touches player - deal damage
            if (!enemy.lastHitTime || now - enemy.lastHitTime > 1000) {
              nearestPlayer.health -= 10;
              enemy.lastHitTime = now;

              // Kill enemy on contact
              delete state.enemies[enemyId];
            }
          } else if (dist > 0) {
            // Move towards player
            enemy.x += (dx / dist) * 0.1;
            enemy.z += (dz / dist) * 0.1;
          }
        }
      });

      // Spawn enemies periodically
      const enemyCount = Object.keys(state.enemies).length;
      if (enemyCount < 5 && now - state.lastSpawnTime > 3000) {
        const enemyId = state.nextEnemyId++;
        const angle = Math.random() * Math.PI * 2;
        const dist = 50;
        state.enemies[enemyId] = {
          x: Math.cos(angle) * dist,
          z: Math.sin(angle) * dist,
          health: 1
        };
        state.lastSpawnTime = now;
      }

      // Respawn dead players after 3 seconds
      Object.entries(state.players).forEach(([playerId, player]) => {
        if (player.health <= 0) {
          if (!player.deathTime) {
            player.deathTime = now;
          } else if (now - player.deathTime > 3000) {
            player.health = 100;
            player.x = (Math.random() - 0.5) * 40;
            player.z = (Math.random() - 0.5) * 40;
            player.pitch = 0;
            delete player.deathTime;
          }
        }
      });
    }
  }
};
`
};
//# sourceMappingURL=shooter.js.map