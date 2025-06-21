import ThreeGlobe from "three-globe";
import * as THREE from "three";
import {TrackballControls} from "three/examples/jsm/controls/TrackballControls";

const globe = {
  dev: '//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg',
  prod: '/assets/world-21600x10800.jpg',
}

const bump = {
  dev: '//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png',
  prod: '/assets/topology-21600x10800.png',
}

const clouds = "/assets/clouds.png";

export const Globe = new ThreeGlobe();

export const Clouds = new THREE.Mesh(
  new THREE.SphereGeometry(Globe.getGlobeRadius() * (1 + 0.004), 75, 75)
);

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

Globe.add(Clouds);

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

export const tbControls = new TrackballControls(camera, renderer.domElement);
tbControls.minDistance = 101;
tbControls.rotateSpeed = 5;
tbControls.zoomSpeed = 0.8;
