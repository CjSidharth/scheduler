import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Create UI container for floor plan
const uiContainer = document.createElement('div');
uiContainer.style.position = 'absolute';
uiContainer.style.top = '80px';
uiContainer.style.right = '10px';
uiContainer.style.width = '200px';
uiContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
uiContainer.style.borderRadius = '5px';
uiContainer.style.padding = '10px';
uiContainer.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
document.body.appendChild(uiContainer);

// Schedule button
const scheduleBtn = document.createElement('button');
scheduleBtn.textContent = 'Schedule Lectures';
scheduleBtn.style.padding = '5px 10px';
scheduleBtn.style.background = '#007bff';
scheduleBtn.style.color = 'white';
scheduleBtn.style.border = 'none';
scheduleBtn.style.borderRadius = '5px';
scheduleBtn.style.cursor = 'pointer';
scheduleBtn.style.margin = '10px auto';
scheduleBtn.style.display = 'block';
scheduleBtn.addEventListener('click', scheduleLectures);
uiContainer.appendChild(scheduleBtn);

// Title for UI
const uiTitle = document.createElement('h3');
uiTitle.textContent = 'Building Floor Plan';
uiTitle.style.margin = '0 0 10px 0';
uiTitle.style.textAlign = 'center';
uiContainer.appendChild(uiTitle);

// Floor selector
const floorSelector = document.createElement('div');
floorSelector.style.marginBottom = '10px';
floorSelector.style.textAlign = 'center';
uiContainer.appendChild(floorSelector);

const floorLabel = document.createElement('label');
floorLabel.textContent = 'Floor: ';
floorSelector.appendChild(floorLabel);

const floorSelect = document.createElement('select');
floorSelect.id = 'floor-select';
floorSelector.appendChild(floorSelect);

// Create floor plan container
const floorPlanContainer = document.createElement('div');
floorPlanContainer.style.width = '100%';
floorPlanContainer.style.height = '200px';
floorPlanContainer.style.border = '1px solid #ccc';
floorPlanContainer.style.position = 'relative';
floorPlanContainer.style.backgroundColor = '#f0f0f0';
uiContainer.appendChild(floorPlanContainer);

// Room info display
const roomInfoDisplay = document.createElement('div');
roomInfoDisplay.style.marginTop = '10px';
roomInfoDisplay.style.padding = '5px';
roomInfoDisplay.style.border = '1px solid #ddd';
roomInfoDisplay.style.borderRadius = '3px';
roomInfoDisplay.style.backgroundColor = '#f9f9f9';
roomInfoDisplay.style.display = 'none';
uiContainer.appendChild(roomInfoDisplay);

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Hemisphere Light
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
scene.add(hemisphereLight);
// Hemispherical


const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);
directionalLight.intensity = 1.5;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
directionalLight.shadow.bias = -0.001;

const pointLight = new THREE.PointLight(0xffffff, 1, 50);
pointLight.position.set(5, 10, 5);
pointLight.castShadow = true;
scene.add(pointLight);



