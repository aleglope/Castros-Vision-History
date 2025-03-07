import { Text, Plane } from "@react-three/drei";
import { useRef, forwardRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { SIGN_SCALE, SIGN_ROTATION } from "./config";

const InfoSign = forwardRef(({ position = [0, 0, 0] }, ref) => {
  const innerRef = useRef();
  const signRef = ref || innerRef;
  const torchLightRef1 = useRef();
  const torchLightRef2 = useRef();

  // Efecto de balanceo suave para dar sensación de exposición al viento
  useFrame((state) => {
    if (signRef.current) {
      // Aplicamos un pequeño balanceo en el eje Z manteniendo la rotación base
      signRef.current.rotation.z =
        SIGN_ROTATION.z + Math.sin(state.clock.elapsedTime * 0.3) * 0.02;
    }

    // Efecto de parpadeo de las llamas de las antorchas
    if (torchLightRef1.current) {
      torchLightRef1.current.intensity =
        1 + Math.sin(state.clock.elapsedTime * 8) * 0.3;
    }
    if (torchLightRef2.current) {
      torchLightRef2.current.intensity =
        1 + Math.sin(state.clock.elapsedTime * 8 + 1) * 0.3;
    }
  });

  const signInfo = {
    title: "Castro de Baroña",
    year: "Siglo I a.C. - I d.C.",
    description: [
      "Asentamiento fortificado de la cultura castreña",
      "ubicado en Puerto del Son, La Coruña, Galicia.",
      "Construido en una pequeña península rocosa",
      "con un foso de 60m de largo por 4m de ancho.",
      "Destacan sus dos murallas defensivas y hasta",
      "veinte viviendas de planta circular u oval.",
      "Uno de los pocos castros cuya economía se basaba",
      "en recursos marítimos además de la agricultura.",
      "Declarado Patrimonio Artístico Nacional",
      "y Bien de Interés Cultural en 1933.",
    ],
  };

  // Componente para reutilizar las antorchas
  const Torch = ({ position, rotation, lightRef }) => (
    <group position={position} rotation={rotation || [0, 0, Math.PI / 8]}>
      {/* Palo de la antorcha */}
      <mesh>
        <cylinderGeometry args={[0.08, 0.1, 1.5]} />
        <meshStandardMaterial color="#513222" roughness={1} />
      </mesh>

      {/* Soporte de metal */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.1]} />
        <meshStandardMaterial color="#555555" roughness={0.6} metalness={0.8} />
      </mesh>

      {/* Fuego de la antorcha */}
      <mesh position={[0, 0.95, 0]}>
        <coneGeometry args={[0.2, 0.4, 8]} />
        <meshBasicMaterial color="#ff4500" />
      </mesh>

      {/* Luz de la antorcha */}
      <pointLight
        ref={lightRef}
        position={[0, 0.95, 0]}
        intensity={1.5}
        distance={10 * SIGN_SCALE}
        color="#ff7700"
      />
    </group>
  );

  return (
    <group
      position={position}
      ref={signRef}
      rotation={[SIGN_ROTATION.x, SIGN_ROTATION.y, SIGN_ROTATION.z]}
      scale={[SIGN_SCALE, SIGN_SCALE, SIGN_SCALE]}
    >
      {/* Base del cartel (madera antigua) */}
      <Plane args={[8, 6]} position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <meshStandardMaterial
          color="#8B4513"
          roughness={0.9}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </Plane>

      {/* Marco del cartel */}
      <Plane args={[7.6, 5.6]} position={[0, 0, 0.05]} rotation={[0, 0, 0]}>
        <meshStandardMaterial
          color="#A38A5B"
          roughness={0.8}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </Plane>

      {/* Título */}
      <Text
        position={[0, 2.1, 0.1]}
        fontSize={0.65}
        color="#422006"
        anchorX="center"
        anchorY="middle"
        maxWidth={7}
        textAlign="center"
        letterSpacing={0.05}
      >
        {signInfo.title}
      </Text>

      {/* Año */}
      <Text
        position={[0, 1.4, 0.1]}
        fontSize={0.45}
        color="#422006"
        anchorX="center"
        anchorY="middle"
        maxWidth={7}
        textAlign="center"
      >
        {signInfo.year}
      </Text>

      {/* Descripción - Con mayor espacio entre líneas */}
      <group position={[0, 0.2, 0]}>
        {signInfo.description.map((line, index) => (
          <Text
            key={index}
            position={[0, 0 - index * 0.32, 0.1]}
            fontSize={0.28}
            maxWidth={7}
            color="#422006"
            anchorX="center"
            anchorY="middle"
            textAlign="center"
            letterSpacing={0.02}
          >
            {line}
          </Text>
        ))}
      </group>

      {/* Postes de soporte */}
      <mesh position={[-3.5, -3, -0.5]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 3]} />
        <meshStandardMaterial color="#5D4037" roughness={1} />
      </mesh>
      <mesh position={[3.5, -3, -0.5]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 3]} />
        <meshStandardMaterial color="#5D4037" roughness={1} />
      </mesh>

      {/* Antorchas decorativas */}
      <Torch
        position={[-4, 1, 0.5]}
        rotation={[0, 0, Math.PI / 8]}
        lightRef={torchLightRef1}
      />
      <Torch
        position={[4, 1, 0.5]}
        rotation={[0, 0, -Math.PI / 8]}
        lightRef={torchLightRef2}
      />
    </group>
  );
});

export default InfoSign;
