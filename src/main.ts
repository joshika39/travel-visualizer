import * as THREE from "three";
import {addMarker, createGlobeArcCurveAccurate} from "@/utils/3d";
import {camera, flyControls, Globe, renderer, scene} from "@/objects";
import countriesRaw from "@/assets/countries.json";
import {Airport, GeoData} from "@/types";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {getAirport} from "@/utils/airports";

const countries: GeoData = countriesRaw as unknown as GeoData;

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const loader = new GLTFLoader();

let planeModel: THREE.Object3D | null = null;

loader.load('/assets/plane.glb', (gltf) => {
  planeModel = gltf.scene;
  planeModel.scale.set(3, 3, 3);
  scene.add(planeModel);
});

document.getElementById("plot-flight")?.addEventListener("click", () => {
  const fromCode = (document.getElementById("from-iata") as HTMLInputElement).value.trim();
  const toCode = (document.getElementById("to-iata") as HTMLInputElement).value.trim();

  const from = getAirport(fromCode);
  const to = getAirport(toCode);

  if (!from || !to) {
    alert("Invalid IATA code(s)");
    return;
  }

  updateFlight(from, to);
});

let arcCurve: THREE.Curve<THREE.Vector3> | null = null;

let t = 0;
const speed = 0.002;
const arcAltitude = 0.02;

function updateFlight(from: Airport, to: Airport) {
  arcCurve = createGlobeArcCurveAccurate(
    from.lat, from.lng,
    to.lat, to.lng,
    Globe.getGlobeRadius(),
    arcAltitude
  );

  if (countries && countries.features) {
    const targets = [from.country, to.country];
    const filteredFeatures = countries.features.filter((f) =>
      targets.includes(f.properties.ADMIN),
    );

    Globe.polygonsData(filteredFeatures)
      .polygonCapColor(() => "rgba(133,200,0,0.44)")
      .polygonStrokeColor(() => "#111")
      .polygonAltitude(() => 0.001);
  }

  scene.children = scene.children.filter(child => !(child instanceof THREE.Mesh && child.geometry.type === 'SphereGeometry'));

  addMarker(from.lat, from.lng);
  addMarker(to.lat, to.lng);

  t = 0;
}

function updatePlane() {
  if (planeModel && arcCurve) {
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

animate();
