import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const COLORS = ['#44aa88', '#ff4444', '#44ff44', '#4444ff', '#ffdd44', '#ff44dd'];
const SHAPES = ['cube', 'sphere', 'torus', 'octahedron', 'icosahedron', 'cylinder'];

export default function Viewer3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shapeMaterialRef = useRef<THREE.MeshPhongMaterial | null>(null);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedShape, setSelectedShape] = useState('cube');
  const [isToolboxCollapsed, setIsToolboxCollapsed] = useState(false); // Track toolbox state
  const shapeRef = useRef<THREE.Mesh | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const createGeometry = (shape: string) => {
    switch (shape) {
      case 'sphere':
        return new THREE.SphereGeometry(0.7, 64, 64);
      case 'torus':
        return new THREE.TorusGeometry(0.7, 0.3, 32, 200);
      case 'octahedron':
        return new THREE.OctahedronGeometry(0.8);
      case 'icosahedron':
        return new THREE.IcosahedronGeometry(0.8);
      case 'cylinder':
        return new THREE.CylinderGeometry(0.6, 0.6, 1.2, 64);
      default:
        return new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x1a1a1a);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      logarithmicDepthBuffer: true,
      precision: 'highp',
    });
    rendererRef.current = renderer;

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 0.7;
    controls.panSpeed = 0.5;

    // Enhanced grid
    const gridHelper = new THREE.GridHelper(20, 40, 0x555555, 0x282828);
    scene.add(gridHelper);

    // Enhanced axes
    const axesHelper = new THREE.AxesHelper(10);
    const xAxis = axesHelper.geometry.attributes.color;
    xAxis.setXYZ(0, 1, 0, 0);
    xAxis.setXYZ(1, 1, 0, 0);
    xAxis.setXYZ(2, 0, 1, 0);
    xAxis.setXYZ(3, 0, 1, 0);
    xAxis.setXYZ(4, 0, 0, 1);
    xAxis.setXYZ(5, 0, 0, 1);
    scene.add(axesHelper);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshPhongMaterial({
      color: 0x222222,
      shininess: 30,
      specular: new THREE.Color(0x111111),
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Main shape
    const geometry = createGeometry(selectedShape);
    const material = new THREE.MeshPhongMaterial({
      color: selectedColor,
      shininess: 100,
      specular: new THREE.Color(0x444444),
    });
    shapeMaterialRef.current = material;
    const shape = new THREE.Mesh(geometry, material);
    shape.castShadow = true;
    shape.receiveShadow = true;
    shapeRef.current = shape;
    scene.add(shape);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    hemisphereLight.position.set(0, 20, 0);
    scene.add(hemisphereLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.bias = -0.0001;
    scene.add(directionalLight);

    camera.position.set(4, 3, 5);
    controls.update();

    // Render once without animation loop
    renderer.render(scene, camera);

    function handleResize() {
      if (!cameraRef.current || !rendererRef.current) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
      rendererRef.current.setPixelRatio(window.devicePixelRatio);
      rendererRef.current.render(sceneRef.current!, cameraRef.current);
    }

    window.addEventListener('resize', handleResize);

    // Add controls change listener to re-render on user interaction
    controls.addEventListener('change', () => {
      renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [selectedShape]);

  useEffect(() => {
    if (
      shapeMaterialRef.current &&
      rendererRef.current &&
      sceneRef.current &&
      cameraRef.current
    ) {
      shapeMaterialRef.current.color.set(selectedColor);
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, [selectedColor]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      <div className="title font-sans font-700" style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: 'white',
        fontSize: '24px',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
      }}>
        ParthCAD
      </div>

      {/* Toolbox */}
      <div
        style={{
          position: 'absolute',
          top: '60px',
          right: '20px',
          backgroundColor: 'rgba(30, 30, 30, 0.9)',
          padding: '15px',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          maxHeight: isToolboxCollapsed ? '50px' : 'none',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease-in-out',
          width: '300px', // Fixed width for consistency
        }}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsToolboxCollapsed(!isToolboxCollapsed)}
          style={{
            padding: '10px',
            backgroundColor: '#444',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold',
            alignSelf: 'center',
            marginBottom: '10px',
          }}
        >
          {isToolboxCollapsed ? 'Expand' : 'Collapse'}
        </button>

        {/* Colors Section */}
        {!isToolboxCollapsed && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {COLORS.map((color) => (
              <div
                key={color}
                onClick={() => setSelectedColor(color)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  cursor: 'pointer',
                  border: color === selectedColor ? '3px solid white' : '2px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  transition: 'transform 0.2s',
                  transform: color === selectedColor ? 'scale(1.1)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        )}

        {/* Shapes Section */}
        {!isToolboxCollapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {SHAPES.map((shape) => (
              <button
                key={shape}
                onClick={() => setSelectedShape(shape)}
                style={{
                  padding: '10px 15px',
                  backgroundColor: shape === selectedShape ? '#666' : '#444',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  fontWeight: shape === selectedShape ? 'bold' : 'normal',
                  transition: 'all 0.2s',
                }}
              >
                {shape}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}