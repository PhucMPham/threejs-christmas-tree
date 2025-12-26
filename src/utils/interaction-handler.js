import * as THREE from 'three';
import { createSparkleBurst } from '../particles/particle-system.js';

/**
 * Handles interactive elements: raycasting, hover effects, click responses
 */
export class InteractionHandler {
  constructor(camera, scene, domElement) {
    this.camera = camera;
    this.scene = scene;
    this.domElement = domElement;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredObject = null;
    this.interactiveObjects = [];
    this.sparkleBursts = [];

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.domElement.addEventListener('click', (e) => this.onClick(e));
    this.domElement.addEventListener('touchstart', (e) => this.onTouchStart(e));
  }

  /**
   * Register objects for interaction
   */
  registerInteractiveObjects(objects) {
    this.interactiveObjects = objects;
  }

  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  onTouchStart(event) {
    if (event.touches.length > 0) {
      this.mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
      this.checkClick();
    }
  }

  onClick() {
    this.checkClick();
  }

  checkClick() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

    if (intersects.length > 0) {
      const clicked = intersects[0].object;
      if (clicked.userData.isOrnament) {
        this.triggerSparkleBurst(clicked.position.clone());
        this.pulseOrnament(clicked);
      }

      if (clicked.name === 'starTopper') {
        this.triggerStarEffect();
      }
    }
  }

  /**
   * Update hover effects each frame
   */
  update() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

    // Reset previous hover
    if (this.hoveredObject && this.hoveredObject !== intersects[0]?.object) {
      this.resetHover(this.hoveredObject);
      this.hoveredObject = null;
    }

    // Apply new hover
    if (intersects.length > 0) {
      const hovered = intersects[0].object;
      if (hovered.userData.isOrnament || hovered.name === 'starTopper') {
        this.applyHover(hovered);
        this.hoveredObject = hovered;
        this.domElement.style.cursor = 'pointer';
      }
    } else {
      this.domElement.style.cursor = 'default';
    }

    // Update sparkle bursts
    this.updateSparkleBursts();
  }

  applyHover(object) {
    if (!object.userData.isHovered) {
      object.userData.isHovered = true;
      object.userData.originalScale = object.userData.originalScale || object.scale.x;

      // Scale up animation
      const targetScale = object.userData.originalScale * 1.4;
      this.animateScale(object, targetScale);

      // Boost intensity if shader material
      if (object.material.uniforms && object.material.uniforms.uIntensity) {
        object.material.uniforms.uIntensity.value = 1.5;
      }
    }
  }

  resetHover(object) {
    if (object.userData.isHovered) {
      object.userData.isHovered = false;

      // Scale down animation
      const targetScale = object.userData.originalScale || 1;
      this.animateScale(object, targetScale);

      // Reset intensity
      if (object.material.uniforms && object.material.uniforms.uIntensity) {
        object.material.uniforms.uIntensity.value = 1.0;
      }
    }
  }

  animateScale(object, targetScale) {
    const startScale = object.scale.x;
    const duration = 200;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentScale = startScale + (targetScale - startScale) * eased;

      object.scale.setScalar(currentScale);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  triggerSparkleBurst(position) {
    const burst = createSparkleBurst(position);
    this.scene.add(burst);
    this.sparkleBursts.push(burst);
  }

  pulseOrnament(ornament) {
    const originalEmissive = ornament.material.emissive?.clone();

    if (ornament.material.uniforms) {
      // Shader material - pulse intensity
      const startIntensity = ornament.material.uniforms.uIntensity.value;
      ornament.material.uniforms.uIntensity.value = 2.5;

      setTimeout(() => {
        ornament.material.uniforms.uIntensity.value = startIntensity;
      }, 300);
    }
  }

  triggerStarEffect() {
    // Find star and trigger special effect
    const star = this.scene.getObjectByName('starTopper');
    if (star && star.material.uniforms) {
      // Temporary boost
      star.material.uniforms.uPulseIntensity.value = 1.0;
      star.material.uniforms.uPulseSpeed.value = 8.0;

      // Create multiple bursts
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const offset = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5
          );
          this.triggerSparkleBurst(star.position.clone().add(offset));
        }, i * 100);
      }

      // Reset after effect
      setTimeout(() => {
        star.material.uniforms.uPulseIntensity.value = 0.4;
        star.material.uniforms.uPulseSpeed.value = 2.0;
      }, 1000);
    }
  }

  updateSparkleBursts() {
    const now = performance.now();

    this.sparkleBursts = this.sparkleBursts.filter((burst) => {
      const elapsed = now - burst.userData.startTime;

      if (elapsed > burst.userData.duration) {
        // Remove expired burst
        this.scene.remove(burst);
        burst.geometry.dispose();
        burst.material.dispose();
        return false;
      }

      // Update lifetime for fading
      const progress = elapsed / burst.userData.duration;
      const lifetimes = burst.geometry.attributes.lifetime.array;
      for (let i = 0; i < lifetimes.length; i++) {
        lifetimes[i] = 1 - progress;
      }
      burst.geometry.attributes.lifetime.needsUpdate = true;

      // Update shader time
      burst.material.uniforms.uTime.value = elapsed / 1000;

      return true;
    });
  }

  dispose() {
    this.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('click', this.onClick);
    this.domElement.removeEventListener('touchstart', this.onTouchStart);

    // Clean up sparkle bursts
    this.sparkleBursts.forEach((burst) => {
      this.scene.remove(burst);
      burst.geometry.dispose();
      burst.material.dispose();
    });
  }
}
