import * as THREE from "three";
import {addMarker, createGlobeArcCurveAccurate} from "@/utils/3d";
import {camera, controls, flyControls, Globe, handlePointerControl, renderer, scene, tbControls} from "@/objects";
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


let t = 0;
const speed = 0.001;

function updatePlane() {
  if (planeModel) {
    const position = arcCurve.getPointAt(t);
    const tangent = arcCurve.getTangentAt(t);

    planeModel.position.copy(position);
    planeModel.lookAt(position.clone().add(tangent));

    t += speed;
    if (t > 1) t = 0;
  }
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  flyControls.update(clock.getDelta());
  renderer.render(scene, camera);
  updatePlane();
}

addMarker(START.lat, START.lng);
addMarker(DEST.lat, DEST.lng);

animate();
