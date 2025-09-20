import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { createNoise2D } from 'https://cdn.jsdelivr.net/npm/simplex-noise@4.0.1/+esm';
const noise2D = createNoise2D();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("voxel-canvas") });
renderer.setSize(window.innerWidth, window.innerHeight);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);

const size = 15;
const spacing = 1.2;

const voxelBlocks = [];

for (let x = 0; x < size; x++) {
  for (let z = 0; z < size; z++) {
    const nx = x / size - 0.5;
    const nz = z / size - 0.5;
    const height = Math.floor((noise2D(nx * 2, nz * 2) + 1) * 2);

    for (let y = 0; y < height; y++) {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshLambertMaterial({ color: `hsl(${y * 40}, 80%, 50%)` });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set((x - size / 2) * spacing, y, (z - size / 2) * spacing);
      scene.add(cube);
      voxelBlocks.push(cube);
    }
  }
}

camera.position.set(0, 10, 20);
camera.lookAt(0, 0, 0);

// rickroll plane
let rickPlane;
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 1024;
canvas.height = 512;

const texture = new THREE.CanvasTexture(canvas);
const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
rickPlane = new THREE.Mesh(new THREE.PlaneGeometry(30, 15), material);
rickPlane.position.set(0, 5, 0);
rickPlane.visible = false;
scene.add(rickPlane);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let breakBlockStreak = 0;

window.addEventListener('mousedown', (event) => {
  if (event.button !== 0) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(voxelBlocks);

  if (intersects.length > 0) {
    const block = intersects[0].object;

    spawnParticles(block.position.clone(), block.material.color.getHex());
    blockBreakSound();

    scene.remove(block);

    const index = voxelBlocks.indexOf(block);
    if (index !== -1) voxelBlocks.splice(index, 1);

    breakBlockStreak++;
    if (breakBlockStreak >= 3) {
      const text = document.getElementById("npc-text")
      const message = "You should not have done that...";

      if (text.textContent !== message && (text.textContent === "Hahaha! Gotcha!" || text.textContent === "Press the button. I dare you.")) {
        let char = 0;
        let done = false;
        text.textContent = "";

        function type() {
          if (done) return;

          if (char < message.length) {
            text.textContent += message[char++];
            setTimeout(type, 40);
          } else {
            setTimeout(() => {
              char = 0;
              done = true;
              type();
            }, 1000);
          }
        }
        type();
        breakBlockStreak = 0;
      }
    }
  }
  else {
    breakBlockStreak = 0;
  }

});

function blockBreakSound() {
  const sounds = ["assets/breaks/glass_00{0}.ogg", "assets/breaks/select_00{0}.ogg", 6, 8]

  const sfx = new Audio();
  const index = Math.floor(Math.random() * (sounds.length - 2));
  sfx.src = sounds[index].replace("{0}", Math.floor(Math.random() * (index * 2)) + 1);
  sfx.volume = 1;
  sfx.playbackRate = Math.random() * 0.3 + 0.85;
  sfx.play();
}

function spawnParticles(position, color = 0xffffff) {
  const count = 6;
  for (let i = 0; i < count; i++) {
    const size = 0.15;
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshBasicMaterial({ color });
    const particle = new THREE.Mesh(geometry, material);

    // Spawn di posisi blok
    particle.position.copy(position);

    // Random arah dan kecepatan
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      Math.random() * 2,
      (Math.random() - 0.5) * 2
    );

    scene.add(particle);

    // Animasi gerak & hilang
    const startTime = performance.now();

    const animateParticle = () => {
      const now = performance.now();
      const delta = (now - startTime) / 1000;

      // Move
      particle.position.addScaledVector(velocity, 0.03);

      if (delta > 0.8) {
        scene.remove(particle);
        return;
      }

      requestAnimationFrame(animateParticle);
    };

    animateParticle();
  }
}


// 🎞️ animate
let animationPaused = false;

