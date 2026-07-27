import React from 'react';
import useIsMobile from '../hooks/useIsMobile';
import SettingsPageDesktop from './desktop/SettingsPageDesktop';
import SettingsPageMobile from './mobile/SettingsPageMobile';

const Settings = () => {
    const isMobile = useIsMobile();

    return (
        <div className="w-full min-h-screen bg-bg0">
            {isMobile ? <SettingsPageMobile /> : <SettingsPageDesktop />}
        </div>
    );
};

export default Settings;
