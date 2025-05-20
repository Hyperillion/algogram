import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import GlitchLoading from "../components/GlitchLoading";

const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:',.<>/?";
const FONT_SIZE = 20;
const ROWS = 60;

const sentenceWords = [
    "In", "the", "chaos", "of", "information", "the", "algorithm", "made_up", "a", "unique", "story", "just", "for", "you"
];

function getRandomChar() {
    return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
}
function getRandomGray() {
    const gray = Math.floor(Math.random() * 85) + 20;
    return `rgb(${gray},${gray},${gray})`;
}
function getIndex(row, col, columns) {
    return row * columns + col;
}

export default function Landing() {
    const navigate = useNavigate();
    const [grid, setGrid] = useState([]);
    const [columns, setColumns] = useState(Math.floor(window.innerWidth / FONT_SIZE));
    const staticCharMap = useRef(new Map());
    const intervalRefs = useRef([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const newColumns = Math.floor(window.innerWidth / FONT_SIZE);
            setColumns(newColumns);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        intervalRefs.current.forEach(clearInterval);
        intervalRefs.current = [];

        const totalChars = ROWS * columns;
        const chars = Array.from({ length: totalChars }, () => ({
            char: getRandomChar(),
            color: getRandomGray(),
        }));

        sentenceWords.forEach((word, i) => {
            const rowOffset = Math.floor(Math.random() * 2);  // 0 or 1 row wiggle
            const row = 3 + i * 2 + rowOffset;

            const colOffset = Math.floor(Math.random() * 8) - 4; // random left/right shift
            const startCol = Math.floor((columns - word.length) / 2) + colOffset;

            for (let j = 0; j < word.length; j++) {
                const index = getIndex(row, startCol + j, columns);
                chars[index] = {
                    char: word[j],
                    color: "#fff",
                    isSentenceWord: true,
                    wordId: i,
                };
                staticCharMap.current.set(index, word[j]);
            }
        });


        const algoWord = "algorithmic";
        const algoRow = ROWS - 11;
        const algoStartCol = Math.floor((columns - algoWord.length) / 2);
        for (let i = 0; i < algoWord.length; i++) {
            const index = getIndex(algoRow, algoStartCol + i, columns);
            chars[index] = {
                char: algoWord[i],
                color: "#fff",
                isAlgo: i < 4
            };
            staticCharMap.current.set(index, algoWord[i]);
        }

        const gramWord = "telegram";
        const gramRow = ROWS - 9;
        const gramStartCol = Math.floor((columns - gramWord.length) / 2);
        for (let i = 0; i < gramWord.length; i++) {
            const index = getIndex(gramRow, gramStartCol + i, columns);
            chars[index] = {
                char: gramWord[i],
                color: "#fff",
                isGram: i >= 4 && i < 8
            };
            staticCharMap.current.set(index, gramWord[i]);
        }

        setGrid(chars);

        for (let i = 0; i < totalChars; i++) {
            if (staticCharMap.current.has(i)) continue;
            const updateChar = () => {
                setGrid((prev) => {
                    const updated = [...prev];
                    updated[i] = {
                        char: getRandomChar(),
                        color: getRandomGray(),
                    };
                    return updated;
                });
            };
            const interval = setInterval(updateChar, 100 + Math.random() * 1500);
            intervalRefs.current.push(interval);
        }

        return () => {
            intervalRefs.current.forEach(clearInterval);
            intervalRefs.current = [];
        };
    }, [columns]);

    const handleNavigate = () => {
        intervalRefs.current.forEach(clearInterval);
        intervalRefs.current = [];
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            navigate("/login");
        }, 4000);
    };

    const pulseStyle = {
        animation: "pulse 2s infinite ease-in-out",
        "@keyframes pulse": {
            "0%": { boxShadow: "0 0 6px rgba(57, 255, 20, 0.4)" },
            "50%": { boxShadow: "0 0 16px rgba(57, 255, 20, 1)" },
            "100%": { boxShadow: "0 0 6px rgba(57, 255, 20, 0.4)" },
        },
    };
    const pinkPulseStyle = {
        animation: "pulsePink 2s infinite ease-in-out",
        "@keyframes pulsePink": {
            "0%": { boxShadow: "0 0 6px rgba(255, 0, 255, 0.4)" },
            "50%": { boxShadow: "0 0 16px rgba(255, 0, 255, 1)" },
            "100%": { boxShadow: "0 0 6px rgba(255, 0, 255, 0.4)" },
        },
    };
    const fadeIn = {
        animation: "fadeIn 1s ease-out",
        "@keyframes fadeIn": {
            from: { opacity: 0 },
            to: { opacity: 1 },
        },
    };

    return (
        <Box sx={{ backgroundColor: "#000", minHeight: "100vh", overflow: "hidden", paddingTop: 4 }}>
            <Box
                sx={{
                    fontFamily: "monospace",
                    fontSize: `${FONT_SIZE}px`,
                    lineHeight: 1.3,
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "left",
                    px: 2,
                }}
            >
                {grid.map((item, i) => {
                    const key = i;
                    const isWordStart = item.wordId !== undefined &&
                        (i === 0 || grid[i - 1].wordId !== item.wordId);

                    if (item.wordId !== undefined && !isWordStart) return null;

                    if (item.wordId !== undefined) {
                        const word = sentenceWords[item.wordId];
                        const row = 2 + item.wordId * 2;
                        const startCol = Math.floor((columns - word.length) / 2);
                        const chars = word.split("").map((c, j) => {
                            const index = getIndex(row, startCol + j, columns);
                            return (
                                <Box
                                    key={j}
                                    component="span"
                                    sx={{ color: "#fff", px: "1px" }}
                                >
                                    {c}

                                </Box>
                            );
                        });

                        return (
                            <Box
                                key={key}
                                component="span"
                                sx={{ display: "inline-block", whiteSpace: "nowrap", px: 1 }}
                            >
                                {chars}
                            </Box>
                        );
                    }

                    return (
                        <Box
                            key={key}
                            component="span"
                            sx={{
                                display: "inline-block",
                                textAlign: "left",
                                userSelect: "none",
                                padding: "0 1px",
                                color: item.color,
                                border: item.isAlgo
                                    ? "2px solid #39ff14"
                                    : item.isGram
                                        ? "2px solid #ff00ff"
                                        : "none",
                                borderRadius: "0px",
                                ...(item.isAlgo ? pulseStyle : {}),
                                ...(item.isGram ? pinkPulseStyle : {}),
                                ...(item.isAlgo || item.isGram ? fadeIn : {}),
                            }}
                        >
                            {item.char}
                        </Box>
                    );
                })}

                <Typography
                    variant="body1"
                    sx={{
                        color: "#fff",
                        mb: 3,
                        fontFamily: "monospace",
                        fontSize: 18,
                        letterSpacing: "0.04em",
                        textTransform: "none",
                    }}
                >
                    and mostly people treat that story as reality.
                </Typography>
            </Box>

            <Box sx={{ textAlign: "center", position: "relative", zIndex: 2, mt: 2, pb: 4 }}>
                <Button
                    variant="outlined" // 或用 contained 但自定义样式
                    sx={{
                        fontFamily: "monospace",
                        textTransform: "lowercase",
                        fontSize: 16,
                        letterSpacing: "0.05em",
                        px: 4,
                        py: 1.5,
                        borderRadius: 0,
                    }}
                    onClick={handleNavigate}
                >
                    see your story of reality
                </Button>

            </Box>
            {loading && <GlitchLoading />}
        </Box>
    );
}