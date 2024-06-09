document.getElementById('play-button').addEventListener('click', function () {
    var iframe = document.getElementById('youtube-player');
    iframe.src = "https://www.youtube.com/embed/YF3pj_3mdMc?autoplay=1";
    document.getElementById('player-container').style.display = 'block';
});