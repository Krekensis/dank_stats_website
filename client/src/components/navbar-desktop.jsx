import React, { useState, useRef, useEffect } from "react";
import NavCard from "./navcard";
import logo from "../assets/DankStats.png";
import { Link } from "react-router-dom";

const COLLAPSED_HEIGHT = 60;
const COLLAPSE_DELAY_MS = 200; // delay before collapsing to avoid flicker

const NavbarDesktop = () => {
  const [expanded, setExpanded] = useState(false);
  const [submenuHeight, setSubmenuHeight] = useState(0);
  const submenuRef = useRef(null);

  const [hoveringItemTrigger, setHoveringItemTrigger] = useState(false);
  const [hoveringPetTrigger, setHoveringPetTrigger] = useState(false);
  const [hoveringSubmenu, setHoveringSubmenu] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null); // 'item' or 'pet'
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

    if (hoveringItemTrigger || hoveringPetTrigger || hoveringSubmenu) {
      setExpanded(true);
      if (hoveringItemTrigger) setActiveMenu('item');
      if (hoveringPetTrigger) setActiveMenu('pet');
    } else {
      // delay
      collapseTimeout.current = setTimeout(() => {
        setExpanded(false);
        setActiveMenu(null);
      }, COLLAPSE_DELAY_MS);
    }

    return () => {
      if (collapseTimeout.current) {
        clearTimeout(collapseTimeout.current);
      }
    };
  }, [hoveringItemTrigger, hoveringPetTrigger, hoveringSubmenu]);

  const containerHeight = expanded ? COLLAPSED_HEIGHT + submenuHeight + 18 : COLLAPSED_HEIGHT;

  const itemStatsCards = [
    {
      heading: "All items overview",
      description: "Listed overview of all items, including their current values and historical trends.",
      redirect: "/all-items-overview",
    },
    {
      heading: "Item value visualizer",
      description: "Visualize how item values have evolved over time through clear, interactive graphs.",
      redirect: "/item-value-visualizer",
    },
    {
      heading: "Item market visualizer",
      description: "Explore the market trends of specific items with detailed visualizations.",
      redirect: "/item-market-visualizer",
    }
  ]

  const petStatsCards = [
    {
      heading: "All pets overview",
      description: "Listed overview of all pets, including their historical market data.",
      redirect: "/all-pets-overview",
    },
    {
      heading: "Pet market visualizer",
      description: "Explore the market trends of specific pets with detailed visualizations.",
      redirect: "/pet-market-visualizer",
    }
  ]

  return (
    <nav className={`fixed top-0 left-0 w-full flex justify-center z-50 pointer-events-none transition-transform duration-500 ${showNavbar ? "translate-y-0" : "-translate-y-full"}`}>
      <div className="mt-4 z-50 relative bg-bg5/70 backdrop-blur-[10px] rounded-xl px-6 py-3 max-w-8xl w-full mx-12 pointer-events-auto flex flex-col transition-all duration-300 ease-in-out overflow-hidden" style={{ height: `${containerHeight}px` }}>
        <div className="flex justify-between items-center">
          {/* Logo + Text Grouped */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary" style={{ maskImage: `url(${logo})`, maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskImage: `url(${logo})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
            <div className="text-primary text-3xl font-audiowide select-none leading-none">
              Dank Stats
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex-1 flex justify-center text-textLight font-mono font-medium space-x-8">
            <a
              href="#"
              className={`hover:text-primary transition cursor-pointer ${activeMenu === 'item' ? 'text-primary' : ''}`}
              onMouseEnter={() => setHoveringItemTrigger(true)}
              onMouseLeave={() => setHoveringItemTrigger(false)}
            >
              Item Statistics
            </a>
            <a
              href="#"
              className={`hover:text-primary transition cursor-pointer ${activeMenu === 'pet' ? 'text-primary' : ''}`}
              onMouseEnter={() => setHoveringPetTrigger(true)}
              onMouseLeave={() => setHoveringPetTrigger(false)}
            >
              Pet Statistics
            </a>
            <Link to="/api-docs" className="hover:text-primary transition cursor-pointer">
              API
            </Link>
          </div>

          {/* Settings Icon */}
          <div className="flex items-center">
            <Link to="/settings" className="text-textLight hover:text-primary transition cursor-pointer" aria-label="Settings">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
          </div>
        </div>

        <div
          ref={submenuRef}
          className={`z-50 mt-3 flex justify-center gap-x-3 transition-opacity duration-300 px-3 w-full ${expanded ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          onMouseEnter={() => setHoveringSubmenu(true)}
          onMouseLeave={() => setHoveringSubmenu(false)}
        >
          {activeMenu === 'item' && itemStatsCards.map((item, index) => (
            <NavCard
              key={index}
              heading={item.heading}
              description={item.description}
              redirect={item.redirect}
            />
          ))}
          {activeMenu === 'pet' && petStatsCards.map((item, index) => (
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

export default NavbarDesktop;
