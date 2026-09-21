import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

/**
 * About section laptop model — renders ONLY in About section's local Canvas.
 * Animated with subtle rotation and bob.
 */
export default function AboutModel() {
  const { scene } = useGLTF('/models/laptop.glb')
  const rootRef = useRef(null)

  useFrame((state) => {
    const root = rootRef.current
    if (!root) return

    const time = state.clock.elapsedTime

    // Subtle rotation around Y axis
    root.rotation.y = Math.sin(time * 0.4) * 0.3

    // Gentle bob — offset from base position
    root.position.y = -0.2 + Math.sin(time * 0.7) * 0.05
  })

  return (
    <primitive
      ref={rootRef}
      object={scene.clone()}
      scale={0.27}
      position={[0, -0.2, 1]}
    />
  )
}

useGLTF.preload('/models/laptop.glb')
