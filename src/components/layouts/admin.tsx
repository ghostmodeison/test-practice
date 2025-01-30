'use client'
import React from 'react';
import Header from '@/components/common/Header';
import Footer from "@/components/common/Footer";
import { withAuth } from "@/components/auth/withAuth";

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="min-h-screen bg-brand1-10 text-black ">
            <Header />
            {children}
            <Footer />
        </div>
    );
};

export default withAuth(AdminLayout);