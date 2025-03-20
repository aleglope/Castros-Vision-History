import {
  TransformControls,
  Environment,
  OrbitControls,
  Html,
  Sky,
  useHelper,
} from "@react-three/drei";
import { Perf } from "r3f-perf";
import { Suspense, useRef, useState, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Model from "./Model.jsx";
import OceanModel from "./OceanModel.jsx";
import RainEffect from "./RainEffect.jsx";
import StormyClouds from "./StormyClouds.jsx";
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
import FirstPersonControls from "./FirstPersonControls.jsx";
import FirstPersonButton from "./FirstPersonButton.jsx";

// Componente para el ambiente tormentoso
function StormyEnvironment({
  intensity = 0.8,
  cloudScale = 1,
  windSpeed = 0.4,
}) {
  const { scene } = useThree();
  const stormRef = useRef();

  // Configurar la escena para ambiente tormentoso
  useEffect(() => {
    if (scene) {
      // Fondo oscuro para tormenta
      scene.background = new THREE.Color("#0a1a2a");
      scene.fog = new THREE.FogExp2("#091320", 0.002);
    }
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  return (
    <group ref={stormRef}>
      {/* Cielo oscuro y nublado */}
      <Sky
        distance={450000}
        sunPosition={[0, -1, 0]}
        inclination={0.49}
        azimuth={0.25}
        rayleigh={intensity * 5}
        turbidity={15}
        mieCoefficient={0.005}
        mieDirectionalG={0.7}
      />

      {/* Nubes de tormenta - Ahora usando el componente separado */}
      <StormyClouds
        cloudScale={cloudScale}
        opacity={0.8 * intensity}
        windSpeed={windSpeed}
      />
    </group>
  );
}

export default function App() {
  const signRef = useRef();
  const modelRef = useRef();
  const oceanModelRef = useRef();
  const stormLightRef = useRef();

  // Iluminación dinámica para tormentas
  useHelper(stormLightRef, THREE.DirectionalLightHelper, 1, "red");

  const [transformMode, setTransformMode] = useState(TRANSFORM_MODES.TRANSLATE);
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [showOceanCoordinates, setShowOceanCoordinates] = useState(false);
  const [showOcean, setShowOcean] = useState(true);
  const [showBounds, setShowBounds] = useState(false);
  const [activeControl, setActiveControl] = useState("sign"); // "sign" o "ocean"
  const [firstPersonMode, setFirstPersonMode] = useState(false);
  const [stormIntensity, setStormIntensity] = useState(
    OCEAN_CONFIG.stormSettings.enabled ? 1 : 0
  );
  const [cloudScale, setCloudScale] = useState(1);
  const [windSpeed, setWindSpeed] = useState(
    OCEAN_CONFIG.stormSettings.windSpeed
  );

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

  // Función para controlar la intensidad de la tormenta
  const toggleStormIntensity = () => {
    setStormIntensity((prev) => (prev > 0 ? 0 : 1));
  };

  // Función para aumentar el tamaño de las nubes
  const increaseCloudScale = () => {
    setCloudScale((prev) => Math.min(prev + 0.1, 2.0));
  };

  // Función para disminuir el tamaño de las nubes
  const decreaseCloudScale = () => {
    setCloudScale((prev) => Math.max(prev - 0.1, 0.5));
  };

  // Función para aumentar la velocidad del viento
  const increaseWindSpeed = () => {
    setWindSpeed((prev) => Math.min(prev + 0.1, 1.2));
  };

  // Función para disminuir la velocidad del viento
  const decreaseWindSpeed = () => {
    setWindSpeed((prev) => Math.max(prev - 0.1, 0.1));
  };

  // Función auxiliar para convertir objeto de posición a array
  const positionToArray = (posObj) => [posObj.x, posObj.y, posObj.z];

  // Iluminación dinámica para tormentas
  useFrame((state, delta) => {
    if (stormLightRef.current) {
      const time = state.clock.getElapsedTime();

      // Simular el movimiento de las nubes y cambios de luz durante la tormenta
      if (stormIntensity > 0) {
        const lightning = Math.random() > 0.99;

        if (lightning) {
          stormLightRef.current.intensity = 2 + Math.random() * 3;
          setTimeout(() => {
            if (stormLightRef.current) stormLightRef.current.intensity = 0.2;
          }, 100);
        }
      }
    }
  });

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
      // Tecla 'S' para activar/desactivar tormenta
      if (e.key === "s" || e.key === "S") {
        toggleStormIntensity();
      }
      // Teclas + y - para modificar el tamaño de las nubes
      if (e.key === "+" || e.key === "=") {
        increaseCloudScale();
      }
      if (e.key === "-" || e.key === "_") {
        decreaseCloudScale();
      }
      // Teclas < y > para modificar la velocidad del viento
      if (e.key === "," || e.key === "<") {
        decreaseWindSpeed();
      }
      if (e.key === "." || e.key === ">") {
        increaseWindSpeed();
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

      {/* Iluminación básica */}
      <ambientLight intensity={stormIntensity > 0 ? 0.2 : 0.5} />

      {/* Luz principal que se oscurece durante la tormenta */}
      <directionalLight
        position={[1, 1, 1]}
        intensity={stormIntensity > 0 ? 0.3 : 0.8}
        castShadow
      />

      {/* Luz direccional para relámpagos */}
      <directionalLight
        ref={stormLightRef}
        position={[100, 100, 100]}
        intensity={0.2}
        color="#8aacff"
        castShadow
      />

      {/* Ambiente según clima */}
      {stormIntensity > 0 ? (
        <StormyEnvironment
          intensity={stormIntensity}
          cloudScale={cloudScale}
          windSpeed={windSpeed}
        />
      ) : (
        <Environment background files={["/nublado.hdr"]} />
      )}

      {/* Efecto de lluvia cuando hay tormenta */}
      {stormIntensity > 0 && (
        <RainEffect
          count={8000}
          velocity={15 * windSpeed}
          opacity={0.6 * OCEAN_CONFIG.stormSettings.rainIntensity}
        />
      )}

      <Suspense fallback={<Placeholder position-y={0.5} scale={[2, 3, 2]} />}>
        <ModelBounds modelRef={modelRef} visible={showBounds}>
          <Model ref={modelRef} />
        </ModelBounds>
      </Suspense>

      {/* Cartel informativo con controles para moverlo */}
      <InfoSign position={positionToArray(SIGN_POSITION)} ref={signRef} />

      {/* Modelo de océano GLTF */}
      {showOcean && (
        <OceanModel
          ref={oceanModelRef}
          position={positionToArray(OCEAN_CONFIG.position)}
          scale={30}
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
            object={activeControl === "sign" ? signRef : oceanModelRef}
            mode={transformMode}
            size={1}
          />

          {/* Panel de controles */}
          <group position={[-300, 0, 0]}>
            {/* Botón para cambiar el modo de transformación */}
            <mesh position={[0, 200, 0]} onClick={toggleTransformMode}>
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
            <mesh position={[0, 150, 0]} onClick={toggleActiveControl}>
              <boxGeometry args={[30, 30, 5]} />
              <meshStandardMaterial
                color={activeControl === "sign" ? "#9b59b6" : "#f39c12"}
              />
            </mesh>

            {/* Botón para activar/desactivar tormenta */}
            <mesh position={[0, 100, 0]} onClick={toggleStormIntensity}>
              <boxGeometry args={[30, 30, 5]} />
              <meshStandardMaterial
                color={stormIntensity > 0 ? "#34495e" : "#7f8c8d"}
              />
            </mesh>

            {/* Controles de nubes - Solo visibles cuando hay tormenta */}
            {stormIntensity > 0 && (
              <>
                {/* Botón para aumentar tamaño de nubes */}
                <mesh position={[-20, 50, 0]} onClick={increaseCloudScale}>
                  <boxGeometry args={[20, 20, 5]} />
                  <meshStandardMaterial color="#27ae60" />
                  <Html position={[0, 0, 3]} center>
                    <div style={{ color: "white", fontSize: "18px" }}>+</div>
                  </Html>
                </mesh>

                {/* Botón para disminuir tamaño de nubes */}
                <mesh position={[20, 50, 0]} onClick={decreaseCloudScale}>
                  <boxGeometry args={[20, 20, 5]} />
                  <meshStandardMaterial color="#c0392b" />
                  <Html position={[0, 0, 3]} center>
                    <div style={{ color: "white", fontSize: "18px" }}>-</div>
                  </Html>
                </mesh>

                {/* Botón para aumentar velocidad del viento */}
                <mesh position={[-20, 20, 0]} onClick={increaseWindSpeed}>
                  <boxGeometry args={[20, 20, 5]} />
                  <meshStandardMaterial color="#2980b9" />
                  <Html position={[0, 0, 3]} center>
                    <div style={{ color: "white", fontSize: "18px" }}>&gt;</div>
                  </Html>
                </mesh>

                {/* Botón para disminuir velocidad del viento */}
                <mesh position={[20, 20, 0]} onClick={decreaseWindSpeed}>
                  <boxGeometry args={[20, 20, 5]} />
                  <meshStandardMaterial color="#8e44ad" />
                  <Html position={[0, 0, 3]} center>
                    <div style={{ color: "white", fontSize: "18px" }}>&lt;</div>
                  </Html>
                </mesh>
              </>
            )}
          </group>

          {/* Visualizador de coordenadas */}
          {showCoordinates && <CoordinatesDisplay target={signRef} />}
          {showOceanCoordinates && (
            <OceanCoordinatesDisplay target={oceanModelRef} />
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
        <Html position={[-300, -60, 0]} center>
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
            <p
              style={{
                margin: "4px 0",
                color: stormIntensity > 0 ? "#34495e" : "#7f8c8d",
              }}
            >
              ■ Clima: {stormIntensity > 0 ? "Tormentoso" : "Normal"}
            </p>
            {stormIntensity > 0 && (
              <>
                <p style={{ margin: "4px 0" }}>
                  ■ Tam. Nubes: {(cloudScale * 100).toFixed(0)}%
                </p>
                <p style={{ margin: "4px 0" }}>
                  ■ Velocidad Viento: {(windSpeed * 100).toFixed(0)}%
                </p>
              </>
            )}
            <p style={{ margin: "8px 0 4px 0" }}>Teclas:</p>
            <p style={{ margin: "4px 0" }}>F: Modo primera persona</p>
            <p style={{ margin: "4px 0" }}>T: Cambiar control</p>
            <p style={{ margin: "4px 0" }}>S: Activar/desactivar tormenta</p>
            {stormIntensity > 0 && (
              <>
                <p style={{ margin: "4px 0" }}>+/-: Tam. nubes</p>
                <p style={{ margin: "4px 0" }}>&lt;/&gt;: Velocidad viento</p>
              </>
            )}
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
