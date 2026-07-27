import React, { useState, useRef, useEffect } from "react";

const ThemeDropdown = ({ themes, selectedTheme, onSelectTheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (themeName) => {
    onSelectTheme(themeName);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full sm:w-64" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-bg1 text-white border-2 border-textMuted/20 rounded-md px-4 py-2 font-mono font-bold focus:outline-none focus:border-primary transition-colors cursor-pointer"
      >
        <span>{selectedTheme || "Green"}</span>
        <svg
          className={`fill-current h-4 w-4 text-primary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-bg1 border-2 border-textMuted/20 rounded-md shadow-xl max-h-60 overflow-y-auto">
          {Object.keys(themes).map((themeName) => (
            <button
              key={themeName}
              onClick={() => handleSelect(themeName)}
              className={`w-full text-left px-4 py-2 font-mono font-bold transition-colors ${(selectedTheme || "Green") === themeName
                ? "bg-primary/20 text-primary border-l-4 border-primary"
                : "text-textMuted hover:bg-bg3 hover:text-white border-l-4 border-transparent"
                }`}
            >
              {themeName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeDropdown;
