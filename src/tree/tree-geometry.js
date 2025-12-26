import * as THREE from 'three';
import { auroraVertexShader, auroraFragmentShader } from '../shaders/aurora-shader.js';
import { holographicVertexShader, holographicFragmentShader } from '../shaders/holographic-shader.js';
import { glowVertexShader, glowFragmentShader } from '../shaders/glow-shader.js';

/**
 * Creates the main Christmas tree group with spiral geometry
 */
export function createChristmasTree() {
  const treeGroup = new THREE.Group();

  // Create trunk with aurora shader
  const trunk = createTrunk();
  treeGroup.add(trunk);

  // Create branch layers
  const branches = createBranchLayers();
  treeGroup.add(branches);

  // Create star topper
  const star = createStarTopper();
  treeGroup.add(star);

  // Create ornaments
  const ornaments = createOrnaments();
  treeGroup.add(ornaments);

  // Create lights
  const lights = createTreeLights();
  treeGroup.add(lights);

  return treeGroup;
}

/**
 * Creates the spiral cone trunk with aurora effect
 */
function createTrunk() {
  const trunkGroup = new THREE.Group();

  // Main cone body
  const coneGeometry = new THREE.ConeGeometry(1.8, 5, 64, 32, true);

  const auroraMaterial = new THREE.ShaderMaterial({
    vertexShader: auroraVertexShader,
    fragmentShader: auroraFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color(0x00ff88) }, // Aurora green
      uColorB: { value: new THREE.Color(0xff00ff) }, // Aurora magenta
    },
    transparent: true,
    side: THREE.DoubleSide,
  });

  const cone = new THREE.Mesh(coneGeometry, auroraMaterial);
  cone.position.y = 2.5;
  cone.name = 'treeTrunk';
  trunkGroup.add(cone);

  // Inner glow cone (slightly smaller)
  const innerGlowGeometry = new THREE.ConeGeometry(1.6, 4.8, 32, 16, true);
  const innerGlowMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide,
  });
  const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
  innerGlow.position.y = 2.5;
  trunkGroup.add(innerGlow);

  return trunkGroup;
}

/**
 * Creates spiral branch layers around the tree
 */
function createBranchLayers() {
  const branchGroup = new THREE.Group();
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // 137.5 degrees

  const layerCount = 7;
  const branchesPerLayer = 8;

  for (let layer = 0; layer < layerCount; layer++) {
    const layerHeight = 0.8 + layer * 0.7;
    const layerRadius = 1.6 - layer * 0.18;
    const layerRotation = layer * goldenAngle;

    for (let i = 0; i < branchesPerLayer; i++) {
      const angle = layerRotation + (i / branchesPerLayer) * Math.PI * 2;
      const branchLength = layerRadius * (0.6 + Math.random() * 0.3);

      // Create branch segment
      const branchGeometry = new THREE.CylinderGeometry(0.02, 0.05, branchLength, 8);
      const branchMaterial = new THREE.MeshStandardMaterial({
        color: 0x00cc66,
        emissive: 0x004422,
        emissiveIntensity: 0.3,
        metalness: 0.2,
        roughness: 0.7,
      });

      const branch = new THREE.Mesh(branchGeometry, branchMaterial);

      // Position and rotate branch outward
      branch.position.set(
        Math.cos(angle) * layerRadius * 0.5,
        layerHeight,
        Math.sin(angle) * layerRadius * 0.5
      );
      branch.rotation.z = -Math.PI / 4 - Math.random() * 0.3;
      branch.rotation.y = angle;

      branchGroup.add(branch);

      // Add foliage at branch tips
      const foliageGeometry = new THREE.IcosahedronGeometry(0.15 + Math.random() * 0.1, 0);
      const foliageMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        emissive: 0x00aa44,
        emissiveIntensity: 0.2,
        metalness: 0.1,
        roughness: 0.8,
      });
      const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
      foliage.position.set(
        Math.cos(angle) * layerRadius,
        layerHeight + 0.1,
        Math.sin(angle) * layerRadius
      );
      foliage.rotation.set(Math.random(), Math.random(), Math.random());
      branchGroup.add(foliage);
    }
  }

  return branchGroup;
}

/**
 * Creates glowing star topper
 */
