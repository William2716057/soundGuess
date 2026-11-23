
//definitions
const TOTAL_ROUNDS = 5;
const MAX_SCORE = 5000;        // points for a perfect guess
const SCORE_SCALE_KM = 1500;   // edit here
const MAX_VIDEO_ERRORS = 5;  

//elements
const els = {
    start: document.getElementById('start-button'),
    confirm: document.getElementById('confirm-button'),
    next: document.getElementById('next-button'),
    overlay: document.getElementById('overlay'),
    overlayText: document.getElementById('overlay-text'),
    status: document.getElementById('status'),
    info: document.getElementById('info'),
    summary: document.getElementById('summary')
};


//states
let phase = 'idle';            // 'idle' | 'guessing' | 'revealed' | 'finished'
let deck = [];                 // shuffled locations still to be played
let round = 0;
let results = [];              // { name, km, score } per round
let current = null;            // location being played
let guess = null;              // L.LatLng of the player's pending guess
let videoErrors = 0;

let ytPlayer = null;

// Map layers for current round
let guessMarker = null;
let targetMarker = null;
let line = null;

// Only use locations that are playable
const playable = locations.filter(loc => !loc.disabled);


//helpers
function shuffle(array) {
    // Fisher-Yates
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function drawLocation() {
    if (deck.length === 0) {
        deck = shuffle(playable.slice());
    }
    return deck.pop();
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

//haversine algorithm to calucalate straight distance
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

//scores
function scoreForDistance(km) {
    return Math.round(MAX_SCORE * Math.exp(-km / SCORE_SCALE_KM));
}

function formatKm(km) {
    return Math.round(km).toLocaleString() + ' km';
}

function totalScore() {
    return results.reduce((sum, r) => sum + r.score, 0);
}

function setOverlay(visible, text) {
    els.overlay.classList.toggle('overlay-hidden', !visible);
    if (text !== undefined) els.overlayText.textContent = text;
}

function updateStatus() {
    if (phase === 'idle') {
        els.status.textContent = '';
        return;
    }
    els.status.textContent =
        `Round ${Math.min(round, TOTAL_ROUNDS)} of ${TOTAL_ROUNDS}  |  Score: ${totalScore().toLocaleString()}`;
}

function clearRoundLayers() {
    [guessMarker, targetMarker, line].forEach(layer => {
        if (layer) map.removeLayer(layer);
    });
    guessMarker = targetMarker = line = null;
}


//map logic
const map = L.map('map', {
    minZoom: 2,
    maxBounds: [[-85, -180], [85, 180]],
    maxBoundsViscosity: 1.0
}).setView([20, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    noWrap: true,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

map.on('click', function (e) {
    if (phase !== 'guessing') return;   // ignore clicks between rounds / after confirming

    guess = e.latlng;
    if (guessMarker) {
        guessMarker.setLatLng(guess);
    } else {
        guessMarker = L.marker(guess).addTo(map);
    }
    els.confirm.disabled = false;
    els.info.textContent = 'Happy with that? Press "Confirm Guess", or click again to move it.'; //here
});

//YouTube API
window.onYouTubeIframeAPIReady = function () {
    ytPlayer = new YT.Player('youtube-player', {
        width: '100%',
        height: '100%',
        playerVars: {
            controls: 0,
            disablekb: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1
        },
        events: {
            onReady: function () {
                els.start.disabled = false;
                els.start.textContent = 'Start Game';
            },
            onError: handleVideoError
        }
    });
};

function handleVideoError() {
    // Video removed, private, or embedding disabled: quietly swap in another one.
    if (phase !== 'guessing') return;

    videoErrors++;
    console.warn('Video failed to play:', current && current.id);

    if (videoErrors > MAX_VIDEO_ERRORS) {
        els.info.textContent = 'Several videos failed to load. Check your connection and refresh the page.';
        return;
    }
    current = drawLocation();
    ytPlayer.loadVideoById(current.id);
}

//game flow logic
function startGame() {
    deck = shuffle(playable.slice());
    round = 0;
    results = [];
    els.summary.hidden = true;
    els.summary.replaceChildren();
    els.start.hidden = true;
    nextRound();
}

function nextRound() {
    round++;
    phase = 'guessing';
    guess = null;
    videoErrors = 0;

    clearRoundLayers();
    map.setView([20, 0], 2);

    current = drawLocation();
    ytPlayer.loadVideoById(current.id);

    setOverlay(true, '\uD83C\uDFA7 Listen closely...');
    els.confirm.hidden = false;
    els.confirm.disabled = true;
    els.next.hidden = true;
    els.info.textContent = 'Listen to the audio, then click the map to place your guess.'; //here
    updateStatus();
}

function confirmGuess() {
    if (phase !== 'guessing' || !guess) return;
    phase = 'revealed';

    const km = calculateDistance(guess.lat, guess.lng, current.lat, current.lng);
    const score = scoreForDistance(km);
    results.push({ name: current.name, km: km, score: score });

    // Show the answer on the map
    const target = L.latLng(current.lat, current.lng);
    targetMarker = L.circleMarker(target, {
        radius: 9, color: '#146c2e', fillColor: '#2ecc71', fillOpacity: 0.9
    }).addTo(map).bindTooltip(current.name, { permanent: true, direction: 'top' });
    line = L.polyline([target, guess], { color: 'red', dashArray: '6 6' }).addTo(map);
    map.fitBounds(L.latLngBounds([target, guess]), { padding: [60, 60], maxZoom: 5 });

    // Reveal the video
    setOverlay(false);

    els.info.textContent =
        `That was ${current.name}. You were ${formatKm(km)} away and scored ${score.toLocaleString()}.`;
    els.confirm.hidden = true;
    els.next.hidden = false;
    els.next.textContent = round >= TOTAL_ROUNDS ? 'See Results' : 'Next Round';
    updateStatus();
}

function showSummary() {
    phase = 'finished';
    if (ytPlayer && ytPlayer.stopVideo) ytPlayer.stopVideo();

    const avgKm = results.reduce((sum, r) => sum + r.km, 0) / results.length;
    const best = results.reduce((a, b) => (a.km < b.km ? a : b));

    els.summary.replaceChildren();

    const heading = document.createElement('h2');
    heading.textContent = 'Game Over';

    const total = document.createElement('p');
    total.textContent =
        `Total score: ${totalScore().toLocaleString()} / ${(MAX_SCORE * TOTAL_ROUNDS).toLocaleString()}`;

    const average = document.createElement('p');
    average.textContent = `Average distance: ${formatKm(avgKm)}`;

    const bestGuess = document.createElement('p');
    bestGuess.textContent = `Closest guess: ${best.name} (${formatKm(best.km)})`;

    const list = document.createElement('ol');
    results.forEach(r => {
        const li = document.createElement('li');
        li.textContent = `${r.name}: ${formatKm(r.km)} away, ${r.score.toLocaleString()} points`;
        list.appendChild(li);
    });

    els.summary.append(heading, total, average, bestGuess, list);
    els.summary.hidden = false;

    clearRoundLayers();
    map.setView([20, 0], 2);
    setOverlay(true, 'Thanks for playing!');
    els.next.hidden = true;
    els.confirm.hidden = true;
    els.start.hidden = false;
    els.start.textContent = 'Play Again';
    els.info.textContent = '';
}

els.start.addEventListener('click', startGame);
els.confirm.addEventListener('click', confirmGuess);
els.next.addEventListener('click', function () {
    if (round >= TOTAL_ROUNDS) {
        showSummary();
    } else {
        nextRound();
    }
});
/*
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

    document.getElementById('overlay').classList.add('overlay-hidden');
    document.getElementById('show-video-button').style.display = 'none';
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
} */


// display scores and average distances