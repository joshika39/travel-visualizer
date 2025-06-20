import * as THREE from "three";
import {Globe, scene} from "@/objects";

export function latLngToVector3(
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

export function createGlobeArcCurve(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  globeRadius: number,
  altitudeRatio = 0.2,
): THREE.QuadraticBezierCurve3 {
  const start = latLngToVector3(startLat, startLng, globeRadius);
  const end = latLngToVector3(endLat, endLng, globeRadius);
  const midLat = (startLat + endLat) / 2;
  const midLng = (startLng + endLng) / 2;
  const mid = latLngToVector3(
    midLat,
    midLng,
    globeRadius * (1 + altitudeRatio),
  );

  return new THREE.QuadraticBezierCurve3(start, mid, end);
}

export function createGlobeArcCurveAccurate(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  globeRadius: number,
  altitudeRatio = 0.2,
  steps = 128
): THREE.Curve<THREE.Vector3> {
  const start = latLngToVector3(startLat, startLng, 1).normalize();
  const end = latLngToVector3(endLat, endLng, 1).normalize();

  const points: THREE.Vector3[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;

    // Spherical linear interpolation
    const interpolated = new THREE.Vector3().copy(start).lerp(end, t).normalize();

    // Great arc altitude bump (sine shaped)
    const altitude = Math.sin(Math.PI * t) * altitudeRatio;

    // Final position = direction * (radius + altitude bump)
    const final = interpolated.multiplyScalar(globeRadius * (1 + altitude));
    points.push(final);
  }

  return new THREE.CatmullRomCurve3(points);
}

export function addMarker(lat: number, lng: number, label: string) {
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
