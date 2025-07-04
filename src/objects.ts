import ThreeGlobe from "three-globe";
import * as THREE from "three";
import {TrackballControls} from "three/examples/jsm/controls/TrackballControls";
import { FlyControls } from "three/examples/jsm/controls/FlyControls";
import {PointerLockControls} from "three/examples/jsm/controls/PointerLockControls";


const globe = {
  dev: '//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg',
  prod: '/assets/world-21600x10800.jpg',
}

const bump = {
  dev: '//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png',
  prod: '/assets/topology-21600x10800.png',
}

const clouds = "/assets/clouds.png";
const CLOUDS_ROTATION_SPEED = -0.006;

export const Globe = new ThreeGlobe();

export const Clouds = new THREE.Mesh(
  new THREE.SphereGeometry(Globe.getGlobeRadius() * (1 + 0.004), 75, 75)
);

export const markers: THREE.Mesh[] = [];

export function rotateClouds() {
  Clouds.rotation.y += (CLOUDS_ROTATION_SPEED * Math.PI) / 180;
  requestAnimationFrame(rotateClouds);
}

function loadTextureAsync(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(url, resolve, undefined, reject);
  });
}

async function init() {
  await Promise.all([
    loadTextureAsync(import.meta.env.DEV ? globe.dev : globe.prod).then(texture =>
      Globe.globeImageUrl(texture.image.src)
    ),
    loadTextureAsync(import.meta.env.DEV ? bump.dev : bump.prod).then(texture =>
      Globe.bumpImageUrl(texture.image.src)
    ),
    loadTextureAsync(clouds).then(texture => {
      Clouds.material = new THREE.MeshPhongMaterial({
        map: texture,
        transparent: true,
      });
    }),
  ]);
}

init().catch(console.error);

document.getElementById("loader")?.remove();

// Uncomment the following line to enable clouds on the globe
//Globe.add(Clouds);

export const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById("globeViz")?.appendChild(renderer.domElement);

export const scene = new THREE.Scene();
scene.add(Globe);
scene.add(new THREE.AmbientLight(0xcccccc, Math.PI));
scene.add(new THREE.DirectionalLight(0xffffff, 0.6 * Math.PI));

export const camera = new THREE.PerspectiveCamera();
camera.aspect = window.innerWidth / window.innerHeight;
camera.updateProjectionMatrix();
camera.position.z = 500;

// NOTE: Currently unused, but can be used for trackball controls
export const tbControls = new TrackballControls(camera, renderer.domElement);
tbControls.minDistance = 101;
tbControls.rotateSpeed = 5;
tbControls.zoomSpeed = 0.8;

export const flyControls = new FlyControls(camera, renderer.domElement);
flyControls.movementSpeed = 100;
flyControls.rollSpeed = Math.PI / 24;
flyControls.autoForward = false;
flyControls.dragToLook = true;

// NOTE: Currently unused, but can be used for free-flying camera controls
export const controls = new PointerLockControls(camera, renderer.domElement);

const rollSpeed = Math.PI / 4;

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

const keys = new Set<string>();

document.addEventListener("keydown", (e) => keys.add(e.code));
document.addEventListener("keyup", (e) => keys.delete(e.code));

export const handlePointerControl = (delta: number) => {
  if (controls.isLocked) {
    if (keys.has("ShiftLeft") || keys.has("ShiftRight")) {
      if (keys.has("KeyQ")) {
        camera.rotateZ(rollSpeed * delta);
      }
      if (keys.has("KeyE")) {
        camera.rotateZ(-rollSpeed * delta);
      }
    }

    direction.set(
      Number(keys.has("KeyD")) - Number(keys.has("KeyA")),
      Number(keys.has("KeyE") && !keys.has("ShiftLeft") && !keys.has("ShiftRight")) -
      Number(keys.has("KeyQ") && !keys.has("ShiftLeft") && !keys.has("ShiftRight")),
      Number(keys.has("KeyS")) - Number(keys.has("KeyW"))
    ).normalize();

    velocity.copy(direction).multiplyScalar(200 * delta);
    controls.moveRight(velocity.x);
    controls.moveForward(velocity.z);
    controls.object.position.y += velocity.y;
  }
}
