import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { Suspense, forwardRef } from "react";

const Model = forwardRef((props, ref) => {
  const model = useLoader(GLTFLoader, "/cAstrosHigh.gltf", (loader) => {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");
    loader.setDRACOLoader(dracoLoader);
  });

  return (
    <Suspense fallback={null}>
      <primitive
        ref={ref}
        object={model.scene}
        scale={3}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -200, 0]}
        {...props}
      />
    </Suspense>
  );
});

export default Model;
