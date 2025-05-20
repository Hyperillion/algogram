import { useEffect, useState } from 'react';

export default function useScrollDirection() {
    const [scrollDirection, setScrollDirection] = useState('up');
    const [calculatedScrollY, setCalculatedScrollY] = useState(0);

    useEffect(() => {
        let lastScrollY = window.scrollY;
        let accumulatedScrollY = 0;

        const updateScrollDirection = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY <= 10) {
                setScrollDirection('up');
                lastScrollY = currentScrollY;
                return;
            }
            if (Math.abs(currentScrollY - lastScrollY) < 10) return;
            setScrollDirection(currentScrollY > lastScrollY ? 'down' : 'up');
            if (accumulatedScrollY >= -80 && accumulatedScrollY <= 0) {
                accumulatedScrollY -= (currentScrollY - lastScrollY);
            }
            setCalculatedScrollY(accumulatedScrollY);
            lastScrollY = currentScrollY;
        };

        window.addEventListener('scroll', updateScrollDirection);
        return () => window.removeEventListener('scroll', updateScrollDirection);
    }, []);

    return [scrollDirection, calculatedScrollY];
}