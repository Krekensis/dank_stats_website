import React, { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import itemData from "../assets/parsed_items3.json";

const emojiSize = 45;
const emojiNum = 200;
const emojiAbsorb = 40;

// =============================== [ Utility Functions ] ===============================

const getRandomPosition = (maxWidth, maxHeight) => {
  const x = Math.random() * (maxWidth - emojiSize);
  const y = Math.random() * (maxHeight - emojiSize);
  return { x, y };
};

const getRandomRotation = () => Math.random() * 60 - 30;

const isOverlapping = (pos1, pos2, margin = 10) => {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < emojiSize + margin;
};

const titleCase = (str) =>
  str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

// ==================================== [ Component ] ====================================

const HomePage = () => {
  const [positions, setPositions] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [absorbingIds, setAbsorbingIds] = useState([]);

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
          id: crypto.randomUUID(), // Unique ID for tracking
        });
      } else {
        break;
      }
    }

    setPositions(placed);
  }, []);

  const handleAbsorb = () => {
    const remaining = positions.filter((p) => !absorbingIds.includes(p.id));
    if (remaining.length === 0) return;

    const toAbsorb = remaining
      .sort(() => 0.5 - Math.random())
      .slice(0, emojiAbsorb)
      .map((p) => p.id);

    setAbsorbingIds((prev) => [...prev, ...toAbsorb]);

    setTimeout(() => {
      setPositions((prev) => prev.filter((p) => !toAbsorb.includes(p.id)));
      setAbsorbingIds((prev) => prev.filter((id) => !toAbsorb.includes(id)));
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#070e0c] relative overflow-hidden">
      <Navbar />

      {/* Emojis */}
      {positions.map(({ x, y, url, rotation, name, latestValue, id }, i) => {
        const isAbsorbing = absorbingIds.includes(id);
        const targetX = window.innerWidth - 60;
        const targetY = window.innerHeight - 60;

        return (
          <div
            key={id}
            onMouseEnter={() => setHovered({ i, x, y, name, latestValue })}
            onMouseLeave={() => setHovered(null)}
            style={{
              position: "absolute",
              top: isAbsorbing ? targetY : y,
              left: isAbsorbing ? targetX : x,
              width: emojiSize,
              height: emojiSize,
              transform: isAbsorbing
                ? "scale(0.1) rotate(720deg)"
                : hovered?.i === i
                  ? "scale(1.4) rotate(0deg)"
                  : `rotate(${rotation}deg) scale(1)`,
              transition: isAbsorbing
                ? "all 0.8s ease-in"
                : hovered?.i === i
                  ? "transform 0.2s ease, opacity 0.2s ease"
                  : "transform 0.4s ease, opacity 0.4s ease",
              opacity: isAbsorbing ? 0 : hovered?.i === i ? 1 : 0.6,
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

      {/* Tooltip */}
      {hovered && !absorbingIds.includes(positions[hovered.i]?.id) && (
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

      {/* Absorb Button */}
      <div
        onClick={handleAbsorb}
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          absorbingIds.length > 0 ? "animate-fast-spin" : "hover:scale-110"
        }`}
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
