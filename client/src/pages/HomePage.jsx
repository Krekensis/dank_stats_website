import React from 'react';
import HomePageDesktop from './HomePageDesktop';
import HomePageMobile from './HomePageMobile';
import useIsMobile from '../hooks/useIsMobile';

const HomePage = () => {
    const isMobile = useIsMobile();
    return isMobile ? <HomePageMobile /> : <HomePageDesktop />;
};

export default HomePage;