function animate() {
  requestAnimationFrame(animate);

  if (!animationPaused) {
    scene.rotation.y += 0.0025;
  }

  if (rickPlane.visible) {
    rickPlane.lookAt(camera.position);
  }

  renderer.render(scene, camera);
}
animate();

const talkToNpc = () => {
  const box = document.getElementById("npc-box");
  const text = document.getElementById("npc-text");
  const ah_btn = document.getElementById("ah-button");

  const messages = [
    "Hello, traveler...",
    "You’re not supposed to be here.",
    "Did you just generate this world for fun?",
    "Press the button. I dare you."
  ];

  let i = 0;
  let char = 0;
  box.classList.remove("hidden");
  text.textContent = "";

  function type() {
    if (i < messages.length) {
      if (char < messages[i].length) {
        text.textContent += messages[i][char++];
        setTimeout(type, 40);
      } else {
        setTimeout(() => {
          if (i < messages.length - 1) text.textContent = "";
          i++; char = 0;
          // setTimeout(type, 50);
          type();
        }, 1000);
      }
    } else {
      ah_btn.classList.remove("hidden");
    }
  }

  type();
};
talkToNpc();

// Konami
const konami = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]; // ↑ ↑ ↓ ↓ ← → ← → B A
let buffer = [];

window.addEventListener("keydown", (e) => {
  buffer.push(e.keyCode);
  if (buffer.length > 10) buffer.shift();

  if (buffer.toString() === konami.toString()) {
    console.log("🔓 KONAMI UNLOCKED");
    if (typeof rick === "function") rick();

    scene.background = new THREE.Color(Math.random() * 0xffffff);

    scene.traverse(obj => {
      if (obj.isMesh && obj.material && obj.material.color) {
        obj.material.color.setHSL(Math.random(), 1, 0.5);
      }
    });

    buffer = [];
  }
});

// rickroll
window.rick = async () => {
  document.getElementById("npc-text").textContent = "Hahaha! Gotcha!";

  const ah_btn = document.getElementById("ah-button");
  ah_btn.classList.add("hidden");

  const audio = document.getElementById("ah-audio");
  audio.currentTime = 0;
  audio.volume = 1;
  audio.play().catch(e => {
    console.warn("Autoplay failed, waiting for user interaction.");
  });


  animationPaused = true;
  voxelBlocks.forEach(block => block.visible = false); // hide voxel world
  rickPlane.visible = true;

  const url = new URL(window.location.href);

  if (url.pathname.endsWith("index.html")) {
    url.pathname = url.pathname.replace(/index\.html$/, "");
  }

  url.pathname = url.pathname.replace(/\/$/, "") + "/rick.txt";

  const response = await fetch(url.toString(), { method: "GET" });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const txt = await response.text();

  const lines = txt.split("\n");
  const frameHeight = 36;
  const totalFrames = Math.floor(lines.length / frameHeight);

  let frame = 0;

  const interval = setInterval(() => {
    const start = frame * frameHeight;
    const end = start + frameHeight;
    const slice = lines.slice(start, end);

    // CLEAR canvas
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // DRAW frame
    ctx.fillStyle = "lime";
    ctx.font = "12px monospace";
    for (let i = 0; i < slice.length; i++) {
      ctx.fillText(slice[i], 10, 20 + i * 14);
    }

    texture.needsUpdate = true;
    frame++;

    if (frame >= totalFrames) {
      clearInterval(interval);
      rickPlane.visible = false;
      voxelBlocks.forEach(b => b.visible = true);
      animationPaused = false;

      ah_btn.classList.remove("hidden");
      audio.pause();
      audio.currentTime = 0;
    }
  }, 120);
};

function resizeAppHeight() {
  const app = document.getElementById("app");
  app.style.height = window.innerHeight + "px";
}

window.addEventListener("resize", resizeAppHeight);
window.addEventListener("orientationchange", resizeAppHeight);
resizeAppHeight();
