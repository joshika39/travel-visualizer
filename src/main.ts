import * as THREE from "three";
import ThreeGlobe from "three-globe";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";

const Globe = new ThreeGlobe()
  .globeImageUrl(
    "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg",
  )
  .bumpImageUrl(
    "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png",
  );

const CLOUDS_IMG_URL = "./clouds.png"; // You should place this in the same folder
const CLOUDS_ALT = 0.004;
const CLOUDS_ROTATION_SPEED = -0.006; // deg/frame

const Clouds = new THREE.Mesh(
  new THREE.SphereGeometry(Globe.getGlobeRadius() * (1 + CLOUDS_ALT), 75, 75),
);

new THREE.TextureLoader().load(CLOUDS_IMG_URL, (cloudsTexture) => {
  Clouds.material = new THREE.MeshPhongMaterial({
    map: cloudsTexture,
    transparent: true,
  });
});

Globe.add(Clouds);

(function rotateClouds() {
  Clouds.rotation.y += (CLOUDS_ROTATION_SPEED * Math.PI) / 180;
  requestAnimationFrame(rotateClouds);
})();

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById("globeViz").appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.add(Globe);
scene.add(new THREE.AmbientLight(0xcccccc, Math.PI));
scene.add(new THREE.DirectionalLight(0xffffff, 0.6 * Math.PI));

const camera = new THREE.PerspectiveCamera();
camera.aspect = window.innerWidth / window.innerHeight;
camera.updateProjectionMatrix();
camera.position.z = 500;

const tbControls = new TrackballControls(camera, renderer.domElement);
tbControls.minDistance = 101;
tbControls.rotateSpeed = 5;
tbControls.zoomSpeed = 0.8;

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

fetch("./ne_110m_admin_0_countries.geojson")
  .then((res) => res.json())
  .then((countries) => {
    const filteredFeatures = countries.features.filter((f) =>
      ["Hungary", "Japan"].includes(f.properties.ADMIN),
    );

    Globe.polygonsData(filteredFeatures)
      .polygonCapColor(() => "rgba(200, 0, 0, 0.7)")
      .polygonSideColor(() => "rgba(0, 200, 0, 0.1)")
      .polygonStrokeColor(() => "#111");
  });

function createGlobeArcCurve(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  globeRadius: number,
  altitudeRatio = 0.2, // should match Globe.arcAltitude()
): THREE.QuadraticBezierCurve3 {
  const start = latLngToVector3(startLat, startLng, globeRadius);
  const end = latLngToVector3(endLat, endLng, globeRadius);

  // Midpoint in lat/lng
  const midLat = (startLat + endLat) / 2;
  const midLng = (startLng + endLng) / 2;

  // Project midpoint with lifted radius
  const mid = latLngToVector3(
    midLat,
    midLng,
    globeRadius * (1 + altitudeRatio),
  );

  return new THREE.QuadraticBezierCurve3(start, mid, end);
}

function latLngToVector3(
  lat: number,
  lng: number,
  radius: number,
): THREE.Vector3 {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (-lng * Math.PI) / 180;

  const x = -radius * Math.cos(latRad) * Math.sin(lngRad);
  const y = radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.cos(lngRad);

  return new THREE.Vector3(x, y, z);
}

const BUD = { lat: 47.473930228244406, lng: 19.07326116987136 };
const NGO = { lat: 35.22022293239852, lng: 136.86926614053183 };

const arcAltitude = 0.2;
const arcCurve = createGlobeArcCurve(
  BUD.lat,
  BUD.lng,
  NGO.lat,
  NGO.lng,
  Globe.getGlobeRadius(),
  arcAltitude,
);
// Create plane mesh
const planeGeometry = new THREE.ConeGeometry(2, 6, 8);
const planeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
planeMesh.rotateX(Math.PI / 2); // face forward
scene.add(planeMesh);

// Plane animation
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
    startLat: BUD.lat,
    startLng: BUD.lng,
    endLat: NGO.lat,
    endLng: NGO.lng,
  },
])
  .arcColor(() => "#ff9900")
  .arcAltitude(arcAltitude)
  .arcStroke(0.5);

function addMarker(lat: number, lng: number, label: string) {
  const pos = latLngToVector3(lat, lng, Globe.getGlobeRadius() * 1.01);

  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff0000 }),
  );
  marker.position.copy(pos);
  scene.add(marker);

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  context.font = "24px Arial";
  context.fillStyle = "white";
  context.fillText(label, 0, 24);
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
  sprite.scale.set(20, 10, 1);
  sprite.position.copy(
    pos
      .clone()
      .normalize()
      .multiplyScalar(Globe.getGlobeRadius() * 1.05),
  );
  scene.add(sprite);
}

addMarker(0, 0, "Gulf of Guinea"); // Should appear off West Africa
addMarker(35.6895, 139.6917, "Tokyo"); // Japan
addMarker(47.4979, 19.0402, "Budapest"); // Hungary

function animate() {
  tbControls.update();
  renderer.render(scene, camera);
  updatePlane();
  requestAnimationFrame(animate);
}

animate();
