import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.sortObjects = true; // Ensure render order is respected for labels
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
      side: THREE.DoubleSide, // Render both sides for visibility
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
      status: 'Available',
      occupiedLectures: [] // Track lecture numbers this room is occupied for
    };
    
    building.add(roomMesh);
    rooms.push(roomMesh);
    floorRooms[floor].push(roomMesh);
  });
}

scene.add(building);

// Temporarily disable fog to ensure labels aren't faded out
scene.fog = null; // Comment this out if you want fog back after testing
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
    roomElement.style.backgroundColor = roomMesh.userData.occupiedLectures.length > 0 ? '#ff0000' : '#00ff00';
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
      currentlySelected.userData.occupiedLectures.length === 0 ? 
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
      roomMesh.userData.occupiedLectures.length === 0 ? 
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
      Occupied for Lectures: ${roomMesh.userData.occupiedLectures.length > 0 ? roomMesh.userData.occupiedLectures.join(', ') : 'None'}
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

let pathLines = [];

function createTextLabel(text, position, roomZ) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 128;
  context.fillStyle = 'rgba(255, 255, 255, 0.9)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = 'black';
  context.lineWidth = 2;
  context.strokeRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'black';
  context.font = 'bold 20px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false, // Ensure visibility
  });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.set(1.5, 0.75, 1);
  sprite.renderOrder = 1;
  sprite.userData = { roomZ }; // Store the room's Z position

  return sprite;
}

