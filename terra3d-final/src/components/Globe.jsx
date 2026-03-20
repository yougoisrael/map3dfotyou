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

// ── Weather tile layer configs ─────────────────────────────────────
const WEATHER_LAYERS = {
  clouds: {
    id: 'owm_clouds',
    label: 'Clouds',
    urlFn: (key) =>
      key
        ? `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${key}`
        : 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  },
  wind: {
    id: 'owm_wind',
    label: 'Wind',
    urlFn: (key) =>
      key
        ? `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${key}`
        : null,
  },
  temp: {
    id: 'owm_temp',
    label: 'Temperature',
    urlFn: (key) =>
      key
        ? `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${key}`
        : null,
  },
};

// ── Globe component ────────────────────────────────────────────────
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

  // ── Expose fly-to to parent ──────────────────────────────────────
  useImperativeHandle(ref, () => ({
    flyTo({ longitude, latitude, height = 800_000, duration = 2.5 }) {
      const v = viewerRef.current;
      if (!v) return;
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
      if (!v) return;
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

  // ── Init Cesium viewer ───────────────────────────────────────────
  useEffect(() => {
    Cesium.Ion.defaultAccessToken = CESIUM_ION_TOKEN;

    const viewer = new Cesium.Viewer(containerRef.current, {
      // Imagery
      baseLayerPicker: false,
      // Terrain — World Terrain via Ion
      terrain: Cesium.Terrain.fromWorldTerrain({
        requestWaterMask: true,
        requestVertexNormals: true,
      }),
      // UI strips
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      // Performance
      requestRenderMode: false,
      maximumRenderTimeChange: Infinity,
      targetFrameRate: 60,
    });

    viewerRef.current = viewer;

    // ── Base imagery: Esri World Imagery (free) ──────────────────
    const baseLayer = viewer.imageryLayers.get(0);
    viewer.imageryLayers.remove(baseLayer, false);

    viewer.imageryLayers.addImageryProvider(
      new Cesium.UrlTemplateImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maximumLevel: 19,
        credit: new Cesium.Credit('Esri World Imagery'),
      })
    );

    // ── Atmosphere & lighting ────────────────────────────────────
    viewer.scene.globe.enableLighting = true;
    viewer.scene.globe.atmosphereLightIntensity = 10.0;
    viewer.scene.globe.atmosphereMieCoefficient = 0.003;
    viewer.scene.globe.atmosphereRayleighCoefficient = new Cesium.Cartesian3(5.5e-6, 13.0e-6, 28.4e-6);
    viewer.scene.globe.atmosphereMieScaleHeight = 3200.0;
    viewer.scene.globe.atmosphereRayleighScaleHeight = 10000.0;
    viewer.scene.globe.showGroundAtmosphere = true;
    viewer.scene.globe.atmosphereSaturationShift = 0.1;
    viewer.scene.globe.atmosphereBrightnessShift = 0.05;

    viewer.scene.skyAtmosphere.show = true;
    viewer.scene.skyAtmosphere.atmosphereLightIntensity = 15.0;

    // Day/night lighting using sun position
    viewer.clock.currentTime = Cesium.JulianDate.now();
    viewer.clock.shouldAnimate = true;
    viewer.scene.globe.enableLighting = true;

    // Smooth depth rendering
    viewer.scene.globe.depthTestAgainstTerrain = true;
    viewer.scene.globe.maximumScreenSpaceError = 2;
    viewer.scene.fog.enabled = true;
    viewer.scene.fog.density = 0.0002;

    // ── Milky Way / Stars background ─────────────────────────────
    viewer.scene.moon.show = true;
    viewer.scene.sun.show = true;
    viewer.scene.skyBox.show = true;

    // ── Water ────────────────────────────────────────────────────
    viewer.scene.globe.showWaterEffect = true;

    // ── Initial camera ───────────────────────────────────────────
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(
        HOME_CAMERA.longitude,
        HOME_CAMERA.latitude,
        HOME_CAMERA.height
      ),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
    });

    // ── Camera change event ──────────────────────────────────────
    viewer.camera.changed.addEventListener(() => {
      if (onCameraChange) {
        const cart = Cesium.Cartographic.fromCartesian(viewer.camera.position);
        onCameraChange({
          longitude: Cesium.Math.toDegrees(cart.longitude),
          latitude: Cesium.Math.toDegrees(cart.latitude),
          altitudeKm: (cart.height / 1000).toFixed(0),
        });
      }
    });

    // ── Click handler ─────────────────────────────────────────────
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((event) => {
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
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // ── Flight data source ────────────────────────────────────────
    const flightDs = new Cesium.CustomDataSource('flights');
    viewer.dataSources.add(flightDs);
    flightDsRef.current = flightDs;

    // ── City labels data source ───────────────────────────────────
    const labelDs = new Cesium.CustomDataSource('labels');
    viewer.dataSources.add(labelDs);
    labelDsRef.current = labelDs;
    populateCityLabels(labelDs);

    return () => {
      handler.destroy();
      viewer.destroy();
      viewerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── City labels visibility ───────────────────────────────────────
  useEffect(() => {
    if (labelDsRef.current) {
      labelDsRef.current.show = !!layers.cities;
    }
  }, [layers.cities]);

  // ── Update flight entities ────────────────────────────────────────
  useEffect(() => {
    const ds = flightDsRef.current;
    if (!ds) return;

    ds.show = !!layers.flights;
    if (!layers.flights) { ds.entities.removeAll(); return; }

    // Batch update: reuse existing entities
    const existingIds = new Set(ds.entities.values.map((e) => e.id));
    const newIds = new Set(flights.map((f) => `flight_${f.icao24}`));

    // Remove stale
    [...existingIds].filter((id) => !newIds.has(id)).forEach((id) => {
      ds.entities.removeById(id);
    });

    // Add / update
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

  // ── Weather layers ────────────────────────────────────────────────
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const activeWeatherKey = layers.weather; // e.g. 'clouds', 'wind', 'temp', or false

    // Remove all existing weather layers
    Object.values(weatherLayerRefs.current).forEach((layer) => {
      if (viewer.imageryLayers.contains(layer)) {
        viewer.imageryLayers.remove(layer, true);
      }
    });
    weatherLayerRefs.current = {};

    if (!activeWeatherKey || !WEATHER_LAYERS[activeWeatherKey]) return;

    const cfg = WEATHER_LAYERS[activeWeatherKey];
    const url = cfg.urlFn(OPENWEATHER_API_KEY);
    if (!url) return;

    const provider = new Cesium.UrlTemplateImageryProvider({
      url,
      maximumLevel: 6,
      minimumLevel: 0,
    });

    const layer = viewer.imageryLayers.addImageryProvider(provider);
    layer.alpha = WEATHER_OPACITY;
    layer.brightness = 1.1;
    weatherLayerRefs.current[activeWeatherKey] = layer;
  }, [layers.weather]);

  // ── Cinematic auto-rotation ───────────────────────────────────────
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (cinematicMode) {
      let last = Date.now();
      const rotate = () => {
        if (!viewerRef.current) return;
        const now = Date.now();
        const dt = (now - last) / 1000;
        last = now;
        const cart = Cesium.Cartographic.fromCartesian(viewer.camera.position);
        if (cart.height > 2_000_000) {
          viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, -Cesium.Math.toRadians(CINEMATIC_SPEED * dt * 60));
        }
        cinematicRef.current = requestAnimationFrame(rotate);
      };
      cinematicRef.current = requestAnimationFrame(rotate);
    } else {
      cancelAnimationFrame(cinematicRef.current);
    }

    return () => cancelAnimationFrame(cinematicRef.current);
  }, [cinematicMode]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  );
});

