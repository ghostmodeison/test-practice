'use client'
import Header from '@/components/common/Header';
import Details from '@/app/dashboard/Onbaording/Details';
import Register from '@/app/dashboard/Onbaording/Register';
import Success from '@/app/dashboard/Onbaording/Success';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const onBoarding = useSelector((state: any) => state.onBoarding.showOnBoarding);
    const [hideSuccess, setHideSuccess] = useState(true);
    const [hideCompanyInfo, setHideCompanyInfo] = useState(true);
    const [countryData, setCountryData] = useState({})
    return (
        <div className="h-screen grid grid-rows-layout bg-neutral-100 relative">

            {!hideSuccess && <Success setHideSuccess={setHideSuccess} />}
            {onBoarding && <Register setHideCompanyInfo={setHideCompanyInfo} setCountryData={setCountryData} />}
            {!hideCompanyInfo && <Details setHideCompanyInfo={setHideCompanyInfo} countryData={countryData} setHideSuccess={setHideSuccess} />}
            <Header />
            {children}
        </div>
    );
};

export default Layout;