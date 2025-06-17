import React, { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import itemData from "../assets/parsed_items4.json";
import Loader from "../components/loader";

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

const generateEmojiPositions = () => {
  const uniqueItems = itemData.filter((item) => item.emoji?.url);
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
        id: crypto.randomUUID(),
      });
    } else {
      break;
    }
  }

  return placed;
};

// ==================================== [ Component ] ====================================

const HomePage = () => {
  const [positions, setPositions] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [absorbingIds, setAbsorbingIds] = useState([]);
  const [vomitingIds, setVomitingIds] = useState([]);
  const [isVomiting, setIsVomiting] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadedIds, setLoadedIds] = useState([]);
  const [savedPositions, setSavedPositions] = useState([]);

  useEffect(() => {
    setPositions(generateEmojiPositions());
    setImagesLoaded(true);
  }, []);

  const handleAbsorbOrVomit = () => {
    const remaining = positions.filter((p) => !absorbingIds.includes(p.id));

    // If no emojis left to absorb, vomit them all out
    if (remaining.length === 0) {
      setIsVomiting(true);

      const vomitPositions = savedPositions.map(pos => ({
        ...pos,
        startX: window.innerWidth - 60,
        startY: window.innerHeight - 60,
      }));

      setVomitingIds(vomitPositions.map(p => p.id));
      setPositions(vomitPositions);

      // After a brief delay, animate to final positions
      setTimeout(() => {
        setPositions(prev => prev.map(pos => ({
          ...pos,
          startX: undefined,
          startY: undefined,
        })));

        setTimeout(() => {
          setVomitingIds([]);
          setIsVomiting(false);
        }, 800);
      }, 50);

      return;
    }

    if (savedPositions.length === 0) {
      setSavedPositions(positions);
    }

    // Normal absorption logic
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
      {imagesLoaded && positions.map(({ x, y, url, rotation, name, latestValue, id, startX, startY }, i) => {
        const isAbsorbing = absorbingIds.includes(id);
        const isVomitingOut = vomitingIds.includes(id);
        const targetX = window.innerWidth - 60;
        const targetY = window.innerHeight - 60;

        return (
          <div
            key={id}
            onMouseEnter={() => !isAbsorbing && !isVomitingOut && setHovered({ i, x, y, name, latestValue })}
            onMouseLeave={() => setHovered(null)}
            style={{
              position: "absolute",
              top: isAbsorbing ? targetY : (isVomitingOut && startY !== undefined) ? startY : y,
              left: isAbsorbing ? targetX : (isVomitingOut && startX !== undefined) ? startX : x,
              width: emojiSize,
              height: emojiSize,
              transform: isAbsorbing
                ? "scale(0.1) rotate(720deg)"
                : isVomitingOut
                  ? "scale(1.2) rotate(-360deg)"
                  : hovered?.i === i
                    ? "scale(1.4) rotate(0deg)"
                    : `rotate(${rotation}deg) scale(1)`,
              transition: isAbsorbing
                ? "all 0.8s ease-in"
                : isVomitingOut
                  ? "all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)"
                  : hovered?.i === i
                    ? "transform 0.2s ease, opacity 0.2s ease"
                    : "transform 0.4s ease, opacity 0.4s ease",
              opacity: isAbsorbing ? 0 : isVomitingOut ? 0.8 : hovered?.i === i ? 1 : 0.6,
              cursor: "pointer",
              zIndex: hovered?.i === i ? 10 : 1,
            }}
          >
            <img
              src={url}
              alt="emoji"
              loading="lazy"
              decoding="async"
              style={{ width: "100%", height: "100%", userSelect: "none", pointerEvents: "auto", imageRendering: "crisp-edges" }}
              onLoad={() => setLoadedIds(prev => [...prev, id])}
              className={`transition duration-400 ${loadedIds.includes(id) ? "blur-0 opacity-100" : "blur-xs opacity-30"}`}
            />
          </div>
        );
      })}

      {/* Tooltip */}
      {hovered && !absorbingIds.includes(positions[hovered.i]?.id) && !vomitingIds.includes(positions[hovered.i]?.id) && (
        <div
          className="absolute bg-[#111816]/80 text-white px-[10px] py-[6px] rounded-md text-sm pointer-events-none whitespace-nowrap z-10"
          style={{
            top: Math.min(window.innerHeight - 60, hovered.y - 10),
            left: Math.min(window.innerWidth - 200, hovered.x + emojiSize + 15),
          }}
        >
          <div className="font-semibold font-mono text-[#6bff7a]">{titleCase(hovered.name)}</div>
          <div className="font-mono"> ⏣ {hovered.latestValue.toLocaleString()}</div>
        </div>
      )}

      {/* Absorb/Vomit Button */}
      <div
        onClick={handleAbsorbOrVomit}
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${absorbingIds.length > 0 ? "animate-fast-spin" : isVomiting ? "animate-bounce" : "hover:scale-110"
          }`}
      >
        <img
          src="https://cdn.discordapp.com/emojis/932395505382744106.png"
          alt={positions.length === 0 ? "Vomit Reality" : "Collapse Reality"}
          style={{
            width: "100px",
            height: "100px",
            transform: "scaleX(-1)",
            filter: "none"
          }}
        />
      </div>
    </div>
  );
};

export default HomePage;