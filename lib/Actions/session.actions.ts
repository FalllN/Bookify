'use server'

import {connectToDatabase} from "@/database/mongoose";
import VoiceSession from "@/database/models/voice-session.model";
import {getCurrentBillingPeriodStart} from "@/lib/subscription-constants";


export interface StartSessionResult {
    success: boolean;
    sessionId?: string;
    error?: string;
}

export const startVoiceSession = async (clerkId: string, bookId: string): Promise<StartSessionResult> => {
    try {
        await connectToDatabase();

        // Limits/Plan to see whether a session is allowed.

        const session = await VoiceSession.create({
            clerkId, bookId, startedAt: new Date(),
            billingPeriodStart: getCurrentBillingPeriodStart(),
            durationSeconds: 0,
        })
        return {
            success: true,
            sessionId: session._id.toString(),
            // maxDurationMinutes: check.maxDurationMinutes,
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