import * as THREE from "three";
import {addMarker, createGlobeArcCurveAccurate} from "@/utils/3d";
import {camera, flyControls, Globe, renderer, scene} from "@/objects";
import countriesRaw from "@/assets/countries.json";
import {Airport, GeoData} from "@/types";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {getAirport} from "@/utils/airports";

const countries: GeoData = countriesRaw as unknown as GeoData;
let controlsEnabled = true;

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

const inputForm = document.getElementById("airport-form");
if (inputForm) {
  inputForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const fromCode = (document.getElementById("from-iata") as HTMLInputElement).value.trim();
    const toCode = (document.getElementById("to-iata") as HTMLInputElement).value.trim();

    const from = getAirport(fromCode);
    const to = getAirport(toCode);

    if (!from || !to) {
      const errorMessageElement = document.getElementById("error-message");
      if (errorMessageElement) {
        errorMessageElement.textContent = "Invalid IATA code(s)";
        errorMessageElement.style.display = "block";
      }
      return;
    }

    const errorMessageElement = document.getElementById("error-message");
    if (errorMessageElement) {
      errorMessageElement.textContent = "";
      errorMessageElement.style.display = "none";
    }

    updateFlight(from, to);
  });

  inputForm?.addEventListener("mouseenter", () => controlsEnabled = false);
  inputForm?.addEventListener("mouseleave", () => controlsEnabled = true);

  inputForm.querySelectorAll("input, button").forEach((el) => {
    el.addEventListener("focus", () => controlsEnabled = false);
    el.addEventListener("blur", () => controlsEnabled = true);
  });
}


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

  scene.children.forEach(child => {
    if (child instanceof THREE.Mesh && child.geometry.type === 'SphereGeometry') {
      scene.remove(child);
      child.geometry.dispose();
      if (child.material instanceof THREE.Material) {
        child.material.dispose();
      }
    }
  });

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

  if (controlsEnabled) {
    flyControls.update(clock.getDelta());
  }

  renderer.render(scene, camera);
  updatePlane();
}

animate();
