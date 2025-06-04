import React, { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import itemData from "../assets/parsed_items3.json";

const emojiSize = 45;
const emojiNum = 200;

// ================================================= [ Functions ] ==================================================

const getRandomPosition = (maxWidth, maxHeight) => {
  const x = Math.random() * (maxWidth - emojiSize);
  const y = Math.random() * (maxHeight - emojiSize);
  return { x, y };
};

const getRandomRotation = () => {
  return Math.random() * 60 - 30;
};

const isOverlapping = (pos1, pos2, margin = 10) => {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < emojiSize + margin;
};

const titleCase = (str) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// ============================================== [ Main Component ] ===============================================

const HomePage = () => {
  const [positions, setPositions] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [absorbing, setAbsorbing] = useState(false);

  useEffect(() => {
    const uniqueItems = itemData.filter((item) => item.emoji?.url);
    const preload = Array.from(new Set(uniqueItems.map((item) => item.emoji.url)));
    preload.forEach((url) => {
      const img = new Image();
      img.src = url;
    });

    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;
    let placed = [];

    while (placed.length < emojiNum && uniqueItems.length > 0) {
      const item = uniqueItems[Math.floor(Math.random() * uniqueItems.length)];
      let pos;
      let tries = 0;
      do {
        pos = getRandomPosition(maxWidth, maxHeight);
        tries++;
      } while (placed.some((p) => isOverlapping(p, pos)) && tries < 100);

      if (tries < 100) {
        placed.push({
          ...pos,
          url: item.emoji.url,
          rotation: getRandomRotation(),
          name: item.name,
          latestValue: item.history?.[item.history.length - 1]?.value ?? "N/A",
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

      {/* Emojis */}
      {positions.map(({ x, y, url, rotation, name, latestValue }, i) => {
        const targetX = window.innerWidth - 60;
        const targetY = window.innerHeight - 60;

        return (
          <div
            key={i}
            onMouseEnter={() => setHovered({ i, x, y, name, latestValue })}
            onMouseLeave={() => setHovered(null)}
            style={{
              position: "absolute",
              top: absorbing ? targetY : y,
              left: absorbing ? targetX : x,
              width: emojiSize,
              height: emojiSize,
              transform: absorbing
                ? "scale(0.1) rotate(720deg)"
                : hovered?.i === i
                  ? "scale(1.4) rotate(0deg)"
                  : `rotate(${rotation}deg) scale(1)`,
              transition: absorbing
                ? "all 1.3s ease-in"
                : hovered?.i === i
                  ? "transform 0.2s ease, opacity 0.2s ease"
                  : "transform 0.4s ease, opacity 0.4s ease",
              opacity: absorbing ? 0 : hovered?.i === i ? 1 : 0.6,
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
        );
      })}

      {hovered && !absorbing && (
        <div
          style={{
            position: "absolute",
            top: Math.min(window.innerHeight - 60, hovered.y - 10),
            left: Math.min(window.innerWidth - 200, hovered.x + emojiSize + 10),
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

      <div
        onClick={() => {
          setAbsorbing(true);
          setTimeout(() => {
            setPositions([]);
            setAbsorbing(false);
          }, 1400);
        }}
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${absorbing ? "animate-fast-spin" : "hover:scale-110"}`}
      >
        <img
          src="https://cdn.discordapp.com/emojis/932395505382744106.png"
          alt="Collapse Reality"
          style={{ width: "100px", height: "100px", transform: "scaleX(-1)" }}
        />
      </div>
    </div>
  );
};

export default HomePage;
