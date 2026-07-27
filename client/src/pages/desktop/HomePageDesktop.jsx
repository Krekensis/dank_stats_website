import React, { useEffect, useState } from "react";
import Navbar from "../../components/navbar";
import itemData from "../../assets/parsed_items4.json";
import { titleCase, formatLargeNumber } from "../../functions/stringUtils";
import logoUrl from "../../assets/DankStats.png";
import { fetchItemData } from "../../hooks/fetchItemData";
import AnimatedNumber from "../../components/animated-number";

const emojiSize = 45;
const emojiNum = 200;
const emojiAbsorb = 40;

// =============================== [ Utility Functions ] ===============================

const getRandomPosition = (maxWidth, maxHeight) => {
  const x = Math.random() * (maxWidth - emojiSize);
  const y = Math.random() * (maxHeight - emojiSize);
  return { x, y };
};

const isOverlapping = (pos1, pos2, margin = 10) => {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < emojiSize + margin;
};

const generateEmojiPositions = () => {
  const uniqueItems = itemData.filter((item) => item.url);
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
        url: item.url,
        rotation: Math.random() * 60 - 30,
        name: item.name,
        latestValue: item.history?.[item.history.length - 1]?.v ?? "N/A",
        id: crypto.randomUUID(),
      });
    } else {
      break;
    }
  }

  return placed;
};

// ==================================== [ Component ] ====================================

