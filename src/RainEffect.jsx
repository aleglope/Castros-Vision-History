import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function RainEffect({
  count = 5000,
  color = "#eeeeee",
  size = 0.1,
  velocity = 10,
  opacity = 0.6,
  area = 1000,
}) {
  const mesh = useRef();
  const light = useRef();

  // Crear geometría de partículas de lluvia
  const [positions, velocities] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Distribuir partículas en un área amplia
      const x = (Math.random() - 0.5) * area;
      const y = (Math.random() - 0.5) * area + 300; // Altura inicial
      const z = (Math.random() - 0.5) * area;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Velocidad variable para cada gota
      velocities[i] = Math.random() * 0.5 + 0.5;
    }

    return [positions, velocities];
  }, [count, area]);

  // Animación de la lluvia
  useFrame((state, delta) => {
    // Referencia al buffer de posiciones
    const positionArray = mesh.current.geometry.attributes.position.array;

    // Actualizar cada partícula
    for (let i = 0; i < count; i++) {
      // Hacer caer las gotas
      positionArray[i * 3 + 1] -= velocities[i] * velocity * delta;

      // Resetear posición cuando llegan "abajo"
      if (positionArray[i * 3 + 1] < -200) {
        positionArray[i * 3] = (Math.random() - 0.5) * area;
        positionArray[i * 3 + 1] = 200 + Math.random() * 100;
        positionArray[i * 3 + 2] = (Math.random() - 0.5) * area;
      }
    }

    // Marcar el atributo de posición como necesitado de actualización
    mesh.current.geometry.attributes.position.needsUpdate = true;

    // Efecto de luz parpadeante para simular relámpagos
    if (light.current) {
      const time = state.clock.getElapsedTime();
      const lightning = Math.random() > 0.97;

      if (lightning) {
        light.current.intensity = Math.random() * 5 + 1;
        setTimeout(() => {
          if (light.current) light.current.intensity = 0;
        }, 100);
      }
    }
  });

  return (
    <group>
      <points ref={mesh}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={size}
          color={color}
          transparent
          opacity={opacity}
          depthWrite={false}
          vertexColors={false}
          fog={true}
        />
      </points>

      {/* Luz de relámpagos */}
      <directionalLight
        ref={light}
        position={[0, 200, 0]}
        intensity={0}
        color="#b0d5ff"
      />
    </group>
  );
}
