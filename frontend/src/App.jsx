import React, { useEffect, useState } from "react";
import Navbar from "./components/navbar"; // make sure this path is correct
import Navcard from "./components/navcard";
import itemData from "../src/assets/parsed_items3.json";

const EMOJI_SIZE = 45;
const NUM_EMOJIS = 200;

const getRandomPosition = (maxWidth, maxHeight) => {
  const x = Math.random() * (maxWidth - EMOJI_SIZE);
  const y = Math.random() * (maxHeight - EMOJI_SIZE);
  return { x, y };
};

const isOverlapping = (pos1, pos2, margin = 10) => {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < EMOJI_SIZE + margin;
};

const getRandomRotation = () => {
  return (Math.random() * 60) - 30;
};

const titleCase = (str) => {
  return str
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const App = () => {
  const [positions, setPositions] = useState([]);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    // Preload unique emoji URLs
    const uniqueItems = itemData.filter(item => item.emoji?.url);
    const preload = Array.from(new Set(uniqueItems.map(item => item.emoji.url)));
    preload.forEach(url => {
      const img = new Image();
      img.src = url;
    });

    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;
    let placed = [];

    while (placed.length < NUM_EMOJIS && uniqueItems.length > 0) {
      const item = uniqueItems[Math.floor(Math.random() * uniqueItems.length)];
      let pos;
      let tries = 0;
      do {
        pos = getRandomPosition(maxWidth, maxHeight);
        tries++;
      } while (placed.some(p => isOverlapping(p, pos)) && tries < 100);

      if (tries < 100) {
        placed.push({
          ...pos,
          url: item.emoji.url,
          rotation: getRandomRotation(),
          name: item.name,
          latestValue: item.history?.[item.history.length - 1]?.value ?? "N/A"
        });
      } else {
        break;
      }
    }

    setPositions(placed);
  }, []);


  return (
    <div className="min-h-screen bg-[#070e0c] relative overflow-hidden">
      <Navbar />
      {positions.map(({ x, y, url, rotation, name, latestValue }, i) => (
        <div
          key={i}
          onMouseEnter={() => setHovered({ i, x, y, name, latestValue })}
          onMouseLeave={() => setHovered(null)}
          style={{
            position: "absolute",
            top: y,
            left: x,
            width: EMOJI_SIZE,
            height: EMOJI_SIZE,
            transform: hovered?.i === i
              ? "scale(1.4) rotate(0deg)"
              : `rotate(${rotation}deg) scale(1)`,
            transition: "transform 0.2s ease, opacity 0.2s ease",
            opacity: hovered?.i === i ? 1 : 0.6,
            cursor: "pointer",
            zIndex: hovered?.i === i ? 10 : 1,
          }}
        >
          <img
            src={url}
            alt="emoji"
            style={{
              width: "100%",
              height: "100%",
              userSelect: "none",
              pointerEvents: "auto",
            }}
          />
        </div>
      ))}

      {hovered && (
        <div
          style={{
            position: "absolute",
            top: hovered.y - 10,
            left: hovered.x + EMOJI_SIZE + 10,
            background: "rgba(0,0,0,0.8)",
            color: "white",
            padding: "6px 10px",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 20,
          }}
        >
          <div className="font-semibold text-[#6bff7a]">{titleCase(hovered.name)}</div>
          <div>⏣ {hovered.latestValue.toLocaleString()}</div>
        </div>
      )}
    </div>
  );
};

export default App;
