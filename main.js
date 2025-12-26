import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { createChristmasTree, updateTree } from './src/tree/tree-geometry.js';
import { createParticleSystem, updateParticles } from './src/particles/particle-system.js';
import { InteractionHandler } from './src/utils/interaction-handler.js';
import { createPostProcessing } from './src/utils/post-processing.js';

// WebGL 2 compatibility check
if (!WebGL.isWebGL2Available()) {
  document.body.innerHTML = `
    <div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#0a0e27;color:#fff;font-family:system-ui;text-align:center;">
      <div>
        <h1>WebGL 2 Not Supported</h1>
        <p>Your browser doesn't support WebGL 2. Please update your browser.</p>
      </div>
    </div>
  `;
  throw new Error('WebGL 2 not available');
}

// Scene setup - Cosmic Aurora theme
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0e27);
scene.fog = new THREE.FogExp2(0x0a0e27, 0.03);

// Camera setup - positioned for optimal tree viewing
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 3, 8);
camera.lookAt(0, 2.5, 0);

// Renderer setup with high quality settings
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

// OrbitControls with smooth damping
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 4;
controls.maxDistance = 15;
controls.maxPolarAngle = Math.PI * 0.85;
controls.target.set(0, 2.5, 0);
controls.autoRotate = true;
controls.autoRotateSpeed = 0.3;

// Lighting - Cosmic Aurora atmosphere
const ambientLight = new THREE.AmbientLight(0x1a1a3a, 0.3);
scene.add(ambientLight);

// Hemisphere light for depth (cool top, warm bottom)
const hemiLight = new THREE.HemisphereLight(0x00ff88, 0xff00ff, 0.4);
scene.add(hemiLight);

// Directional light for main illumination
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// Point lights for accent colors
const greenLight = new THREE.PointLight(0x00ff88, 1.5, 10);
greenLight.position.set(-3, 4, 3);
scene.add(greenLight);

const magentaLight = new THREE.PointLight(0xff00ff, 1.2, 8);
magentaLight.position.set(3, 2, -3);
scene.add(magentaLight);

const cyanLight = new THREE.PointLight(0x00ffff, 1.0, 8);
cyanLight.position.set(0, 6, 2);
scene.add(cyanLight);

// Create Christmas tree
const christmasTree = createChristmasTree();
scene.add(christmasTree);

// Create particle systems
const particles = createParticleSystem();
scene.add(particles);

// Create ground reflection plane
const groundGeometry = new THREE.CircleGeometry(6, 64);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x0a0e27,
  metalness: 0.9,
  roughness: 0.3,
  transparent: true,
  opacity: 0.8,
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.01;
scene.add(ground);

// Setup post-processing
const postProcessing = createPostProcessing(renderer, scene, camera);

// Setup interaction handler
const interactionHandler = new InteractionHandler(camera, scene, renderer.domElement);

// Register interactive objects (ornaments and star)
const interactiveObjects = [];
christmasTree.traverse((child) => {
  if (child.userData.isOrnament || child.name === 'starTopper') {
    interactiveObjects.push(child);
  }
});
interactionHandler.registerInteractiveObjects(interactiveObjects);

// Handle window resize
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  postProcessing.resize(width, height);
});

// Clock for animations
const clock = new THREE.Clock();

// Animation loop
let animationId;

function animate() {
  animationId = requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();

  // Update tree animations
  updateTree(christmasTree, elapsedTime);

  // Update particle systems
  updateParticles(particles, elapsedTime);

  // Update interactions
  interactionHandler.update();

  // Animate accent lights
  greenLight.position.x = Math.sin(elapsedTime * 0.5) * 3;
  greenLight.position.z = Math.cos(elapsedTime * 0.5) * 3;
  magentaLight.position.x = Math.sin(elapsedTime * 0.3 + Math.PI) * 3;
  magentaLight.position.z = Math.cos(elapsedTime * 0.3 + Math.PI) * 3;

  // Update controls
  controls.update();

  // Render with post-processing
  postProcessing.composer.render();
}

// Pause animation when tab is hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(animationId);
    clock.stop();
  } else {
    clock.start();
    animate();
  }
});

// Start animation
animate();

// Add loading complete indicator
console.log('✨ Cosmic Aurora Christmas Tree loaded!');
console.log('🎄 Interact with ornaments and the star for special effects');
console.log('🖱️ Use mouse to orbit around the scene');
