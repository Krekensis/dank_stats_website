import { useState, useEffect } from "react";

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

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem("dank_stats_settings");
        if (stored) setSettings(JSON.parse(stored));
      } catch (e) {}
    };

    window.addEventListener("dank_settings_changed", handleStorageChange);
    // Also listen to actual storage events from other tabs
    window.addEventListener("storage", (e) => {
      if (e.key === "dank_stats_settings") handleStorageChange();
    });

    return () => {
      window.removeEventListener("dank_settings_changed", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const updateSetting = (key, value) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem("dank_stats_settings", JSON.stringify(updated));
      window.dispatchEvent(new Event("dank_settings_changed"));
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings({});
    localStorage.removeItem("dank_stats_settings");
    window.dispatchEvent(new Event("dank_settings_changed"));
  };

  return { settings, updateSetting, resetSettings };
};
