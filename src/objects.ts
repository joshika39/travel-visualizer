import ThreeGlobe from "three-globe";
import * as THREE from "three";
import {CLOUDS_ALT} from "@/utils/constants";
import {TrackballControls} from "three/examples/jsm/controls/TrackballControls";

export const Globe = new ThreeGlobe()
  .globeImageUrl(
    "./world.200412.3x21600x10800.jpg",
  )
  .bumpImageUrl(
    "./gebco_08_rev_elev_21600x10800.png",
  );

export const Clouds = new THREE.Mesh(
  new THREE.SphereGeometry(Globe.getGlobeRadius() * (1 + CLOUDS_ALT), 75, 75),
);

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
