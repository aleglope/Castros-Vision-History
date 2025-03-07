import React from "react";
import { Html } from "@react-three/drei";

const FirstPersonButton = ({ onClick, isActive }) => {
  return (
    <Html position={[-300, 50, 0]} center>
      <button
        onClick={onClick}
        style={{
          background: isActive ? "#e74c3c" : "#2ecc71",
          color: "white",
          border: "none",
          padding: "10px 15px",
          borderRadius: "5px",
          fontWeight: "bold",
          fontSize: "14px",
          cursor: "pointer",
          boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
          transition: "all 0.3s",
          width: "200px",
        }}
      >
        {isActive ? "Salir Modo Primera Persona" : "Vista Primera Persona"}
      </button>

      {isActive && (
        <div
          style={{
            background: "rgba(0,0,0,0.7)",
            color: "white",
            padding: "10px",
            borderRadius: "5px",
            marginTop: "10px",
            fontSize: "12px",
            width: "200px",
            textAlign: "center",
          }}
        >
          <p style={{ margin: "4px 0" }}>
            <strong>Controles:</strong>
          </p>
          <p style={{ margin: "2px 0" }}>W - Avanzar</p>
          <p style={{ margin: "2px 0" }}>S - Retroceder</p>
          <p style={{ margin: "2px 0" }}>A - Izquierda</p>
          <p style={{ margin: "2px 0" }}>D - Derecha</p>
          <p style={{ margin: "2px 0" }}>Ratón - Mirar</p>
          <p style={{ margin: "6px 0", fontWeight: "bold", color: "#ffcc00" }}>
            ¡HAZ CLIC EN LA PANTALLA PARA ACTIVAR EL CONTROL CON EL RATÓN!
          </p>
          <p style={{ margin: "2px 0" }}>ESC - Desbloquear ratón</p>
        </div>
      )}
    </Html>
  );
};

export default FirstPersonButton;
