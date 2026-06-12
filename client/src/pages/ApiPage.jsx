import React from 'react';
import useIsMobile from '../hooks/useIsMobile';
import ApiPageDesktop from './desktop/ApiPageDesktop';
import ApiPageMobile from './mobile/ApiPageMobile';

const ApiPage = () => {
    const isMobile = useIsMobile();

    return (
        <div className="w-full min-h-screen bg-[#070e0c]">
            {isMobile ? <ApiPageMobile /> : <ApiPageDesktop />}
        </div>
    );
};

export default ApiPage;
