import { useLoader, useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { Suspense, forwardRef, useRef, useState, useEffect } from "react";
import { MeshStandardMaterial, Color, FogExp2 } from "three";
import * as THREE from "three";

const OceanModel = forwardRef((props, ref) => {
  const groupRef = useRef();
  const materialRef = useRef();
  const [stormIntensity, setStormIntensity] = useState(0.5);

  // Cargar el modelo
  const model = useLoader(GLTFLoader, "/ocean/scene.gltf", (loader) => {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");
    loader.setDRACOLoader(dracoLoader);
  });

  // Modificar materiales para aspecto tormentoso
  useEffect(() => {
    if (model) {
      model.scene.traverse((child) => {
        if (child.isMesh) {
          // Guardar referencia al material principal del océano
          if (child.material && child.name.toLowerCase().includes("water")) {
            materialRef.current = child.material;

            // Modificar material para aspecto tormentoso
            child.material = new MeshStandardMaterial({
              color: new Color("#1a3a4a"),
              roughness: 0.7,
              metalness: 0.2,
              envMapIntensity: 1.5,
              fog: true,
            });
          }
        }
      });
    }
  }, [model]);

  // Animar el océano
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Movimiento básico de oleaje
      const time = state.clock.getElapsedTime();

      // Movimiento de olas grandes
      groupRef.current.position.y = Math.sin(time * 0.2) * 5 - 100;

      // Rotación sutil para simular oleaje
      groupRef.current.rotation.x = Math.sin(time * 0.3) * 0.03;
      groupRef.current.rotation.z = Math.cos(time * 0.2) * 0.02;

      // Variar la intensidad de la tormenta
      const newIntensity = 0.3 + Math.abs(Math.sin(time * 0.1)) * 0.5;
      setStormIntensity(newIntensity);

      // Actualizar aspecto del material según la intensidad
      if (materialRef.current) {
        materialRef.current.roughness = 0.5 + newIntensity * 0.3;
        materialRef.current.envMapIntensity = 1.0 + newIntensity * 0.5;
      }
    }
  });

  return (
    <Suspense fallback={null}>
      <group ref={ref}>
        <group
          ref={groupRef}
          scale={props.scale || 30}
          position={props.position || [0, -100, 0]}
          rotation={props.rotation || [0, 0, 0]}
        >
          <primitive object={model.scene} />

          {/* Niebla local para ambiente tormentoso */}
          <fog attach="fog" args={["#062d44", 10, 500]} />

          {/* Luces dinámicas para simular relámpagos */}
          {stormIntensity > 0.6 && (
            <pointLight
              position={[0, 100, 0]}
              intensity={stormIntensity * 50}
              color="#a0eeff"
              distance={500}
              decay={2}
            />
          )}
        </group>
      </group>
    </Suspense>
  );
});

export default OceanModel;
