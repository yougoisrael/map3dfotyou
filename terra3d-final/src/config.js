// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Terra3D — Configuration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Get your FREE Cesium Ion token at: https://cesium.com/ion/signup
// Get your FREE OpenWeatherMap key at: https://openweathermap.org/api
//
// Replace the placeholder strings below with your actual keys.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CESIUM_ION_TOKEN =
  import.meta.env.VITE_CESIUM_ION_TOKEN ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2YjU0ZDg0Zi05ZWEyLTRjYzctYTE1Mi04MTNhYjYxNGJjZTgiLCJpZCI6NDA2NDc1LCJpYXQiOjE3NzM5Nzc5ODV9.5TrGvDmM3k2YJeFL921S2E3fPwLUhq4tZnKo4qodYNw';

export const OPENWEATHER_API_KEY =
  import.meta.env.VITE_OPENWEATHER_API_KEY || ''; // Add your key here

// Flight data polling interval (ms) — OpenSky free tier: 10s min
export const FLIGHT_POLL_INTERVAL = 15_000;

// Weather tile opacity
export const WEATHER_OPACITY = 0.6;

// Default camera home position
export const HOME_CAMERA = {
  longitude: 0,
  latitude: 20,
  height: 25_000_000, // 25,000 km
};

// Cinematic rotation speed (degrees/second)
export const CINEMATIC_SPEED = 0.025;
