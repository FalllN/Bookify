'use client';

import {Mic, MicOff} from "lucide-react";
import useVapi from "@/hooks/useVapi";
import {IBook} from "@/types";
import Image from "next/image";
import Transcript from "@/components/Transcript";
import {formatDuration} from "@/lib/utils";

const VapiControls = ({ book }: { book: IBook}) => {
    const { status, isActive, messages, currentMessage, currentUserMessage, duration, volumeLevel,
        start, stop, clearError, } = useVapi(book)

    return (
        <>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="vapi-header-card">
                    <div className="vapi-cover-wrapper">
                        <Image
                            src={book.coverURL}
                            alt={book.title}
                            width={120}
                            height={180}
                            className="vapi-cover-image"
                        />
                        <div className="vapi-mic-wrapper">
                            {isActive && (status === 'speaking' || status === 'thinking' || status === 'listening') && (
                                <div
                                    className={`vapi-pulse-ring ${status === 'listening' ? 'animate-none' : ''}`}
                                    style={status === 'listening' ? {
                                        transform: `scale(${1 + volumeLevel * 2})`,
                                        opacity: 0.3 + volumeLevel,
                                    } : {}}
                                />
                            )}
                            <button onClick={isActive ? stop : start} disabled={status === 'connecting'}
                                    className={`vapi-mic-btn ${isActive ? 'vapi-mic-btn-active' : 'vapi-mic-btn-inactive'}`}>
                                {isActive ? (
                                    <Mic className="size-7 text-[#212a3b]" />
                                ) : (
                                    <MicOff className="size-7 text-[#212a3b]" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <h1 className="text-2xl md:text-3xl font-bold font-serif text-[#212a3b]">
                            {book.title}
                        </h1>
                        <p className="text-xl text-[#3d485e]">by {book.author}</p>

                        <div className="flex flex-wrap gap-2 mt-2">
                            <div className="vapi-status-indicator">
                                <span className={`vapi-status-dot vapi-status-dot-${
                                    status === 'idle' ? 'ready' : 
                                    status === 'starting' ? 'speaking' : 
                                    status
                                }`} />
                                <span className="vapi-status-text capitalize">{status === 'idle' ? 'Ready' : status}</span>
                            </div>
                            <div className="vapi-status-indicator">
                                <span className="vapi-status-text">Voice: {book.persona || 'Default'}</span>
                            </div>
                            <div className="vapi-status-indicator">
                                <span className="vapi-status-text">{formatDuration(duration)}/15:00</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="vapi-transcript-wrapper">
                    <Transcript
                        messages={messages}
                        currentMessage={currentMessage}
                        currentUserMessage={currentUserMessage}
                    />
                </div>
            </div>
        </>
    )
}
export default VapiControls
