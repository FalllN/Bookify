import React from 'react';
import PricingTableWrapper from '@/components/PricingTableWrapper';

const SubscriptionsPage = () => {
    return (
        <main className="min-h-screen bg-background pt-[var(--navbar-height)]">
            <section className="wrapper py-10 md:py-16">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-[#212a3b] mb-4 font-serif">
                        Choose Your Plan
                    </h1>
                    <p className="text-lg text-[#3d485e] max-w-2xl mx-auto">
                        Unlock more books, longer sessions, and advanced features with our flexible subscription plans.
                    </p>
                </div>

                <div className="clerk-pricing-table-wrapper">
                    <PricingTableWrapper />
                </div>
            </section>
        </main>
    );
};

export default SubscriptionsPage;
