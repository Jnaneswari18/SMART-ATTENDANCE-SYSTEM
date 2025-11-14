// ====== DOM ELEMENTS ======
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const startBtn = document.getElementById('startCamera');
const captureBtn = document.getElementById('capturePhoto');
const studentNameInput = document.getElementById('studentName');
const registerNumberInput = document.getElementById('registerNumber');
const messageBox = document.getElementById('message');
const attendanceTable = document.getElementById('attendanceTable').querySelector('tbody');

// ====== CONSTANTS ======
const COLLEGE_LAT = 17.86991525;
const COLLEGE_LON = 83.29601172913065;
const ALLOWED_RADIUS = 0.1; // km (≈100 meters)

let stream = null;

// ====== START CAMERA ======
startBtn.addEventListener('click', async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    video.srcObject = stream;
    messageBox.style.color = "#22c55e";
    messageBox.textContent = "✅ Camera started successfully!";
    captureBtn.disabled = false;
  } catch (err) {
    console.error(err);
    messageBox.style.color = "#ef4444";
    messageBox.textContent = "🚫 Unable to start camera. Please allow camera permission.";
  }
});

// ====== CAPTURE & MARK ATTENDANCE ======
captureBtn.addEventListener('click', () => {
  const name = studentNameInput.value.trim();
  const regNo = registerNumberInput.value.trim();

  if (!name || !regNo) {
    alert("Please enter both Name and Register Number.");
    return;
  }

  if (!navigator.geolocation) {
    alert("Geolocation not supported by your browser.");
    return;
  }

  messageBox.style.color = "#facc15";
  messageBox.textContent = "📍 Checking your location...";

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const userLat = pos.coords.latitude;
      const userLon = pos.coords.longitude;
      const distance = getDistanceFromLatLonInKm(userLat, userLon, COLLEGE_LAT, COLLEGE_LON);

      if (distance <= ALLOWED_RADIUS) {
        capturePhotoAndMark(name, regNo);
      } else {
        messageBox.style.color = "#ef4444";
        messageBox.textContent = "🚫 You are outside the college area. Attendance not marked.";
      }
    },
    (err) => {
      console.error(err);
      messageBox.style.color = "#ef4444";
      messageBox.textContent = "❌ Failed to get location. Please enable GPS.";
    }
  );
});

// ====== CAPTURE FUNCTION ======
function capturePhotoAndMark(name, regNo) {
  // Capture image from video stream
  const ctx = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = canvas.toDataURL('image/png'); // base64 image (can be saved later)
  const now = new Date();
  const date = now.toLocaleDateString();
  const time = now.toLocaleTimeString();

  // Store attendance
  saveAttendance({ name, regNo, date, time, imageData });

  messageBox.style.color = "#10b981";
  messageBox.textContent = `🎉 Attendance Marked Successfully at ${time} on ${date} ✅`;

  // Refresh table
  renderAttendanceTable();
}

// ====== SAVE ATTENDANCE LOCALLY ======
function saveAttendance(entry) {
  let data = JSON.parse(localStorage.getItem('attendanceData')) || [];

  // Prevent multiple entries on same day
  const alreadyMarked = data.find(
    (e) => e.regNo === entry.regNo && e.date === entry.date
  );

  if (!alreadyMarked) {
    data.push(entry);
    localStorage.setItem('attendanceData', JSON.stringify(data));
  } else {
    messageBox.style.color = "#fbbf24";
    messageBox.textContent = "⚠️ Attendance already marked for today.";
  }
}

// ====== DISPLAY ATTENDANCE ======
function renderAttendanceTable() {
  let data = JSON.parse(localStorage.getItem('attendanceData')) || [];
  attendanceTable.innerHTML = '';

  data.forEach((entry) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${entry.date}</td>
      <td>✅ Present</td>
    `;
    attendanceTable.appendChild(row);
  });
}

// ====== DISTANCE CALCULATION (Haversine) ======
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // radius of Earth (km)
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// ====== LOAD ATTENDANCE ON START ======
window.addEventListener('load', renderAttendanceTable);