const StatCategory = ({ title, data, isCurrency }) => {
  const format = (val) => isCurrency ? formatLargeNumber(val) : val.toLocaleString();

  return (
    <div className="bg-bg0/80 border border-textMuted/20 rounded-2xl p-6 flex flex-col w-full transition-all hover:bg-bg0/90">
      <div className="text-textMuted text-lg uppercase tracking-widest mb-4 font-audiowide border-b border-textMuted/20 pb-2 text-center">
        {title}
      </div>

      {/* Total Main Highlight */}
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="text-textMuted text-xs uppercase tracking-widest mb-1 font-mono">Total</div>
        <div className="text-primary text-3xl font-bold font-mono tracking-tight">
          <AnimatedNumber value={data.total} formatFn={(val) => `${isCurrency ? "⏣ " : ""}${format(val)}`} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mt-2">
        {/* Buy / Sell */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs sm:text-sm font-mono">
            <span className="text-textMuted">Buy:</span>
            <span className="text-white whitespace-nowrap">
              <AnimatedNumber value={data.buy} formatFn={(val) => `${isCurrency ? "⏣ " : ""}${format(val)}`} />
            </span>
          </div>
          <div className="flex justify-between items-center text-xs sm:text-sm font-mono">
            <span className="text-textMuted">Sell:</span>
            <span className="text-white whitespace-nowrap">
              <AnimatedNumber value={data.sell} formatFn={(val) => `${isCurrency ? "⏣ " : ""}${format(val)}`} />
            </span>
          </div>
          {/* Progress bar Buy vs Sell */}
          <div className="w-full h-1.5 bg-bg4 rounded-full overflow-hidden flex border border-textMuted/10 mt-1">
            <div style={{ width: `${(data.buy / (data.buy + data.sell || 1)) * 100}%` }} className="h-full bg-primary relative transition-all duration-[3000ms]"></div>
            <div className="h-full bg-bg13 relative flex-1"></div>
          </div>
        </div>

        {/* Public / Private */}
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex justify-between items-center text-xs sm:text-sm font-mono">
            <span className="text-textMuted">Public:</span>
            <span className="text-white whitespace-nowrap">
              <AnimatedNumber value={data.public} formatFn={(val) => `${isCurrency ? "⏣ " : ""}${format(val)}`} />
            </span>
          </div>
          <div className="flex justify-between items-center text-xs sm:text-sm font-mono">
            <span className="text-textMuted">Private:</span>
            <span className="text-white whitespace-nowrap">
              <AnimatedNumber value={data.private} formatFn={(val) => `${isCurrency ? "⏣ " : ""}${format(val)}`} />
            </span>
          </div>
          {/* Progress bar Public vs Private */}
          <div className="w-full h-1.5 bg-bg4 rounded-full overflow-hidden flex border border-textMuted/10 mt-1">
            <div style={{ width: `${(data.public / (data.public + data.private || 1)) * 100}%` }} className="h-full bg-primary relative transition-all duration-[3000ms]"></div>
            <div className="h-full bg-bg13 relative flex-1"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HomePageDesktop = () => {
  const [positions, setPositions] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [absorbingIds, setAbsorbingIds] = useState([]);
  const [vomitingIds, setVomitingIds] = useState([]);
  const [isVomiting, setIsVomiting] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadedIds, setLoadedIds] = useState([]);
  const [savedPositions, setSavedPositions] = useState([]);
  const [stats, setStats] = useState({
    trades: { total: 0, sell: 0, buy: 0, public: 0, private: 0 },
    volume: { total: 0, sell: 0, buy: 0, public: 0, private: 0 },
    count: { total: 0, sell: 0, buy: 0, public: 0, private: 0 }
  });

  useEffect(() => {
    setPositions(generateEmojiPositions());
    setImagesLoaded(true);

    fetchItemData()
      .then(items => {
        const newStats = {
          trades: { total: 0, sell: 0, buy: 0, public: 0, private: 0 },
          volume: { total: 0, sell: 0, buy: 0, public: 0, private: 0 },
          count: { total: 0, sell: 0, buy: 0, public: 0, private: 0 }
        };

        items.forEach(item => {
          if (!item.stats) return;
          const s = item.stats;

          // Trades
          newStats.trades.total += s.total.trades;
          newStats.trades.sell += s.public.sell.trades + s.private.sell.trades;
          newStats.trades.buy += s.public.buy.trades + s.private.buy.trades;
          newStats.trades.public += s.public.sell.trades + s.public.buy.trades;
          newStats.trades.private += s.private.sell.trades + s.private.buy.trades;

          // Volume
          newStats.volume.total += s.total.vol;
          newStats.volume.sell += s.public.sell.vol + s.private.sell.vol;
          newStats.volume.buy += s.public.buy.vol + s.private.buy.vol;
          newStats.volume.public += s.public.sell.vol + s.public.buy.vol;
          newStats.volume.private += s.private.sell.vol + s.private.buy.vol;

          // Count
          newStats.count.total += s.total.num;
          newStats.count.sell += s.public.sell.num + s.private.sell.num;
          newStats.count.buy += s.public.buy.num + s.private.buy.num;
          newStats.count.public += s.public.sell.num + s.public.buy.num;
          newStats.count.private += s.private.sell.num + s.private.buy.num;
        });

        setStats(newStats);
      })
      .catch(err => console.error("Error fetching stats:", err));
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
    const toAbsorb = remaining.sort(() => 0.5 - Math.random()).slice(0, emojiAbsorb).map((p) => p.id);

    setAbsorbingIds((prev) => [...prev, ...toAbsorb]);

    setTimeout(() => {
      setPositions((prev) => prev.filter((p) => !toAbsorb.includes(p.id)));
      setAbsorbingIds((prev) => prev.filter((id) => !toAbsorb.includes(id)));
    }, 800);

  };

  return (
    <div className="min-h-screen bg-bg0 relative overflow-hidden">
      <Navbar />

      {/* Hero Banner */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 px-4" style={{ paddingTop: '40px' }}>
        <div className="bg-bg4/70 backdrop-blur-md border border-textMuted/20 p-8 rounded-2xl flex flex-col items-center text-center w-full max-w-5xl xl:max-w-6xl pointer-events-auto transition-all">
          <h1 className="text-4xl md:text-5xl text-primary mb-4 font-audiowide flex items-center justify-center gap-4">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-primary" style={{ maskImage: `url(${logoUrl})`, maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskImage: `url(${logoUrl})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
            Dank Stats
          </h1>
          <p className="text-textMuted mb-8 font-mono text-lg max-w-2xl leading-relaxed">
            The Ultimate Analytics Platform for Dank Memer. Dive into deep market trends, visualizers, and data insights.
          </p>

          <div className="w-full flex flex-col md:flex-row gap-6">
            <StatCategory title="Market Volume" data={stats.volume} isCurrency />
            <StatCategory title="Trades Executed" data={stats.trades} />
            <StatCategory title="Items Exchanged" data={stats.count} />
          </div>
        </div>
      </div>

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
                  ? "transform 0.7s ease-out, top 0.7s ease-out, left 0.7s ease-out, opacity 0.7s ease"
                  : hovered?.i === i
                    ? "transform 0.2s ease, opacity 0.2s ease"
                    : "transform 0.4s ease, opacity 0.4s ease",
              opacity: isAbsorbing ? 0 : isVomitingOut ? 0.8 : hovered?.i === i ? 1 : 0.6,
              cursor: "pointer",
              zIndex: hovered?.i === i ? 10 : 1,
            }}
          >
            <img
              src={`${url.includes("animated=true") ? url.replace(".webp?animated=true", ".gif") : url}?id=${id}`}
              key={`${id}-${isVomitingOut}`}
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
          className="absolute bg-bg4/80 text-white px-[10px] py-[6px] rounded-md text-sm pointer-events-none whitespace-nowrap z-10"
          style={{
            top: Math.min(window.innerHeight - 60, hovered.y - 10),
            left: Math.min(window.innerWidth - 200, hovered.x + emojiSize + 15),
          }}
        >
          <div className="font-semibold font-mono text-primary">{titleCase(hovered.name)}</div>
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

export default HomePageDesktop;