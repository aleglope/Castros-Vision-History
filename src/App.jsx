import {
  TransformControls,
  Environment,
  OrbitControls,
} from "@react-three/drei";
import { Perf } from "r3f-perf";
import { Suspense } from "react";
import Model from "./Model.jsx";
import Placeholder from "./Placeholder.jsx";

export default function App() {
  return (
    <>
      <TransformControls position={[0, 0, 0]} />
      <Perf position="top-left" />
      <OrbitControls makeDefault />
      <ambientLight intensity={0.5} />
      <Environment background files={["/nublado.hdr"]} />
      <Suspense fallback={<Placeholder position-y={0.5} scale={[2, 3, 2]} />}>
        <Model />
      </Suspense>
    </>
  );
}
