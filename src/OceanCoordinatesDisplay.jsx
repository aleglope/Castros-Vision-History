import React, { useEffect, useState } from "react";
import { Html } from "@react-three/drei";

const OceanCoordinatesDisplay = ({ target }) => {
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [size, setSize] = useState({ width: 0, length: 0 });
  const [copied, setCopied] = useState(false);

  // Actualizar valores en cada frame
  useEffect(() => {
    if (!target.current) return;

    const updateInterval = setInterval(() => {
      if (target.current) {
        setPosition({
          x: parseFloat(target.current.position.x.toFixed(2)),
          y: parseFloat(target.current.position.y.toFixed(2)),
          z: parseFloat(target.current.position.z.toFixed(2)),
        });
        setRotation({
          x: parseFloat(target.current.rotation.x.toFixed(2)),
          y: parseFloat(target.current.rotation.y.toFixed(2)),
          z: parseFloat(target.current.rotation.z.toFixed(2)),
        });

        // Estimamos el tamaño basado en la escala y la geometría base
        const scaleX = target.current.scale.x || 1;
        const scaleZ = target.current.scale.z || 1;
        setSize({
          width: parseFloat((20000 * scaleX).toFixed(2)),
          length: parseFloat((20000 * scaleZ).toFixed(2)),
        });
      }
    }, 100);

    return () => clearInterval(updateInterval);
  }, [target]);

  // Copiar formato de código para config.js
  const copyToClipboard = () => {
    const configText = `// Actualiza esta configuración en config.js
export const OCEAN_CONFIG = {
  position: {
    x: ${position.x},
    y: ${position.y},
    z: ${position.z}
  },
  size: {
    width: ${size.width},
    length: ${size.length}
  },
  resolution: [256, 256],
  color: {
    depth: '#1e88e5',
    surface: '#b3e5fc'
  },
  waves: {
    bigWavesElevation: 1.2,
    bigWavesFrequency: [1.2, 0.8],
    bigWaveSpeed: 1.5,
    smallWavesElevation: 0.4,
    smallWavesFrequency: 1.8,
    smallWavesSpeed: 0.6,
    smallWavesIterations: 5
  }
};
`;
    navigator.clipboard.writeText(configText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Html
      position={[0, 100, 0]}
      distanceFactor={15}
      center
      zIndexRange={[100, 0]}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.8)",
          color: "white",
          padding: "15px",
          borderRadius: "5px",
          fontFamily: "monospace",
          fontSize: "12px",
          boxShadow: "0 0 10px rgba(0,0,0,0.5)",
          width: "300px",
          position: "fixed",
          top: "10px",
          left: "10px",
          zIndex: 1000,
        }}
      >
        <h3 style={{ margin: "0 0 10px 0", textAlign: "center" }}>
          Coordenadas del Océano
        </h3>

        <div style={{ marginBottom: "10px" }}>
          <strong>Posición:</strong>
          <pre
            style={{
              margin: "5px 0",
              background: "#333",
              padding: "5px",
              borderRadius: "3px",
            }}
          >
            x: {position.x}, y: {position.y}, z: {position.z}
          </pre>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <strong>Tamaño:</strong>
          <pre
            style={{
              margin: "5px 0",
              background: "#333",
              padding: "5px",
              borderRadius: "3px",
            }}
          >
            width: {size.width}, length: {size.length}
          </pre>
        </div>

        <button
          onClick={copyToClipboard}
          style={{
            background: copied ? "#4CAF50" : "#3498db",
            color: "white",
            border: "none",
            padding: "8px 12px",
            borderRadius: "4px",
            cursor: "pointer",
            width: "100%",
            fontWeight: "bold",
          }}
        >
          {copied
            ? "¡Copiado a Portapapeles!"
            : "Copiar Configuración para config.js"}
        </button>
      </div>
    </Html>
  );
};

export default OceanCoordinatesDisplay;
