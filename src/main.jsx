import "./styles.css";
import ReactDOM from "react-dom/client";
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import App from "./App.jsx";
import Zoom from "./zoom.jsx";

const root = ReactDOM.createRoot(document.querySelector("#root"));

root.render(
  <Canvas camera={{ position: [0, 300, 0], fov: 75, far: 3000, near: 0.1 }}>
    <App />
    <Zoom />
  </Canvas>
);
