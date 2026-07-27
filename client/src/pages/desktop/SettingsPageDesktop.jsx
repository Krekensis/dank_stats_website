import React, { useState, useEffect } from "react";
import NavbarDesktop from "../../components/navbar-desktop";
import { useSettings } from "../../hooks/useSettings";
import ThemeDropdown from '../../components/ThemeDropdown';
import CustomThemeBuilder from '../../components/CustomThemeBuilder';
import { getLocalStorageUsage } from '../../utils/storage';

const SettingsPageDesktop = () => {
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
    <div className="min-h-screen bg-bg0 text-white font-mono selection:bg-primary selection:text-black">
      <NavbarDesktop />

      <div className="mt-[100px] pb-20 px-8 max-w-7xl mx-auto flex gap-12">
        {/* Sidebar */}
        <div className="w-64 shrink-0 flex flex-col gap-2 sticky top-28 h-fit">
          <h2 className="text-textMuted text-sm uppercase tracking-widest mb-4 pb-2 border-b-2 border-textMuted/10">Settings</h2>

          <button
            onClick={() => setActiveTab("data")}
            className={`text-left px-4 py-3 rounded-lg text-sm transition-all duration-300 ${activeTab === "data"
              ? 'bg-primary/10 text-primary'
              : 'bg-bg0/50 text-textMuted hover:bg-primary/4'
              }`}
          >
            Data & Storage
          </button>

          <button
            onClick={() => setActiveTab("appearance")}
            className={`text-left px-4 py-3 rounded-lg text-sm transition-all duration-300 ${activeTab === "appearance"
              ? 'bg-primary/10 text-primary'
              : 'bg-bg0/50 text-textMuted hover:bg-primary/4'
              }`}
          >
            Appearance
          </button>

          <div className="mt-8 border-t-2 border-textMuted/10 pt-4">
            <button
              onClick={handleReset}
              className="w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-300 bg-[#ff6b6b]/10 text-[#ff6b6b] hover:bg-[#ff6b6b]/20 cursor-pointer"
            >
              Reset to Defaults
            </button>
            {resetMessage && (
              <div className="text-primary text-xs font-semibold px-4 mt-2 animate-fade-in">
                {resetMessage}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">

          {/* Data & Storage Tab */}
          <div className={`${activeTab === 'data' ? 'block' : 'hidden'} animate-fade-in`}>
            <div className="mb-8 pb-8">
              <h1 className="text-3xl text-textLight font-bold tracking-wide mb-4">Data & Storage</h1>
              <p className="text-textMuted text-lg leading-relaxed">Manage your locally cached data to ensure optimal performance.</p>
            </div>

            <div className="bg-bg4 shadow-lg rounded-xl overflow-visible mb-8 p-6 border border-textMuted/10">
              <h2 className="text-xl font-semibold text-white mb-2">Cached Data <span className="text-textMuted text-sm ml-2 font-normal">({getLocalStorageUsage()} KB Used)</span></h2>
              <p className="text-textMuted text-sm mb-6">
                Clear locally cached item and market data.
              </p>

              <div className="flex items-center space-x-4">
                <button
                  onClick={handleClearCache}
                  className="bg-primary hover:bg-primaryHover text-bg0 font-extrabold py-2 px-6 rounded-md transition-colors cursor-pointer"
                >
                  Clear cached data
                </button>
                {clearMessage && (
                  <span className={`text-sm font-semibold ${clearMessage.includes("success") ? "text-primary" : "text-red-500"}`}>
                    {clearMessage}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Appearance Tab */}
          <div className={`${activeTab === 'appearance' ? 'block' : 'hidden'} animate-fade-in`}>
            <div className="mb-8 pb-8">
              <h1 className="text-3xl text-textLight font-bold tracking-wide mb-4">Appearance</h1>
              <p className="text-textMuted text-lg leading-relaxed">Customize the look and feel of Dank Stats.</p>
            </div>

            <div className="bg-bg4 shadow-lg rounded-xl overflow-visible mb-8 p-6 border border-textMuted/10">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-white">Border Radius</h2>
                <span className="text-primary font-mono font-bold text-lg">{settings.borderRadius !== undefined ? settings.borderRadius : 50}%</span>
              </div>
              <p className="text-textMuted text-sm mb-6">
                Set the global border radius for UI elements.
              </p>

              <div className="flex items-center space-x-6">
                <span className="text-textMuted font-mono text-sm w-12">Sharp</span>
                <div className="relative w-full max-w-xs h-4 flex items-center">
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
                <span className="text-textMuted font-mono text-sm w-12 text-right">Round</span>
              </div>
            </div>

            <div className="bg-bg4 shadow-lg rounded-xl overflow-visible mb-8 p-6 border border-textMuted/10">
              <h2 className="text-xl font-semibold text-white mb-2">Color Theme</h2>
              <p className="text-textMuted text-sm mb-6">
                Select a color theme for Dank Stats.
              </p>

              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={settings.useCustomTheme || false}
                  onChange={(e) => updateSetting("useCustomTheme", e.target.checked)}
                  className="w-5 h-5 accent-primary cursor-pointer"
                  id="customThemeToggleDesktop"
                />
                <label htmlFor="customThemeToggleDesktop" className="text-white font-mono cursor-pointer">
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
                  <p className="text-textMuted text-sm animate-pulse">Loading themes...</p>
                )
              )}

              {settings.useCustomTheme && <CustomThemeBuilder />}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsPageDesktop;
