import React, { useRef, useMemo, forwardRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";

// Definir el shader personalizado para las ondas del océano
const OceanMaterial = shaderMaterial(
  // Uniforms
  {
    uTime: 0,
    uBigWavesElevation: 0.15,
    uBigWavesFrequency: new THREE.Vector2(4, 1.5),
    uBigWaveSpeed: 0.75,
    uSmallWavesElevation: 0.15,
    uSmallWavesFrequency: 3.0,
    uSmallWavesSpeed: 0.2,
    uSmallWavesIterations: 4.0,
    uDepthColor: new THREE.Color("#0077be"),
    uSurfaceColor: new THREE.Color("#8ab4f8"),
    uColorOffset: 0.08,
    uColorMultiplier: 5.0,
  },
  // Vertex Shader
  `
    uniform float uTime;
    uniform float uBigWavesElevation;
    uniform vec2 uBigWavesFrequency;
    uniform float uBigWaveSpeed;
    uniform float uSmallWavesElevation;
    uniform float uSmallWavesFrequency;
    uniform float uSmallWavesSpeed;
    uniform float uSmallWavesIterations;

    varying float vElevation;
    varying vec3 vNormal;
    varying vec3 vPosition;

    // Función para ondas Gerstner
    vec3 gerstnerWave(vec3 position, float steepness, float wavelength, float speed, vec2 direction) {
      direction = normalize(direction);
      float k = 2.0 * 3.14159 / wavelength;
      float f = k * (dot(direction, position.xz) - speed * uTime);
      float a = steepness / k;
      
      return vec3(
        direction.x * (a * cos(f)),
        a * sin(f),
        direction.y * (a * cos(f))
      );
    }

    void main() {
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      
      // Coordenadas para ondas
      float x = modelPosition.x;
      float z = modelPosition.z;

      // Elevación para ondas grandes (Gerstner)
      vec3 wave1 = gerstnerWave(modelPosition.xyz, 0.1, 10.0, uBigWaveSpeed * 0.5, vec2(1.0, 1.0));
      vec3 wave2 = gerstnerWave(modelPosition.xyz, 0.1, 8.0, uBigWaveSpeed * 0.8, vec2(0.7, 0.3));
      vec3 wave3 = gerstnerWave(modelPosition.xyz, 0.05, 5.0, uBigWaveSpeed, vec2(-0.2, 0.5));
      
      // Sumar todas las ondas
      float elevation = 
        wave1.y + 
        wave2.y + 
        wave3.y;
      
      // Ondas pequeñas usando ruido
      for(float i = 1.0; i <= uSmallWavesIterations; i++) {
        elevation -= abs(
          sin(x * uSmallWavesFrequency * i + uTime * uSmallWavesSpeed) * 
          sin(z * uSmallWavesFrequency * i + uTime * uSmallWavesSpeed)
        ) * uSmallWavesElevation / i;
      }
      
      modelPosition.y += elevation;
      
      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectedPosition = projectionMatrix * viewPosition;
      
      gl_Position = projectedPosition;
      
      // Enviar variables al fragment shader
      vElevation = elevation;
      vPosition = modelPosition.xyz;
      
      // Calcular normal para reflejos
      vec3 modified = position + vec3(wave1 + wave2 + wave3);
      vNormal = normalize(normalMatrix * normal + 0.2 * vec3(modified));
    }
  `,
  // Fragment Shader
  `
    uniform vec3 uDepthColor;
    uniform vec3 uSurfaceColor;
    uniform float uColorOffset;
    uniform float uColorMultiplier;

    varying float vElevation;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      // Mezclar colores basado en la elevación
      float mixStrength = (vElevation + uColorOffset) * uColorMultiplier;
      vec3 color = mix(uDepthColor, uSurfaceColor, mixStrength);
      
      // Añadir brillo especular simple
      vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
      float specular = pow(max(0.0, dot(reflect(-lightDirection, vNormal), vec3(0.0, 0.0, 1.0))), 10.0);
      color += specular * 0.5;

      gl_FragColor = vec4(color, 0.8);
    }
  `
);

// Extender Three.js con nuestro material personalizado
extend({ OceanMaterial });

// Componente principal
const GerstnerOcean = forwardRef(
  (
    {
      position = [0, 0, 0],
      size = [5000, 5000],
      resolution = [128, 128],
      color = {
        depth: "#0077be",
        surface: "#8ab4f8",
      },
      waves = {
        bigWavesElevation: 0.15,
        bigWavesFrequency: [4, 1.5],
        bigWaveSpeed: 0.75,
        smallWavesElevation: 0.15,
        smallWavesFrequency: 3.0,
        smallWavesSpeed: 0.2,
        smallWavesIterations: 4,
      },
      ...props
    },
    ref
  ) => {
    const localRef = useRef();
    const materialRef = useRef();
    const oceanRef = ref || localRef;

    // Crear geometría
    const geometry = useMemo(
      () =>
        new THREE.PlaneGeometry(size[0], size[1], resolution[0], resolution[1]),
      [size, resolution]
    );

    // Actualizar uniforms en cada frame
    useFrame((state) => {
      if (materialRef.current) {
        materialRef.current.uTime = state.clock.getElapsedTime();
      }
    });

    // Configurar uniforms iniciales
    useMemo(() => {
      if (materialRef.current) {
        // Configuración de colores
        materialRef.current.uDepthColor = new THREE.Color(color.depth);
        materialRef.current.uSurfaceColor = new THREE.Color(color.surface);

        // Configuración de ondas grandes
        materialRef.current.uBigWavesElevation = waves.bigWavesElevation;
        materialRef.current.uBigWavesFrequency = new THREE.Vector2(
          waves.bigWavesFrequency[0],
          waves.bigWavesFrequency[1]
        );
        materialRef.current.uBigWaveSpeed = waves.bigWaveSpeed;

        // Configuración de ondas pequeñas
        materialRef.current.uSmallWavesElevation = waves.smallWavesElevation;
        materialRef.current.uSmallWavesFrequency = waves.smallWavesFrequency;
        materialRef.current.uSmallWavesSpeed = waves.smallWavesSpeed;
        materialRef.current.uSmallWavesIterations = waves.smallWavesIterations;
      }
    }, [color, waves]);

    return (
      <mesh
        ref={oceanRef}
        position={position}
        rotation={[-Math.PI / 2, 0, 0]}
        {...props}
      >
        <bufferGeometry attach="geometry" {...geometry} />
        <oceanMaterial ref={materialRef} transparent side={THREE.DoubleSide} />
      </mesh>
    );
  }
);

export default GerstnerOcean;