// Add a ground plane
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshPhongMaterial({
  color: 0x808080,
  shininess: 100,
  reflectivity: 0.5,
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.position.y = -0.1;
groundMesh.castShadow = true;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

// Building dimensions
const buildingWidth = 10;
const buildingDepth = 10;
const floorHeight = 2;
const totalFloors = 5;

// Create a group to hold the entire building
const building = new THREE.Group();

// Storage for all room meshes for selection
const rooms = [];
const floorRooms = Array(totalFloors).fill().map(() => []);



// Create each floor
for (let floor = 0; floor < totalFloors; floor++) {
  // Add option to floor selector
  const option = document.createElement('option');
  option.value = floor;
  option.textContent = `Floor ${floor + 1}`;
  floorSelect.appendChild(option);
  
  // Floor base
  const floorGeometry = new THREE.BoxGeometry(buildingWidth, 0.2, buildingDepth);
  const floorMaterial = new THREE.MeshPhongMaterial({
    color: 0xcccccc,
    shininess: 100,
  });  
	const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
  floorMesh.position.y = floor * floorHeight;
  floorMesh.receiveShadow = true;
  building.add(floorMesh);
  
  // Create 4 classrooms on each floor
  const roomWidth = buildingWidth / 2 - 0.2;
  const roomDepth = buildingDepth / 2 - 0.2;
  const roomHeight = floorHeight - 0.2;
  
  const positions = [
    { x: -buildingWidth/4, z: -buildingDepth/4 },
    { x: buildingWidth/4, z: -buildingDepth/4 },
    { x: -buildingWidth/4, z: buildingDepth/4 },
    { x: buildingWidth/4, z: buildingDepth/4 }
  ];
  
  positions.forEach((pos, index) => {
    const roomGeometry = new THREE.BoxGeometry(roomWidth, roomHeight, roomDepth);
    const roomMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.6,
      roughness: 0.2,
      metalness: 0.1,
      clearcoat: 0.5,
      clearcoatRoughness: 0.1,
    });
    const roomMesh = new THREE.Mesh(roomGeometry, roomMaterial);
    roomMesh.position.set(pos.x, floor * floorHeight + roomHeight/2 + 0.1, pos.z);
    

    floorMesh.castShadow = true;
    floorMesh.receiveShadow = true;

    roomMesh.castShadow = true;
    roomMesh.receiveShadow = true;
		
    
    // Add metadata to identify floor and room
    roomMesh.userData = {
      floor: floor,
      room: index,
      originalColor: 0x00ff00,
      isSelected: false,
      name: `Room ${index + 1}`,
      capacity: Math.floor(Math.random() * 30) + 20, // Random capacity between 20-50
      status: 'Available'
    };
    
    building.add(roomMesh);
    rooms.push(roomMesh); // Add room to the rooms array
    floorRooms[floor].push(roomMesh); // Add room to floor-specific array
  });
}


// Add the building to the scene
scene.add(building);

scene.fog = new THREE.Fog(0x87ceeb, 10, 50); // Light blue fog
scene.background = new THREE.Color(0x87ceeb); // Light blue sky

const gridHelper = new THREE.GridHelper(100, 20, 0x444444, 0x444444);
gridHelper.position.y = -0.1;
scene.add(gridHelper);



// Position the camera
camera.position.set(15, 10, 15);
camera.lookAt(0, 5, 0);

// Raycaster for selecting objects
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Currently selected room
let currentlySelected = null;

// Create the 2D floor plan UI elements for each floor
function createFloorPlanElements() {
  // Clear existing floor plan
  floorPlanContainer.innerHTML = '';
  
  // Get current floor
  const currentFloor = parseInt(floorSelect.value);
  
  // Create rooms for this floor
  floorRooms[currentFloor].forEach((roomMesh, index) => {
    const roomElement = document.createElement('div');
    roomElement.className = 'floor-plan-room';
    roomElement.style.position = 'absolute';
    roomElement.style.width = '45%';
    roomElement.style.height = '45%';
    roomElement.style.backgroundColor = roomMesh.userData.isSelected ? '#ff0000' : '#00ff00';
    roomElement.style.opacity = '0.7';
    roomElement.style.border = '1px solid black';
    roomElement.style.cursor = 'pointer';
    
    // Position based on room index
    switch(index) {
      case 0: // Top left
        roomElement.style.top = '5%';
        roomElement.style.left = '5%';
        break;
      case 1: // Top right
        roomElement.style.top = '5%';
        roomElement.style.right = '5%';
        break;
      case 2: // Bottom left
        roomElement.style.bottom = '5%';
        roomElement.style.left = '5%';
        break;
      case 3: // Bottom right
        roomElement.style.bottom = '5%';
        roomElement.style.right = '5%';
        break;
    }
    
    // Add room label
    roomElement.innerHTML = `<div style="text-align:center; padding-top:35%;">Room ${index + 1}</div>`;
    
    // Make the room selectable in the UI
    roomElement.addEventListener('click', () => {
      selectRoom(roomMesh);
    });
    
    floorPlanContainer.appendChild(roomElement);
  });
}

