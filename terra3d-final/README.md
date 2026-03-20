# 🌍 Terra3D — Live Earth Intelligence Platform

> A production-grade interactive 3D Earth platform built with React + CesiumJS. Real-time flight tracking, weather overlays, terrain, atmosphere, and cinematic camera — all in the browser.

![Terra3D](https://img.shields.io/badge/Terra3D-v1.0.0-00c8ff?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)
![CesiumJS](https://img.shields.io/badge/CesiumJS-1.116-4fc3f7?style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-5-646cff?style=for-the-badge&logo=vite)

---

## ✨ Features

| Feature | Details |
|---|---|
| 🌍 **3D Globe** | CesiumJS WebGL — photorealistic Esri World Imagery |
| 🏔️ **Real Terrain** | Cesium World Terrain with elevation & water |
| ✈️ **Live Flights** | OpenSky Network (real) + simulated fallback |
| 🌦️ **Weather Layers** | Clouds / Wind / Temperature via OpenWeatherMap |
| 📍 **City Labels** | 36 world cities with population-scaled markers |
| 🔍 **Search** | Geocode any city, country, or coordinates |
| 🌙 **Day/Night Cycle** | Real sun position lighting |
| 🎬 **Cinematic Mode** | Auto-rotating orbit with smooth inertia |
| 📡 **Live HUD** | Real-time coordinates, altitude, UTC clock |
| 🖱️ **Flight Inspector** | Click any aircraft for speed, altitude, heading |

---

## 🚀 Quick Start

### 1. Clone

```bash
git clone https://github.com/YOUR_USERNAME/terra3d.git
cd terra3d
```

### 2. Install

```bash
npm install
```

### 3. Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# FREE token — https://cesium.com/ion/signup
VITE_CESIUM_ION_TOKEN=your_token_here

# Optional — https://openweathermap.org/api
VITE_OPENWEATHER_API_KEY=your_key_here
```

### 4. Run

```bash
npm run dev
# → http://localhost:3000
```

---

## 📦 Build & Deploy

### Build

```bash
npm run build
# Output: /dist
```

### Deploy to Vercel (recommended)

```bash
npm i -g vercel
vercel --prod
```

Set environment variables in Vercel dashboard:
- `VITE_CESIUM_ION_TOKEN`
- `VITE_OPENWEATHER_API_KEY` (optional)

### Deploy to Netlify

```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

---

## 🗂️ Project Structure

```
terra3d/
├── src/
│   ├── components/
│   │   ├── Globe.jsx          # Core CesiumJS 3D globe
│   │   ├── SearchBar.jsx      # Geocoding search
│   │   ├── LayerPanel.jsx     # Layer toggles
│   │   ├── HUD.jsx            # Coordinates overlay
│   │   └── FlightInfo.jsx     # Flight detail panel
│   ├── hooks/
│   │   └── useFlights.js      # Flight polling hook
│   ├── services/
│   │   ├── flightService.js   # OpenSky Network API
│   │   └── geocodingService.js # Nominatim / OSM
│   ├── utils/
│   │   └── cesiumHelpers.js   # Cesium utilities
│   ├── styles/
│   │   └── global.css         # Design system
│   ├── config.js              # API keys & settings
│   └── App.jsx                # Root component
├── index.html
├── vite.config.js
├── vercel.json
└── .env.example
```

---

## 🔑 Free API Keys

| Service | Purpose | Link |
|---|---|---|
| **Cesium Ion** | 3D terrain & imagery | [cesium.com/ion](https://cesium.com/ion/signup) |
| **OpenWeatherMap** | Weather tile layers | [openweathermap.org](https://openweathermap.org/api) |
| **OpenSky Network** | Live flight data | No key required |
| **Nominatim / OSM** | Geocoding search | No key required |
| **Esri World Imagery** | Satellite basemap | No key required |

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite 5
- **3D Engine**: CesiumJS 1.116
- **Terrain**: Cesium World Terrain (Ion)
- **Imagery**: Esri World Imagery (free)
- **Flights**: OpenSky Network REST API
- **Geocoding**: Nominatim / OpenStreetMap
- **Weather**: OpenWeatherMap tile API
- **Deployment**: Vercel / Netlify

---

## 📄 License

MIT — free to use and modify.

---

> Built with ❤️ — Terra3D
