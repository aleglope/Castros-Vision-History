import React, { useRef, useMemo, forwardRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const LowPolyOcean = forwardRef(
  (
    {
      position = [0, -10, 0],
      size = [5000, 5000],
      segments = [50, 50],
      color = "#0077be",
      waveHeight = 20,
      waveSpeed = 0.5,
      ...props
    },
    ref
  ) => {
    const meshRef = useRef();
    const geoRef = useRef();

    // Usar la referencia externa si se proporciona, de lo contrario usar la interna
    const oceanRef = ref || meshRef;

    // Crear geometría
    const geometry = useMemo(() => {
      const geo = new THREE.PlaneGeometry(
        size[0],
        size[1],
        segments[0],
        segments[1]
      );
      // Desordenar ligeramente los vértices para un efecto low poly
      const positionAttribute = geo.attributes.position;
      const vertex = new THREE.Vector3();

      for (let i = 0; i < positionAttribute.count; i++) {
        vertex.fromBufferAttribute(positionAttribute, i);

        // No alterar los bordes demasiado para mantener forma rectangular
        const isEdge =
          i < segments[0] + 1 ||
          i % (segments[0] + 1) === 0 ||
          i % (segments[0] + 1) === segments[0] ||
          i > positionAttribute.count - segments[0] - 2;

        if (!isEdge) {
          // Añadir un poco de aleatoriedad en xz
          vertex.x += (Math.random() - 0.5) * 15;
          vertex.z += (Math.random() - 0.5) * 15;
        }

        positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }

      // Necesario para el efecto de luces
      geo.computeVertexNormals();
      return geo;
    }, [size, segments]);

    // Animar olas
    useFrame((state) => {
      if (geoRef.current) {
        const time = state.clock.getElapsedTime();
        const positionAttribute = geoRef.current.attributes.position;
        const vertex = new THREE.Vector3();

        for (let i = 0; i < positionAttribute.count; i++) {
          vertex.fromBufferAttribute(positionAttribute, i);

          // Coordenadas originales
          const initialX = vertex.x;
          const initialZ = vertex.z;

          // Calcular olas usando seno y coseno con diferencia de fase para más naturalidad
          vertex.y =
            Math.sin(initialX * 0.05 + time * waveSpeed) *
            Math.cos(initialZ * 0.05 + time * waveSpeed * 0.8) *
            waveHeight;

          positionAttribute.setY(i, vertex.y);
        }

        positionAttribute.needsUpdate = true;
        geoRef.current.computeVertexNormals();
      }
    });

    return (
      <mesh
        ref={oceanRef}
        position={position}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        {...props}
      >
        <bufferGeometry ref={geoRef} {...geometry} />
        <meshPhongMaterial
          color={color}
          side={THREE.DoubleSide}
          flatShading={true}
          shininess={100}
          specular={new THREE.Color("#ffffff")}
        />
      </mesh>
    );
  }
);

export default LowPolyOcean;
