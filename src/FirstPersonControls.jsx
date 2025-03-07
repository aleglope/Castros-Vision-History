import React, { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Controles en primera persona para "caminar" sobre el modelo
const FirstPersonControls = ({
  active = false,
  walkSpeed = 60,
  turnSpeed = 1,
  modelRef,
  elevationOffset = 5, // Altura por encima de la superficie
}) => {
  const { camera, gl } = useThree();
  const keysPressed = useRef({});
  const lookDirection = useRef(new THREE.Vector3(0, 0, -1));
  const raycaster = useRef(new THREE.Raycaster());
  const originalCameraPosition = useRef(null);
  const originalCameraRotation = useRef(null);
  const targetPosition = useRef(new THREE.Vector3());
  const targetHeight = useRef(0);
  const smoothFactor = 0.15; // Factor de suavizado para el movimiento al caminar

  // Guardar la posición y rotación original de la cámara
  useEffect(() => {
    if (active && !originalCameraPosition.current) {
      originalCameraPosition.current = camera.position.clone();
      originalCameraRotation.current = camera.rotation.clone();
      targetPosition.current.copy(camera.position);
      targetHeight.current = camera.position.y;
    } else if (!active && originalCameraPosition.current) {
      // Restaurar la posición y rotación de la cámara al desactivar
      camera.position.copy(originalCameraPosition.current);
      camera.rotation.copy(originalCameraRotation.current);
      originalCameraPosition.current = null;
      originalCameraRotation.current = null;
    }
  }, [active, camera]);

  // Configuración inicial: posición y orientación
  useEffect(() => {
    if (active && modelRef.current) {
      try {
        // Posición inicial (centro del modelo pero sobre la superficie)
        const boundingBox = new THREE.Box3().setFromObject(modelRef.current);
        const center = boundingBox.getCenter(new THREE.Vector3());

        // Colocar la cámara ligeramente elevada sobre el punto más alto del modelo
        const highPoint = new THREE.Vector3(
          center.x,
          boundingBox.max.y + elevationOffset,
          center.z
        );
        camera.position.copy(highPoint);
        targetPosition.current.copy(highPoint);
        targetHeight.current = highPoint.y;

        // Orientación inicial (mirando horizontalmente hacia adelante)
        camera.lookAt(new THREE.Vector3(center.x, highPoint.y, center.z - 100));
        lookDirection.current.set(0, 0, -1).applyQuaternion(camera.quaternion);

        console.log(
          "Primera persona activada. Haz clic en la pantalla para controlar la cámara."
        );
      } catch (error) {
        console.error(
          "Error al inicializar la vista en primera persona:",
          error
        );
      }
    }
  }, [active, camera, modelRef, elevationOffset]);

  // Capturar eventos de teclado
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e) => {
      keysPressed.current[e.code] = true;
    };

    const handleKeyUp = (e) => {
      keysPressed.current[e.code] = false;
    };

    const handleMouseMove = (e) => {
      if (!active || document.pointerLockElement !== gl.domElement) return;

      try {
        // Rotación horizontal (mirar a los lados)
        const horizontalRotation = -e.movementX * turnSpeed * 0.002;

        // Rotación vertical (mirar arriba/abajo)
        const verticalRotation = -e.movementY * turnSpeed * 0.002;

        // Aplicar rotaciones directamente a la cámara
        camera.rotation.y += horizontalRotation;

        // Limitar la rotación vertical entre -80 y 80 grados
        camera.rotation.x = Math.max(
          -Math.PI * 0.45, // -80 grados aproximadamente
          Math.min(
            Math.PI * 0.45, // 80 grados aproximadamente
            camera.rotation.x + verticalRotation
          )
        );

        // Actualizar el vector de dirección
        lookDirection.current.set(0, 0, -1).applyQuaternion(camera.quaternion);
      } catch (error) {
        console.error("Error al mover la cámara con el ratón:", error);
      }
    };

    const handlePointerLock = () => {
      if (active && document.pointerLockElement !== gl.domElement) {
        gl.domElement.requestPointerLock();
      }
    };

    // Solicitar bloqueo del puntero al activar
    if (active) {
      setTimeout(() => {
        try {
          gl.domElement.requestPointerLock();
        } catch (error) {
          console.error("Error al solicitar bloqueo del puntero:", error);
        }
      }, 100);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    document.addEventListener("mousemove", handleMouseMove);
    gl.domElement.addEventListener("click", handlePointerLock);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("mousemove", handleMouseMove);
      gl.domElement.removeEventListener("click", handlePointerLock);

      // Liberar bloqueo del puntero al desactivar
      if (document.pointerLockElement === gl.domElement) {
        document.exitPointerLock();
      }
    };
  }, [active, gl.domElement, turnSpeed, camera]);

  // Lógica de movimiento en cada frame - con suavizado simple
  useFrame((state, delta) => {
    if (!active || !modelRef.current) return;

    try {
      // Vectores de movimiento
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
        camera.quaternion
      );
      forward.y = 0; // Mantener movimiento horizontal
      forward.normalize();

      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(
        camera.quaternion
      );
      right.y = 0; // Mantener movimiento horizontal
      right.normalize();

      // Acumular movimiento basado en teclas presionadas
      const moveVector = new THREE.Vector3(0, 0, 0);

      if (keysPressed.current["KeyW"]) moveVector.add(forward);
      if (keysPressed.current["KeyS"]) moveVector.sub(forward);
      if (keysPressed.current["KeyA"]) moveVector.sub(right);
      if (keysPressed.current["KeyD"]) moveVector.add(right);

      // Si hay movimiento, normalizar y aplicar velocidad
      if (moveVector.length() > 0) {
        moveVector.normalize().multiplyScalar(walkSpeed * delta);

        // Calcular la posición objetivo sumando el movimiento a la posición actual
        targetPosition.current.copy(camera.position).add(moveVector);

        // Raycast hacia abajo para encontrar la altura del terreno
        raycaster.current.set(
          new THREE.Vector3(
            targetPosition.current.x,
            1000,
            targetPosition.current.z
          ),
          new THREE.Vector3(0, -1, 0)
        );

        const intersects = raycaster.current.intersectObject(
          modelRef.current,
          true
        );

        if (intersects.length > 0) {
          // Actualizar la altura objetivo basada en el terreno + offset
          targetHeight.current = intersects[0].point.y + elevationOffset;
        }
      }

      // Aplicar suavizado al movimiento - movernos hacia la posición objetivo
      if (!targetPosition.current.equals(camera.position)) {
        // Mover horizontalmente con interpolación
        camera.position.x +=
          (targetPosition.current.x - camera.position.x) * smoothFactor;
        camera.position.z +=
          (targetPosition.current.z - camera.position.z) * smoothFactor;

        // Suavizar también la altura
        camera.position.y +=
          (targetHeight.current - camera.position.y) * smoothFactor;
      }
    } catch (error) {
      console.error("Error en el movimiento de la cámara:", error);
    }
  });

  return null;
};

export default FirstPersonControls;