function createStarTopper() {
  const starGroup = new THREE.Group();

  // Main star geometry
  const starGeometry = new THREE.IcosahedronGeometry(0.25, 1);
  const starMaterial = new THREE.ShaderMaterial({
    vertexShader: glowVertexShader,
    fragmentShader: glowFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0xffff00) },
      uPulseSpeed: { value: 2.0 },
      uPulseIntensity: { value: 0.4 },
    },
    transparent: true,
  });

  const star = new THREE.Mesh(starGeometry, starMaterial);
  star.position.y = 5.2;
  star.name = 'starTopper';
  starGroup.add(star);

  // Outer glow halo
  const haloGeometry = new THREE.SphereGeometry(0.4, 16, 16);
  const haloMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff88,
    transparent: true,
    opacity: 0.2,
  });
  const halo = new THREE.Mesh(haloGeometry, haloMaterial);
  halo.position.y = 5.2;
  starGroup.add(halo);

  // Add point light at star
  const starLight = new THREE.PointLight(0xffff00, 2, 5);
  starLight.position.y = 5.2;
  starGroup.add(starLight);

  return starGroup;
}

/**
 * Creates holographic ornaments placed along the tree
 */
function createOrnaments() {
  const ornamentGroup = new THREE.Group();
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  const ornamentCount = 25;
  const ornamentGeometries = [
    new THREE.SphereGeometry(0.12, 16, 16),
    new THREE.OctahedronGeometry(0.1),
    new THREE.IcosahedronGeometry(0.1, 0),
  ];

  const holoMaterial = new THREE.ShaderMaterial({
    vertexShader: holographicVertexShader,
    fragmentShader: holographicFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 1.0 },
    },
    transparent: true,
    side: THREE.DoubleSide,
  });

  for (let i = 0; i < ornamentCount; i++) {
    // Fibonacci spiral placement
    const t = i / ornamentCount;
    const angle = i * goldenAngle;
    const radius = 0.5 + t * 1.3;
    const height = 0.8 + t * 4.2;

    const geomIndex = Math.floor(Math.random() * ornamentGeometries.length);
    const geometry = ornamentGeometries[geomIndex].clone();

    const ornament = new THREE.Mesh(geometry, holoMaterial.clone());
    ornament.position.set(
      Math.cos(angle) * radius,
      height,
      Math.sin(angle) * radius
    );
    ornament.name = `ornament_${i}`;
    ornament.userData.isOrnament = true;
    ornament.userData.originalScale = 1.0;

    ornamentGroup.add(ornament);
  }

  return ornamentGroup;
}

/**
 * Creates twinkling light points around the tree
 */
function createTreeLights() {
  const lightGroup = new THREE.Group();
  const lightCount = 50;
  const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];

  for (let i = 0; i < lightCount; i++) {
    const t = i / lightCount;
    const angle = i * 0.5;
    const radius = 0.4 + t * 1.4;
    const height = 0.5 + t * 4.5;

    // Light sphere
    const lightGeometry = new THREE.SphereGeometry(0.03, 8, 8);
    const color = colors[Math.floor(Math.random() * colors.length)];
    const lightMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.9,
    });

    const light = new THREE.Mesh(lightGeometry, lightMaterial);
    light.position.set(
      Math.cos(angle) * radius,
      height,
      Math.sin(angle) * radius
    );
    light.userData.baseOpacity = 0.9;
    light.userData.twinklePhase = Math.random() * Math.PI * 2;
    light.name = `light_${i}`;

    lightGroup.add(light);
  }

  return lightGroup;
}

/**
 * Update tree animations
 */
export function updateTree(treeGroup, time) {
  treeGroup.traverse((child) => {
    if (child.material && child.material.uniforms) {
      // Update shader time uniform
      if (child.material.uniforms.uTime) {
        child.material.uniforms.uTime.value = time;
      }
    }

    // Twinkle lights
    if (child.name && child.name.startsWith('light_')) {
      const phase = child.userData.twinklePhase || 0;
      const twinkle = Math.sin(time * 3 + phase) * 0.4 + 0.6;
      child.material.opacity = child.userData.baseOpacity * twinkle;
    }
  });

  // Gentle tree sway
  treeGroup.rotation.y = Math.sin(time * 0.2) * 0.02;
}
