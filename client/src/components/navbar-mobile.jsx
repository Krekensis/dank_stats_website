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

  const petStatsCards = [
    {
      heading: "All pets overview",
      redirect: "/all-pets-overview",
    },
    {
      heading: "Pet market visualizer",
      redirect: "/pet-market-visualizer",
    }
  ];

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-transform duration-500 ${showNavbar ? "translate-y-0" : "-translate-y-full"}`}>
      <div className="bg-bg5/90 backdrop-blur-[10px] w-full px-4 py-3 flex flex-col transition-all duration-300 shadow-md">
        <div className="flex justify-between items-center">
          {/* Logo + Text */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary" style={{ maskImage: `url(${logo})`, maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskImage: `url(${logo})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
            <div className="text-primary text-xl font-audiowide select-none leading-none">
              Dank Stats
            </div>
          </Link>

          {/* Right Icons: Settings + Hamburger */}
          <div className="flex items-center space-x-2">
            <Link to="/settings" onClick={() => setExpanded(false)} className="text-textLight hover:text-primary transition p-2 focus:outline-none" aria-label="Settings">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>

            {/* Hamburger Icon */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-primary focus:outline-none p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={expanded ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Content */}
        <div className={`overflow-hidden transition-all duration-300 flex flex-col ${expanded ? "max-h-96 mt-4 opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="flex flex-col space-y-3 font-mono text-textLight text-sm">
            <div className="text-primary font-bold border-b border-bg12 pb-1">Item Statistics</div>
            {itemStatsCards.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  setExpanded(false);
                  navigate(item.redirect);
                }}
                className="text-left pl-4 hover:text-primary transition py-1"
              >
                {item.heading}
              </button>
            ))}
            <div className="text-primary font-bold border-b border-bg12 pb-1 mt-2">Pet Statistics</div>
            {petStatsCards.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  setExpanded(false);
                  navigate(item.redirect);
                }}
                className="text-left pl-4 hover:text-primary transition py-1"
              >
                {item.heading}
              </button>
            ))}
            <div className="text-primary font-bold border-b border-bg12 pb-1 mt-2">API</div>
            <Link
              to="/api-docs"
              onClick={() => setExpanded(false)}
              className="text-left pl-4 hover:text-primary transition py-1"
            >
              Documentation
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavbarMobile;
