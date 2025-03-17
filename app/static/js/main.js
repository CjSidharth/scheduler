// Set up the scene, camera, and renderer
import * as THREE from './three.module.js';
// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Building dimensions
const buildingWidth = 10;
const buildingDepth = 10;
const floorHeight = 2;
const totalFloors = 5;

// Create a group to hold the entire building
const building = new THREE.Group();

// Create each floor
for (let floor = 0; floor < totalFloors; floor++) {
  // Floor base (the actual floor)
  const floorGeometry = new THREE.BoxGeometry(buildingWidth, 0.2, buildingDepth);
  const floorMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc, wireframe: true });
  const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
  floorMesh.position.y = floor * floorHeight;
  building.add(floorMesh);
  
  // Create 4 classrooms on each floor (2x2 grid)
  const roomWidth = buildingWidth / 2 - 0.2; // Allowing for walls
  const roomDepth = buildingDepth / 2 - 0.2;
  const roomHeight = floorHeight - 0.2;
  
  // Classroom positions (corners of the floor)
  const positions = [
    { x: -buildingWidth/4, z: -buildingDepth/4 },  // Back left
    { x: buildingWidth/4, z: -buildingDepth/4 },   // Back right
    { x: -buildingWidth/4, z: buildingDepth/4 },   // Front left
    { x: buildingWidth/4, z: buildingDepth/4 }     // Front right
  ];
  
  // Create rooms
  positions.forEach((pos, index) => {
    // Room walls
    const roomGeometry = new THREE.BoxGeometry(roomWidth, roomHeight, roomDepth);
    const roomMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00,
      wireframe: true  // Wireframe to see inside
    });
    const roomMesh = new THREE.Mesh(roomGeometry, roomMaterial);
    roomMesh.position.set(pos.x, floor * floorHeight + roomHeight/2 + 0.1, pos.z);
    building.add(roomMesh);
  });
}

// Add the building to the scene
scene.add(building);

// Position the camera
camera.position.set(15, 10, 15);
camera.lookAt(0, 5, 0);

// Animation function
function animate() {
    requestAnimationFrame(animate);
    
    // Rotate the building slightly
    building.rotation.y += 0.005;
    
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(newWidth, newHeight);
});

// Start the animation loop
animate();
