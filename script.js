var videoLinks = [
    "https://www.youtube.com/watch?v=-Xlzej8RTTU", // 28.645166730940492, 77.21402962943293
    "https://www.youtube.com/watch?v=7n2vqKHFO1Y", // 64.963051, -19.020835
    "https://www.youtube.com/watch?v=9L1jrC2-BTE", // 40.7460, 14.4989
    "https://www.youtube.com/watch?v=1HjK0BQXKYc", // 6.230833, -75.590553
    "https://www.youtube.com/watch?v=WUtB57qawoo", // 42.5195, -70.8967
    "https://www.youtube.com/watch?v=nr3HUVWw0WI"  // 59.9139, 10.7522
];

var coordinates = [
    [28.645166730940492, 77.21402962943293], // Delhi
    [64.963051, -19.020835], // Iceland
    [40.7460, 14.4989], // Pompeii
    [6.230833, -75.590553], // Medellin
    [42.5195, -70.8967], // Salem
    [59.9139, 10.7522] // Oslo
];

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

    currentCoordinate = coordinates[randomIndex]; //Update target coordinates

    var iframe = document.getElementById('youtube-player');
    iframe.src = "https://www.youtube.com/embed/" + videoId + "?autoplay=1";
    document.getElementById('player-container').style.display = 'block';
});

const map = L.map('map').setView([0, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

map.on('click', function (e) {
    if (!currentCoordinate) return; //Exit if no target coordinates set

    const userLat = e.latlng.lat;
    const userLng = e.latlng.lng;

    if (line) {
        map.removeLayer(line); // Remove existing line if any
    }

    line = L.polyline([currentCoordinate, [userLat, userLng]], { color: 'red' }).addTo(map); // Draw line

    const distance = calculateDistance(userLat, userLng, currentCoordinate[0], currentCoordinate[1]);

    document.getElementById('info').innerText = `Your guess is ${distance.toFixed(2)} km away from the target location.`;
});

//formulas for calculating distace
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