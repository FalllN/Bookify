'use client';

// Create hooks/useVapi.ts: the core hook. Initializes Vapi SDK, manages call lifecycle (idle, connecting, starting, listening, thinking, speaking), tracks messages array + currentMessage streaming, handles duration timer with maxDuration enforcement, session tracking via server actions

import { useState, useEffect, useRef, useCallback } from 'react';
import Vapi from '@vapi-ai/web';
import { useAuth } from '@clerk/nextjs';

import { ASSISTANT_ID, DEFAULT_VOICE, VOICE_SETTINGS } from '@/lib/constants';
import { getVoice } from '@/lib/utils';
import { IBook, Messages } from '@/types';
import { startVoiceSession, endVoiceSession } from '@/lib/Actions/session.actions';
import { getUserPlanWithLimits } from '@/lib/subscription';

export function useLatestRef<T>(value: T) {
    const ref = useRef(value);

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref;
}

const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY;
const TIMER_INTERVAL_MS = 1000;
const SECONDS_PER_MINUTE = 60;
const TIME_WARNING_THRESHOLD = 60; // Show warning when this many seconds remain

let vapi: InstanceType<typeof Vapi> | null = null;
function getVapi() {
    if (typeof window === 'undefined') return null;
    if (!vapi) {
        if (!VAPI_API_KEY) {
            console.warn('NEXT_PUBLIC_VAPI_API_KEY environment variable is not set');
            return null;
        }
        try {
            vapi = new Vapi(VAPI_API_KEY);
        } catch (e) {
            console.error('Failed to initialize Vapi SDK:', e);
            return null;
        }
    }
    return vapi;
}

export type CallStatus = 'idle' | 'connecting' | 'starting' | 'listening' | 'thinking' | 'speaking';

