import React, { useState, useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function ModelBounds({
  modelRef,
  visible = true,
  color = "#ff0000",
  children,
}) {
  const [bounds, setBounds] = useState({
    min: { x: 0, y: 0, z: 0 },
    max: { x: 0, y: 0, z: 0 },
    size: { x: 0, y: 0, z: 0 },
    center: { x: 0, y: 0, z: 0 },
  });
  const boxRef = useRef();
  const { scene } = useThree();

  // Calcular los límites del modelo
  useEffect(() => {
    if (!modelRef || !modelRef.current) return;

    // Pequeño retraso para asegurar que el modelo esté cargado
    const timeout = setTimeout(() => {
      // Método 1: Usar la caja de colisión de Three.js
      const box = new THREE.Box3().setFromObject(modelRef.current);

      const min = box.min;
      const max = box.max;
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      setBounds({
        min: { x: min.x, y: min.y, z: min.z },
        max: { x: max.x, y: max.y, z: max.z },
        size: { x: size.x, y: size.y, z: size.z },
        center: { x: center.x, y: center.y, z: center.z },
      });

      // Mostrar información en la consola para ayudar a posicionar el océano
      console.log("Límites del modelo:", {
        min: { x: min.x, y: min.y, z: min.z },
        max: { x: max.x, y: max.y, z: max.z },
        size: { x: size.x, y: size.y, z: size.z },
        center: { x: center.x, y: center.y, z: center.z },
      });

      // Sugerencia para la posición del océano
      const oceanY = min.y - 10; // 10 unidades por debajo del mínimo Y
      const oceanSize = Math.max(size.x, size.z) * 2; // Suficientemente grande para cubrir el modelo

      console.log("Sugerencia para el océano:", {
        position: [center.x, oceanY, center.z],
        size: [oceanSize, oceanSize],
      });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [modelRef]);

  return (
    <>
      {visible && (
        <mesh
          ref={boxRef}
          position={[bounds.center.x, bounds.center.y, bounds.center.z]}
        >
          <boxGeometry args={[bounds.size.x, bounds.size.y, bounds.size.z]} />
          <meshBasicMaterial
            color={color}
            wireframe={true}
            transparent={true}
            opacity={0.3}
          />
        </mesh>
      )}
      {children && React.cloneElement(children, { boundsData: bounds })}
    </>
  );
}
