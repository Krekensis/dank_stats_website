import React, { useState, useEffect } from "react";
import logo from "../assets/DankStats.png";
import { Link, useNavigate } from "react-router-dom";

const NavbarMobile = () => {
  const [expanded, setExpanded] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (Math.abs(currentScrollY - lastScrollY) < 80) { return; } //threshold
      if (currentScrollY > lastScrollY && !expanded) { setShowNavbar(false) }
      else { setShowNavbar(true) }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, expanded]);

  const itemStatsCards = [
    {
      heading: "All items overview",
      redirect: "/all-items-overview",
    },
    {
      heading: "Item value visualizer",
      redirect: "/item-value-visualizer",
    },
    {
      heading: "Item market visualizer",
      redirect: "/item-market-visualizer",
    }
  ];

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-transform duration-500 ${showNavbar ? "translate-y-0" : "-translate-y-full"}`}>
      <div className="bg-[#151f19]/90 backdrop-blur-[10px] w-full px-4 py-3 flex flex-col transition-all duration-300 shadow-md">
        <div className="flex justify-between items-center">
          {/* Logo + Text */}
          <Link to="/" className="flex items-center space-x-2">
            <img src={logo} alt="Dank Stats Logo" className="w-8 h-8 object-contain" />
            <div className="text-[#6bff7a] text-xl font-audiowide select-none leading-none">
              Dank Stats
            </div>
          </Link>

          {/* Hamburger Icon */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[#6bff7a] focus:outline-none p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={expanded ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path>
            </svg>
          </button>
        </div>

        {/* Mobile Menu Content */}
        <div className={`overflow-hidden transition-all duration-300 flex flex-col ${expanded ? "max-h-96 mt-4 opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="flex flex-col space-y-3 font-mono text-[#c6ffcc] text-sm">
            <div className="text-[#6bff7a] font-bold border-b border-[#2a3c31] pb-1">Item Statistics</div>
            {itemStatsCards.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  setExpanded(false);
                  navigate(item.redirect);
                }}
                className="text-left pl-4 hover:text-[#6bff7a] transition py-1"
              >
                {item.heading}
              </button>
            ))}
            <div className="text-[#6bff7a] font-bold border-b border-[#2a3c31] pb-1 mt-2">About</div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavbarMobile;
