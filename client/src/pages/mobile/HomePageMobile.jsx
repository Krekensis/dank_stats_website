import React, { useEffect, useState } from "react";
import Navbar from "../../components/navbar";
import itemData from "../../assets/parsed_items4.json";
import { titleCase, formatLargeNumber } from "../../functions/stringUtils";
import logoUrl from "../../assets/DankStats.png";
import { fetchItemData } from "../../hooks/fetchItemData";

const emojiSize = 45;
const emojiNum = 50;
const emojiAbsorb = 15;

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



const HomePageMobile = () => {
  const [positions, setPositions] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [absorbingIds, setAbsorbingIds] = useState([]);
  const [vomitingIds, setVomitingIds] = useState([]);
  const [isVomiting, setIsVomiting] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadedIds, setLoadedIds] = useState([]);
  const [savedPositions, setSavedPositions] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    setPositions(generateEmojiPositions());
    setImagesLoaded(true);

    fetchItemData()
      .then(items => {
        let totalTrades = 0, totalVolume = 0, totalItemsMoved = 0;
        let totalSellTrades = 0, volumeOfSellTrades = 0;
        let totalBuyTrades = 0, volumeOfBuyTrades = 0;
        let totalPrivateTrades = 0, totalPublicTrades = 0;

        items.forEach(item => {
          if (!item.stats) return;
          const s = item.stats;
          totalTrades += s.total.trades;
          totalVolume += s.total.vol;
          totalItemsMoved += s.total.num;
          totalSellTrades += s.public.sell.trades + s.private.sell.trades;
          volumeOfSellTrades += s.public.sell.vol + s.private.sell.vol;
          totalBuyTrades += s.public.buy.trades + s.private.buy.trades;
          volumeOfBuyTrades += s.public.buy.vol + s.private.buy.vol;
          totalPrivateTrades += s.private.buy.trades + s.private.sell.trades;
          totalPublicTrades += s.public.buy.trades + s.public.sell.trades;
        });

        setStats({
          totalTrades,
          totalVolume,
          totalItemsMoved,
          totalSellTrades,
          volumeOfSellTrades,
          totalBuyTrades,
          volumeOfBuyTrades,
          totalPrivateTrades,
          totalPublicTrades
        });
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
    <div className="min-h-screen bg-[#070e0c] relative overflow-hidden">
      <Navbar />

      {/* Hero Banner */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 px-4" style={{ paddingTop: '64px' }}>
        <div className="bg-[#111816]/70 backdrop-blur-md border border-[#a4bbb0]/20 p-5 rounded-2xl flex flex-col items-center text-center w-full max-w-sm pointer-events-auto max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-[#6bff7a]/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#6bff7a]/40">
          <h1 className="text-3xl text-[#6bff7a] mb-3 font-audiowide flex items-center justify-center gap-3">
            <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
            Dank Stats
          </h1>
          <p className="text-[#a4bbb0] mb-6 font-mono text-xs max-w-xs leading-relaxed">
            The Ultimate Analytics Platform for Dank Memer. Dive into deep market trends, visualizers, and data insights.
          </p>

          {stats ? (
            <div className="w-full flex flex-col gap-4">
              {/* Top Highlights */}
              <div className="grid grid-cols-1 gap-3 w-full">
                <div className="bg-[#070e0c]/80 border border-[#a4bbb0]/20 rounded-xl p-4 flex flex-col items-center justify-center">
                  <div className="text-[#a4bbb0] text-[10px] uppercase tracking-widest mb-1 font-mono">Total Market Volume</div>
                  <div className="text-[#6bff7a] text-xl font-bold font-mono tracking-tight">⏣ {formatLargeNumber(stats.totalVolume)}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 w-full">
                  <div className="bg-[#070e0c]/80 border border-[#a4bbb0]/20 rounded-xl p-4 flex flex-col items-center justify-center">
                    <div className="text-[#a4bbb0] text-[9px] uppercase tracking-widest mb-1 font-mono text-center">Total Trades</div>
                    <div className="text-[#6bff7a] text-lg font-bold font-mono tracking-tight">{formatLargeNumber(stats.totalTrades)}</div>
                  </div>
                  <div className="bg-[#070e0c]/80 border border-[#a4bbb0]/20 rounded-xl p-4 flex flex-col items-center justify-center">
                    <div className="text-[#a4bbb0] text-[9px] uppercase tracking-widest mb-1 font-mono text-center">Items Exchanged</div>
                    <div className="text-[#6bff7a] text-lg font-bold font-mono tracking-tight">{formatLargeNumber(stats.totalItemsMoved)}</div>
                  </div>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="grid grid-cols-1 gap-4 w-full mt-2">
                {/* Buy vs Sell Volume */}
                <div className="bg-[#070e0c]/80 border border-[#a4bbb0]/20 rounded-xl p-4">
                  <div className="flex justify-between text-[10px] font-mono mb-2">
                    <span className="text-[#a4bbb0]">SELL: <span className="text-[#6bff7a]">⏣ {formatLargeNumber(stats.volumeOfSellTrades)}</span></span>
                    <span className="text-[#a4bbb0]">BUY: <span className="text-[#6bff7a]">⏣ {formatLargeNumber(stats.volumeOfBuyTrades)}</span></span>
                  </div>
                  <div className="w-full h-3 bg-[#111816] rounded-full overflow-hidden flex border border-[#a4bbb0]/10">
                    <div 
                      style={{ width: `${(stats.volumeOfSellTrades / (stats.totalVolume || 1)) * 100}%` }} 
                      className="h-full bg-[#3d7a4d] relative"
                    ></div>
                    <div 
                      style={{ width: `${(stats.volumeOfBuyTrades / (stats.totalVolume || 1)) * 100}%` }} 
                      className="h-full bg-[#6bff7a] relative"
                    ></div>
                  </div>
                  <div className="text-center text-[#869c91] text-[9px] uppercase mt-2 font-mono tracking-widest">Volume Distribution</div>
                </div>

                {/* Public vs Private Trades */}
                <div className="bg-[#070e0c]/80 border border-[#a4bbb0]/20 rounded-xl p-4">
                  <div className="flex justify-between text-[10px] font-mono mb-2">
                    <span className="text-[#a4bbb0]">PRIV: <span className="text-[#6bff7a]">{formatLargeNumber(stats.totalPrivateTrades)}</span></span>
                    <span className="text-[#a4bbb0]">PUB: <span className="text-[#6bff7a]">{formatLargeNumber(stats.totalPublicTrades)}</span></span>
                  </div>
                  <div className="w-full h-3 bg-[#111816] rounded-full overflow-hidden flex border border-[#a4bbb0]/10">
                    <div 
                      style={{ width: `${(stats.totalPrivateTrades / (stats.totalTrades || 1)) * 100}%` }} 
                      className="h-full bg-[#3d7a4d] relative"
                    ></div>
                    <div 
                      style={{ width: `${(stats.totalPublicTrades / (stats.totalTrades || 1)) * 100}%` }} 
                      className="h-full bg-[#6bff7a] relative"
                    ></div>
                  </div>
                  <div className="text-center text-[#869c91] text-[9px] uppercase mt-2 font-mono tracking-widest">Trade Visibility</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-[#6bff7a] font-mono animate-pulse py-8 text-sm tracking-widest">Loading global statistics...</div>
          )}
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
            onClick={() => !isAbsorbing && !isVomitingOut && (hovered?.i === i ? setHovered(null) : setHovered({ i, x, y, name, latestValue }))}
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

export default HomePageMobile;