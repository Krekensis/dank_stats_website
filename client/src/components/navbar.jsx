import React, { useState, useRef, useEffect } from "react";
import NavCard from "./navcard";
import logo from "../assets/DankStats.png";
import { Link } from "react-router-dom";

const COLLAPSED_HEIGHT = 60;
const COLLAPSE_DELAY_MS = 200; // delay before collapsing to avoid flicker

const Navbar = () => {
  const [expanded, setExpanded] = useState(false);
  const [submenuHeight, setSubmenuHeight] = useState(0);
  const submenuRef = useRef(null);

  const [hoveringTrigger, setHoveringTrigger] = useState(false);
  const [hoveringSubmenu, setHoveringSubmenu] = useState(false);
  const collapseTimeout = useRef(null);

  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (Math.abs(currentScrollY - lastScrollY) < 80) { return; } //threshold
      if (currentScrollY > lastScrollY) { setShowNavbar(false) }
      else { setShowNavbar(true) }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

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
    // Clear pending collapse timeout
    if (collapseTimeout.current) {
      clearTimeout(collapseTimeout.current);
      collapseTimeout.current = null;
    }

    if (hoveringTrigger || hoveringSubmenu) {
      setExpanded(true);
    } else {
      // delay
      collapseTimeout.current = setTimeout(() => {
        setExpanded(false);
      }, COLLAPSE_DELAY_MS);
    }

    return () => {
      if (collapseTimeout.current) {
        clearTimeout(collapseTimeout.current);
      }
    };
  }, [hoveringTrigger, hoveringSubmenu]);

  const containerHeight = expanded ? COLLAPSED_HEIGHT + submenuHeight + 18 : COLLAPSED_HEIGHT;

  const itemStatsCards = [
    {
      heading: "Item value visualizer",
      description: "Visualize how item values have evolved over time through clear, interactive graphs.",
      redirect: "/item-value-visualizer",
    },
    {
      heading: "All items overview",
      description: "Listed overview of all items, including their current values and historical trends.",
      redirect: "/all-items-overview",
    },
  ]

  return (
    <nav className={`fixed top-0 left-0 w-full flex justify-center z-50 pointer-events-none transition-transform duration-500 ${showNavbar ? "translate-y-0" : "-translate-y-full"}`}>
      <div className="mt-4 z-50 relative bg-[#151f19]/70 backdrop-blur-[10px] rounded-xl px-6 py-3 max-w-8xl w-full mx-12 pointer-events-auto flex flex-col transition-all duration-300 ease-in-out overflow-hidden" style={{ height: `${containerHeight}px` }}>
        <div className="flex justify-between items-center">
          {/* Logo + Text Grouped */}
          <Link to="/" className="flex items-center space-x-3">
            <img src={logo} alt="Dank Stats Logo" className="w-10 h-10 object-contain" />
            <div className="text-[#6bff7a] text-3xl font-extrabold font-mono select-none leading-none">
              Dank Stats
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex-1 flex justify-center text-[#c6ffcc] font-mono font-medium space-x-8">
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
          className={`z-50 mt-3 flex justify-center gap-x-3 transition-opacity duration-300 px-3 w-full ${expanded ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          onMouseEnter={() => setHoveringSubmenu(true)}
          onMouseLeave={() => setHoveringSubmenu(false)}
        >
          {itemStatsCards.map((item, index) => (
            <NavCard
              key={index}
              heading={item.heading}
              description={item.description}
              redirect={item.redirect}
            />
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

