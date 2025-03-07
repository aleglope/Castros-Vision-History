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

// Configuración del océano avanzado (Gerstner)
export const OCEAN_CONFIG = {
  position: {
    x: 0,
    y: -100,
    z: 0,
  },
  size: {
    width: 20000,
    length: 20000,
  },
  resolution: [256, 256],
  color: {
    depth: "#1e88e5", // Azul más claro y brillante
    surface: "#b3e5fc", // Azul claro con tono celeste
  },
  waves: {
    bigWavesElevation: 1.2, // Aumentado de 0.5 a 1.2 para olas mucho más altas
    bigWavesFrequency: [1.2, 0.8], // Frecuencia reducida para olas más grandes y dramáticas
    bigWaveSpeed: 1.5, // Aumentado para movimiento más rápido y dinámico
    smallWavesElevation: 0.4, // Aumentado para más detalle en las crestas
    smallWavesFrequency: 1.8, // Ajustado para mejor visualización
    smallWavesSpeed: 0.6, // Aumentado para mayor energía visual
    smallWavesIterations: 5, // Aumentado para más detalle en la espuma
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
};

// Modos de transformación
export const TRANSFORM_MODES = {
  TRANSLATE: "translate",
  ROTATE: "rotate",
  SCALE: "scale",
};
