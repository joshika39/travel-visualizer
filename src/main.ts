import * as THREE from "three";
import {addMarker, createGlobeArcCurveAccurate} from "@/utils/3d";
import {camera, controls, Globe, renderer, scene} from "@/objects";
import countriesRaw from "@/assets/countries.json";
import {GeoData} from "@/types";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";

const countries: GeoData = countriesRaw as unknown as GeoData;

const START = {lat: 47.473930228244406, lng: 19.07326116987136, name: "Budapest", country: "Hungary"};
const DEST = {lat: 55.618265392816504, lng: 12.648949173439565, name: "Copenhagen", country: "Denmark"};

const arcAltitude = 0.02;

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const targets = [
  START.country,
  DEST.country,
]

if (countries && countries.features) {
  const filteredFeatures = countries.features.filter((f) =>
    targets.includes(f.properties.ADMIN),
  );

  Globe.polygonsData(filteredFeatures)
    .polygonCapColor(() => "rgba(133,200,0,0.44)")
    .polygonStrokeColor(() => "#111")
    .polygonAltitude(() => 0.001);
}

const arcCurve = createGlobeArcCurveAccurate(
  START.lat,
  START.lng,
  DEST.lat,
  DEST.lng,
  Globe.getGlobeRadius(),
  arcAltitude
);

const loader = new GLTFLoader();

let planeModel: THREE.Object3D | null = null;

loader.load('/assets/plane.glb', (gltf) => {
  planeModel = gltf.scene;
  planeModel.scale.set(3, 3, 3);
  scene.add(planeModel);
});

let arcProgress = 0;
const arcSpeed = 0.0012;

let t = 0; // between 0 and 1
const speed = 0.001; // adjust as needed (how fast it moves)

function updatePlane() {
  arcProgress = (arcProgress + arcSpeed) % 1;

  const position = arcCurve.getPoint(arcProgress);
  const tangent = arcCurve.getTangent(arcProgress);
  const normal = position.clone().normalize();
  const binormal = new THREE.Vector3()
    .crossVectors(tangent, normal)
    .normalize();
  const correctedTangent = new THREE.Vector3()
    .crossVectors(normal, binormal)
    .normalize();

  const mat4 = new THREE.Matrix4();
  mat4.makeBasis(binormal, normal, correctedTangent);

  if (planeModel) {
    // Move plane along curve
    const position = arcCurve.getPointAt(t);
    const tangent = arcCurve.getTangentAt(t);

    planeModel.position.copy(position);
    planeModel.lookAt(position.clone().add(tangent));

    t += speed;
    if (t > 1) t = 0; // loop or stop
  }
}

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const clock = new THREE.Clock();

const keys = new Set<string>();

document.addEventListener("keydown", (e) => keys.add(e.code));
document.addEventListener("keyup", (e) => keys.delete(e.code));

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const rollSpeed = Math.PI / 4;

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

  renderer.render(scene, camera);
  updatePlane();
}

addMarker(START.lat, START.lng);
addMarker(DEST.lat, DEST.lng);

animate();
