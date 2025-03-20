// Configuración global para la aplicación

// Posición del cartel informativo
export const SIGN_POSITION = {
  x: 150,
  y: -5.65,
  z: -104.44,
};

// Escala del cartel
export const SIGN_SCALE = 4.08;

// Rotación del cartel (en radianes)
export const SIGN_ROTATION = {
  x: 0,
  y: 0.52,
  z: 0.02,
};

// Configuración del océano (modelo 3D)
export const OCEAN_CONFIG = {
  position: {
    x: 0,
    y: -100,
    z: 0,
  },
  // Configuración del clima hostil
  stormSettings: {
    enabled: true,
    rainIntensity: 0.7, // 0-1
    waveStrength: 0.8, // 0-1, fuerza de las olas
    cloudDensity: 0.9, // 0-1
    lightning: true,
    fogDensity: 0.6, // 0-1
    windSpeed: 0.75, // 0-1
  },
};

// Posiciones de cámara para vistas
export const CAMERA_VIEWS = {
  castroBarona: {
    position: { x: 200, y: -5, z: -50 },
    lookAt: { x: 150, y: -5.65, z: -104.44 },
  },
  oceanView: {
    position: { x: 500, y: 200, z: 500 },
    lookAt: { x: 0, y: -100, z: 0 },
  },
  stormView: {
    position: { x: 300, y: 100, z: 300 },
    lookAt: { x: 0, y: -50, z: 0 },
  },
};

// Modos de transformación
export const TRANSFORM_MODES = {
  TRANSLATE: "translate",
  ROTATE: "rotate",
  SCALE: "scale",
};
