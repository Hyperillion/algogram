import React, { useEffect, useState } from 'react';

const targetWords = [
    'This_is',
    'the_social_media',
    "that_algorithms",
    "has_your_fully_controlled",
    "welcome_to",
    "algogram"
];
const glitchChars = '￥¥#@!&$*%^?_1234567890';

export default function FirstLoading() {
    const [wordIndex, setWordIndex] = useState(0);
    const [displayText, setDisplayText] = useState([]);
    const [confirmed, setConfirmed] = useState([]);

    useEffect(() => {
        let isCancelled = false;

        const startAnimation = async () => {
            const currentWord = targetWords[wordIndex];
            setDisplayText(Array(currentWord.length).fill(''));
            setConfirmed(Array(currentWord.length).fill(false));

            for (let index = 0; index < currentWord.length; index++) {
                await scrambleOne(index, currentWord);
                if (isCancelled) return;
            }

            setTimeout(() => {
                if (!isCancelled) {
                    setWordIndex((prev) => (prev + 1) % targetWords.length);
                }
            }, 400); // wait before switching word
        };

        const scrambleOne = (index, word) => {
            return new Promise((resolve) => {
                let remaining = Math.floor(Math.random() * 3) + 3;

                const tick = () => {
                    if (remaining <= 0) {
                        setDisplayText((prev) => {
                            const updated = [...prev];
                            updated[index] = word[index];
                            return updated;
                        });
                        setConfirmed((prev) => {
                            const updated = [...prev];
                            updated[index] = true;
                            return updated;
                        });
                        resolve();
                    } else {
                        setDisplayText((prev) => {
                            const updated = [...prev];
                            updated[index] = glitchChars[Math.floor(Math.random() * glitchChars.length)];
                            return updated;
                        });
                        remaining--;
                        setTimeout(tick, 40);
                    }
                };

                tick();
            });
        };

        startAnimation();

        return () => {
            isCancelled = true;
        };
    }, [wordIndex]);

    return (
        <div style={overlayStyles}>
            <div style={textContainerStyles}>
                {displayText.map((char, i) => (
                    <span
                        key={i}
                        style={{
                            ...charStyles,
                            color: confirmed[i] ? '#39ff14' : '#444',
                        }}
                    >
                        {char}
                    </span>
                ))}
            </div>
        </div>
    );
}

const overlayStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 2000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
};

const textContainerStyles = {
    fontFamily: 'monospace',
    fontSize: '2rem',
    letterSpacing: '0.2em',
    display: 'flex',
};

const charStyles = {
    transition: 'all 0.2s ease-in-out',
    minWidth: '1ch',
};
