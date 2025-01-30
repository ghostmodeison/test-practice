'use client';
import Cart from "@/components/cart/Cart";
import Footer from "@/components/common/Footer";
import React from "react";

const Page: React.FC = () => {

    return (
        <div className="bg-neutral-100">
            <Cart />
            <Footer />
        </div>
    );
};

export default Page;
