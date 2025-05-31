import React, { useState, useRef, useEffect } from "react";
import NavCard from "./navcard";

const COLLAPSED_HEIGHT = 60;
const COLLAPSE_DELAY_MS = 200; // delay before collapsing to avoid flicker

const Navbar = () => {
  const [expanded, setExpanded] = useState(false);
  const [submenuHeight, setSubmenuHeight] = useState(0);
  const submenuRef = useRef(null);

  const [hoveringTrigger, setHoveringTrigger] = useState(false);
  const [hoveringSubmenu, setHoveringSubmenu] = useState(false);
  const collapseTimeout = useRef(null);

  useEffect(() => {
    const submenu = submenuRef.current;
    if (!submenu) return;

    if (expanded) {
      submenu.style.position = "absolute";
      submenu.style.visibility = "hidden";
      submenu.style.pointerEvents = "auto";
      submenu.style.opacity = "1";

      requestAnimationFrame(() => {
        const height = submenu.scrollHeight;
        setSubmenuHeight(height);

        submenu.style.position = "";
        submenu.style.visibility = "";
        submenu.style.pointerEvents = "";
        submenu.style.opacity = "";
      });
    } else {
      setSubmenuHeight(0);
    }
  }, [expanded]);

  useEffect(() => {
    // Clear any pending collapse timeout
    if (collapseTimeout.current) {
      clearTimeout(collapseTimeout.current);
      collapseTimeout.current = null;
    }

    if (hoveringTrigger || hoveringSubmenu) {
      setExpanded(true);
    } else {
      // Delay collapse to avoid flicker when moving between trigger and submenu
      collapseTimeout.current = setTimeout(() => {
        setExpanded(false);
      }, COLLAPSE_DELAY_MS);
    }

    // Cleanup on unmount
    return () => {
      if (collapseTimeout.current) {
        clearTimeout(collapseTimeout.current);
      }
    };
  }, [hoveringTrigger, hoveringSubmenu]);

  const containerHeight = expanded ? COLLAPSED_HEIGHT + submenuHeight + 20 : COLLAPSED_HEIGHT;

  return (
    <nav className="fixed top-4 left-0 w-full flex justify-center z-50 pointer-events-none">
      <div
        className="relative bg-[#151f1c] rounded-xl px-6 py-3 max-w-8xl w-full mx-12 pointer-events-auto flex flex-col transition-all duration-300 ease-in-out overflow-hidden"
        style={{ height: `${containerHeight}px` }}
      >
        <div className="flex justify-between items-center">
          <div className="text-[#6bff7a] text-3xl font-extrabold font-mono select-none">
            Dank Stats
          </div>
          <div className="flex-1 flex justify-center text-[#c6ffcc] font-mono font-medium px-5 space-x-8">
            <a
              href="#"
              className="hover:text-[#6bff7a] transition cursor-pointer"
              onMouseEnter={() => setHoveringTrigger(true)}
              onMouseLeave={() => setHoveringTrigger(false)}
            >
              Item Statistics
            </a>

            <a href="#" className="hover:text-[#6bff7a] transition">
              About
            </a>
          </div>
        </div>

        <div
          ref={submenuRef}
          className={`mt-4 flex justify-center gap-x-6 transition-opacity duration-300 w-full px-10 ${
            expanded ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onMouseEnter={() => setHoveringSubmenu(true)}
          onMouseLeave={() => setHoveringSubmenu(false)}
        >
          {["ItemValueHistory"].map((label) => (
            <NavCard
              key={label}
              heading="Item value history"
              description="Visualize how item values have evolved over time through clear, interactive graphs."
              redirect="/item-value-history"
            />
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

