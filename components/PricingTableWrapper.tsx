'use client';

import React, { useEffect, useState } from 'react';
import { PricingTable } from '@clerk/nextjs';

const PricingTableWrapper = () => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return <div className="min-h-[400px] flex items-center justify-center">
            <div className="animate-pulse text-[#3d485e]">Loading pricing...</div>
        </div>;
    }

    return <PricingTable />;
};

export default PricingTableWrapper;
