'use server'

import {connectToDatabase} from "@/database/mongoose";
import VoiceSession from "@/database/models/voice-session.model";
import {getCurrentBillingPeriodStart} from "@/lib/subscription-constants";
import { auth } from "@clerk/nextjs/server";
import { getUserPlanWithLimits } from "@/lib/subscription";


export interface StartSessionResult {
    success: boolean;
    sessionId?: string;
    maxDurationMinutes?: number;
    error?: string;
}

export const startVoiceSession = async (clerkId: string, bookId: string): Promise<StartSessionResult> => {
    try {
        await connectToDatabase();

        // Check subscription limits
        const { has } = await auth();
        const { limits } = getUserPlanWithLimits(has);

        const billingPeriodStart = getCurrentBillingPeriodStart();

        if (limits.maxSessionsPerMonth !== Infinity) {
            const sessionCount = await VoiceSession.countDocuments({
                clerkId,
                billingPeriodStart,
            });

            if (sessionCount >= limits.maxSessionsPerMonth) {
                return {
                    success: false,
                    error: `Monthly session limit reached. Your current plan allows for ${limits.maxSessionsPerMonth} sessions per month.`,
                }
            }
        }

        const session = await VoiceSession.create({
            clerkId, bookId, startedAt: new Date(),
            billingPeriodStart,
            durationSeconds: 0,
        })
        return {
            success: true,
            sessionId: session._id.toString(),
            maxDurationMinutes: limits.maxDurationPerSession,
        }
    } catch (e) {
        console.error('Error starting call', e);
        return {
            success: false,
            error: "Failed to start voice session. Please try again.",
        }
    }
}

export const endVoiceSession = async (sessionId: string, durationSeconds: number): Promise<{ success: true } | false> => {
    try {
        await connectToDatabase();

        const result = await VoiceSession.findByIdAndUpdate(sessionId, {
            endedAt: new Date(),
            durationSeconds: durationSeconds
        });

        if(!result) return false;

        return { success: true };
    } catch (e) {
        console.error('Error ending voice session', e);
        return false;
    }
}