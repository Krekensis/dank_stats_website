import React from 'react';
import HomePageDesktop from './desktop/HomePageDesktop';
import HomePageMobile from './mobile/HomePageMobile';
import useIsMobile from '../hooks/useIsMobile';

const HomePage = () => {
    const isMobile = useIsMobile();
    return isMobile ? <HomePageMobile /> : <HomePageDesktop />;
};

export default HomePage;