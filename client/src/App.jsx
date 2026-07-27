import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import logoUrl from "./assets/DankStats.png";
import Home from "./pages/HomePage";
import ItemValueVisualizer from "./pages/ItemValueVisualizer";
import AllItemsOverview from "./pages/AllItemsOverview";
import ItemMarketVisualizer from "./pages/ItemMarketVisualizer";
import AllPetsOverview from "./pages/AllPetsOverview";
import PetMarketVisualizer from "./pages/PetMarketVisualizer";
import ApiPage from "./pages/ApiPage";
import Settings from "./pages/Settings";
import { Analytics } from "@vercel/analytics/react";
import { useSettings } from "./hooks/useSettings";

const App = () => {
  const { settings } = useSettings();
  const [themes, setThemes] = useState(null);

  useEffect(() => {
    fetch('/themes.json')
      .then(res => res.json())
      .then(data => setThemes(data))
      .catch(err => console.error("Failed to load themes:", err));
  }, []);

  useEffect(() => {
    if (!themes) return;
    let selectedTheme = null;
    if (settings.useCustomTheme && settings.customTheme) {
      selectedTheme = settings.customTheme;
    } else {
      const themeName = settings.theme || "Green";
      selectedTheme = themes[themeName] || themes["Green"];
    }
    if (selectedTheme) {
      Object.entries(selectedTheme).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--theme-${key}`, value);
      });
      localStorage.setItem("dank_stats_theme_colors", JSON.stringify(selectedTheme));

      // Update Favicon dynamically using canvas mask
      const primaryColor = selectedTheme.primary || "#6bff7a";
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.src = logoUrl;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 128, 128);
        ctx.globalCompositeOperation = "source-in";
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, 0, 128, 128);
        const newFavicon = canvas.toDataURL("image/png");
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.head.appendChild(link);
        }
        link.href = newFavicon;
      };
    }
  }, [settings.theme, settings.useCustomTheme, settings.customTheme, themes]);

  useEffect(() => {
    const borderRadius = settings.borderRadius !== undefined ? settings.borderRadius : 50;
    const scale = borderRadius / 50;
    document.documentElement.style.setProperty("--radius-scale", scale);
  }, [settings.borderRadius]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/item-value-visualizer" element={<ItemValueVisualizer />} />
        <Route path="/all-items-overview" element={<AllItemsOverview />} />
        <Route path="/item-market-visualizer" element={<ItemMarketVisualizer />} />
        <Route path="/all-pets-overview" element={<AllPetsOverview />} />
        <Route path="/pet-market-visualizer" element={<PetMarketVisualizer />} />
        <Route path="/api-docs" element={<ApiPage />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <Analytics />
    </>
  );
};

export default App;
