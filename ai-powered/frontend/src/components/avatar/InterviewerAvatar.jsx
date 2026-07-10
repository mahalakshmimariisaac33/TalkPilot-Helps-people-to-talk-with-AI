import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SKIN = { MALE: '#c8956c', FEMALE: '#d4a574' };
const HAIR = { MALE: '#2c1810', FEMALE: '#3d2314' };
const SUIT = { MALE: '#1a2744', FEMALE: '#2d3a52' };

const EMOTION_OFFSETS = {
  welcoming: { browY: 0.02, smile: 0.15, headTilt: 0.05 },
  attentive: { browY: 0, smile: 0.05, headTilt: 0 },
  encouraging: { browY: 0.03, smile: 0.2, headTilt: 0.08 },
  impressed: { browY: -0.01, smile: 0.25, headTilt: -0.03 },
  closing: { browY: 0.01, smile: 0.18, headTilt: 0.04 },
  neutral: { browY: 0, smile: 0.08, headTilt: 0 },
};

function Head({ gender, mouthOpen, blink, emotion, isSpeaking }) {
  const groupRef = useRef();
  const skinColor = SKIN[gender] || SKIN.MALE;
  const hairColor = HAIR[gender] || HAIR.MALE;
  const emotionData = EMOTION_OFFSETS[emotion] || EMOTION_OFFSETS.neutral;

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.08 + emotionData.headTilt;
    groupRef.current.rotation.x = Math.sin(t * 0.25) * 0.03;
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.008;
  });

  const eyeScaleY = blink ? 0.08 : 1;
  const mouthHeight = 0.04 + mouthOpen * 0.12;
  const mouthWidth = 0.14 + (isSpeaking ? mouthOpen * 0.04 : 0);

  return (
    <group ref={groupRef}>
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.25, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.38, 32, 32]} />
        <meshStandardMaterial color={skinColor} roughness={0.65} />
      </mesh>

      <mesh position={[0, 0.12, -0.02]} scale={[1.05, gender === 'FEMALE' ? 1.15 : 0.95, 1.05]}>
        <sphereGeometry args={[0.36, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color={hairColor} roughness={0.9} />
      </mesh>

      {gender === 'FEMALE' && (
        <mesh position={[0.32, -0.05, 0.05]} rotation={[0, 0, -0.3]}>
          <capsuleGeometry args={[0.04, 0.35, 4, 8]} />
          <meshStandardMaterial color={hairColor} roughness={0.9} />
        </mesh>
      )}

      <mesh position={[-0.12, 0.06, 0.32]} scale={[1, eyeScaleY, 1]}>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
      <mesh position={[-0.12, 0.06, 0.36]} scale={[1, eyeScaleY, 1]}>
        <sphereGeometry args={[0.028, 12, 12]} />
        <meshStandardMaterial color="#3d2314" />
      </mesh>

      <mesh position={[0.12, 0.06, 0.32]} scale={[1, eyeScaleY, 1]}>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
      <mesh position={[0.12, 0.06, 0.36]} scale={[1, eyeScaleY, 1]}>
        <sphereGeometry args={[0.028, 12, 12]} />
        <meshStandardMaterial color="#3d2314" />
      </mesh>

      <mesh position={[-0.12, 0.14 + emotionData.browY, 0.34]} rotation={[0, 0, 0.15]}>
        <boxGeometry args={[0.1, 0.015, 0.02]} />
        <meshStandardMaterial color={hairColor} />
      </mesh>
      <mesh position={[0.12, 0.14 + emotionData.browY, 0.34]} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[0.1, 0.015, 0.02]} />
        <meshStandardMaterial color={hairColor} />
      </mesh>

      <mesh position={[0, -0.02, 0.35]} rotation={[0.3, 0, 0]}>
        <coneGeometry args={[0.04, 0.1, 8]} />
        <meshStandardMaterial color={skinColor} roughness={0.75} />
      </mesh>

      <mesh position={[0, -0.12 - emotionData.smile * 0.05, 0.33]}>
        <boxGeometry args={[mouthWidth, mouthHeight, 0.02]} />
        <meshStandardMaterial color="#8b4545" roughness={0.5} />
      </mesh>
    </group>
  );
}

