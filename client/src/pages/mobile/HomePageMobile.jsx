import React, { useEffect, useState } from "react";
import Navbar from "../../components/navbar";
import itemData from "../../assets/parsed_items4.json";
import { titleCase, formatLargeNumber } from "../../functions/stringUtils";
import logoUrl from "../../assets/DankStats.png";
import { fetchItemData } from "../../hooks/fetchItemData";

// ==================================== [ Component ] ====================================

const StatCategory = ({ title, data, isCurrency }) => {
  const format = (val) => isCurrency ? formatLargeNumber(val) : val.toLocaleString();

  return (
    <div className="bg-[#070e0c]/80 border border-[#a4bbb0]/20 rounded-xl p-4 flex flex-col w-full">
      <div className="text-[#a4bbb0] text-sm uppercase tracking-widest mb-3 font-audiowide border-b border-[#a4bbb0]/20 pb-2 text-center">
        {title}
      </div>

      {/* Total Main Highlight */}
      <div className="flex flex-col items-center justify-center mb-4">
        <div className="text-[#a4bbb0] text-[10px] uppercase tracking-widest mb-1 font-mono">Total</div>
        <div className="text-[#6bff7a] text-xl font-bold font-mono tracking-tight">{isCurrency && "⏣ "}{format(data.total)}</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Buy / Sell */}
        <div className="flex flex-col gap-1 border-r border-[#a4bbb0]/10 pr-3">
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="text-[#a4bbb0]">Buy:</span>
            <span className="text-white">{isCurrency && "⏣ "}{format(data.buy)}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="text-[#a4bbb0]">Sell:</span>
            <span className="text-white">{isCurrency && "⏣ "}{format(data.sell)}</span>
          </div>
          {/* Progress bar Buy vs Sell */}
          <div className="w-full h-1 bg-[#111816] rounded-full overflow-hidden flex border border-[#a4bbb0]/10 mt-1">
            <div style={{ width: `${(data.buy / (data.buy + data.sell || 1)) * 100}%` }} className="h-full bg-[#6bff7a] relative"></div>
            <div style={{ width: `${(data.sell / (data.buy + data.sell || 1)) * 100}%` }} className="h-full bg-[#3d7a4d] relative"></div>
          </div>
        </div>

        {/* Public / Private */}
        <div className="flex flex-col gap-1 pl-1">
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="text-[#a4bbb0]">Pub:</span>
            <span className="text-white">{isCurrency && "⏣ "}{format(data.public)}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="text-[#a4bbb0]">Priv:</span>
            <span className="text-white">{isCurrency && "⏣ "}{format(data.private)}</span>
          </div>
          {/* Progress bar Public vs Private */}
          <div className="w-full h-1 bg-[#111816] rounded-full overflow-hidden flex border border-[#a4bbb0]/10 mt-1">
            <div style={{ width: `${(data.public / (data.public + data.private || 1)) * 100}%` }} className="h-full bg-[#6bff7a] relative"></div>
            <div style={{ width: `${(data.private / (data.public + data.private || 1)) * 100}%` }} className="h-full bg-[#3d7a4d] relative"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HomePageMobile = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {

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
            Analytics Platform for Dank Memer. View market trends, visualizers, and data insights.
          </p>

          {stats ? (
            <div className="w-full flex flex-col gap-4">
              <StatCategory title="Market Volume" data={stats.volume} isCurrency />
              <StatCategory title="Trades Executed" data={stats.trades} />
              <StatCategory title="Items Exchanged" data={stats.count} />
            </div>
          ) : (
            <div className="text-[#6bff7a] font-mono animate-pulse py-8 text-sm tracking-widest">Loading global statistics...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePageMobile;