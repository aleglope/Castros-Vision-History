import {
  TransformControls,
  Environment,
  OrbitControls,
  Html,
} from "@react-three/drei";
import { Perf } from "r3f-perf";
import { Suspense, useRef, useState, useEffect } from "react";
import Model from "./Model.jsx";
import Placeholder from "./Placeholder.jsx";
import InfoSign from "./InfoSign.jsx";
import CoordinatesDisplay from "./CoordinatesDisplay.jsx";
import OceanCoordinatesDisplay from "./OceanCoordinatesDisplay.jsx";
import {
  SIGN_POSITION,
  TRANSFORM_MODES,
  OCEAN_CONFIG,
  CAMERA_VIEWS,
} from "./config.js";
import ModelBounds from "./ModelBounds.jsx";
import GerstnerOcean from "./GerstnerOcean.jsx";
import FirstPersonControls from "./FirstPersonControls.jsx";
import FirstPersonButton from "./FirstPersonButton.jsx";

export default function App() {
  const signRef = useRef();
  const modelRef = useRef();
  const oceanRef = useRef();

  const [transformMode, setTransformMode] = useState(TRANSFORM_MODES.TRANSLATE);
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [showOceanCoordinates, setShowOceanCoordinates] = useState(false);
  const [showOcean, setShowOcean] = useState(true);
  const [showBounds, setShowBounds] = useState(false);
  const [activeControl, setActiveControl] = useState("sign"); // "sign" o "ocean"
  const [firstPersonMode, setFirstPersonMode] = useState(false);

  // Función para cambiar el modo de transformación
  const toggleTransformMode = () => {
    if (transformMode === TRANSFORM_MODES.TRANSLATE)
      setTransformMode(TRANSFORM_MODES.ROTATE);
    else if (transformMode === TRANSFORM_MODES.ROTATE)
      setTransformMode(TRANSFORM_MODES.SCALE);
    else setTransformMode(TRANSFORM_MODES.TRANSLATE);
  };

  // Función para cambiar entre controlar el cartel y el océano
  const toggleActiveControl = () => {
    if (activeControl === "sign") {
      setActiveControl("ocean");
      setShowCoordinates(false);
      setShowOceanCoordinates(true);
    } else {
      setActiveControl("sign");
      setShowCoordinates(true);
      setShowOceanCoordinates(false);
    }
  };

  // Función para activar/desactivar el modo primera persona
  const toggleFirstPersonMode = () => {
    setFirstPersonMode(!firstPersonMode);
  };

  // Función auxiliar para convertir objeto de posición a array
  const positionToArray = (posObj) => [posObj.x, posObj.y, posObj.z];

  // Función auxiliar para convertir objeto de tamaño a array
  const sizeToArray = (sizeObj) => [sizeObj.width, sizeObj.length];

  // Alternar visualización con teclas
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Evitar que las teclas funcionen en modo primera persona (excepto Escape)
      if (firstPersonMode && e.key !== "Escape") return;

      // Tecla 'Escape' para salir del modo primera persona
      if (e.key === "Escape" && firstPersonMode) {
        setFirstPersonMode(false);
        return;
      }

      // Tecla 'C' para coordenadas del elemento activo
      if (e.key === "c" || e.key === "C") {
        if (activeControl === "sign") {
          setShowCoordinates((prev) => !prev);
        } else {
          setShowOceanCoordinates((prev) => !prev);
        }
      }
      // Tecla 'O' para océano
      if (e.key === "o" || e.key === "O") {
        setShowOcean((prev) => !prev);
      }
      // Tecla 'B' para límites
      if (e.key === "b" || e.key === "B") {
        setShowBounds((prev) => !prev);
      }
      // Tecla 'T' para cambiar entre cartel y océano
      if (e.key === "t" || e.key === "T") {
        toggleActiveControl();
      }
      // Tecla 'F' para activar/desactivar modo primera persona
      if (e.key === "f" || e.key === "F") {
        toggleFirstPersonMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeControl, firstPersonMode]);

  return (
    <>
      <Perf position="top-left" />

      {/* Control de cámara según el modo */}
      {!firstPersonMode && <OrbitControls makeDefault />}

      <ambientLight intensity={0.5} />
      <directionalLight position={[1, 1, 1]} intensity={0.8} castShadow />
      <Environment background files={["/nublado.hdr"]} />

      <Suspense fallback={<Placeholder position-y={0.5} scale={[2, 3, 2]} />}>
        <ModelBounds modelRef={modelRef} visible={showBounds}>
          <Model ref={modelRef} />
        </ModelBounds>
      </Suspense>

      {/* Cartel informativo con controles para moverlo */}
      <InfoSign position={positionToArray(SIGN_POSITION)} ref={signRef} />

      {/* Océano avanzado con ondas Gerstner */}
      {showOcean && (
        <GerstnerOcean
          ref={oceanRef}
          position={positionToArray(OCEAN_CONFIG.position)}
          size={sizeToArray(OCEAN_CONFIG.size)}
          resolution={OCEAN_CONFIG.resolution}
          color={OCEAN_CONFIG.color}
          waves={OCEAN_CONFIG.waves}
        />
      )}

      {/* Controles en primera persona */}
      <FirstPersonControls
        active={firstPersonMode}
        modelRef={modelRef}
        walkSpeed={100}
        elevationOffset={10}
      />

      {/* Controles de transformación (solo visibles fuera del modo primera persona) */}
      {!firstPersonMode && (
        <>
          {/* Agregar controles de transformación para el elemento activo */}
          <TransformControls
            object={activeControl === "sign" ? signRef : oceanRef}
            mode={transformMode}
            size={1}
          />

          {/* Botón para cambiar el modo de transformación */}
          <mesh position={[-300, 200, 0]} onClick={toggleTransformMode}>
            <boxGeometry args={[30, 30, 5]} />
            <meshStandardMaterial
              color={
                transformMode === TRANSFORM_MODES.TRANSLATE
                  ? "#3498db"
                  : transformMode === TRANSFORM_MODES.ROTATE
                  ? "#e74c3c"
                  : "#2ecc71"
              }
            />
          </mesh>

          {/* Botón para cambiar entre controlar cartel y océano */}
          <mesh position={[-300, 150, 0]} onClick={toggleActiveControl}>
            <boxGeometry args={[30, 30, 5]} />
            <meshStandardMaterial
              color={activeControl === "sign" ? "#9b59b6" : "#f39c12"}
            />
          </mesh>

          {/* Visualizador de coordenadas */}
          {showCoordinates && <CoordinatesDisplay target={signRef} />}
          {showOceanCoordinates && (
            <OceanCoordinatesDisplay target={oceanRef} />
          )}
        </>
      )}

      {/* Botón para activar/desactivar modo primera persona */}
      <FirstPersonButton
        onClick={toggleFirstPersonMode}
        isActive={firstPersonMode}
      />

      {/* Instrucciones para los controles (solo visibles fuera del modo primera persona) */}
      {!firstPersonMode && (
        <Html position={[-300, 100, 0]} center>
          <div
            style={{
              background: "rgba(0,0,0,0.7)",
              color: "white",
              padding: "8px",
              borderRadius: "4px",
              fontSize: "12px",
              width: "200px",
              textAlign: "center",
            }}
          >
            <p style={{ margin: "4px 0" }}>Pulsadores:</p>
            <p
              style={{
                margin: "4px 0",
                color:
                  transformMode === TRANSFORM_MODES.TRANSLATE
                    ? "#3498db"
                    : transformMode === TRANSFORM_MODES.ROTATE
                    ? "#e74c3c"
                    : "#2ecc71",
              }}
            >
              ■ Cambiar Modo: {transformMode}
            </p>
            <p
              style={{
                margin: "4px 0",
                color: activeControl === "sign" ? "#9b59b6" : "#f39c12",
              }}
            >
              ■ Control: {activeControl === "sign" ? "Cartel" : "Océano"}
            </p>
            <p style={{ margin: "8px 0 4px 0" }}>Teclas:</p>
            <p style={{ margin: "4px 0" }}>F: Modo primera persona</p>
            <p style={{ margin: "4px 0" }}>T: Cambiar control</p>
            <p style={{ margin: "4px 0" }}>
              C:{" "}
              {activeControl === "sign"
                ? showCoordinates
                  ? "Ocultar"
                  : "Mostrar"
                : showOceanCoordinates
                ? "Ocultar"
                : "Mostrar"}{" "}
              coords
            </p>
            <p style={{ margin: "4px 0" }}>
              O: {showOcean ? "Ocultar" : "Mostrar"} océano
            </p>
            <p style={{ margin: "4px 0" }}>
              B: {showBounds ? "Ocultar" : "Mostrar"} límites
            </p>
          </div>
        </Html>
      )}
    </>
  );
}