// Handle floor change
floorSelect.addEventListener('change', () => {
  createFloorPlanElements();
  
  // Update camera to focus on the selected floor
  const floorIndex = parseInt(floorSelect.value);
  camera.position.set(15, floorIndex * floorHeight + 7, 15);
  camera.lookAt(0, floorIndex * floorHeight, 0);
});

// Function to select a room (works for both 3D clicks and UI clicks)
let selectedRooms = []; // Array to keep track of selected rooms

function selectRoom(roomMesh) {
  if (!roomMesh.userData.isSelected) {
    // Select the room
    roomMesh.userData.isSelected = true;
    roomMesh.material.color.setHex(0xff0000); // Change color to red
    selectedRooms.push(roomMesh); // Add to selection list
  } else {
    // Deselect the room
    roomMesh.userData.isSelected = false;
    roomMesh.material.color.setHex(roomMesh.userData.originalColor); // Restore original color
    selectedRooms = selectedRooms.filter(room => room !== roomMesh); // Remove from selection list
  }

  // Display selected rooms information
  if (selectedRooms.length > 0) {
    roomInfoDisplay.style.display = 'block';
    roomInfoDisplay.innerHTML = selectedRooms.map(room => `
      <strong>Floor ${room.userData.floor + 1}, ${room.userData.name}</strong><br>
      Capacity: ${room.userData.capacity} people<br>
      Status: <span style="color: ${room.userData.status === 'Available' ? 'green' : 'red'}">
        ${room.userData.status}
      </span>
    `).join('<hr>'); // Show details of multiple rooms
  } else {
    roomInfoDisplay.style.display = 'none'; // Hide if no rooms are selected
  }

  createFloorPlanElements(); // Update 2D floor plan if applicable
}


// Handle mouse click for selection in 3D view
function onMouseClick(event) {
  // Calculate mouse position in normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // Update the raycaster
  raycaster.setFromCamera(mouse, camera);
  
  // Find intersections with room meshes
  const intersects = raycaster.intersectObjects(rooms);
  
  if (intersects.length > 0) {
    // Get the first (closest) intersected room
    const selectedRoom = intersects[0].object;
    
    // Select the room
    selectRoom(selectedRoom);
    
    // Update floor selector to match the floor of the selected room
    floorSelect.value = selectedRoom.userData.floor;
    createFloorPlanElements();
  }
}

// Add event listener for mouse click
window.addEventListener('click', onMouseClick);

// Animate Camera


// Animation function
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // Required for OrbitControls damping
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

// Initialize the floor plan for the first floor
createFloorPlanElements();

// Start the animation loop
// Get references to the dock inputs and container
const subjectInput = document.getElementById('subject-input');
const divisionInput = document.getElementById('division-input');
const addLectureBtn = document.getElementById('add-lecture-btn');
const lectureCardsContainer = document.getElementById('lecture-cards');

let lectures = []; // Store lectures for scheduling

// Function to create a new lecture card
function createLectureCard(subject, division, room = null) {
  const card = document.createElement('div');
  card.className = 'lecture-card';

  const lectureText = document.createElement('span');
  lectureText.textContent = room 
    ? `${subject} (${division}) - Floor ${room.userData.floor + 1}, ${room.userData.name}` 
    : `${subject} (${division})`;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', () => {
    if (room && room.userData.isSelected) {
      selectRoom(room); // Deselect the room
    }
    lectureCardsContainer.removeChild(card);
    lectures = lectures.filter(l => l.card !== card); // Remove from lectures array
  });

  card.appendChild(lectureText);
  card.appendChild(closeBtn);
  
  // Store lecture data
  const lectureData = { subject, division, room, card };
  lectures.push(lectureData);
  
  return card;
}

// Add event listener to the "Add Lecture" button
addLectureBtn.addEventListener('click', () => {
  const subject = subjectInput.value.trim();
  const division = divisionInput.value.trim();
  if (subject && division) {
    let selectedRoom = selectedRooms.length > 0 ? selectedRooms[selectedRooms.length - 1] : null;
    if (selectedRoom && selectedRoom.userData.status !== 'Available') {
      alert('Selected room is not available!');
      return;
    }
    const card = createLectureCard(subject, division, selectedRoom);
    lectureCardsContainer.appendChild(card);
    if (selectedRoom) {
      selectedRoom.userData.status = 'Occupied';
      selectRoom(selectedRoom); // Update UI
      selectRoom(selectedRoom); // Keep highlighted
    }
    subjectInput.value = '';
    divisionInput.value = '';
  }
});