export function useVapi(book: IBook) {
    const { userId, has } = useAuth();
    const { limits } = getUserPlanWithLimits(has);

    const [status, setStatus] = useState<CallStatus>('idle');
    const [messages, setMessages] = useState<Messages[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [currentUserMessage, setCurrentUserMessage] = useState('');
    const [duration, setDuration] = useState(0);
    const [volumeLevel, setVolumeLevel] = useState(0);
    const [limitError, setLimitError] = useState<string | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const sessionIdRef = useRef<string | null>(null);
    const isStoppingRef = useRef(false);

    // Keep refs in sync with latest values for use in callbacks
    const maxDurationRef = useLatestRef(limits.maxDurationPerSession * 60);
    const durationRef = useLatestRef(duration);
    const voice = book.persona || DEFAULT_VOICE;

    // Set up Vapi event listeners
    useEffect(() => {
        const handlers = {
            'call-start': () => {
                isStoppingRef.current = false;
                setStatus('starting'); // AI speaks first, wait for it
                setCurrentMessage('');
                setCurrentUserMessage('');
                setVolumeLevel(0);

                // Increase mic sensitivity (gain) to help pick up quieter voices
                getVapi()
                    ?.increaseMicLevel(2.0)
                    .catch((err) => console.error('Failed to increase mic level:', err));

                // Start duration timer
                startTimeRef.current = Date.now();
                setDuration(0);
                timerRef.current = setInterval(() => {
                    if (startTimeRef.current) {
                        const newDuration = Math.floor((Date.now() - startTimeRef.current) / TIMER_INTERVAL_MS);
                        setDuration(newDuration);

                        // Check duration limit
                        if (newDuration >= maxDurationRef.current) {
                            getVapi()?.stop();
                            setLimitError(
                                `Session time limit (${Math.floor(
                                    maxDurationRef.current / SECONDS_PER_MINUTE,
                                )} minutes) reached. Upgrade your plan for longer sessions.`,
                            );
                        }
                    }
                }, TIMER_INTERVAL_MS);
            },

            'call-end': () => {
                // Don't reset isStoppingRef here - delayed events may still fire
                setStatus('idle');
                setCurrentMessage('');
                setCurrentUserMessage('');
                setVolumeLevel(0);

                // Stop timer
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }

                // End session tracking
                if (sessionIdRef.current) {
                    endVoiceSession(sessionIdRef.current, durationRef.current).catch((err) =>
                        console.error('Failed to end voice session:', err),
                    );
                    sessionIdRef.current = null;
                }

                startTimeRef.current = null;
            },

            'speech-start': () => {
                if (!isStoppingRef.current) {
                    setStatus('speaking');
                }
            },
            'speech-end': () => {
                if (!isStoppingRef.current) {
                    // After AI finishes speaking, user can talk
                    setStatus('listening');
                }
            },

            message: (message: {
                type: string;
                role: string;
                transcriptType: string;
                transcript: string;
            }) => {
                if (message.type !== 'transcript') return;

                // User finished speaking → AI is thinking
                if (message.role === 'user' && message.transcriptType === 'final') {
                    if (!isStoppingRef.current) {
                        setStatus('thinking');
                    }
                    setCurrentUserMessage('');
                }

                // Partial user transcript → show real-time typing
                if (message.role === 'user' && message.transcriptType === 'partial') {
                    setCurrentUserMessage(message.transcript);
                    return;
                }

                // Partial AI transcript → show word-by-word
                if (message.role !== 'user' && message.transcriptType === 'partial') {
                    setCurrentMessage(message.transcript);
                    return;
                }

                // Final transcript → add to messages
                if (message.transcriptType === 'final') {
                    if (message.role !== 'user') setCurrentMessage('');
                    if (message.role === 'user') setCurrentUserMessage('');

                    setMessages((prev) => [...prev, { role: message.role, content: message.transcript }]);
                }
            },

            error: (error: any) => {
                console.error('Vapi error detected:', error);
                
                // Extremely detailed logging for all errors, especially empty-looking ones
                console.error('Vapi error details:', {
                    message: error?.message,
                    stack: error?.stack,
                    name: error?.name,
                    code: error?.code,
                    status: error?.status,
                    body: error?.body,
                    raw: error
                });

                if (error && typeof error === 'object' && Object.keys(error).length === 0) {
                    console.error('Vapi error is an empty object literal. This often means a configuration issue (API Key, Assistant ID) or a network/CORS block.');
                }

                // Log configuration state for debugging
                console.log('Vapi Config state:', {
                    hasApiKey: !!VAPI_API_KEY,
                    hasAssistantId: !!ASSISTANT_ID,
                    assistantId: ASSISTANT_ID?.substring(0, 8) + '...',
                    apiKeyPrefix: VAPI_API_KEY?.substring(0, 8) + '...'
                });

                // Don't reset isStoppingRef here - delayed events may still fire
                setStatus('idle');
                setCurrentMessage('');
                setCurrentUserMessage('');
                setVolumeLevel(0);

                // Stop timer on error
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }

                // End session tracking on error
                if (sessionIdRef.current) {
                    endVoiceSession(sessionIdRef.current, durationRef.current).catch((err) =>
                        console.error('Failed to end voice session on error:', err),
                    );
                    sessionIdRef.current = null;
                }

                // Show user-friendly error message
                const errorMessage = error.message?.toLowerCase() || '';
                if (errorMessage.includes('timeout') || errorMessage.includes('silence')) {
                    setLimitError('Session ended due to inactivity. Click the mic to start again.');
                } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
                    setLimitError('Connection lost. Please check your internet and try again.');
                } else {
                    setLimitError('Session ended unexpectedly. Click the mic to start again.');
                }

                startTimeRef.current = null;
            },
            'call-start-progress': (event: any) => {
                console.log('Vapi Call Start Progress:', event.stage, event.status);
            },
            'call-start-success': (event: any) => {
                console.log('Vapi Call Start Success:', event);
            },
            'call-start-failed': (event: any) => {
                console.error('Vapi Call Start Failed:', event);
                setLimitError(`Failed to start voice session: ${event.error || 'Unknown error'}`);
                setStatus('idle');
            },
            'volume-level': (volume: number) => {
                setVolumeLevel(volume);
            },
        };

        // Register all handlers
        const vapiInstance = getVapi();
        if (vapiInstance) {
            Object.entries(handlers).forEach(([event, handler]) => {
                vapiInstance.on(event as keyof typeof handlers, handler as () => void);
            });
        }

        return () => {
            const vapiInstance = getVapi();
            if (!vapiInstance) return;

            // End active session on unmount
            if (sessionIdRef.current) {
                vapiInstance.stop();
                endVoiceSession(sessionIdRef.current, durationRef.current).catch((err) =>
                    console.error('Failed to end voice session on unmount:', err),
                );
                sessionIdRef.current = null;
            }
            // Cleanup handlers
            Object.entries(handlers).forEach(([event, handler]) => {
                vapiInstance.off(event as keyof typeof handlers, handler as () => void);
            });
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const start = useCallback(async (text?: string) => {
        if (!userId) {
            setLimitError('Please sign in to start a voice session.');
            return;
        }

        setLimitError(null);

        const vapiInstance = getVapi();
        if (!vapiInstance) {
            setLimitError('Vapi configuration missing. Please check your environment variables.');
            setStatus('idle');
            return;
        }

        if (!ASSISTANT_ID) {
            setLimitError('Vapi Assistant ID missing. Please check your environment variables.');
            setStatus('idle');
            return;
        }

        setStatus('connecting');

        try {
            // Check session limits and create session record
            const result = await startVoiceSession(userId, book._id);

            if (!result.success) {
                setLimitError(result.error || 'Session limit reached. Please upgrade your plan.');
                setStatus('idle');
                return;
            }

            sessionIdRef.current = result.sessionId || null;
            // Note: Server-returned maxDurationMinutes is informational only
            // The actual limit is enforced by useLatestRef(limits.maxSessionMinutes * 60)

            const firstMessage = text || `Hey, good to meet you. Quick question before we dive in - have you actually read ${book.title} yet, or are we starting fresh?`;

            await vapiInstance.start(ASSISTANT_ID, {
                firstMessage,
                variableValues: {
                    title: book.title,
                    author: book.author,
                    bookId: book._id,
                    persona: voice,
                },
                voice: {
                    provider: '11labs' as const,
                    voiceId: getVoice(voice).id,
                    model: 'eleven_turbo_v2_5' as const,
                    stability: VOICE_SETTINGS.stability,
                    similarityBoost: VOICE_SETTINGS.similarityBoost,
                    style: VOICE_SETTINGS.style,
                    useSpeakerBoost: VOICE_SETTINGS.useSpeakerBoost,
                    speed: VOICE_SETTINGS.speed,
                },
            });
        } catch (err) {
            console.error('Failed to start call:', err);
            setStatus('idle');
            setLimitError('Failed to start voice session. Please try again.');
        }
    }, [book._id, book.title, book.author, voice, userId]);

    const stop = useCallback(() => {
        isStoppingRef.current = true;
        getVapi()?.stop();
    }, []);

    const clearError = useCallback(() => {
        setLimitError(null);
    }, []);

    const isActive =
        status === 'starting' ||
        status === 'listening' ||
        status === 'thinking' ||
        status === 'speaking';

    // Calculate remaining time
    const maxDurationSeconds = limits.maxDurationPerSession * SECONDS_PER_MINUTE;
    const remainingSeconds = Math.max(0, maxDurationSeconds - duration);
    const showTimeWarning =
        isActive && remainingSeconds <= TIME_WARNING_THRESHOLD && remainingSeconds > 0;

    return {
        status,
        isActive,
        messages,
        currentMessage,
        currentUserMessage,
        duration,
        volumeLevel,
        start,
        stop,
        limitError,
        clearError,
        maxDurationSeconds,
        remainingSeconds,
        showTimeWarning,
    };
}

export default useVapi;