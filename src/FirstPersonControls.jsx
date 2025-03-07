import React, { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Controles en primera persona para "caminar" sobre el modelo
const FirstPersonControls = ({
  active = false,
  walkSpeed = 250, // Velocidad aún mayor
  turnSpeed = 1,
  modelRef,
  elevationOffset = 10, // Altura por encima de la superficie
}) => {
  const { camera, gl } = useThree();
  const keysPressed = useRef({});
  const lookDirection = useRef(new THREE.Vector3(0, 0, -1));
  const raycaster = useRef(new THREE.Raycaster());
  const originalCameraPosition = useRef(null);
  const originalCameraRotation = useRef(null);

  // Sistema simplificado para movimiento fluido
  const targetPosition = useRef(new THREE.Vector3());
  const fixedHeight = useRef(0);
  const baseModelHeight = useRef(0);
  const walkingOffset = useRef(0);
  const walkingTime = useRef(0);

  // Parámetros para el movimiento fluido
  const lerpFactor = 0.5; // Factor de interpolación aún mayor

  // Referencias para optimización
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const moveDirection = useRef(new THREE.Vector3());

  // Memoria de dirección para movimiento suave
  const lastMoveDirection = useRef(new THREE.Vector3());
  const isMoving = useRef(false);

  // Calcular la altura base del modelo solo una vez
  const initModelHeight = () => {
    if (!modelRef.current) return 0;

    try {
      // Obtener la altura base del modelo calculando un promedio de varios puntos
      const boundingBox = new THREE.Box3().setFromObject(modelRef.current);
      const center = boundingBox.getCenter(new THREE.Vector3());

      // Realizar un solo raycast para encontrar una altura aproximada
      const ray = new THREE.Raycaster(
        new THREE.Vector3(center.x, boundingBox.max.y + 100, center.z),
        new THREE.Vector3(0, -1, 0)
      );

      const hits = ray.intersectObject(modelRef.current, true);

      if (hits.length > 0) {
        // Si encontramos una intersección, usar esa altura
        return hits[0].point.y;
      } else {
        // Si no, usar el punto más bajo del modelo
        return boundingBox.min.y;
      }
    } catch (error) {
      console.error("Error al calcular altura del modelo:", error);
      return 0;
    }
  };

  // Guardar la posición y rotación original de la cámara
  useEffect(() => {
    if (active && !originalCameraPosition.current) {
      originalCameraPosition.current = camera.position.clone();
      originalCameraRotation.current = camera.rotation.clone();

      // Calcular altura base del modelo solo una vez
      baseModelHeight.current = initModelHeight();

      // Ajustar la altura fija de la cámara
      fixedHeight.current = baseModelHeight.current + elevationOffset;

      // Actualizar posición inicial
      targetPosition.current.copy(camera.position);
      camera.position.y = fixedHeight.current;
      targetPosition.current.y = fixedHeight.current;

      // Importante para evitar el problema de gimbal lock
      camera.rotation.order = "YXZ";
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

        // Calcular altura base una vez
        baseModelHeight.current = initModelHeight();

        // Ajustar altura fija
        fixedHeight.current = baseModelHeight.current + elevationOffset;

        // Colocar la cámara ligeramente elevada sobre el punto más alto del modelo
        const highPoint = new THREE.Vector3(
          center.x,
          fixedHeight.current,
          center.z
        );
        camera.position.copy(highPoint);
        targetPosition.current.copy(highPoint);

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

        // Actualizar el vector de dirección (solo cuando se mueve el ratón)
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

  // Lógica de movimiento en cada frame - Simplificada al máximo
  useFrame((state, delta) => {
    if (!active || !modelRef.current) return;

    try {
      // Calcular velocidad base con delta time
      const speed = walkSpeed * delta;

      // Reusar vectores preexistentes para rendimiento
      forward.current.set(0, 0, -1).applyQuaternion(camera.quaternion);
      forward.current.y = 0;
      forward.current.normalize();

      right.current.set(1, 0, 0).applyQuaternion(camera.quaternion);
      right.current.y = 0;
      right.current.normalize();

      // Comprobar qué teclas están presionadas
      moveDirection.current.set(0, 0, 0);

      const wKey = keysPressed.current["KeyW"];
      const sKey = keysPressed.current["KeyS"];
      const aKey = keysPressed.current["KeyA"];
      const dKey = keysPressed.current["KeyD"];

      // Determinar si se está moviendo
      const wasMoving = isMoving.current;
      isMoving.current = wKey || sKey || aKey || dKey;

      if (wKey) moveDirection.current.add(forward.current);
      if (sKey) moveDirection.current.sub(forward.current);
      if (aKey) moveDirection.current.sub(right.current);
      if (dKey) moveDirection.current.add(right.current);

      // Solo aplicar movimiento si hay dirección
      if (moveDirection.current.length() > 0) {
        moveDirection.current.normalize().multiplyScalar(speed);

        // Suavizar dirección para evitar microstuttering
        moveDirection.current.lerp(lastMoveDirection.current, 0.2);
        lastMoveDirection.current.copy(moveDirection.current);

        // Actualizar posición objetivo (manteniendo altura fija)
        targetPosition.current.x = camera.position.x + moveDirection.current.x;
        targetPosition.current.z = camera.position.z + moveDirection.current.z;

        // Actualizar tiempo para oscilación de caminar
        walkingTime.current += delta * 10; // Velocidad de oscilación

        // Pequeña oscilación vertical para simular pasos (solo si está caminando)
        if (isMoving.current) {
          // Calcular una pequeña oscilación basada en un seno
          walkingOffset.current = Math.sin(walkingTime.current) * 0.15;
        } else {
          // Reducir gradualmente la oscilación al detenerse
          walkingOffset.current *= 0.9;
        }

        // Aplicar altura base más oscilación
        targetPosition.current.y = fixedHeight.current + walkingOffset.current;
      } else {
        // Reducir dirección residual al detenerse
        lastMoveDirection.current.multiplyScalar(0.7);

        // Reducir efecto de oscilación al detenerse
        walkingOffset.current *= 0.9;

        // Mantener la posición actual
        targetPosition.current.copy(camera.position);
        targetPosition.current.y = fixedHeight.current + walkingOffset.current;
      }

      // Aplicar movimiento con interpolación fuerte para mayor suavidad
      camera.position.x +=
        (targetPosition.current.x - camera.position.x) * lerpFactor;
      camera.position.z +=
        (targetPosition.current.z - camera.position.z) * lerpFactor;
      camera.position.y +=
        (targetPosition.current.y - camera.position.y) * lerpFactor;
    } catch (error) {
      console.error("Error en el movimiento de la cámara:", error);
    }
  });

  return null;
};

export default FirstPersonControls;
