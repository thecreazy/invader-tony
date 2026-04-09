// StarfieldBackground.ts: Adds the procedural starfield shader mesh to the game scene

import * as THREE from 'three';
import starfieldVert from '../game/shaders/starfield/starfield.vert';
import starfieldFrag from '../game/shaders/starfield/starfield.frag';

export interface IStarfieldBackground {
  update(delta: number): void;
  dispose(scene: THREE.Scene): void;
}

export function createStarfieldBackground(scene: THREE.Scene): IStarfieldBackground {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: starfieldVert,
    fragmentShader: starfieldFrag,
    depthWrite: false,
  });
  const geom = new THREE.PlaneGeometry(50, 30);
  const mesh = new THREE.Mesh(geom, material);
  mesh.position.z = -5;
  mesh.renderOrder = -1;
  scene.add(mesh);

  return {
    update(delta) {
      material.uniforms['uTime'].value += delta;
    },
    dispose(s) {
      s.remove(mesh);
      geom.dispose();
      material.dispose();
    },
  };
}
