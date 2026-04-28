import React from 'react';
import NavbarDesktop from './navbar-desktop';
import NavbarMobile from './navbar-mobile';
import useIsMobile from '../hooks/useIsMobile';

const Navbar = () => {
    const isMobile = useIsMobile();
    return isMobile ? <NavbarMobile /> : <NavbarDesktop />;
};

export default Navbar;
