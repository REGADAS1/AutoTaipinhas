document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('brandsTrack');
    if (!track) return;

    const moveInterval = 2000;
    const animationDuration = 550;

    function slideNext() {
        const firstItem = track.querySelector('.brand-logo-item');
        if (!firstItem) return;

        const itemWidth = firstItem.offsetWidth;

        track.style.transition = `transform ${animationDuration}ms ease`;
        track.style.transform = `translateX(-${itemWidth}px)`;

        const handleTransitionEnd = () => {
            track.style.transition = 'none';
            track.style.transform = 'translateX(0)';
            track.appendChild(firstItem);
            track.removeEventListener('transitionend', handleTransitionEnd);
        };

        track.addEventListener('transitionend', handleTransitionEnd);
    }

    setInterval(slideNext, moveInterval);
});