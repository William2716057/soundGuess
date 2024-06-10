let currentCoordinate = null;
let line = null;

function getVideoId(url) {
    const urlParams = new URLSearchParams(new URL(url).search);
    return urlParams.get('v');
}

document.getElementById('play-button').addEventListener('click', function () {
    var randomIndex = Math.floor(Math.random() * videoLinks.length);
    var randomLink = videoLinks[randomIndex];
    var videoId = getVideoId(randomLink);

    currentCoordinate = coordinates[randomIndex]; // Update target coordinates

    var iframe = document.getElementById('youtube-player');
    iframe.src = "https://www.youtube.com/embed/" + videoId + "?autoplay=1";
    document.getElementById('player-container').style.display = 'block';

    // Reset and show the "Show Video" button
    var showVideoButton = document.getElementById('show-video-button');
    showVideoButton.style.display = 'inline';
    document.getElementById('overlay').classList.remove('overlay-hidden');
});

document.getElementById('show-video-button').addEventListener('click', function () {
    document.getElementById('overlay').classList.add('overlay-hidden');
    this.style.display = 'none'; // Hide the "Show Video" button after clicking
});

const map = L.map('map').setView([0, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

map.on('click', function (e) {
    if (!currentCoordinate) return; // Exit if no target coordinates set

    const userLat = e.latlng.lat;
    const userLng = e.latlng.lng;

    if (line) {
        map.removeLayer(line); // Remove existing line if any
    }

    line = L.polyline([currentCoordinate, [userLat, userLng]], { color: 'red' }).addTo(map); // Draw line

    const distance = calculateDistance(userLat, userLng, currentCoordinate[0], currentCoordinate[1]);

    document.getElementById('info').innerText = `Your guess is ${distance.toFixed(2)} km away from the target location.`;
});

// Formulas for calculating distance
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}