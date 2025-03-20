import { useRef, useState, useEffect } from "react";
import { Cloud, Clouds } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function StormyClouds({
  cloudScale = 1,
  opacity = 0.8,
  windSpeed = 0.4,
  enabled = true,
}) {
  const cloudsRef = useRef();
  const [clouds, setClouds] = useState([
    {
      id: 1,
      opacity: 0.9,
      speed: 0.4,
      width: 100,
      depth: 20,
      segments: 40,
      position: [0, 150, 0],
    },
    {
      id: 2,
      opacity: 0.7,
      speed: 0.3,
      width: 200,
      depth: 30,
      segments: 50,
      position: [-100, 180, -100],
    },
    {
      id: 3,
      opacity: 0.85,
      speed: 0.5,
      width: 150,
      depth: 25,
      segments: 45,
      position: [100, 160, 100],
    },
    {
      id: 4,
      opacity: 0.75,
      speed: 0.35,
      width: 120,
      depth: 22,
      segments: 42,
      position: [-150, 170, 80],
    },
    {
      id: 5,
      opacity: 0.8,
      speed: 0.45,
      width: 180,
      depth: 28,
      segments: 48,
      position: [80, 190, -120],
    },
  ]);

  // Efecto de viento en las nubes
  useFrame((state, delta) => {
    if (cloudsRef.current && enabled) {
      cloudsRef.current.children.forEach((cloud, index) => {
        // Movimiento de deriva lento
        cloud.position.x +=
          Math.sin(state.clock.elapsedTime * 0.1 + index) *
          windSpeed *
          0.1 *
          delta;
        cloud.position.z +=
          Math.cos(state.clock.elapsedTime * 0.15 + index * 2) *
          windSpeed *
          0.08 *
          delta;
      });
    }
  });

  return (
    <group>
      <Clouds material={THREE.MeshLambertMaterial} ref={cloudsRef}>
        {clouds.map((cloud) => (
          <Cloud
            key={cloud.id}
            opacity={cloud.opacity * opacity}
            speed={cloud.speed * windSpeed}
            width={cloud.width * cloudScale}
            depth={cloud.depth * cloudScale}
            segments={cloud.segments}
            position={[cloud.position[0], cloud.position[1], cloud.position[2]]}
          />
        ))}
      </Clouds>
    </group>
  );
}
