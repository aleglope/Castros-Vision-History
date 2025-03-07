import React, { useEffect, useState } from "react";
import { Html } from "@react-three/drei";

const CoordinatesDisplay = ({ target }) => {
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [scale, setScale] = useState({ x: 1, y: 1, z: 1 });
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
        setScale({
          x: parseFloat(target.current.scale.x.toFixed(2)),
          y: parseFloat(target.current.scale.y.toFixed(2)),
          z: parseFloat(target.current.scale.z.toFixed(2)),
        });
      }
    }, 100);

    return () => clearInterval(updateInterval);
  }, [target]);

  // Copiar formato de código para config.js
  const copyToClipboard = () => {
    const configText = `// Actualiza estas coordenadas en config.js
export const SIGN_POSITION = {
  x: ${position.x},
  y: ${position.y},
  z: ${position.z}
};

// Si has modificado la rotación
// Rotación en radianes (multiplicar por Math.PI para usar en código)
// x: ${rotation.x.toFixed(2)}, y: ${rotation.y.toFixed(
      2
    )}, z: ${rotation.z.toFixed(2)}

// Si has modificado la escala
export const SIGN_SCALE = ${scale.x}; // Usando escala X como referencia
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
          right: "10px",
          zIndex: 1000,
        }}
      >
        <h3 style={{ margin: "0 0 10px 0", textAlign: "center" }}>
          Coordenadas del Cartel
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
          <strong>Rotación:</strong>
          <pre
            style={{
              margin: "5px 0",
              background: "#333",
              padding: "5px",
              borderRadius: "3px",
            }}
          >
            x: {rotation.x}, y: {rotation.y}, z: {rotation.z}
          </pre>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <strong>Escala:</strong>
          <pre
            style={{
              margin: "5px 0",
              background: "#333",
              padding: "5px",
              borderRadius: "3px",
            }}
          >
            x: {scale.x}, y: {scale.y}, z: {scale.z}
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
            : "Copiar Coordenadas para config.js"}
        </button>
      </div>
    </Html>
  );
};

export default CoordinatesDisplay;
