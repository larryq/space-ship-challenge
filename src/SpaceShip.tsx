import { useFrame } from "@react-three/fiber";
import {
  RigidBody,
  RapierRigidBody,
  CuboidCollider,
} from "@react-three/rapier";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { Vector3, Euler, Quaternion } from "three";
import { useGLTF, useKeyboardControls } from "@react-three/drei";
import { useGame } from "./store/GameStore";
import * as THREE from "three";
import thrusterVertex from "./shaders/thrusters.vert";
import thrusterFragment from "./shaders/thrusters.frag";
// @ts-expect-error use instead of ignore so it doesn't hide other potential issues
import shipModelPath from "./assets/spaceship_1.glb";

export const SpaceShip = forwardRef((props, ref) => {
  const shipBody = useRef<RapierRigidBody>(null!);
  const visualMeshRef = useRef<THREE.Group>(null!);
  const [, getKeys] = useKeyboardControls(); // Requires KeyboardControls wrapper in Experience
  // useImperativeHandle(ref, () => shipBody.current);
  const phase = useGame((state) => state.phase);
  const worldPos = new THREE.Vector3();
  const worldQuat = new THREE.Quaternion();
  const offset = new THREE.Vector3(0, 3, 20);

  useImperativeHandle(ref, () => ({
    body: shipBody.current,
    mesh: visualMeshRef.current,
  }));

  // 1. Load the GLB
  const { scene } = useGLTF(shipModelPath); // Replace with your path

  const clonedScene = useMemo(() => scene.clone(), [scene]);
  const ThrusterMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: thrusterVertex,
      fragmentShader: thrusterFragment,
      uniforms: {
        uTime: { value: 0 },
        uThrottle: { value: 0 },
        uColor: { value: new THREE.Color("#0099ff") }, // Plasma Blue
      },
      transparent: true,
      blending: THREE.AdditiveBlending, // This is key for the "glow" look
      side: THREE.DoubleSide,
      depthWrite: false, // Prevents the flame from "cutting" into other objects
      depthTest: true,
    });
  }, []);
  const thrusterMaterialRef = useRef(ThrusterMaterial);

  useEffect(() => {
    // 4. Find the exhaust plane and apply the shader
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name.includes("exhaust")) {
        child.material = ThrusterMaterial;
        child.material.transparent = true;
      }
    });
  }, [clonedScene, ThrusterMaterial]);

  useEffect(() => {
    // When the store says we are back in "playing" mode,
    // we manually move the physics body to the new sector start.
    if (phase === "resetShipPosition" && shipBody.current) {
      console.log("Resetting ship position for new sector");
      shipBody.current.setTranslation({ x: 0, y: 0, z: 50 }, true);

      // 2. Kill the momentum so you don't keep flying at warp speed
      shipBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      shipBody.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

      // 2. Teleport the Mesh (Rapier usually handles this, but let's be safe)
      if (visualMeshRef.current) {
        visualMeshRef.current.position.set(0, 0, 0);
      }
    }
  }, [phase]);

  useFrame((state, delta) => {
    if (!shipBody.current || !visualMeshRef.current) {
      return;
    }

    const { forward, backward, left, right, shift } = getKeys();

    //////////////////////

    const pos = shipBody.current.translation();
    const rot = shipBody.current.rotation();

    visualMeshRef.current.getWorldPosition(worldPos);
    visualMeshRef.current.getWorldQuaternion(worldQuat);

    // 2. Calculate camera offset
    offset.set(0, 3, 10); // Desired camera position relative to ship
    offset.applyQuaternion(worldQuat).add(worldPos);

    const distance = state.camera.position.distanceTo(offset);
    if (distance > 20) {
      state.camera.position.copy(offset);
    } else {
      state.camera.position.lerp(offset, 0.1); // Faster lerp feels better
    }

    // We take the "Up" direction of the ship's visual mesh and tell the camera to use it
    const shipUp = new THREE.Vector3(0, 1, 0);
    shipUp.applyQuaternion(
      visualMeshRef.current.getWorldQuaternion(new THREE.Quaternion()),
    );
    //state.camera.up.lerp(shipUp, 0.1); // Smoothly tilt the camera's "Up"
    state.camera.up.set(0, 1, 0);
    state.camera.lookAt(worldPos);

    // Update thruster shader uniforms
    ///////////////////////
    if (thrusterMaterialRef.current) {
      thrusterMaterialRef.current.uniforms.uTime.value += delta;
      // Get speed from physics body for the throttle
      if (shipBody.current) {
        const velocity = shipBody.current.linvel();
        const speed = Math.sqrt(
          velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2,
        );
        const throttle = THREE.MathUtils.clamp(speed / 10, 0, 1);
        thrusterMaterialRef.current.uniforms.uThrottle.value = throttle;
      }
    }
    //finish updating shader uniforms
    ////////////////////////

    //  check for warp. We only stop the movement impulses, not the camera.
    ////////////////////////
    if (phase === "warping" || phase === "resetShipPosition") {
      // Kill momentum during warp so ship doesn't drift away from tunnel
      shipBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      shipBody.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

      // This points the physics collider straight down the -Z axis
      const neutralRotation = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(0, 0, 0),
      );
      shipBody.current.setRotation(neutralRotation, true);

      // 2. Kill all spinning momentum
      shipBody.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

      // 3. Reset Visual Tilt (The "Mesh")
      if (visualMeshRef.current) {
        visualMeshRef.current.rotation.set(0, 0, 0);
      }

      return;
    }
    ////////////////////////

    const impulse = new Vector3(0, 0, 0);
    const moveSpeed = 415 * delta;

    // Rotation (Banking)
    // We tilt the ship visually, but apply torque to the physics body
    // 1. Get current speed (how fast are we actually moving?)
    const velocity = shipBody.current.linvel();
    const currentSpeed = Math.sqrt(
      velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2,
    );

    //// 2. Calculate "Turning Effectiveness"
    //// If speed is 0, turnFactor is 0. If speed is 10+, turnFactor is 1.  Maintain a floor of 0.5 so you can still turn at low / no speeds, just not as sharply.
    const turnFactor = THREE.MathUtils.clamp(currentSpeed / 1.0, 0.3, 0.7);

    const yawSpeed = 3.5 * delta * turnFactor; // Adjust 1.5 to make turns faster/slower

    const currentRot = shipBody.current.rotation();
    const currentEuler = new THREE.Euler().setFromQuaternion(
      new THREE.Quaternion(
        currentRot.x,
        currentRot.y,
        currentRot.z,
        currentRot.w,
      ),
      "YXZ", // Order is important for flight
    );

    //handle pitch (tilting up/down)
    let targetPitch = currentEuler.x;
    const pitchSpeed = 1.8 * delta;
    const maxPitch = Math.PI / 2 - 0.4; // 90 degrees minus a little buffer to prevent gimbal lock

    if (forward) targetPitch -= pitchSpeed;
    if (backward) targetPitch += pitchSpeed;

    //handle yaw (turning left/right)
    if (left) currentEuler.y += yawSpeed;
    if (right) currentEuler.y -= yawSpeed;

    // AUTO-LEVELING: If shift is released, drift pitch back to 0
    // 0.05 at 60fps is roughly a half-second return
    // if (!forward && !backward) {
    //   targetPitch = THREE.MathUtils.lerp(targetPitch, 0, 0.04);
    // }

    // Clamp the pitch so it never exceeds target pitch up or down
    currentEuler.x = THREE.MathUtils.clamp(targetPitch, -maxPitch, maxPitch);

    // Also level out the Roll (Z) of the physics body to keep it stable
    currentEuler.z = THREE.MathUtils.lerp(currentEuler.z, 0, 0.1);

    // Apply the corrected rotation back to the physics body
    const newQuat = new THREE.Quaternion().setFromEuler(currentEuler);
    shipBody.current.setRotation(newQuat, true);

    if (left || right) {
      shipBody.current.setLinearDamping(0.5); // High drag to help the pivot
    } else if (shift) {
      shipBody.current.setLinearDamping(0.8); // Low drag for straight-line speed
    } else {
      shipBody.current.setLinearDamping(4.0); // Natural braking/coasting
    }

    // Determine Thrust (Only move if shift is held)
    if (shift) {
      impulse.z -= moveSpeed;
    }

    impulse.applyQuaternion(newQuat);
    shipBody.current.applyImpulse(impulse, true);

    // TIGHT TURN LOGIC: Reduce sideways drift when turning by applying counter-forces based on the ship's right and up vectors
    //////////////////////
    //--- LATERAL GRIP (Left/Right) ---
    const linVel = shipBody.current.linvel();
    const velocityVec = new THREE.Vector3(linVel.x, linVel.y, linVel.z);
    const rightVec = new THREE.Vector3(1, 0, 0).applyQuaternion(newQuat);
    // Calculate how much the ship is moving sideways
    const lateralVelocity = new THREE.Vector3(linVel.x, linVel.y, linVel.z).dot(
      rightVec,
    );
    // Apply a counter-force to stop the "sliding"
    // 0.1 is subtle, 0.9 is very tight/grippy
    const gripStrength = 0.9;
    const lateralImpulse = rightVec.multiplyScalar(
      -lateralVelocity * gripStrength,
    );
    shipBody.current.applyImpulse(lateralImpulse, true);

    // --- VERTICAL GRIP (Up/Down) ---
    const upVec = new THREE.Vector3(0, 1, 0).applyQuaternion(newQuat);
    const verticalVelocity = velocityVec.dot(upVec);
    const verticalImpulse = upVec.multiplyScalar(
      -verticalVelocity * gripStrength,
    );
    shipBody.current.applyImpulse(verticalImpulse, true);
    //////////////////////
    //End of tight turn logic

    // We apply this to the visualMeshRef, NOT the shipBody.  Thinking of the shipBody as the "physics soul" of the ship, and the visualMeshRef as the "flesh".  The physics body is what collides and moves, but the visual mesh is what we see and can tilt/bank for effect.
    const targetTilt = left ? 0.5 : right ? -0.5 : 0;
    visualMeshRef.current.rotation.z = THREE.MathUtils.lerp(
      visualMeshRef.current.rotation.z,
      targetTilt,
      0.05, // Lower value = "heavier" feeling bank
    );
  });

  return (
    <RigidBody
      ref={shipBody}
      linearDamping={0.8}
      angularDamping={1}
      name="ship"
      gravityScale={0}
      friction={0}
      //colliders="hull" // Uses your Blender model's shape
      //colliders="cuboid" // Simpler box collider
      colliders={false}
      mass={1}
    >
      <CuboidCollider args={[1, 1, 2]} />
      <group ref={visualMeshRef}>
        <mesh>
          <primitive
            object={clonedScene}
            scale={0.5}
            rotation={[0, Math.PI, 0]}
          />
        </mesh>
      </group>
    </RigidBody>
  );
});
