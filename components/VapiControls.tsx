'use client';

import {Mic, MicOff, Play, X} from "lucide-react";
import useVapi from "@/hooks/useVapi";
import {IBook, IBookSegment} from "@/types";
import Image from "next/image";
import Transcript from "@/components/Transcript";
import {formatDuration} from "@/lib/utils";
import {useEffect, useState} from "react";
import {getBookSegments} from "@/lib/Actions/book.actions";

const VapiControls = ({ book }: { book: IBook}) => {
    const { status, isActive, messages, currentMessage, currentUserMessage, duration, volumeLevel,
        start, stop, clearError, maxDurationSeconds, limitError } = useVapi(book)

    const [segments, setSegments] = useState<IBookSegment[]>([]);
    const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number>(0);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const fetchSegments = async () => {
            const result = await getBookSegments(book._id);
            if (result.success && result.data) {
                setSegments(result.data);
            }
        };
        fetchSegments();
    }, [book._id]);

    const handlePlaySegment = () => {
        const segment = segments[selectedSegmentIndex];
        if (segment) {
            start(segment.content);
        }
    };

    return (
        <>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Segment Selection Section */}
                <div className="vapi-header-card flex flex-col sm:flex-row items-end gap-4">
                    <div className="flex-1 w-full">
                        <label htmlFor="segment-select" className="vapi-badge-ai-text mb-2 block">
                            Select a segment to hear the AI read:
                        </label>
                        <select
                            id="segment-select"
                            className="w-full p-3 rounded-lg border border-[var(--border-subtle)] bg-white text-[#212a3b] focus:ring-2 focus:ring-[#212a3b] focus:outline-none font-medium cursor-pointer shadow-soft-sm"
                            value={selectedSegmentIndex}
                            onChange={(e) => setSelectedSegmentIndex(Number(e.target.value))}
                        >
                            {segments.length === 0 ? (
                                <option value="0">No segments available</option>
                            ) : (
                                segments.map((segment, index) => (
                                    <option key={segment._id.toString()} value={index}>
                                        Segment {segment.segmentIndex + 1} {segment.pageNumber ? `(Page ${segment.pageNumber})` : ''} - {segment.wordCount} words
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                    <button
                        onClick={handlePlaySegment}
                        disabled={isActive || segments.length === 0}
                        className={`flex items-center justify-center gap-2 px-8 py-3 rounded-full font-bold transition-all shadow-soft-sm h-[50px] ${
                            isActive || segments.length === 0
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-70'
                                : 'bg-[#212a3b] text-white hover:bg-[#3d485e] active:scale-95'
                        }`}
                        style={{ fontFamily: "'IBM Plex Serif', serif" }}
                    >
                        <Play className="size-5 fill-current" />
                        Play
                    </button>
                </div>

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
                            <button onClick={isActive ? stop : () => start()} disabled={status === 'connecting'}
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
                                <span className="vapi-status-text">
                                    {formatDuration(duration)}/{isMounted ? formatDuration(maxDurationSeconds) : '15:00'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="vapi-transcript-wrapper">
                    {limitError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-300">
                            <p className="font-medium">{limitError}</p>
                            <button 
                                onClick={clearError}
                                className="text-red-500 hover:text-red-700 transition-colors p-1"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                    )}
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