// ── City labels dataset ───────────────────────────────────────────────
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
  { name: 'Jakarta', lon: 106.865, lat: -6.175, pop: 10e6 },
  { name: 'Mexico City', lon: -99.133, lat: 19.432, pop: 9e6 },
  { name: 'Lagos', lon: 3.406, lat: 6.524, pop: 15e6 },
  { name: 'Dhaka', lon: 90.412, lat: 23.810, pop: 21e6 },
  { name: 'Karachi', lon: 67.010, lat: 24.861, pop: 14e6 },
  { name: 'Buenos Aires', lon: -58.381, lat: -34.603, pop: 3e6 },
  { name: 'Shanghai', lon: 121.474, lat: 31.230, pop: 24e6 },
  { name: 'Osaka', lon: 135.502, lat: 34.693, pop: 2.7e6 },
  { name: 'Chongqing', lon: 106.504, lat: 29.533, pop: 32e6 },
  { name: 'Kinshasa', lon: 15.327, lat: -4.323, pop: 14e6 },
  { name: 'Nairobi', lon: 36.817, lat: -1.292, pop: 4.4e6 },
  { name: 'Toronto', lon: -79.383, lat: 43.653, pop: 3e6 },
  { name: 'Chicago', lon: -87.623, lat: 41.878, pop: 2.7e6 },
  { name: 'Seoul', lon: 126.978, lat: 37.566, pop: 10e6 },
  { name: 'Bangkok', lon: 100.501, lat: 13.756, pop: 10e6 },
  { name: 'Taipei', lon: 121.565, lat: 25.033, pop: 2.7e6 },
  { name: 'Ho Chi Minh City', lon: 106.660, lat: 10.776, pop: 8.9e6 },
  { name: 'Madrid', lon: -3.703, lat: 40.417, pop: 3.2e6 },
  { name: 'Rome', lon: 12.496, lat: 41.902, pop: 2.8e6 },
  { name: 'Berlin', lon: 13.405, lat: 52.520, pop: 3.7e6 },
  { name: 'Riyadh', lon: 46.675, lat: 24.687, pop: 7.5e6 },
  { name: 'Cape Town', lon: 18.424, lat: -33.924, pop: 4.6e6 },
];

function populateCityLabels(ds) {
  WORLD_CITIES.forEach((city) => {
    const labelHeight = 50000;
    ds.entities.add({
      id: `city_${city.name}`,
      position: Cesium.Cartesian3.fromDegrees(city.lon, city.lat, labelHeight),
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
        scaleByDistance: new Cesium.NearFarScalar(200_000, 1.2, 8_000_000, 0.6),
      },
      point: {
        pixelSize: city.pop > 8e6 ? 5 : 3.5,
        color: Cesium.Color.fromCssColorString(city.pop > 8e6 ? '#00c8ff' : 'rgba(200,220,240,0.8)'),
        outlineColor: Cesium.Color.fromCssColorString('rgba(0,200,255,0.3)'),
        outlineWidth: city.pop > 8e6 ? 3 : 1,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        translucencyByDistance: new Cesium.NearFarScalar(300_000, 1.0, 20_000_000, 0.0),
        scaleByDistance: new Cesium.NearFarScalar(200_000, 1.4, 8_000_000, 0.5),
      },
    });
  });
}

export default Globe;
