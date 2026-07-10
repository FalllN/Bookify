import { PlanSlug, SUBSCRIPTION_PLANS } from './constants';

/**
 * Utility to determine the user's current subscription plan using Clerk's has() method.
 * Works both server-side (with auth().has) and client-side (with useAuth().has).
 * 
 * @param has The has function provided by Clerk's auth() or useAuth()
 * @returns The user's current PlanSlug
 */
export function getUserPlan(has: ((params: { plan: string }) => boolean) | undefined | null): PlanSlug {
    if (!has || typeof has !== 'function') return 'free';
    
    try {
        if (has({ plan: 'pro' })) return 'pro';
        if (has({ plan: 'standard' })) return 'standard';
    } catch (e) {
        console.error('Error checking user plan:', e);
        return 'free';
    }
    
    return 'free';
}

/**
 * Get the limits associated with a specific plan.
 * 
 * @param plan The user's current plan slug
 * @returns The limits object for the plan
 */
export function getPlanLimits(plan: PlanSlug) {
    return SUBSCRIPTION_PLANS[plan].limits;
}

/**
 * Convenience function to get the user's plan and its limits in one go.
 * 
 * @param has The has function provided by Clerk's auth() or useAuth()
 */
export function getUserPlanWithLimits(has: ((params: { plan: string }) => boolean) | undefined | null) {
    const plan = getUserPlan(has);
    return {
        plan,
        limits: getPlanLimits(plan),
    };
}
