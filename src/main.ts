import * as THREE from "three";
import {addMarker, createGlobeArcCurveAccurate} from "@/utils/3d";
import {camera, Clouds, controls, flyControls, Globe, move, renderer, scene, tbControls} from "@/objects";
import countriesRaw from "@/assets/countries.json";
import {GeoData} from "@/types";

const countries: GeoData = countriesRaw as unknown as GeoData;

export const CLOUDS_ROTATION_SPEED = -0.006;
const START = {lat: 47.473930228244406, lng: 19.07326116987136, name: "Budapest", country: "Hungary"};
const DEST = {lat: 55.618265392816504, lng: 12.648949173439565, name: "Copenhagen", country: "Denmark"};

const arcAltitude = 0.01;


(function rotateClouds() {
  Clouds.rotation.y += (CLOUDS_ROTATION_SPEED * Math.PI) / 180;
  requestAnimationFrame(rotateClouds);
})();

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
    .polygonSideColor(() => "rgba(0,200,0,0.06)")
    .polygonStrokeColor(() => "#111");
}

const arcCurve = createGlobeArcCurveAccurate(
  START.lat,
  START.lng,
  DEST.lat,
  DEST.lng,
  Globe.getGlobeRadius(),
  arcAltitude
);

const planeGeometry = new THREE.ConeGeometry(1, 2, 3);
const planeMaterial = new THREE.MeshPhongMaterial({color: 0xffffff});
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
planeMesh.rotateX(Math.PI / 2);
scene.add(planeMesh);

let arcProgress = 0;
const arcSpeed = 0.0012;
const planeDummy = new THREE.Object3D();

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
  planeDummy.quaternion.setFromRotationMatrix(mat4);
  planeDummy.position.copy(position);

  planeMesh.position.copy(position);
  planeMesh.quaternion.copy(planeDummy.quaternion);
}

Globe.arcsData([
  {
    startLat: START.lat,
    startLng: START.lng,
    endLat: DEST.lat,
    endLng: DEST.lng,
  },
])
  .arcColor(() => "#ff9900")
  .arcAltitude(arcAltitude)
  .arcStroke(0.2);

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

addMarker(START.lat, START.lng, START.name);
addMarker(DEST.lat, DEST.lng, DEST.name);

animate();
