import React, { useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { useControls, button } from "leva";
import TWEEN from "@tweenjs/tween.js";
import { CAMERA_VIEWS } from "./config";

const annotations = [
  {
    title: "View A",
    position: { x: 200, y: 100, z: 100 },
    lookAt: { x: 1, y: 0, z: 0 },
  },
  {
    title: "View B",
    position: { x: 100, y: 200, z: 500 },
    lookAt: { x: 8.1, y: -1.5, z: 2 },
  },
  {
    title: "View C",
    position: { x: 300, y: 200, z: -500 },
    lookAt: { x: 0, y: 0, z: 0 },
  },
  {
    title: "View D",
    position: { x: 300, y: 25, z: -50 },
    lookAt: { x: 100, y: 0, z: 100 },
  },
  {
    title: "Castro de Baroña",
    position: CAMERA_VIEWS.castroBarona.position,
    lookAt: CAMERA_VIEWS.castroBarona.lookAt,
  },
];

function Zoom() {
  const controlsRef = useRef();
  const { camera } = useThree();

  useControls("Camera", () => {
    const buttons = annotations.reduce(
      (acc, { title, position, lookAt }) => ({
        ...acc,
        [title]: button(() => {
          new TWEEN.Tween(camera.position)
            .to(position, 2000)
            .easing(TWEEN.Easing.Cubic.Out)
            .start();

          new TWEEN.Tween(controlsRef.current.target)
            .to(lookAt, 1000)
            .easing(TWEEN.Easing.Cubic.Out)
            .start();
        }),
      }),
      {}
    );
    return buttons;
  });

  // Añadir controles para los modos de transformación
  useControls("Transformación", {
    "Cambiar Modo": button(() => {
      const modeButton = document.querySelector("mesh");
      if (modeButton) {
        const event = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
        });
        modeButton.dispatchEvent(event);
      }
    }),
  });

  useFrame(() => TWEEN.update());

  return null;
}

export default Zoom;
