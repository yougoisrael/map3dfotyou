import * as Cesium from 'cesium';

/**
 * Fly camera smoothly to a lon/lat/height position.
 */
export function flyTo(viewer, { longitude, latitude, height = 1_000_000, duration = 2.5, heading = 0, pitch = -90 }) {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
    orientation: {
      heading: Cesium.Math.toRadians(heading),
      pitch: Cesium.Math.toRadians(pitch),
      roll: 0,
    },
    duration,
    easingFunction: Cesium.EasingFunction.SINUSOIDAL_IN_OUT,
  });
}

/**
 * Convert screen pixel position to lon/lat.
 */
export function screenToGeo(viewer, x, y) {
  const scene = viewer.scene;
  const ray = scene.camera.getPickRay(new Cesium.Cartesian2(x, y));
  if (!ray) return null;

  const pos = scene.globe.pick(ray, scene);
  if (!pos) return null;

  const cart = Cesium.Cartographic.fromCartesian(pos);
  return {
    longitude: Cesium.Math.toDegrees(cart.longitude),
    latitude: Cesium.Math.toDegrees(cart.latitude),
    height: cart.height,
  };
}

/**
 * Create a glowing aircraft billboard entity.
 */
export function buildFlightEntity(flight) {
  const canvas = document.createElement('canvas');
  canvas.width = 36;
  canvas.height = 36;
  const ctx = canvas.getContext('2d');

  // Outer glow
  ctx.beginPath();
  ctx.arc(18, 18, 12, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 200, 255, 0.12)';
  ctx.fill();

  // Inner dot
  ctx.beginPath();
  ctx.arc(18, 18, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = flight.simulated ? 'rgba(255, 200, 0, 0.95)' : 'rgba(0, 220, 255, 0.95)';
  ctx.fill();

  // Direction tick
  const rad = Cesium.Math.toRadians(flight.heading - 90);
  ctx.beginPath();
  ctx.moveTo(18, 18);
  ctx.lineTo(18 + Math.cos(rad) * 10, 18 + Math.sin(rad) * 10);
  ctx.strokeStyle = flight.simulated ? 'rgba(255, 200, 0, 0.8)' : 'rgba(0, 220, 255, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  return {
    position: Cesium.Cartesian3.fromDegrees(
      flight.longitude,
      flight.latitude,
      flight.altitude + 500
    ),
    billboard: {
      image: canvas,
      width: 28,
      height: 28,
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      scaleByDistance: new Cesium.NearFarScalar(1_000_000, 1.4, 20_000_000, 0.4),
    },
    properties: new Cesium.PropertyBag(flight),
    id: `flight_${flight.icao24}`,
  };
}

/**
 * Format altitude in ft.
 */
export function metersToFeet(m) {
  return Math.round(m * 3.28084).toLocaleString();
}

/**
 * Format speed in knots.
 */
export function msToKnots(ms) {
  return Math.round(ms * 1.944).toLocaleString();
}

/**
 * Camera altitude in km.
 */
export function cameraAltitudeKm(viewer) {
  const cart = Cesium.Cartographic.fromCartesian(viewer.camera.position);
  return (cart.height / 1000).toFixed(0);
}