function Body({ gender }) {
  const suitColor = SUIT[gender] || SUIT.MALE;

  return (
    <group position={[0, 0.6, 0]}>
      <mesh>
        <boxGeometry args={[0.9, 1.0, 0.45]} />
        <meshStandardMaterial color={suitColor} roughness={0.85} />
      </mesh>

      <mesh position={[0, 0.42, 0.1]}>
        <boxGeometry args={[0.35, 0.12, 0.15]} />
        <meshStandardMaterial color="#e8e8e8" />
      </mesh>

      {gender === 'MALE' ? (
        <mesh position={[0, 0.15, 0.24]}>
          <boxGeometry args={[0.08, 0.5, 0.03]} />
          <meshStandardMaterial color="#1e3a5f" roughness={0.6} />
        </mesh>
      ) : (
        <mesh position={[0, 0.35, 0.22]}>
          <torusGeometry args={[0.06, 0.008, 8, 16]} />
          <meshStandardMaterial color="#c9a227" metalness={0.8} roughness={0.2} />
        </mesh>
      )}

      <mesh position={[-0.55, 0.35, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color={suitColor} roughness={0.85} />
      </mesh>
      <mesh position={[0.55, 0.35, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color={suitColor} roughness={0.85} />
      </mesh>
    </group>
  );
}

function InterviewRoom() {
  const wallColor = useMemo(() => new THREE.Color('#2a3f5f'), []);
  const floorColor = useMemo(() => new THREE.Color('#1e2d42'), []);

  return (
    <group>
      <mesh position={[0, 2, -1.8]} receiveShadow>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color={wallColor} roughness={0.95} />
      </mesh>

      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color={floorColor} roughness={0.9} />
      </mesh>

      <mesh position={[0, 0.35, 0.6]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.08, 0.8]} />
        <meshStandardMaterial color="#3d2817" roughness={0.7} />
      </mesh>

      <mesh position={[0, 0.7, 0.85]}>
        <boxGeometry args={[0.6, 0.8, 0.08]} />
        <meshStandardMaterial color="#1a2744" roughness={0.8} />
      </mesh>

      <group position={[-1.5, 0, -1.2]}>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.15, 0.18, 0.6, 12]} />
          <meshStandardMaterial color="#5c4033" />
        </mesh>
        <mesh position={[0, 0.75, 0]}>
          <sphereGeometry args={[0.25, 12, 12]} />
          <meshStandardMaterial color="#2d5a27" roughness={0.9} />
        </mesh>
      </group>

      <mesh position={[1.8, 2.2, -1.75]}>
        <planeGeometry args={[1.2, 1.5]} />
        <meshStandardMaterial color="#87ceeb" emissive="#4488aa" emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}

export default function InterviewerAvatar({ gender, mouthOpen, isSpeaking, emotion }) {
  const [blink, setBlink] = useState(false);
  const blinkTimerRef = useRef(0);

  useFrame((_, delta) => {
    blinkTimerRef.current += delta;
    if (blinkTimerRef.current > 2.5 + Math.random() * 2) {
      setBlink(true);
      blinkTimerRef.current = 0;
      setTimeout(() => setBlink(false), 120);
    }
  });

  return (
    <group position={[0, -0.3, 0]}>
      <InterviewRoom />
      <Body gender={gender} />
      <group position={[0, 1.55, 0]}>
        <Head
          gender={gender}
          mouthOpen={mouthOpen}
          blink={blink}
          emotion={emotion}
          isSpeaking={isSpeaking}
        />
      </group>
    </group>
  );
}
