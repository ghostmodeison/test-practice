'use client'
import Header from '@/components/common/Header';
import React from 'react';
import Footer from '@/components/common/Footer';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="h-screen bg-neutral-100">
            <Header />
            {children}
            <Footer />
        </div>
    );
};

export default Layout;