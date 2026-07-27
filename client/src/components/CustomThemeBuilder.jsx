import React, { useState, useEffect, useRef } from "react";
import { useSettings } from "../hooks/useSettings";
import { HexColorPicker } from "react-colorful";

const DEFAULT_CUSTOM_THEME = {
  primary: "#6bff7a",
  primaryHover: "#58e36b",
  textMuted: "#a4bbb0",
  textLight: "#c6ffcc",
  bg0: "#070e0c",
  bg1: "#0a0f0d",
  bg2: "#0c1411",
  bg3: "#0d1311",
  bg4: "#111816",
  bg5: "#151f19",
  bg6: "#17211d",
  bg7: "#182521",
  bg8: "#1a2522",
  bg9: "#1d2a24",
  bg10: "#1e2a27",
  bg11: "#213024",
  bg12: "#2a3c31",
  bg13: "#3d7a4d",
  border1: "#2b473e",
  border2: "#4a5e56"
};

const ColorPickerPopover = ({ color, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative flex-shrink-0" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded cursor-pointer border border-textMuted/40 shadow-sm"
        style={{ backgroundColor: color }}
        aria-label="Pick color"
      />
      {isOpen && (
        <div className="absolute z-50 mt-2 left-0 sm:-left-16 shadow-2xl rounded-xl border border-textMuted/20 overflow-hidden">
          <HexColorPicker color={color} onChange={onChange} />
        </div>
      )}
    </div>
  );
};

const CustomThemeBuilder = () => {
  const { settings, updateSetting } = useSettings();

  useEffect(() => {
    if (!settings.customTheme) {
      updateSetting("customTheme", DEFAULT_CUSTOM_THEME);
    }
  }, []);

  const handleChange = (key, value) => {
    const currentTheme = settings.customTheme || DEFAULT_CUSTOM_THEME;
    updateSetting("customTheme", {
      ...currentTheme,
      [key]: value
    });
  };

  const currentTheme = settings.customTheme || DEFAULT_CUSTOM_THEME;
  const colorKeys = Object.keys(DEFAULT_CUSTOM_THEME);

  return (
    <div className="mt-6 pt-6 border-t border-textMuted/20">
      <h3 className="text-lg font-semibold text-white mb-4">Custom Theme Builder</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {colorKeys.map((key) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="text-textMuted text-xs font-mono">{key}</label>
            <div className="flex items-center gap-2">
              <ColorPickerPopover
                color={currentTheme[key]}
                onChange={(newColor) => handleChange(key, newColor)}
              />
              <input
                type="text"
                value={currentTheme[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full bg-bg2 text-textLight border border-textMuted/20 rounded px-2 py-1 font-mono text-sm focus:outline-none focus:border-primary uppercase"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomThemeBuilder;