function animate() {
  requestAnimationFrame(animate);
  
  // Animate path lines
  const time = Date.now() * 0.001;
  pathLines.forEach(line => {
    if (line.material) {
      line.material.opacity = 0.6 + Math.sin(time + (line.userData.animationOffset || 0)) * 0.4;
    }
  });

  // Update label visibility and orientation
  scene.traverse(object => {
    if (object.isSprite && object.userData.roomZ !== undefined) {
      object.lookAt(camera.position);
      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);
      const labelDirection = object.position.clone().sub(camera.position).normalize();
      const dot = cameraDirection.dot(labelDirection);
      const isFrontSide = dot > 0;
      object.visible = isFrontSide;
      const distance = camera.position.distanceTo(object.position);
      const maxDistance = 20;
      const opacity = THREE.MathUtils.clamp(1 - distance / maxDistance, 0.3, 1);
      object.material.opacity = opacity;
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

// Add Edit button between Add Lecture and Reset Schedule buttons
let isEditingMode = false;
const editBtn = document.createElement('button');
editBtn.id = 'edit-lectures-btn';
editBtn.textContent = 'Edit';
editBtn.style.padding = '5px 10px';
editBtn.style.background = '#007bff';
editBtn.style.color = 'white';
editBtn.style.border = 'none';
editBtn.style.borderRadius = '5px';
editBtn.style.cursor = 'pointer';
editBtn.style.marginLeft = '10px';
editBtn.addEventListener('click', toggleEditMode);
addLectureBtn.parentNode.insertBefore(editBtn, addLectureBtn.nextSibling);

// Add Reset button beside the Edit button
const resetBtn = document.createElement('button');
resetBtn.id = 'reset-schedule-btn';
resetBtn.textContent = 'Reset Schedule';
resetBtn.style.padding = '5px 10px';
resetBtn.style.background = '#ff4444';
resetBtn.style.color = 'white';
resetBtn.style.border = 'none';
resetBtn.style.borderRadius = '5px';
resetBtn.style.cursor = 'pointer';
resetBtn.style.marginLeft = '10px';
resetBtn.addEventListener('click', resetSchedule);
editBtn.parentNode.insertBefore(resetBtn, editBtn.nextSibling);

let lectures = window.lectureStore;

// Function to toggle editing mode
function toggleEditMode() {
  isEditingMode = !isEditingMode;
  editBtn.textContent = isEditingMode ? 'Done' : 'Edit';
  editBtn.style.background = isEditingMode ? '#28a745' : '#007bff';
  updateLectureCards();
}

// Function to update lecture cards based on editing mode
function updateLectureCards() {
  lectureCardsContainer.innerHTML = ''; // Clear the container
  if (lectures && lectures.length > 0) { // Check if lectures exist and have items
    lectures.forEach(lecture => {
      const card = createLectureCard(lecture.subject, lecture.division, lecture.lecture, lecture.room, false);
      lectureCardsContainer.appendChild(card);
      lecture.card = card;
    });
  }
  window.lectureStore = lectures;
  console.log('After updateLectureCards, lectures:', lectures);
  console.log('After updateLectureCards, lectureCardsContainer:', lectureCardsContainer.innerHTML);
}

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

// Load saved lectures on page load, but only if not reset
window.addEventListener('load', () => {
  if (window.lectureStore && window.lectureStore.length > 0) {
    lectures = window.lectureStore;
    lectures.forEach(lecture => {
      const card = createLectureCard(lecture.subject, lecture.division, lecture.lecture, lecture.room, false);
      lectureCardsContainer.appendChild(card);
      lecture.card = card;
      if (lecture.room) {
        const room = rooms.find(r => r.userData.floor === lecture.room.userData.floor && r.userData.room === lecture.room.userData.room);
        if (room) {
          room.userData.occupiedLectures.push(lecture.lecture);
          room.material.color.setHex(0xff0000);
        }
      }
    });
    createFloorPlanElements();
  }
  console.log('On load, lectures:', lectures);
  console.log('On load, window.lectureStore:', window.lectureStore);
});

function createLectureCard(subject, division, lecture, room = null, addToLectures = true) {
  const card = document.createElement('div');
  card.className = 'lecture-card';

  const lectureText = document.createElement('span');
  lectureText.textContent = room 
    ? `${subject} (${division}) - ${lecture} - Floor ${room.userData.floor + 1}, ${room.userData.name}` 
    : `${subject} (${division}) - ${lecture}`;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', () => {
    if (room) {
      room.userData.occupiedLectures = room.userData.occupiedLectures.filter(l => l !== lecture);
      room.material.color.setHex(room.userData.occupiedLectures.length === 0 ? room.userData.originalColor : 0xff0000);
      // Remove label if the room is no longer occupied
      if (room.userData.occupiedLectures.length === 0 && room.userData.label) {
        scene.remove(room.userData.label);
        room.userData.label = null;
      }
      createFloorPlanElements();
    }
    lectureCardsContainer.removeChild(card);
    lectures = lectures.filter(l => l.card !== card);
    window.lectureStore = lectures;
  });

  card.appendChild(lectureText);
  card.appendChild(closeBtn);

  if (isEditingMode) {
    const editCardBtn = document.createElement('button');
    editCardBtn.textContent = 'Edit';
    editCardBtn.style.marginLeft = '5px';
    editCardBtn.addEventListener('click', () => {
      const lectureData = lectures.find(l => l.card === card);
      if (lectureData) {
        enableEditModeForCard(card, lectureData);
      } else {
        console.error('Lecture data not found for card:', card);
      }
    });
    card.appendChild(editCardBtn);
  }
  
  const lectureData = { subject, division, lecture, room, card };
  if (addToLectures) {
    lectures = lectures.filter(l => l.card !== card);
    lectures.push(lectureData);
    window.lectureStore = lectures;
  }
  
  return card;
}

function enableEditModeForCard(card, lectureData) {
  const { subject, division, lecture, room } = lectureData;

  card.innerHTML = '';

  const subjectInputEdit = document.createElement('input');
  subjectInputEdit.type = 'text';
  subjectInputEdit.value = subject;
  subjectInputEdit.style.margin = '2px';
  subjectInputEdit.style.width = '100px';

  const divisionSelectEdit = document.createElement('select');
  const divisionCount = parseInt(divisionCountInput.value);
  for (let i = 1; i <= divisionCount; i++) {
    const option = document.createElement('option');
    option.value = `D${i}`;
    option.textContent = `D${i}`;
    if (`D${i}` === division) option.selected = true;
    divisionSelectEdit.appendChild(option);
  }
  divisionSelectEdit.style.margin = '2px';

  const lectureSelectEdit = document.createElement('select');
  ['Lecture 1', 'Lecture 2', 'Lecture 3', 'Lecture 4', 'Lecture 5'].forEach(lec => {
    const option = document.createElement('option');
    option.value = lec;
    option.textContent = lec;
    if (lec === lecture) option.selected = true;
    lectureSelectEdit.appendChild(option);
  });
  lectureSelectEdit.style.margin = '2px';

  const roomSelectEdit = document.createElement('select');
  const noRoomOption = document.createElement('option');
  noRoomOption.value = 'none';
  noRoomOption.textContent = 'No Room';
  if (!room) noRoomOption.selected = true;
  roomSelectEdit.appendChild(noRoomOption);
  rooms.forEach(r => {
    const option = document.createElement('option');
    option.value = `${r.userData.floor}-${r.userData.room}`;
    option.textContent = `Floor ${r.userData.floor + 1}, Room ${r.userData.room + 1}`;
    if (room && r.userData.floor === room.userData.floor && r.userData.room === room.userData.room) {
      option.selected = true;
    }
    roomSelectEdit.appendChild(option);
  });
  roomSelectEdit.style.margin = '2px';

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.style.margin = '2px';
  saveBtn.addEventListener('click', () => {
    const newSubject = subjectInputEdit.value.trim();
    const newDivision = divisionSelectEdit.value;
    const newLecture = lectureSelectEdit.value;
    const newRoomValue = roomSelectEdit.value;
    let newRoom = null;
    if (newRoomValue !== 'none') {
      const [floor, roomIndex] = newRoomValue.split('-').map(Number);
      newRoom = rooms.find(r => r.userData.floor === floor && r.userData.room === roomIndex);
    }

    if (!newSubject) {
      alert('Subject cannot be empty!');
      return;
    }

    const duplicateExists = lectures.some(l => 
      l !== lectureData && 
      l.division === newDivision && 
      l.lecture === newLecture
    );
    if (duplicateExists) {
      alert(`Lecture ${newLecture} for ${newDivision} already exists!`);
      return;
    }

    if (newRoom && newRoom !== room && newRoom.userData.occupiedLectures.includes(newLecture)) {
      alert(`This room is already occupied for ${newLecture}! Please select a different room or lecture number.`);
      return;
    }

    // Remove label from the old room if it's no longer occupied
    if (room && (room !== newRoom || lecture !== newLecture)) {
      room.userData.occupiedLectures = room.userData.occupiedLectures.filter(l => l !== lecture);
      room.material.color.setHex(room.userData.occupiedLectures.length === 0 ? room.userData.originalColor : 0xff0000);
      if (room.userData.occupiedLectures.length === 0 && room.userData.label) {
        scene.remove(room.userData.label);
        room.userData.label = null;
        console.log(`Removed label from Floor ${room.userData.floor + 1}, ${room.userData.name}`);
      }
    }
    if (newRoom && (newRoom !== room || lecture !== newLecture)) {
      newRoom.userData.occupiedLectures.push(newLecture);
      newRoom.material.color.setHex(0xff0000);
    }

    const lectureIndex = lectures.findIndex(l => l === lectureData);
    if (lectureIndex !== -1) {
      lectures[lectureIndex] = {
        subject: newSubject,
        division: newDivision,
        lecture: newLecture,
        room: newRoom,
        card: card
      };
      window.lectureStore = lectures;
    }

    updateLectureCards();
    createFloorPlanElements();
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.margin = '2px';
  cancelBtn.addEventListener('click', () => {
    updateLectureCards();
  });

  card.appendChild(subjectInputEdit);
  card.appendChild(document.createElement('br'));
  card.appendChild(divisionSelectEdit);
  card.appendChild(document.createElement('br'));
  card.appendChild(lectureSelectEdit);
  card.appendChild(document.createElement('br'));
  card.appendChild(roomSelectEdit);
  card.appendChild(document.createElement('br'));
  card.appendChild(saveBtn);
  card.appendChild(cancelBtn);
}

addLectureBtn.addEventListener('click', () => {
  const subject = subjectInput.value.trim();
  const division = divisionSelect.value;
  const lecture = lectureSelect.value;
  if (subject && division && lecture) {
    const exists = lectures.some(l => 
      l.division === division && l.lecture === lecture
    );
    if (exists) {
      alert(`Lecture ${lecture} for ${division} already exists! Each division can only have one lecture per lecture number.`);
      return;
    }

    let selectedRoom = currentlySelected;
    if (selectedRoom) {
      if (selectedRoom.userData.occupiedLectures.includes(lecture)) {
        alert(`This room is already occupied for ${lecture}! Please select a different room or lecture number.`);
        return;
      }
    }

    const card = createLectureCard(subject, division, lecture, selectedRoom);
    lectureCardsContainer.appendChild(card);
    if (selectedRoom) {
      selectedRoom.userData.occupiedLectures.push(lecture);
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

function scheduleLectures() {
  if (lectures.length === 0) {
    alert('No lectures to schedule!');
    return;
  }

  pathLines.forEach(line => scene.remove(line));
  pathLines = [];
  rooms.forEach(room => {
    if (room.userData.label) {
      scene.remove(room.userData.label);
      room.userData.label = null;
    }
  });

  const lecturesByDivision = {};
  lectures.forEach(lecture => {
    if (!lecturesByDivision[lecture.division]) {
      lecturesByDivision[lecture.division] = [];
    }
    lecturesByDivision[lecture.division].push(lecture);
  });

  const divisionColors = [0xffff00, 0xff00ff, 0x00ffff, 0xff8000, 0x8000ff];

  Object.keys(lecturesByDivision).forEach((division, divisionIndex) => {
    const divisionLectures = lecturesByDivision[division];
    divisionLectures.sort((a, b) => a.lecture.localeCompare(b.lecture));
    let scheduledLectures = [];
    let availableRooms = rooms.filter(r => !r.userData.occupiedLectures.includes(divisionLectures[0].lecture));
    const divisionColor = divisionColors[divisionIndex % divisionColors.length];

    divisionLectures.forEach((lecture, index) => {
      let bestRoom = lecture.room;
      if (!bestRoom) {
        availableRooms = rooms.filter(r => !r.userData.occupiedLectures.includes(lecture.lecture));
        if (!availableRooms.length) {
          alert(`Not enough available rooms for ${lecture.lecture} in division ${division}!`);
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
      } else if (bestRoom.userData.occupiedLectures.includes(lecture.lecture) && bestRoom !== lecture.room) {
        alert(`Room on Floor ${bestRoom.userData.floor + 1}, ${bestRoom.userData.name} is already occupied for ${lecture.lecture}!`);
        return;
      }

      bestRoom.userData.occupiedLectures.push(lecture.lecture);
      bestRoom.material.color.setHex(0xff0000);
      lecture.room = bestRoom;
      scheduledLectures.push({ ...lecture, sequence: index + 1 });
      availableRooms = availableRooms.filter(r => r !== bestRoom);

      lecture.card.firstChild.textContent = `${lecture.subject} (${lecture.division}) - ${lecture.lecture} - Floor ${bestRoom.userData.floor + 1}, ${bestRoom.userData.name}`;

      const roomHeight = floorHeight - 0.2;
      const labelPos = bestRoom.position.clone().add(new THREE.Vector3(0, -roomHeight / 2 + 0.9, 0));
      const labelText = `${lecture.subject} (${lecture.division}) - ${lecture.lecture}`;
      const label = createTextLabel(labelText, labelPos, bestRoom.position.z);
      scene.add(label);
      bestRoom.userData.label = label;
    });

    scheduledLectures.sort((a, b) => a.sequence - b.sequence);
    for (let i = 0; i < scheduledLectures.length - 1; i++) {
      const start = scheduledLectures[i].room.position.clone();
      const end = scheduledLectures[i + 1].room.position.clone();
      const pathGeometry = new THREE.BufferGeometry().setFromPoints([start, end]);
      const pathMaterial = new THREE.LineBasicMaterial({ color: divisionColor, linewidth: 2 });
      const pathLine = new THREE.Line(pathGeometry, pathMaterial);
      pathLine.userData.animationOffset = i;
      scene.add(pathLine);
      pathLines.push(pathLine);
    }
  });

  createFloorPlanElements();
}

function resetSchedule() {
  // 1. Clear all lectures and lecture cards
  console.log('Before clearing lectures:', lectures);
  lectures = [];
  window.lectureStore = []; // Explicitly clear window.lectureStore
  lectureCardsContainer.innerHTML = '';
  console.log('After clearing lectures:', lectures);
  console.log('After clearing window.lectureStore:', window.lectureStore);
  console.log('Lecture cards container:', lectureCardsContainer.innerHTML);

  // 2. Reset all user inputs in the lecture dock
  subjectInput.value = '';
  divisionSelect.value = 'D1';
  lectureSelect.value = 'Lecture 1';
  divisionCountInput.value = '2';
  updateDivisionOptions(2);
  console.log('User inputs reset:', {
    subject: subjectInput.value,
    division: divisionSelect.value,
    lecture: lectureSelect.value,
    divisionCount: divisionCountInput.value
  });

  // 3. Reset building state and remove all labels
  rooms.forEach(room => {
    room.userData.occupiedLectures = [];
    room.userData.isSelected = false;
    room.material.color.setHex(room.userData.originalColor);
    if (room.userData.label) {
      scene.remove(room.userData.label);
      room.userData.label = null;
    }
  });

  // Additional step: Traverse the scene to remove any remaining sprites (labels)
  scene.traverse(object => {
    if (object.isSprite && object.userData.roomZ !== undefined) {
      scene.remove(object);
      console.log('Removed stray label sprite from scene');
    }
  });

  console.log('Rooms reset:', rooms.map(r => ({
    name: r.userData.name,
    floor: r.userData.floor,
    occupiedLectures: r.userData.occupiedLectures,
    color: r.material.color.getHex(),
    hasLabel: !!r.userData.label
  })));

  // 4. Clear paths
  pathLines.forEach(line => scene.remove(line));
  pathLines = [];
  console.log('Path lines cleared:', pathLines);

  // 5. Reset UI state
  floorSelect.value = '0';
  createFloorPlanElements();
  roomInfoDisplay.style.display = 'none';
  currentlySelected = null;
  selectedRooms = [];
  console.log('UI state reset:', {
    floor: floorSelect.value,
    roomInfoDisplay: roomInfoDisplay.style.display,
    currentlySelected: currentlySelected,
    selectedRooms: selectedRooms
  });

  // 6. Reset editing mode
  isEditingMode = false;
  editBtn.textContent = 'Edit';
  editBtn.style.background = '#007bff';
  updateLectureCards();
  console.log('Editing mode reset:', {
    isEditingMode,
    editBtnText: editBtn.textContent,
    editBtnColor: editBtn.style.background
  });

  // 7. Reset camera position
  camera.position.set(15, 10, 15);
  camera.lookAt(0, 5, 0);
  controls.update();
  console.log('Camera reset:', {
    position: camera.position,
    lookAt: camera.getWorldDirection(new THREE.Vector3())
  });
}

animate();
