import { Box } from "@react-three/drei";

export default function Placeholder(props) {
  return (
    <mesh {...props}>
      <Box args={[1, 1, 1]}>
        <meshBasicMaterial wireframe color="red" />
      </Box>
    </mesh>
  );
}
