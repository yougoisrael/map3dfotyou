import React, { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as Cesium from 'cesium';
import {
  CESIUM_ION_TOKEN,
  OPENWEATHER_API_KEY,
  HOME_CAMERA,
  WEATHER_OPACITY,
  CINEMATIC_SPEED,
} from '../config.js';
import { buildFlightEntity, cameraAltitudeKm } from '../utils/cesiumHelpers.js';

// ── Tell Cesium where its static assets live ──────────────────────
window.CESIUM_BASE_URL = '/';

const WEATHER_LAYERS = {
  clouds: {
    urlFn: (key) =>
      key
        ? `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${key}`
        : null,
  },
  wind: {
    urlFn: (key) =>
      key
        ? `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${key}`
        : null,
  },
  temp: {
    urlFn: (key) =>
      key
        ? `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${key}`
        : null,
  },
};

const Globe = forwardRef(function Globe(
  { flights, layers, onCameraChange, onEntityClick, cinematicMode },
  ref
) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const cinematicRef = useRef(null);
  const flightDsRef = useRef(null);
  const weatherLayerRefs = useRef({});
  const labelDsRef = useRef(null);
  const initRef = useRef(false);

  useImperativeHandle(ref, () => ({
    flyTo({ longitude, latitude, height = 800_000, duration = 2.5 }) {
      const v = viewerRef.current;
      if (!v || v.isDestroyed()) return;
      v.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-45),
          roll: 0,
        },
        duration,
        easingFunction: Cesium.EasingFunction.SINUSOIDAL_IN_OUT,
      });
    },
    goHome() {
      const v = viewerRef.current;
      if (!v || v.isDestroyed()) return;
      v.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          HOME_CAMERA.longitude,
          HOME_CAMERA.latitude,
          HOME_CAMERA.height
        ),
        duration: 2,
        easingFunction: Cesium.EasingFunction.SINUSOIDAL_IN_OUT,
      });
    },
    getAltitude() {
      return viewerRef.current ? cameraAltitudeKm(viewerRef.current) : '0';
    },
  }));

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    // Set token before anything
    Cesium.Ion.defaultAccessToken = CESIUM_ION_TOKEN;

    let viewer;
    try {
      viewer = new Cesium.Viewer(containerRef.current, {
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        animation: false,
        timeline: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
        // Start without terrain — add it after so failure doesn't break everything
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
        requestRenderMode: false,
        targetFrameRate: 60,
      });
    } catch (err) {
      console.error('[Globe] Viewer creation failed:', err);
      return;
    }

    viewerRef.current = viewer;

    // ── Add World Terrain async (won't break page if fails) ────────
    Cesium.Terrain.fromWorldTerrain({
      requestWaterMask: true,
      requestVertexNormals: true,
    }).then((terrain) => {
      if (!viewer.isDestroyed()) {
        viewer.scene.setTerrain(terrain);
      }
    }).catch((e) => {
      console.warn('[Globe] Terrain load failed (using flat ellipsoid):', e.message);
    });

    // ── Base imagery: Esri World Imagery ───────────────────────────
    try {
      viewer.imageryLayers.removeAll();
      viewer.imageryLayers.addImageryProvider(
        new Cesium.UrlTemplateImageryProvider({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          maximumLevel: 19,
          credit: new Cesium.Credit('Esri'),
        })
      );
    } catch (e) {
      console.warn('[Globe] Imagery provider error:', e.message);
    }

    // ── Atmosphere ─────────────────────────────────────────────────
    try {
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.showGroundAtmosphere = true;
      viewer.scene.skyAtmosphere.show = true;
      viewer.scene.globe.depthTestAgainstTerrain = false; // false = more stable
      viewer.scene.globe.maximumScreenSpaceError = 2;
      viewer.scene.fog.enabled = true;
      viewer.scene.fog.density = 0.0002;
      viewer.scene.moon.show = true;
      viewer.scene.sun.show = true;
      viewer.clock.shouldAnimate = true;
    } catch (e) {
      console.warn('[Globe] Atmosphere setup error:', e.message);
    }

    // ── Initial camera position ────────────────────────────────────
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(
        HOME_CAMERA.longitude,
        HOME_CAMERA.latitude,
        HOME_CAMERA.height
      ),
    });

    // ── Camera change event ────────────────────────────────────────
    viewer.camera.changed.addEventListener(() => {
      if (onCameraChange && !viewer.isDestroyed()) {
        try {
          const cart = Cesium.Cartographic.fromCartesian(viewer.camera.position);
          onCameraChange({
            longitude: Cesium.Math.toDegrees(cart.longitude),
            latitude: Cesium.Math.toDegrees(cart.latitude),
            altitudeKm: (cart.height / 1000).toFixed(0),
          });
        } catch (_) {}
      }
    });

    // ── Click handler ──────────────────────────────────────────────
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((event) => {
      try {
        const picked = viewer.scene.pick(event.position);
        if (Cesium.defined(picked) && Cesium.defined(picked.id)) {
          const entity = picked.id;
          if (entity.id?.startsWith('flight_') && entity.properties) {
            const props = entity.properties.getValue(viewer.clock.currentTime);
            onEntityClick?.({ type: 'flight', data: props });
            return;
          }
        }
        onEntityClick?.(null);
      } catch (_) {}
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // ── Data sources ───────────────────────────────────────────────
    const flightDs = new Cesium.CustomDataSource('flights');
    viewer.dataSources.add(flightDs);
    flightDsRef.current = flightDs;

    const labelDs = new Cesium.CustomDataSource('labels');
    viewer.dataSources.add(labelDs);
    labelDsRef.current = labelDs;
    populateCityLabels(labelDs);

    return () => {
      cancelAnimationFrame(cinematicRef.current);
      handler.destroy();
      if (!viewer.isDestroyed()) viewer.destroy();
      viewerRef.current = null;
      initRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── City labels visibility ─────────────────────────────────────
  useEffect(() => {
    if (labelDsRef.current) labelDsRef.current.show = !!layers.cities;
  }, [layers.cities]);

  // ── Update flights ─────────────────────────────────────────────
  useEffect(() => {
    const ds = flightDsRef.current;
    if (!ds) return;
    ds.show = !!layers.flights;
    if (!layers.flights) { ds.entities.removeAll(); return; }

    const existingIds = new Set(ds.entities.values.map((e) => e.id));
    const newIds = new Set(flights.map((f) => `flight_${f.icao24}`));

    [...existingIds].filter((id) => !newIds.has(id)).forEach((id) => ds.entities.removeById(id));

    flights.forEach((flight) => {
      const id = `flight_${flight.icao24}`;
      const cfg = buildFlightEntity(flight);
      if (ds.entities.getById(id)) {
        const e = ds.entities.getById(id);
        e.position = cfg.position;
        e.billboard = cfg.billboard;
      } else {
        ds.entities.add({ ...cfg, id });
      }
    });
  }, [flights, layers.flights]);

  // ── Weather layers ─────────────────────────────────────────────
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    const activeKey = layers.weather;
    Object.values(weatherLayerRefs.current).forEach((layer) => {
      if (viewer.imageryLayers.contains(layer)) viewer.imageryLayers.remove(layer, true);
    });
    weatherLayerRefs.current = {};

    if (!activeKey || !WEATHER_LAYERS[activeKey]) return;
    const url = WEATHER_LAYERS[activeKey].urlFn(OPENWEATHER_API_KEY);
    if (!url) return;

    try {
      const layer = viewer.imageryLayers.addImageryProvider(
        new Cesium.UrlTemplateImageryProvider({ url, maximumLevel: 6 })
      );
      layer.alpha = WEATHER_OPACITY;
      weatherLayerRefs.current[activeKey] = layer;
    } catch (e) {
      console.warn('[Globe] Weather layer error:', e.message);
    }
  }, [layers.weather]);

  // ── Cinematic rotation ─────────────────────────────────────────
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    cancelAnimationFrame(cinematicRef.current);
    if (!cinematicMode) return;

    let last = Date.now();
    const rotate = () => {
      if (!viewerRef.current || viewer.isDestroyed()) return;
      const now = Date.now();
      const dt = (now - last) / 1000;
      last = now;
      try {
        const cart = Cesium.Cartographic.fromCartesian(viewer.camera.position);
        if (cart.height > 2_000_000) {
          viewer.camera.rotate(
            Cesium.Cartesian3.UNIT_Z,
            -Cesium.Math.toRadians(CINEMATIC_SPEED * dt * 60)
          );
        }
      } catch (_) {}
      cinematicRef.current = requestAnimationFrame(rotate);
    };
    cinematicRef.current = requestAnimationFrame(rotate);

    return () => cancelAnimationFrame(cinematicRef.current);
  }, [cinematicMode]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  );
});

