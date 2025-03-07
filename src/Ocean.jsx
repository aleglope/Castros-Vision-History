import React, { useRef, useMemo } from "react";
import { extend, useThree, useLoader, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water.js";

extend({ Water });

function Ocean({ position = [0, -20, 0], size = [5000, 5000] }) {
  const ref = useRef();
  const gl = useThree((state) => state.gl);

  // Cargar la textura de normales para el agua
  const waterNormals = useLoader(THREE.TextureLoader, "/water-normals.jpg");

  // Configurar repetición de textura
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

  // Crear geometría del plano para el agua
  const geom = useMemo(() => new THREE.PlaneGeometry(size[0], size[1]), [size]);

  // Configuración del efecto de agua
  const config = useMemo(
    () => ({
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: new THREE.Vector3(0, 1, 0),
      sunColor: 0xffffff,
      waterColor: 0x0064b5,
      distortionScale: 10,
      fog: false,
      format: gl.encoding,
    }),
    [waterNormals, gl.encoding]
  );

  // Actualizar el tiempo uniforme del shader de agua en cada frame
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.material.uniforms.time.value += delta * 0.5;
    }
  });

  return (
    <water
      ref={ref}
      args={[geom, config]}
      rotation-x={-Math.PI / 2}
      position={position}
    />
  );
}

export default Ocean;
