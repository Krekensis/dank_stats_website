import React, { useState, useEffect } from "react";
import NavbarDesktop from "../components/navbar-desktop";
import NavbarMobile from "../components/navbar-mobile";

// Custom hook for managing settings
export const useSettings = () => {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem("dank_stats_settings");
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.warn("Failed to parse settings", e);
      return {};
    }
  });

  const updateSetting = (key, value) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem("dank_stats_settings", JSON.stringify(updated));
      return updated;
    });
  };

  return { settings, updateSetting };
};

const Settings = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { settings, updateSetting } = useSettings();
  const [activeTab, setActiveTab] = useState("data");
  const [clearMessage, setClearMessage] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleClearCache = () => {
    try {
      // Save settings temporarily
      const savedSettings = localStorage.getItem("dank_stats_settings");
      
      // Clear all storage
      sessionStorage.clear();
      localStorage.clear();
      
      // Restore settings
      if (savedSettings) {
        localStorage.setItem("dank_stats_settings", savedSettings);
      }
      
      setClearMessage("Cache cleared successfully!");
      setTimeout(() => setClearMessage(""), 3000);
    } catch (error) {
      console.error("Error clearing cache:", error);
      setClearMessage("Failed to clear cache.");
      setTimeout(() => setClearMessage(""), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#070e0c] text-white font-mono selection:bg-[#6bff7a] selection:text-black">
      {isMobile ? <NavbarMobile /> : <NavbarDesktop />}

      <div className="mt-[100px] pb-20 px-8 max-w-7xl mx-auto flex gap-12">
        {/* Sidebar */}
        <div className="w-64 shrink-0 flex flex-col gap-2 sticky top-28 h-fit hidden md:flex">
          <h2 className="text-[#a4bbb0] text-sm uppercase tracking-widest mb-4 pb-2 border-b-2 border-[#a4bbb0]/10 ">Settings</h2>
          
          <button
            onClick={() => setActiveTab("data")}
            className={`text-left px-4 py-3 rounded-lg text-sm transition-all duration-300 ${activeTab === "data"
              ? 'bg-[#6bff7a]/10 text-[#6bff7a]'
              : 'bg-[#070e0c]/50 text-[#a4bbb0] hover:bg-[#6bff7a]/4'
            }`}
          >
            Data & Storage
          </button>
        </div>

        {/* Mobile Tab Selector */}
        {isMobile && (
          <div className="w-full flex space-x-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab("data")}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-300 ${activeTab === "data"
                ? 'bg-[#6bff7a]/10 text-[#6bff7a]'
                : 'bg-[#070e0c]/50 text-[#a4bbb0] hover:bg-[#6bff7a]/4'
              }`}
            >
              Data & Storage
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          
          {/* Data & Storage Tab */}
          <div className={`${activeTab === 'data' ? 'block' : 'hidden'} animate-fade-in`}>
            <div className="mb-8 pb-8">
              <h1 className="text-3xl text-[#c6ffcc] font-bold tracking-wide mb-4">Data & Storage</h1>
              <p className="text-[#a4bbb0] text-lg leading-relaxed">Manage your locally cached data to ensure optimal performance.</p>
            </div>
            
            <div className="bg-[#111816] shadow-lg rounded-xl overflow-hidden mb-8 p-6 border border-[#a4bbb0]/10">
              <h2 className="text-xl font-semibold text-white mb-2">Cached Data</h2>
              <p className="text-[#a4bbb0] text-sm mb-6">
                Clear locally cached item and market data. This will force the app to fetch fresh data from the server on your next visit. Your custom settings will not be deleted.
              </p>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleClearCache}
                  className="bg-[#6bff7a] hover:bg-[#58e36b] text-[#070e0c] font-extrabold py-2 px-6 rounded-md transition-colors"
                >
                  Clear cached data
                </button>
                {clearMessage && (
                  <span className={`text-sm font-semibold ${clearMessage.includes("success") ? "text-[#6bff7a]" : "text-red-500"}`}>
                    {clearMessage}
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;
