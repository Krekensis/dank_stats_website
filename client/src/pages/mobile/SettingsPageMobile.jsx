import React, { useState, useEffect } from "react";
import NavbarMobile from "../../components/navbar-mobile";
import { useSettings } from "../../hooks/useSettings";
import ThemeDropdown from '../../components/ThemeDropdown';
import CustomThemeBuilder from '../../components/CustomThemeBuilder';
import { getLocalStorageUsage } from '../../utils/storage';

const SettingsPageMobile = () => {
  const { settings, updateSetting, resetSettings } = useSettings();
  const [activeTab, setActiveTab] = useState("data");
  const [clearMessage, setClearMessage] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [themes, setThemes] = useState(null);

  useEffect(() => {
    fetch('/themes.json')
      .then(res => res.json())
      .then(data => setThemes(data))
      .catch(err => console.error("Failed to load themes:", err));
  }, []);

  const handleReset = () => {
    resetSettings();
    setResetMessage("Settings Reset!");
    setTimeout(() => setResetMessage(""), 3000);
  };

  const handleClearCache = () => {
    try {
      const savedSettings = localStorage.getItem("dank_stats_settings");
      sessionStorage.clear();
      localStorage.clear();
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
    <div className="min-h-screen bg-bg0 text-white font-mono selection:bg-primary selection:text-black pb-20">
      <NavbarMobile />

      <div className="pt-24 px-4 w-full">
        {/* Mobile Tab Selector */}
        <div className="w-full flex space-x-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveTab("data")}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-300 font-bold ${activeTab === "data"
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'bg-bg4 text-textMuted border border-transparent'
              }`}
          >
            Data & Storage
          </button>

          <button
            onClick={() => setActiveTab("appearance")}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-300 font-bold ${activeTab === "appearance"
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'bg-bg4 text-textMuted border border-transparent'
              }`}
          >
            Appearance
          </button>
        </div>

        {/* Main Content Area */}
        <div className="w-full">

          {/* Data & Storage Tab */}
          <div className={`${activeTab === 'data' ? 'block' : 'hidden'} animate-fade-in`}>
            <div className="mb-6">
              <h1 className="text-2xl text-textLight font-bold tracking-wide mb-2">Data & Storage</h1>
              <p className="text-textMuted text-sm leading-relaxed">Manage your locally cached data to ensure optimal performance.</p>
            </div>

            <div className="bg-bg4 shadow-lg rounded-xl overflow-hidden mb-6 p-4 border border-textMuted/10">
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center justify-between"><span>Cached Data</span><span className="text-textMuted text-xs font-normal">({getLocalStorageUsage()} KB)</span></h2>
              <p className="text-textMuted text-xs mb-6">
                Clear locally cached item and market data.
              </p>

              <div className="flex flex-col space-y-4">
                <button
                  onClick={handleClearCache}
                  className="w-full bg-primary hover:bg-primaryHover text-bg0 font-extrabold py-3 rounded-md transition-colors text-sm"
                >
                  Clear cached data
                </button>
                {clearMessage && (
                  <div className={`text-center text-xs font-semibold ${clearMessage.includes("success") ? "text-primary" : "text-red-500"}`}>
                    {clearMessage}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Appearance Tab */}
          <div className={`${activeTab === 'appearance' ? 'block' : 'hidden'} animate-fade-in`}>
            <div className="mb-6">
              <h1 className="text-2xl text-textLight font-bold tracking-wide mb-2">Appearance</h1>
              <p className="text-textMuted text-sm leading-relaxed">Customize the look and feel of Dank Stats.</p>
            </div>

            <div className="bg-bg4 shadow-lg rounded-xl overflow-hidden mb-6 p-4 border border-textMuted/10">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-white">Border Radius</h2>
                <span className="text-primary font-mono font-bold">{settings.borderRadius !== undefined ? settings.borderRadius : 50}%</span>
              </div>
              <p className="text-textMuted text-xs mb-6">
                Set the global border radius for UI elements.
              </p>

              <div className="flex items-center space-x-4">
                <span className="text-textMuted font-mono text-xs w-10">Sharp</span>
                <div className="relative w-full h-4 flex items-center">
                  <div className="absolute w-full h-[3px] rounded-full" style={{ background: 'var(--theme-bg10)' }} />
                  <div className="absolute h-[3px] rounded-full pointer-events-none" style={{ background: 'var(--theme-primary)', width: `${settings.borderRadius !== undefined ? settings.borderRadius : 50}%` }} />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.borderRadius !== undefined ? settings.borderRadius : 50}
                    onChange={(e) => updateSetting("borderRadius", parseInt(e.target.value))}
                    className="outlier-slider relative w-full"
                  />
                </div>
                <span className="text-textMuted font-mono text-xs w-10 text-right">Round</span>
              </div>
            </div>

            <div className="bg-bg4 shadow-lg rounded-xl overflow-hidden mb-6 p-4 border border-textMuted/10">
              <h2 className="text-lg font-semibold text-white mb-2">Color Theme</h2>
              <p className="text-textMuted text-xs mb-6">
                Select a color theme for Dank Stats.
              </p>

              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={settings.useCustomTheme || false}
                  onChange={(e) => updateSetting("useCustomTheme", e.target.checked)}
                  className="w-5 h-5 accent-primary cursor-pointer"
                  id="customThemeToggleMobile"
                />
                <label htmlFor="customThemeToggleMobile" className="text-white text-sm font-mono cursor-pointer">
                  Enable Custom Theme
                </label>
              </div>

              {!settings.useCustomTheme && (
                themes ? (
                  <ThemeDropdown
                    themes={themes}
                    selectedTheme={settings.theme}
                    onSelectTheme={(themeName) => updateSetting("theme", themeName)}
                  />
                ) : (
                  <p className="text-textMuted text-xs animate-pulse">Loading themes...</p>
                )
              )}

              {settings.useCustomTheme && <CustomThemeBuilder />}
            </div>
          </div>

          <div className="mt-8 border-t border-textMuted/10 pt-6">
            <button
              onClick={handleReset}
              className="w-full bg-[#ff6b6b]/10 text-[#ff6b6b] hover:bg-[#ff6b6b]/20 font-bold py-3 rounded-md transition-colors text-sm"
            >
              Reset to Defaults
            </button>
            {resetMessage && (
              <div className="text-center text-primary text-xs font-semibold mt-3 animate-fade-in">
                {resetMessage}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsPageMobile;
