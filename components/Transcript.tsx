'use client';

import React, { useEffect, useRef } from 'react';
import { Mic } from 'lucide-react';
import { Messages } from '@/types';

interface TranscriptProps {
  messages: Messages[];
  currentMessage: string;
  currentUserMessage: string;
}

const Transcript = ({ messages, currentMessage, currentUserMessage }: TranscriptProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentMessage, currentUserMessage]);

  const isEmpty = messages.length === 0 && !currentMessage && !currentUserMessage;

  if (isEmpty) {
    return (
      <div className="transcript-container">
        <div className="transcript-empty">
          <Mic className="size-12 text-[#212a3b] mb-4" />
          <p className="transcript-empty-text">No conversation yet</p>
          <p className="transcript-empty-hint">Click the mic button above to start talking</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transcript-container">
      <div className="transcript-messages" ref={scrollRef}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`transcript-message ${
              msg.role === 'user' ? 'transcript-message-user' : 'transcript-message-assistant'
            }`}
          >
            <div
              className={`transcript-bubble ${
                msg.role === 'user' ? 'transcript-bubble-user' : 'transcript-bubble-assistant'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {currentUserMessage && (
          <div className="transcript-message transcript-message-user">
            <div className="transcript-bubble transcript-bubble-user">
              {currentUserMessage}
              <span className="transcript-cursor" />
            </div>
          </div>
        )}

        {currentMessage && (
          <div className="transcript-message transcript-message-assistant">
            <div className="transcript-bubble transcript-bubble-assistant">
              {currentMessage}
              <span className="transcript-cursor" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transcript;
