import * as THREE from "three";
import {addMarker, createGlobeArcCurve} from "@/utils/3d";
import {CLOUDS_IMG_URL, CLOUDS_ROTATION_SPEED} from "@/utils/constants";
import {camera, Clouds, Globe, renderer, scene, tbControls} from "@/objects";

new THREE.TextureLoader().load(CLOUDS_IMG_URL, (cloudsTexture) => {
  Clouds.material = new THREE.MeshPhongMaterial({
    map: cloudsTexture,
    transparent: true,
  });
});


(function rotateClouds() {
  Clouds.rotation.y += (CLOUDS_ROTATION_SPEED * Math.PI) / 180;
  requestAnimationFrame(rotateClouds);
})();

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

const planeGeometry = new THREE.ConeGeometry(2, 6, 8);
const planeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
planeMesh.rotateX(Math.PI / 2); // face forward
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
    startLat: BUD.lat,
    startLng: BUD.lng,
    endLat: NGO.lat,
    endLng: NGO.lng,
  },
])
  .arcColor(() => "#ff9900")
  .arcAltitude(arcAltitude)
  .arcStroke(0.5);

addMarker(0, 0, "Gulf of Guinea");
addMarker(35.6895, 139.6917, "Tokyo");
addMarker(47.4979, 19.0402, "Budapest");

function animate() {
  tbControls.update();
  renderer.render(scene, camera);
  updatePlane();
  requestAnimationFrame(animate);
}

animate();
