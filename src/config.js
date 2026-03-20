// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Terra3D — Configuration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CESIUM_ION_TOKEN =
  import.meta.env.VITE_CESIUM_ION_TOKEN ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2YjU0ZDg0Zi05ZWEyLTRjYzctYTE1Mi04MTNhYjYxNGJjZTgiLCJpZCI6NDA2NDc1LCJpYXQiOjE3NzM5Nzc5ODV9.5TrGvDmM3k2YJeFL921S2E3fPwLUhq4tZnKo4qodYNw';

export const OPENWEATHER_API_KEY =
  import.meta.env.VITE_OPENWEATHER_API_KEY || '';

export const FLIGHT_POLL_INTERVAL = 15_000;
export const WEATHER_OPACITY = 0.6;

export const HOME_CAMERA = {
  longitude: 0,
  latitude: 20,
  height: 25_000_000,
};

export const CINEMATIC_SPEED = 0.025;
