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

const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
scene.add(hemisphereLight);

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

// In-memory store for lectures
window.lectureStore = window.lectureStore || [];

// Create each floor
for (let floor = 0; floor < totalFloors; floor++) {
  const option = document.createElement('option');
  option.value = floor;
  option.textContent = `Floor ${floor + 1}`;
  floorSelect.appendChild(option);
  
  const floorGeometry = new THREE.BoxGeometry(buildingWidth, 0.2, buildingDepth);
  const floorMaterial = new THREE.MeshPhongMaterial({
    color: 0xcccccc,
    shininess: 100,
  });  
  const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
  floorMesh.position.y = floor * floorHeight;
  floorMesh.receiveShadow = true;
  building.add(floorMesh);
  
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
    
    roomMesh.userData = {
      floor: floor,
      room: index,
      originalColor: 0x00ff00,
      isSelected: false,
      name: `Room ${index + 1}`,
      capacity: Math.floor(Math.random() * 30) + 20,
      status: 'Available'
    };
    
    building.add(roomMesh);
    rooms.push(roomMesh);
    floorRooms[floor].push(roomMesh);
  });
}

scene.add(building);

scene.fog = new THREE.Fog(0x87ceeb, 10, 50);
scene.background = new THREE.Color(0x87ceeb);

const gridHelper = new THREE.GridHelper(100, 20, 0x444444, 0x444444);
gridHelper.position.y = -0.1;
scene.add(gridHelper);

camera.position.set(15, 10, 15);
camera.lookAt(0, 5, 0);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let currentlySelected = null;

function createFloorPlanElements() {
  floorPlanContainer.innerHTML = '';
  const currentFloor = parseInt(floorSelect.value);
  
  floorRooms[currentFloor].forEach((roomMesh, index) => {
    const roomElement = document.createElement('div');
    roomElement.className = 'floor-plan-room';
    roomElement.style.position = 'absolute';
    roomElement.style.width = '45%';
    roomElement.style.height = '45%';
    roomElement.style.backgroundColor = roomMesh.userData.status === 'Occupied' ? '#ff0000' : '#00ff00';
    roomElement.style.opacity = '0.7';
    roomElement.style.border = '1px solid black';
    roomElement.style.cursor = 'pointer';
    
    switch(index) {
      case 0: roomElement.style.top = '5%'; roomElement.style.left = '5%'; break;
      case 1: roomElement.style.top = '5%'; roomElement.style.right = '5%'; break;
      case 2: roomElement.style.bottom = '5%'; roomElement.style.left = '5%'; break;
      case 3: roomElement.style.bottom = '5%'; roomElement.style.right = '5%'; break;
    }
    
    roomElement.innerHTML = `<div style="text-align:center; padding-top:35%;">Room ${index + 1}</div>`;
    roomElement.addEventListener('click', () => selectRoom(roomMesh));
    floorPlanContainer.appendChild(roomElement);
  });
}

floorSelect.addEventListener('change', () => {
  createFloorPlanElements();
  const floorIndex = parseInt(floorSelect.value);
  camera.position.set(15, floorIndex * floorHeight + 7, 15);
  camera.lookAt(0, floorIndex * floorHeight, 0);
});

let selectedRooms = [];

function selectRoom(roomMesh) {
  if (currentlySelected && currentlySelected !== roomMesh) {
    currentlySelected.userData.isSelected = false;
    currentlySelected.material.color.setHex(
      currentlySelected.userData.status === 'Available' ? 
      0x00ff00 : 0xff0000
    );
  }

  if (!roomMesh.userData.isSelected) {
    roomMesh.userData.isSelected = true;
    roomMesh.material.color.setHex(0xffff00); // Yellow for selection
    currentlySelected = roomMesh;
    selectedRooms = [roomMesh];
  } else {
    roomMesh.userData.isSelected = false;
    roomMesh.material.color.setHex(
      roomMesh.userData.status === 'Available' ? 
      0x00ff00 : 0xff0000
    );
    currentlySelected = null;
    selectedRooms = [];
  }

  if (roomMesh.userData.isSelected) {
    roomInfoDisplay.style.display = 'block';
    roomInfoDisplay.innerHTML = `
      <strong>Floor ${roomMesh.userData.floor + 1}, ${roomMesh.userData.name}</strong><br>
      Capacity: ${roomMesh.userData.capacity} people<br>
      Status: <span style="color: ${roomMesh.userData.status === 'Available' ? 'green' : 'red'}">
        ${roomMesh.userData.status}
      </span>
    `;
  } else {
    roomInfoDisplay.style.display = 'none';
  }

  createFloorPlanElements();
}

function onMouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(rooms);
  
  if (intersects.length > 0) {
    const selectedRoom = intersects[0].object;
    selectRoom(selectedRoom);
    floorSelect.value = selectedRoom.userData.floor;
    createFloorPlanElements();
  }
}

window.addEventListener('click', onMouseClick);

function animate() {
  requestAnimationFrame(animate);
  
  // Animate path lines
  const time = Date.now() * 0.001;
  pathLines.forEach(line => {
    if (line.material) {
      line.material.opacity = 0.6 + Math.sin(time + line.userData.animationOffset) * 0.4;
    }
  });

  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  const newWidth = window.innerWidth;
  const newHeight = window.innerHeight;
  camera.aspect = newWidth / newHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(newWidth, newHeight);
});

createFloorPlanElements();

// Lecture dock elements
const subjectInput = document.getElementById('subject-input');
const divisionSelect = document.getElementById('division-select');
const lectureSelect = document.getElementById('lecture-select');
const addLectureBtn = document.getElementById('add-lecture-btn');
const lectureCardsContainer = document.getElementById('lecture-cards');
const divisionCountInput = document.getElementById('division-count');
const updateDivisionsBtn = document.getElementById('update-divisions-btn');

let lectures = window.lectureStore;

// Function to update division dropdown options
function updateDivisionOptions(count) {
  divisionSelect.innerHTML = '';
  for (let i = 1; i <= count; i++) {
    const option = document.createElement('option');
    option.value = `D${i}`;
    option.textContent = `D${i}`;
    divisionSelect.appendChild(option);
  }
}

// Initial setup with default number of divisions (2)
updateDivisionOptions(parseInt(divisionCountInput.value));

// Update divisions when button clicked
updateDivisionsBtn.addEventListener('click', () => {
  const newCount = parseInt(divisionCountInput.value);
  if (newCount >= 1) {
    updateDivisionOptions(newCount);
  } else {
    alert('Please enter a number greater than or equal to 1.');
    divisionCountInput.value = 1;
    updateDivisionOptions(1);
  }
});

// Load saved lectures on page load
window.addEventListener('load', () => {
  lectures.forEach(lecture => {
    const card = createLectureCard(lecture.subject, lecture.division, lecture.lecture, lecture.room);
    lectureCardsContainer.appendChild(card);
    if (lecture.room) {
      const room = rooms.find(r => r.userData.floor === lecture.room.userData.floor && r.userData.room === lecture.room.userData.room);
      if (room) {
        room.userData.status = 'Occupied';
        room.material.color.setHex(0xff0000);
      }
    }
  });
  createFloorPlanElements();
});

function createLectureCard(subject, division, lecture, room = null) {
  const card = document.createElement('div');
  card.className = 'lecture-card';

  const lectureText = document.createElement('span');
  lectureText.textContent = room 
    ? `${subject} (${division}) - ${lecture} - Floor ${room.userData.floor + 1}, ${room.userData.name}` 
    : `${subject} (${division}) - ${lecture}`;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', () => {
    if (room && room.userData.status === 'Occupied') {
      room.userData.status = 'Available';
      room.userData.isSelected = false;
      room.material.color.setHex(room.userData.originalColor);
      createFloorPlanElements();
    }
    lectureCardsContainer.removeChild(card);
    lectures = lectures.filter(l => l.card !== card);
    window.lectureStore = lectures;
  });

  card.appendChild(lectureText);
  card.appendChild(closeBtn);
  
  const lectureData = { subject, division, lecture, room, card };
  lectures.push(lectureData);
  window.lectureStore = lectures;
  
  return card;
}

addLectureBtn.addEventListener('click', () => {
  const subject = subjectInput.value.trim();
  const division = divisionSelect.value;
  const lecture = lectureSelect.value;
  if (subject && division && lecture) {
    let selectedRoom = currentlySelected;
    if (selectedRoom && selectedRoom.userData.status !== 'Available') {
      alert('Selected room is not available!');
      return;
    }
    const card = createLectureCard(subject, division, lecture, selectedRoom);
    lectureCardsContainer.appendChild(card);
    if (selectedRoom) {
      selectedRoom.userData.status = 'Occupied';
      selectedRoom.userData.isSelected = false;
      selectedRoom.material.color.setHex(0xff0000);
      currentlySelected = null;
      selectedRooms = [];
    }
    subjectInput.value = '';
    createFloorPlanElements();
  }
});

subjectInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') addLectureBtn.click();
});

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

let pathLines = [];

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

function scheduleLectures() {
  if (lectures.length === 0) {
    alert('No lectures to schedule!');
    return;
  }

  // Clear existing paths and labels
  pathLines.forEach(line => scene.remove(line));
  pathLines = [];
  rooms.forEach(room => {
    if (room.userData.label) {
      scene.remove(room.userData.label);
      room.userData.label = null;
    }
  });

  // Group lectures by division
  const lecturesByDivision = {};
  lectures.forEach(lecture => {
    if (!lecturesByDivision[lecture.division]) {
      lecturesByDivision[lecture.division] = [];
    }
    lecturesByDivision[lecture.division].push(lecture);
  });

  // Define colors for different divisions
  const divisionColors = [
    0xffff00, // Yellow
    0xff00ff, // Magenta
    0x00ffff, // Cyan
    0xff8000, // Orange
    0x8000ff  // Purple
  ];

  // Process each division separately
  Object.keys(lecturesByDivision).forEach((division, divisionIndex) => {
    const divisionLectures = lecturesByDivision[division];
    divisionLectures.sort((a, b) => a.lecture.localeCompare(b.lecture));
    
    let scheduledLectures = [];
    let availableRooms = rooms.filter(r => r.userData.status === 'Available');
    const divisionColor = divisionColors[divisionIndex % divisionColors.length];

    divisionLectures.forEach((lecture, index) => {
      let bestRoom;
      if (lecture.room) {
        bestRoom = lecture.room;
        if (bestRoom.userData.status === 'Occupied' && bestRoom !== lecture.room) {
          alert(`Room on Floor ${bestRoom.userData.floor + 1}, ${bestRoom.userData.name} is already occupied!`);
          return;
        }
      } else {
        if (!availableRooms.length) {
          alert(`Not enough available rooms for division ${division}!`);
          return;
        }
        bestRoom = availableRooms.reduce((best, current) => {
          const bestDist = scheduledLectures.length > 0 ? 
            Math.abs(best.userData.floor - scheduledLectures[scheduledLectures.length - 1].room.userData.floor) : 
            Infinity;
          const currDist = scheduledLectures.length > 0 ? 
            Math.abs(current.userData.floor - scheduledLectures[scheduledLectures.length - 1].room.userData.floor) : 
            Infinity;
          return currDist < bestDist ? current : best;
        }, availableRooms[0]);
      }

      bestRoom.userData.status = 'Occupied';
      bestRoom.material.color.setHex(0xff0000);
      lecture.room = bestRoom;
      scheduledLectures.push({ ...lecture, sequence: index + 1 });
      availableRooms = availableRooms.filter(r => r !== bestRoom);

      lecture.card.firstChild.textContent = `${lecture.subject} (${lecture.division}) - ${lecture.lecture} - Floor ${bestRoom.userData.floor + 1}, ${bestRoom.userData.name}`;

      const labelPos = bestRoom.position.clone().add(new THREE.Vector3(0, 1.5, 0));
      const labelText = `${lecture.subject} (${lecture.division}) - ${lecture.lecture}`;
      const label = createTextLabel(labelText, labelPos);
      scene.add(label);
      bestRoom.userData.label = label;
    });

    // Create path for this division
    scheduledLectures.sort((a, b) => a.sequence - b.sequence);
    for (let i = 0; i < scheduledLectures.length - 1; i++) {
      const start = scheduledLectures[i].room.position.clone();
      const end = scheduledLectures[i + 1].room.position.clone();
      const pathGeometry = new THREE.BufferGeometry().setFromPoints([start, end]);
      const pathMaterial = new THREE.LineBasicMaterial({ 
        color: divisionColor, 
        linewidth: 2
      });
      const pathLine = new THREE.Line(pathGeometry, pathMaterial);
      scene.add(pathLine);
      pathLines.push(pathLine);
    }
  });

  createFloorPlanElements();
}

animate();