// Allow pressing "Enter" to add a lecture
subjectInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') addLectureBtn.click();
});
divisionInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') addLectureBtn.click();
});

// Create a navbar (unchanged)
const navbar = document.createElement('div');
navbar.style.position = 'absolute';
navbar.style.top = '0';
navbar.style.left = '0';
navbar.style.width = '100%';
navbar.style.height = '50px';
navbar.style.backgroundColor = '#333';
navbar.style.color = 'white';
navbar.style.display = 'flex';
navbar.style.alignItems = 'center';
navbar.style.padding = '0 20px';
navbar.innerHTML = '<h2>Lecture Scheduler</h2>';
document.body.appendChild(navbar);

// Store path lines for cleanup
let pathLines = [];

// Function to create a text label in 3D space
function createTextLabel(text, position) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 128;
  context.fillStyle = 'rgba(255, 255, 255, 0.8)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'black';
  context.font = 'bold 20px Arial';
  context.textAlign = 'center';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.set(2, 1, 1);
  return sprite;
}

// Scheduling algorithm
function scheduleLectures() {
  if (lectures.length === 0) {
    alert('No lectures to schedule!');
    return;
  }

  // Clear previous path and labels
  pathLines.forEach(line => scene.remove(line));
  pathLines = [];
  rooms.forEach(room => {
    if (room.userData.label) {
      scene.remove(room.userData.label);
      room.userData.label = null;
    }
    room.userData.status = 'Available'; // Reset status
  });

  // Sort lectures by division to group students
  lectures.sort((a, b) => a.division.localeCompare(b.division));

  // Assign rooms to minimize floor distance
  let scheduledLectures = [];
  let availableRooms = rooms.filter(r => r.userData.status === 'Available');
  let lastFloor = null;

  lectures.forEach((lecture, index) => {
    if (!availableRooms.length) {
      alert('Not enough available rooms!');
      return;
    }

    // Prioritize room on the same or nearest floor
    let bestRoom = availableRooms.reduce((best, current) => {
      const bestDist = lastFloor !== null ? Math.abs(best.userData.floor - lastFloor) : Infinity;
      const currDist = lastFloor !== null ? Math.abs(current.userData.floor - lastFloor) : Infinity;
      return currDist < bestDist ? current : best;
    }, availableRooms[0]);

    bestRoom.userData.status = 'Occupied';
    bestRoom.userData.isSelected = true;
    bestRoom.material.color.setHex(0xff0000);
    lecture.room = bestRoom;
    scheduledLectures.push({ ...lecture, sequence: index + 1 });
    lastFloor = bestRoom.userData.floor;
    availableRooms = availableRooms.filter(r => r !== bestRoom);

    // Update lecture card
    lecture.card.firstChild.textContent = `${lecture.subject} (${lecture.division}) - Floor ${bestRoom.userData.floor + 1}, ${bestRoom.userData.name}`;

    // Add label to 3D scene
    const labelPos = bestRoom.position.clone().add(new THREE.Vector3(0, 1.5, 0));
    const labelText = `${lecture.subject} (${lecture.division})`;
    const label = createTextLabel(labelText, labelPos);
    scene.add(label);
    bestRoom.userData.label = label;
  });

  // Create path between lectures
  scheduledLectures.sort((a, b) => a.sequence - b.sequence);
  for (let i = 0; i < scheduledLectures.length - 1; i++) {
    const start = scheduledLectures[i].room.position.clone();
    const end = scheduledLectures[i + 1].room.position.clone();
    const pathGeometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const pathMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
    const pathLine = new THREE.Line(pathGeometry, pathMaterial);
    scene.add(pathLine);
    pathLines.push(pathLine);
  }

  // Update UI
  createFloorPlanElements();
}

// Start the animation loop
animate();