// ── City labels ────────────────────────────────────────────────────
const WORLD_CITIES = [
  { name: 'New York', lon: -74.006, lat: 40.714, pop: 8e6 },
  { name: 'London', lon: -0.127, lat: 51.507, pop: 9e6 },
  { name: 'Tokyo', lon: 139.691, lat: 35.689, pop: 14e6 },
  { name: 'Paris', lon: 2.352, lat: 48.857, pop: 2.1e6 },
  { name: 'Dubai', lon: 55.296, lat: 25.276, pop: 3.5e6 },
  { name: 'Sydney', lon: 151.209, lat: -33.868, pop: 5e6 },
  { name: 'Moscow', lon: 37.617, lat: 55.755, pop: 12e6 },
  { name: 'Beijing', lon: 116.407, lat: 39.904, pop: 21e6 },
  { name: 'São Paulo', lon: -46.633, lat: -23.548, pop: 12e6 },
  { name: 'Cairo', lon: 31.235, lat: 30.044, pop: 10e6 },
  { name: 'Mumbai', lon: 72.877, lat: 19.076, pop: 20e6 },
  { name: 'Singapore', lon: 103.819, lat: 1.352, pop: 5.8e6 },
  { name: 'Los Angeles', lon: -118.243, lat: 34.052, pop: 4e6 },
  { name: 'Istanbul', lon: 28.978, lat: 41.015, pop: 15e6 },
  { name: 'Lagos', lon: 3.406, lat: 6.524, pop: 15e6 },
  { name: 'Mexico City', lon: -99.133, lat: 19.432, pop: 9e6 },
  { name: 'Shanghai', lon: 121.474, lat: 31.230, pop: 24e6 },
  { name: 'Seoul', lon: 126.978, lat: 37.566, pop: 10e6 },
  { name: 'Bangkok', lon: 100.501, lat: 13.756, pop: 10e6 },
  { name: 'Berlin', lon: 13.405, lat: 52.520, pop: 3.7e6 },
  { name: 'Nairobi', lon: 36.817, lat: -1.292, pop: 4.4e6 },
  { name: 'Buenos Aires', lon: -58.381, lat: -34.603, pop: 3e6 },
  { name: 'Toronto', lon: -79.383, lat: 43.653, pop: 3e6 },
  { name: 'Madrid', lon: -3.703, lat: 40.417, pop: 3.2e6 },
  { name: 'Rome', lon: 12.496, lat: 41.902, pop: 2.8e6 },
  { name: 'Riyadh', lon: 46.675, lat: 24.687, pop: 7.5e6 },
  { name: 'Cape Town', lon: 18.424, lat: -33.924, pop: 4.6e6 },
];

function populateCityLabels(ds) {
  WORLD_CITIES.forEach((city) => {
    try {
      ds.entities.add({
        id: `city_${city.name}`,
        position: Cesium.Cartesian3.fromDegrees(city.lon, city.lat, 50000),
        label: {
          text: city.name,
          font: "500 12px 'Syne', sans-serif",
          fillColor: Cesium.Color.fromCssColorString('#e8f4ff'),
          outlineColor: Cesium.Color.fromCssColorString('#000509'),
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
          pixelOffset: new Cesium.Cartesian2(8, 0),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          translucencyByDistance: new Cesium.NearFarScalar(500_000, 1.0, 15_000_000, 0.0),
        },
        point: {
          pixelSize: city.pop > 8e6 ? 5 : 3.5,
          color: Cesium.Color.fromCssColorString(city.pop > 8e6 ? '#00c8ff' : 'rgba(200,220,240,0.8)'),
          outlineColor: Cesium.Color.fromCssColorString('rgba(0,200,255,0.3)'),
          outlineWidth: city.pop > 8e6 ? 3 : 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          translucencyByDistance: new Cesium.NearFarScalar(300_000, 1.0, 20_000_000, 0.0),
        },
      });
    } catch (_) {}
  });
}

export default Globe;
