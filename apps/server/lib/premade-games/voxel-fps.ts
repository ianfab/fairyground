export default {
  name: "voxel-fps",
  description: "Fast-paced 3D multiplayer FPS with destructible voxel terrain - shoot enemies and build/destroy blocks like Minecraft meets Krunker.io",
  code: `
function initGameClient(container, socket, roomId, emitAction) {
  let scene, camera, renderer;
  let playerMeshes = new Map();
  let bulletMeshes = [];
  let voxelMeshes = new Map();
  let localPlayerId = socket.id;
  let animationFrameId;
  let cleanupEvents = [];

  // Movement state
  let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, jump = false;
  let isShiftPressed = false; // New: Track shift key
  let velocity = { x: 0, y: 0, z: 0 };
  let yaw = 0, pitch = 0;
  let isPointerLocked = false;
  let onGround = false;
  
  // Game Modes: 'shoot' or 'build'
  let gameMode = 'shoot'; 
  let selectedBlock = 1;

  // Shared resources
  let voxelGeo, voxelMats, playerGeo, bulletGeo, bulletMat;

  const loadThree = () => new Promise((resolve) => {
    if (window.THREE) return resolve();
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';
    script.onload = resolve;
    document.head.appendChild(script);
  });

  loadThree().then(() => {
    voxelGeo = new THREE.BoxGeometry(1, 1, 1);
    voxelMats = {
      1: new THREE.MeshLambertMaterial({ color: 0x8B4513 }), // Dirt
      2: new THREE.MeshLambertMaterial({ color: 0x808080 }), // Stone
      3: new THREE.MeshLambertMaterial({ color: 0xDEB887 })  // Wood
    };
    playerGeo = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    bulletGeo = new THREE.SphereGeometry(0.15, 8, 8);
    bulletMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 0, 60);

    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0.5, 5, 0.5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 50, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // --- Input Handling ---
    const onKey = (e, isDown) => {
      switch(e.code) {
        case 'KeyW': moveForward = isDown; break;
        case 'KeyS': moveBackward = isDown; break;
        case 'KeyA': moveLeft = isDown; break;
        case 'KeyD': moveRight = isDown; break;
        case 'Space': jump = isDown; break;
        case 'ShiftLeft': 
        case 'ShiftRight': 
          isShiftPressed = isDown; 
          break;
        // Mode Switching
        case 'Digit1': 
          if(isDown) { 
            gameMode = 'shoot'; 
            updateBlockUI(); 
          } 
          break;
        case 'Digit2': 
          if(isDown) { 
            gameMode = 'build'; 
            selectedBlock = 1; 
            updateBlockUI(); 
          } 
          break;
        case 'Digit3': 
          if(isDown) { 
            gameMode = 'build'; 
            selectedBlock = 2; 
            updateBlockUI(); 
          } 
          break;
        case 'Digit4': 
          if(isDown) { 
            gameMode = 'build'; 
            selectedBlock = 3; 
            updateBlockUI(); 
          } 
          break;
      }
    };

    const onKeyDown = (e) => onKey(e, true);
    const onKeyUp = (e) => onKey(e, false);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    cleanupEvents.push(
      () => document.removeEventListener('keydown', onKeyDown),
      () => document.removeEventListener('keyup', onKeyUp)
    );

    renderer.domElement.addEventListener('click', () => renderer.domElement.requestPointerLock());
    
    const onMouseMove = (e) => {
      if (document.pointerLockElement !== renderer.domElement) {
        isPointerLocked = false;
        return;
      }
      isPointerLocked = true;
      yaw -= e.movementX * 0.002;
      pitch -= e.movementY * 0.002;
      pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
    };
    document.addEventListener('mousemove', onMouseMove);
    cleanupEvents.push(() => document.removeEventListener('mousemove', onMouseMove));

    const onMouseDown = (e) => {
      if (!isPointerLocked) return;

      const direction = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));

      // SHOOT MODE
      if (gameMode === 'shoot') {
        if (e.button === 0) { // Left Click = Shoot
          emitAction('shoot', {
            position: camera.position.toArray(),
            direction: direction.toArray()
          });
          // Visual recoil
          camera.position.y += 0.05;
        }
      } 
      // BLOCK MODE
      else {
        // Raycast
        const raycaster = new THREE.Raycaster();
        raycaster.set(camera.position, direction);
        const voxelObjects = Array.from(voxelMeshes.values());
        const intersects = raycaster.intersectObjects(voxelObjects);

        if (e.button === 0) { // Left Click = Destroy
          if (intersects.length > 0 && intersects[0].distance < 8) {
            const { x, y, z } = intersects[0].object.userData;
            emitAction('destroyBlock', { x, y, z });
          }
        } else if (e.button === 2) { // Right Click = Place
          if (intersects.length > 0 && intersects[0].distance < 8) {
            const hit = intersects[0];
            const normal = hit.face.normal;
            const pos = hit.object.position.clone().add(normal);
            emitAction('placeBlock', {
              x: Math.floor(pos.x),
              y: Math.floor(pos.y),
              z: Math.floor(pos.z),
              type: selectedBlock
            });
          }
        }
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    cleanupEvents.push(() => document.removeEventListener('mousedown', onMouseDown));

    // UI Setup
    const ui = document.createElement('div');
    ui.style.cssText = 'position:absolute;top:20px;left:50%;transform:translateX(-50%);color:white;font-family:monospace;pointer-events:none;text-align:center;z-index:100;text-shadow:1px 1px 2px black;';
    ui.innerHTML = \`
      <div style="font-size:20px;margin-bottom:5px;">VOXEL FPS</div>
      <div style="font-size:12px;opacity:0.8;">
        WASD: Move | Shift: Crouch (No Fall) | Space: Jump<br>
        1: GUN | 2-4: BLOCKS
      </div>
      <div id="stats" style="margin-top:10px;font-size:16px;">Score: 0 | HP: 100</div>
      <div id="blocks" style="margin-top:10px;display:flex;gap:5px;justify-content:center;">
         <div id="modeGun" style="padding:5px 10px;background:#333;border:2px solid white;">GUN (Left Click)</div>
         <div id="b1" style="width:30px;height:30px;background:#8B4513;border:2px solid #333;"></div>
         <div id="b2" style="width:30px;height:30px;background:#808080;border:2px solid #333;"></div>
         <div id="b3" style="width:30px;height:30px;background:#DEB887;border:2px solid #333;"></div>
      </div>
      <div id="crosshair" style="position:fixed;top:50%;left:50%;width:4px;height:4px;background:red;transform:translate(-50%,-50%);border-radius:50%;"></div>
      <div id="modeHint" style="position:fixed;top:52%;left:50%;transform:translate(-50%,0);font-size:10px;opacity:0.7;">SHOOT MODE</div>
    \`;
    container.appendChild(ui);

    function updateBlockUI() {
      const crosshair = document.getElementById('crosshair');
      const hint = document.getElementById('modeHint');
      const gunEl = document.getElementById('modeGun');
      
      if (gameMode === 'shoot') {
        gunEl.style.borderColor = 'white';
        gunEl.style.color = 'white';
        crosshair.style.background = 'red';
        hint.innerText = "SHOOT MODE (Left: Fire)";
        ['b1','b2','b3'].forEach(id => document.getElementById(id).style.borderColor = '#333');
      } else {
        gunEl.style.borderColor = '#333';
        gunEl.style.color = '#888';
        crosshair.style.background = 'white';
        hint.innerText = "BUILD MODE (Left: Destroy | Right: Place)";
        ['b1','b2','b3'].forEach((id, i) => {
          const el = document.getElementById(id);
          el.style.borderColor = (selectedBlock === i+1) ? 'white' : '#333';
        });
      }
    }
    updateBlockUI(); // Init

    let lastTime = performance.now();
    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (isPointerLocked) {
        const speed = isShiftPressed ? 4 : 8; // Slower when crouching
        const direction = new THREE.Vector3();
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0,1,0), yaw);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0,1,0), yaw);

        if (moveForward) direction.add(forward);
        if (moveBackward) direction.sub(forward);
        if (moveLeft) direction.sub(right);
        if (moveRight) direction.add(right);
        
        if (direction.lengthSq() > 0) direction.normalize().multiplyScalar(speed);

        velocity.x = direction.x;
        velocity.z = direction.z;

        // Visual camera dip when crouching
        const targetY = isShiftPressed ? 3.6 : 5; // This is just visual offset relative to player Y
        // Actually camera is updated in onStateUpdate based on player pos, 
        // but we can add a local offset here if we want smoother crouching, 
        // for now let's rely on server position updates.

        if (jump && onGround) {
           emitAction('jump', {});
           onGround = false;
        }

        camera.rotation.set(pitch, yaw, 0, 'YXZ');
        
        emitAction('move', {
          velocity: [velocity.x, velocity.y, velocity.z],
          rotation: [pitch, yaw, 0],
          shift: isShiftPressed // Send shift state to server
        });
      }

      renderer.render(scene, camera);
    }
    animate();

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);
    cleanupEvents.push(() => window.removeEventListener('resize', onResize));
  });

  return {
    onStateUpdate: (state) => {
      if (!scene) return;

      const me = state.players[localPlayerId];
      if (me) {
        // Camera follow
        const eyeHeight = 0.6; // Distance from center to eyes
        camera.position.lerp(new THREE.Vector3(me.position[0], me.position[1] + eyeHeight, me.position[2]), 0.5);
        onGround = me.onGround;
        
        // Update stats UI
        const stats = document.getElementById('stats');
        if(stats) stats.innerText = \`Score: \${me.score} | HP: \${me.health}\`;
      }

      // Render Players
      Object.entries(state.players).forEach(([id, player]) => {
        if (id === localPlayerId) return;
        
        let mesh = playerMeshes.get(id);
        if (!mesh) {
           if (!playerGeo) return; 
           const mat = new THREE.MeshLambertMaterial({ color: player.color });
           mesh = new THREE.Mesh(playerGeo, mat);
           mesh.castShadow = true;
           scene.add(mesh);
           playerMeshes.set(id, mesh);
        }
        mesh.position.lerp(new THREE.Vector3(player.position[0], player.position[1], player.position[2]), 0.5);
        mesh.rotation.y = player.rotation[1];
      });

      for (const [id, mesh] of playerMeshes) {
        if (!state.players[id]) {
          scene.remove(mesh);
          mesh.geometry.dispose();
          mesh.material.dispose();
          playerMeshes.delete(id);
        }
      }

      // Bullets
      bulletMeshes.forEach(m => scene.remove(m));
      bulletMeshes = [];
      if (bulletGeo && bulletMat) {
          state.bullets.forEach(b => {
             const mesh = new THREE.Mesh(bulletGeo, bulletMat);
             mesh.position.set(b.position[0], b.position[1], b.position[2]);
             scene.add(mesh);
             bulletMeshes.push(mesh);
          });
      }

      // Voxels
      const currentKeys = new Set();
      if (state.voxels && voxelGeo && voxelMats) {
        Object.entries(state.voxels).forEach(([key, v]) => {
          currentKeys.add(key);
          if (!voxelMeshes.has(key)) {
            const mesh = new THREE.Mesh(voxelGeo, voxelMats[v.type]);
            mesh.position.set(v.x + 0.5, v.y + 0.5, v.z + 0.5);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData = { x: v.x, y: v.y, z: v.z };
            scene.add(mesh);
            voxelMeshes.set(key, mesh);
          }
        });
      }

      for (const [key, mesh] of voxelMeshes) {
        if (!currentKeys.has(key)) {
          scene.remove(mesh);
          voxelMeshes.delete(key);
        }
      }
    },
    cleanup: () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      cleanupEvents.forEach(fn => fn());
      if (renderer && renderer.domElement && container) {
        container.removeChild(renderer.domElement);
      }
      playerMeshes.forEach(m => { m.geometry.dispose(); m.material.dispose(); });
      voxelMeshes.forEach(m => scene.remove(m)); 
    }
  };
}

const serverLogic = {
  initialState: {
    players: {},
    bullets: [],
    voxels: {},
    nextBulletId: 0,
    worldSize: { x: 64, y: 32, z: 64 },
    worldOffset: { x: 32, y: 0, z: 32 },
    world: null
  },
  moves: {
    playerJoined: (state, payload, playerId) => {
      if (!state.world) {
        state.world = Array(64).fill(null).map(() => Array(32).fill(null).map(() => Array(64).fill(0)));
        
        const addBlock = (x, y, z, type) => {
           const ix = x + 32, iy = y, iz = z + 32;
           if(ix>=0 && ix<64 && iy>=0 && iy<32 && iz>=0 && iz<64) {
             state.world[ix][iy][iz] = type;
             state.voxels[\`\${x},\${y},\${z}\`] = {x,y,z,type};
           }
        };
        for(let x=-15; x<=15; x++) {
          for(let z=-15; z<=15; z++) addBlock(x, 1, z, 1);
        }
        for(let y=2; y<8; y++) { addBlock(10, y, 10, 2); addBlock(-10, y, -10, 2); }
      }

      state.players[playerId] = {
        position: [0, 5, 0],
        velocity: [0, 0, 0],
        rotation: [0, 0, 0],
        health: 100,
        score: 0,
        color: Math.random() * 0xffffff,
        onGround: false,
        isShiftPressed: false // Track shift
      };
    },
    move: (state, { velocity, rotation, shift }, playerId) => {
      const p = state.players[playerId];
      if (!p) return;
      p.rotation = rotation;
      p.velocity[0] = velocity[0];
      p.velocity[2] = velocity[2];
      p.isShiftPressed = shift || false;
    },
    jump: (state, _, playerId) => {
      const p = state.players[playerId];
      if (p && p.onGround) p.velocity[1] = 10; 
    },
    shoot: (state, { position, direction }, playerId) => {
      const p = state.players[playerId];
      if (!p || p.health <= 0) return;
      state.bullets.push({
        id: state.nextBulletId++,
        owner: playerId,
        position,
        direction,
        createdAt: Date.now()
      });
    },
    placeBlock: (state, { x, y, z, type }, playerId) => {
      const ix = x + 32, iy = y, iz = z + 32;
      if (ix<0 || ix>=64 || iy<0 || iy>=32 || iz<0 || iz>=64) return;
      if (state.world[ix][iy][iz] !== 0) return;
      const isTrapping = Object.values(state.players).some(p => {
         return Math.abs(p.position[0] - (x+0.5)) < 0.8 && 
                Math.abs(p.position[1] - (y+0.5)) < 1.8 && 
                Math.abs(p.position[2] - (z+0.5)) < 0.8;
      });
      if (isTrapping) return;
      state.world[ix][iy][iz] = type;
      state.voxels[\`\${x},\${y},\${z}\`] = { x, y, z, type };
    },
    destroyBlock: (state, { x, y, z }, playerId) => {
      const ix = x + 32, iy = y, iz = z + 32;
      if (ix<0 || ix>=64 || iy<0 || iy>=32 || iz<0 || iz>=64) return;
      if (state.world[ix][iy][iz] === 0) return;
      state.world[ix][iy][iz] = 0;
      delete state.voxels[\`\${x},\${y},\${z}\`];
    },
    tick: (state) => {
      const dt = 0.016;
      
      const isSolid = (x, y, z) => {
        const ix = Math.floor(x) + 32;
        const iy = Math.floor(y);
        const iz = Math.floor(z) + 32;
        if (ix<0 || ix>=64 || iy<0 || iy>=32 || iz<0 || iz>=64) return false;
        return state.world[ix][iy][iz] !== 0;
      };

      Object.values(state.players).forEach(p => {
        if (p.health <= 0) return;

        p.velocity[1] -= 30 * dt; 
        
        let nextPos = [...p.position];
        // Apply Y first
        nextPos[1] += p.velocity[1] * dt;

        // Y Collision
        const width = 0.3;
        if (isSolid(nextPos[0], nextPos[1]-0.9, nextPos[2]) && p.velocity[1] < 0) {
           nextPos[1] = Math.floor(nextPos[1]-0.9) + 1 + 0.901;
           p.velocity[1] = 0;
           p.onGround = true;
        } else {
           p.onGround = false;
        }

        // --- X MOVEMENT & SHIFT LOGIC ---
        const originalX = nextPos[0];
        nextPos[0] += p.velocity[0] * dt;

        // 1. Wall collision X
        if (isSolid(nextPos[0] + width, nextPos[1], nextPos[2]) || isSolid(nextPos[0] - width, nextPos[1], nextPos[2])) {
           nextPos[0] = originalX;
        }
        // 2. Shift Edge Check X
        // If we are on ground, holding shift, and the block BENEATH our new X pos is air... don't move.
        if (p.isShiftPressed && p.onGround) {
           // Check slightly below feet at new X
           if (!isSolid(nextPos[0], nextPos[1] - 1.5, nextPos[2])) {
              nextPos[0] = originalX; // Cancel X move
           }
        }

        // --- Z MOVEMENT & SHIFT LOGIC ---
        const originalZ = nextPos[2];
        nextPos[2] += p.velocity[2] * dt;

        // 1. Wall collision Z
        if (isSolid(nextPos[0], nextPos[1], nextPos[2] + width) || isSolid(nextPos[0], nextPos[1], nextPos[2] - width)) {
           nextPos[2] = originalZ;
        }
        // 2. Shift Edge Check Z
        if (p.isShiftPressed && p.onGround) {
           if (!isSolid(nextPos[0], nextPos[1] - 1.5, nextPos[2])) {
              nextPos[2] = originalZ; // Cancel Z move
           }
        }

        // Void check
        if (nextPos[1] < -10) {
           p.health = 100;
           p.position = [0, 10, 0];
           p.velocity = [0, 0, 0];
        } else {
           p.position = nextPos;
        }
      });

      // Bullet Physics
      state.bullets = state.bullets.filter(b => {
        if (Date.now() - b.createdAt > 2000) return false;
        const speed = 50 * dt;
        let hit = false;
        b.position[0] += b.direction[0] * speed;
        b.position[1] += b.direction[1] * speed;
        b.position[2] += b.direction[2] * speed;
        if (isSolid(b.position[0], b.position[1], b.position[2])) return false;
        Object.entries(state.players).forEach(([pid, p]) => {
           if (pid === b.owner || p.health <= 0) return;
           const dist = Math.sqrt(
             (p.position[0]-b.position[0])**2 + 
             (p.position[1]-b.position[1])**2 + 
             (p.position[2]-b.position[2])**2
           );
           if (dist < 1.0) {
             p.health -= 20;
             if (p.health <= 0) {
                p.position = [0, -50, 0];
                const shooter = state.players[b.owner];
                if (shooter) shooter.score += 100;
             }
             hit = true;
           }
        });
        return !hit;
      });
    }
  }
};
`
};
