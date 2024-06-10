var videoLinks = [
    "https://www.youtube.com/watch?v=-Xlzej8RTTU", // 28.645166730940492, 77.21402962943293
    "https://www.youtube.com/watch?v=7n2vqKHFO1Y", // Iceland
    "https://www.youtube.com/watch?v=9L1jrC2-BTE", // Pompeii
    "https://www.youtube.com/watch?v=1HjK0BQXKYc", // Medellin, Colombia, Downtown, La Candelaria
    "https://www.youtube.com/watch?v=WUtB57qawoo", // Salem, Massachusetts, 3am
    "https://www.youtube.com/watch?v=nr3HUVWw0WI"  // Oslo
];

function getVideoId(url) {
    const urlParams = new URLSearchParams(new URL(url).search);
    return urlParams.get('v');
}

document.getElementById('play-button').addEventListener('click', function () {
    var randomIndex = Math.floor(Math.random() * videoLinks.length);
    var randomLink = videoLinks[randomIndex];
    var videoId = getVideoId(randomLink);

    var iframe = document.getElementById('youtube-player');
    iframe.src = "https://www.youtube.com/embed/" + videoId + "?autoplay=1";
    document.getElementById('player-container').style.display = 'block';
});