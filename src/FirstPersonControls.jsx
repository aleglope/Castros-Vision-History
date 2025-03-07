import React, { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Controles en primera persona para "caminar" sobre el modelo
const FirstPersonControls = ({
  active = false,
  walkSpeed = 250, // Velocidad aún mayor
  turnSpeed = 1,
  modelRef,
  elevationOffset = 1, // Altura por encima de la superficie
}) => {
  const { camera, gl, scene } = useThree();
  const keysPressed = useRef({});
  const lookDirection = useRef(new THREE.Vector3(0, 0, -1));
  const originalCameraPosition = useRef(null);
  const originalCameraRotation = useRef(null);

  // Sistema simplificado para movimiento fluido
  const targetPosition = useRef(new THREE.Vector3());
  const walkingOffset = useRef(0);
  const walkingTime = useRef(0);

  // Sistema de bounding box para detección de altura
  const modelBoundingBox = useRef(new THREE.Box3());
  const characterBoundingBox = useRef(new THREE.Box3());
  const characterSize = useRef(new THREE.Vector3(1, 2, 1)); // Tamaño del "personaje"
  const terrainY = useRef(0);

  // Sistema de navegación por waypoints
  const waypoints = useRef([]);
  const currentWaypoint = useRef(-1); // -1 significa que no está siguiendo waypoints
  const waypointHelpers = useRef([]);
  const pathLines = useRef(null);
  const followingPath = useRef(false);
  const waypointReachedDistance = 2; // Distancia en unidades para considerar alcanzado un waypoint

  // Parámetros para el movimiento fluido
  const lerpFactor = 0.5; // Factor de interpolación aún mayor

  // Referencias para optimización
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const moveDirection = useRef(new THREE.Vector3());

  // Memoria de dirección para movimiento suave
  const lastMoveDirection = useRef(new THREE.Vector3());
  const isMoving = useRef(false);

  // Inicializar bounding box del modelo
  const initModelBoundingBox = () => {
    if (!modelRef.current) return;

    try {
      // Calcular bounding box del modelo una sola vez
      modelBoundingBox.current.setFromObject(modelRef.current);

      // Obtener la altura del terreno (punto más alto del modelo)
      terrainY.current = modelBoundingBox.current.max.y;

      console.log("Altura del terreno detectada:", terrainY.current);
    } catch (error) {
      console.error("Error al inicializar bounding box:", error);
    }
  };

  // Actualizar el bounding box del personaje
  const updateCharacterBoundingBox = (position) => {
    characterBoundingBox.current.setFromCenterAndSize(
      position,
      characterSize.current
    );
  };

  // Añadir un nuevo waypoint a la ruta
  const addWaypoint = (position) => {
    // Crear un nuevo waypoint en la posición dada
    const waypoint = new THREE.Vector3(position.x, position.y, position.z);
    waypoints.current.push(waypoint);

    // Crear un helper visual para el waypoint (una esfera)
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(waypoint);
    scene.add(sphere);
    waypointHelpers.current.push(sphere);

    // Actualizar la línea de ruta
    updatePathLine();

    console.log(
      `Waypoint ${waypoints.current.length} añadido en ${waypoint.x}, ${waypoint.y}, ${waypoint.z}`
    );
    return waypoints.current.length - 1;
  };

  // Eliminar todos los waypoints
  const clearWaypoints = () => {
    // Eliminar helpers visuales
    waypointHelpers.current.forEach((helper) => {
      scene.remove(helper);
    });
    waypointHelpers.current = [];

    // Eliminar línea de ruta
    if (pathLines.current) {
      scene.remove(pathLines.current);
      pathLines.current = null;
    }

    // Limpiar array de waypoints
    waypoints.current = [];
    currentWaypoint.current = -1;
    followingPath.current = false;

    console.log("Ruta borrada");
  };

  // Actualizar la línea de visualización de la ruta
  const updatePathLine = () => {
    // Eliminar línea anterior si existe
    if (pathLines.current) {
      scene.remove(pathLines.current);
    }

    // Si hay menos de 2 waypoints, no hay línea que dibujar
    if (waypoints.current.length < 2) return;

    // Crear nueva geometría de línea
    const points = [];
    waypoints.current.forEach((waypoint) => {
      points.push(waypoint.clone());
    });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xffff00 });
    pathLines.current = new THREE.Line(geometry, material);
    scene.add(pathLines.current);
  };

  // Iniciar seguimiento de la ruta de waypoints
  const followPath = (startIndex = 0) => {
    if (waypoints.current.length === 0) {
      console.warn("No hay waypoints definidos para seguir");
      return;
    }

    currentWaypoint.current = Math.min(
      startIndex,
      waypoints.current.length - 1
    );
    followingPath.current = true;

    console.log(`Siguiendo ruta desde waypoint ${currentWaypoint.current + 1}`);
  };

  // Detener seguimiento de la ruta
  const stopFollowingPath = () => {
    followingPath.current = false;
    console.log("Seguimiento de ruta detenido");
  };

  // Exponer métodos al contexto externo
  React.useEffect(() => {
    // Exponer API de waypoints al objeto window para poder usarla desde la consola
    window.waypointAPI = {
      addWaypoint: (x, y, z) => {
        // Si no se proporciona y, usar la altura del terreno + offset
        const yPos = y !== undefined ? y : terrainY.current + elevationOffset;
        return addWaypoint(new THREE.Vector3(x, yPos, z));
      },
      addCurrentPosition: () => {
        return addWaypoint(camera.position.clone());
      },
      clearWaypoints,
      followPath,
      stopFollowingPath,
      getWaypoints: () => [...waypoints.current],
    };

    return () => {
      // Limpiar la API al desmontar
      delete window.waypointAPI;
    };
  }, []);

  // Guardar la posición y rotación original de la cámara
  useEffect(() => {
    if (active && !originalCameraPosition.current) {
      originalCameraPosition.current = camera.position.clone();
      originalCameraRotation.current = camera.rotation.clone();

      // Inicializar bounding box del modelo
      initModelBoundingBox();

      // Posicionar la cámara inicialmente
      targetPosition.current.copy(camera.position);
      camera.position.y = terrainY.current + elevationOffset;
      targetPosition.current.y = camera.position.y;

      // Inicializar el bounding box del personaje
      updateCharacterBoundingBox(camera.position);

      // Importante para evitar el problema de gimbal lock
      camera.rotation.order = "YXZ";
    } else if (!active && originalCameraPosition.current) {
      // Restaurar la posición y rotación de la cámara al desactivar
      camera.position.copy(originalCameraPosition.current);
      camera.rotation.copy(originalCameraRotation.current);
      originalCameraPosition.current = null;
      originalCameraRotation.current = null;

      // Limpiar sistema de waypoints
      clearWaypoints();
    }
  }, [active, camera]);

  // Configuración inicial: posición y orientación
  useEffect(() => {
    if (active && modelRef.current) {
      try {
        // Inicializar bounding box del modelo
        initModelBoundingBox();

        // Posición inicial (centro del modelo pero sobre la superficie)
        const center = new THREE.Vector3();
        modelBoundingBox.current.getCenter(center);

        // Colocar la cámara ligeramente elevada sobre el punto más alto del modelo
        const highPoint = new THREE.Vector3(
          center.x,
          terrainY.current + elevationOffset,
          center.z
        );
        camera.position.copy(highPoint);
        targetPosition.current.copy(highPoint);

        // Inicializar el bounding box del personaje
        updateCharacterBoundingBox(camera.position);

        // Orientación inicial (mirando horizontalmente hacia adelante)
        camera.lookAt(new THREE.Vector3(center.x, highPoint.y, center.z - 100));
        lookDirection.current.set(0, 0, -1).applyQuaternion(camera.quaternion);

        console.log(
          "Primera persona activada. Haz clic en la pantalla para controlar la cámara. " +
            "Usa waypointAPI desde la consola para crear rutas."
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

      // Atajos de teclado para control de waypoints
      if (e.code === "KeyP" && e.shiftKey) {
        // Shift+P: Añadir waypoint en posición actual
        addWaypoint(camera.position.clone());
      } else if (e.code === "KeyC" && e.shiftKey) {
        // Shift+C: Borrar todos los waypoints
        clearWaypoints();
      } else if (e.code === "KeyF" && e.shiftKey) {
        // Shift+F: Comenzar/detener seguimiento de ruta
        if (followingPath.current) {
          stopFollowingPath();
        } else {
          followPath(0);
        }
      }
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

  // Función para mover hacia un waypoint
  const moveTowardsWaypoint = (waypoint, delta) => {
    // Calcular dirección hacia el waypoint
    const direction = new THREE.Vector3()
      .subVectors(waypoint, camera.position)
      .normalize();

    // Ignorar el componente Y para movimiento horizontal
    direction.y = 0;
    direction.normalize();

    // Aplicar velocidad
    const speed = walkSpeed * delta;
    direction.multiplyScalar(speed);

    // Suavizar movimiento
    direction.lerp(lastMoveDirection.current, 0.2);
    lastMoveDirection.current.copy(direction);

    // Distancia al waypoint (solo XZ, ignoramos altura)
    const horizontalDistanceToWaypoint = new THREE.Vector2(
      waypoint.x - camera.position.x,
      waypoint.z - camera.position.z
    ).length();

    // Si estamos lo suficientemente cerca, pasar al siguiente waypoint
    if (horizontalDistanceToWaypoint < waypointReachedDistance) {
      currentWaypoint.current++;

      // Si hemos llegado al final de la ruta
      if (currentWaypoint.current >= waypoints.current.length) {
        // Detener seguimiento o volver al primer waypoint (loop)
        currentWaypoint.current = 0; // Quitar esta línea para detenerse al final
        // stopFollowingPath(); // Descomentar esta línea para detenerse al final
      }

      console.log(`Llegando a waypoint ${currentWaypoint.current}`);

      // Rápidamente mirar hacia el siguiente waypoint para orientarnos
      if (currentWaypoint.current < waypoints.current.length) {
        const nextWaypoint = waypoints.current[currentWaypoint.current];
        const lookAt = new THREE.Vector3(
          nextWaypoint.x,
          camera.position.y,
          nextWaypoint.z
        );
        camera.lookAt(lookAt);
        lookDirection.current.set(0, 0, -1).applyQuaternion(camera.quaternion);
      }

      return;
    }

    // Actualizar posición objetivo
    targetPosition.current.x = camera.position.x + direction.x;
    targetPosition.current.z = camera.position.z + direction.z;

    // Actualizar tiempo para oscilación de caminar
    walkingTime.current += delta * 8;
    walkingOffset.current = Math.sin(walkingTime.current) * 0.15;

    // Aplicar altura adecuada (altura del terreno + offset + oscilación)
    targetPosition.current.y =
      terrainY.current + elevationOffset + walkingOffset.current;

    // Actualizar el bounding box del personaje
    updateCharacterBoundingBox(targetPosition.current);

    // Hacer que la cámara mire hacia el waypoint
    const lookAt = new THREE.Vector3(waypoint.x, camera.position.y, waypoint.z);
    camera.lookAt(lookAt);
    lookDirection.current.set(0, 0, -1).applyQuaternion(camera.quaternion);
  };

  // Lógica de movimiento en cada frame - Con sistema de navegación
  useFrame((state, delta) => {
    if (!active || !modelRef.current) return;

    try {
      // Si estamos siguiendo una ruta de waypoints
      if (
        followingPath.current &&
        waypoints.current.length > 0 &&
        currentWaypoint.current >= 0 &&
        currentWaypoint.current < waypoints.current.length
      ) {
        const waypoint = waypoints.current[currentWaypoint.current];
        moveTowardsWaypoint(waypoint, delta);
        isMoving.current = true;
      }
      // Control manual con teclado
      else if (!followingPath.current) {
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

          // Actualizar posición objetivo (manteniendo altura adecuada)
          targetPosition.current.x =
            camera.position.x + moveDirection.current.x;
          targetPosition.current.z =
            camera.position.z + moveDirection.current.z;

          // Actualizar tiempo para oscilación de caminar
          walkingTime.current += delta * 8;

          // Pequeña oscilación vertical para simular pasos (solo si está caminando)
          if (isMoving.current) {
            // Calcular una pequeña oscilación basada en un seno
            walkingOffset.current = Math.sin(walkingTime.current) * 0.15;
          } else {
            // Reducir gradualmente la oscilación al detenerse
            walkingOffset.current *= 0.9;
          }

          // Aplicar altura base más oscilación
          targetPosition.current.y =
            terrainY.current + elevationOffset + walkingOffset.current;

          // Actualizar el bounding box del personaje con la nueva posición
          updateCharacterBoundingBox(targetPosition.current);

          // Verificar si el bounding box del personaje intersecta con el modelo
          // (Esto es un reemplazo más eficiente del raycast)
          const isOnGround = characterBoundingBox.current.intersectsBox(
            modelBoundingBox.current
          );

          // Si está en el suelo, ajustar la altura para que esté justo encima
          if (isOnGround) {
            targetPosition.current.y =
              terrainY.current + elevationOffset + walkingOffset.current;
          }
        } else {
          // Reducir dirección residual al detenerse
          lastMoveDirection.current.multiplyScalar(0.7);

          // Reducir efecto de oscilación al detenerse
          walkingOffset.current *= 0.9;

          // Mantener la posición actual
          targetPosition.current.copy(camera.position);
          targetPosition.current.y =
            terrainY.current + elevationOffset + walkingOffset.current;
        }
      }

      // Aplicar movimiento con interpolación fuerte para mayor suavidad (siempre)
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
