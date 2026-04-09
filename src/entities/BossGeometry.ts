// BossGeometry.ts: Boss Three.js mesh and material setup — geometry only, no logic

import * as THREE from 'three';

export interface BossRenderObjects {
  group: THREE.Group;
  faceMesh: THREE.Mesh;
  glowMesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  glowMat: THREE.MeshBasicMaterial;
  texture: THREE.Texture;
  dispose(scene: THREE.Scene): void;
}

export function createBossGeometry(scene: THREE.Scene): BossRenderObjects {
  const texture = new THREE.TextureLoader().load(
    '/assets/tony_boss.png',
    undefined,
    undefined,
    (err) => console.error('[BossGeometry] texture load failed:', err),
  );
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const geom = new THREE.PlaneGeometry(3.5, 4.0);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  const faceMesh = new THREE.Mesh(geom, mat);
  faceMesh.renderOrder = 1;

  const glowGeom = new THREE.SphereGeometry(2.2, 10, 10);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xff8800,
    transparent: true,
    opacity: 0.06,
  });
  const glowMesh = new THREE.Mesh(glowGeom, glowMat);
  glowMesh.position.z = -0.5;
  glowMesh.renderOrder = 0;

  const group = new THREE.Group();
  group.add(glowMesh);
  group.add(faceMesh);
  group.position.set(0, 8, 0);
  scene.add(group);

  return {
    group,
    faceMesh,
    glowMesh,
    mat,
    glowMat,
    texture,
    dispose(s) {
      s.remove(group);
      geom.dispose();
      glowGeom.dispose();
      mat.dispose();
      glowMat.dispose();
      texture.dispose();
    },
  };
}
