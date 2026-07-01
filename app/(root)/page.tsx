import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import {sampleBooks} from "@/lib/constants";
import BookCard from "@/components/ui/BookCard";
import Link from "next/link";

const Page = () => {
    return (
        <main className="min-h-screen bg-background pt-(--navbar-height)">
            <section className="wrapper pt-28 mb-10 md:mb-16">
                <div className="library-hero-card">
                    <div className="library-hero-content">
                        {/* Left Section */}
                        <div className="library-hero-text">
                            <h1 className="library-hero-title">Your Library</h1>
                            <p className="library-hero-description">
                                Convert your books into interactive AI conversations. Listen, learn, and discuss your favorite reads.
                            </p>
                            <Button asChild className="bg-[`#e4e8ed`] text-black hover:bg-[`#d4d8dd`] rounded-lg h-12 px-6 flex items-center gap-2 border-none shadow-none cursor-pointer">
                                <Link href="/books/new">
                                <Plus className="size-5" />
                                <span className="font-semibold text-base">Add new book</span>
                                </Link>
                            </Button>
                        </div>

                        {/* Center Section - Illustration */}
                        {/* Mobile Illustration */}
                        <div className="library-hero-illustration">
                             <Image 
                                src="/assets/hero-illustration.png" 
                                alt="illustration" 
                                width={300} 
                                height={300} 
                                className="object-contain"
                            />
                        </div>

                        {/* Desktop Illustration */}
                        <div className="library-hero-illustration-desktop">
                            <Image 
                                src="/assets/hero-illustration.png" 
                                alt="illustration" 
                                width={400} 
                                height={400} 
                                className="object-contain"
                            />
                        </div>

                        {/* Right Section - Steps */}
                        <div className="library-steps-card max-w-[260px] w-full shadow-soft">
                            <div className="flex flex-col gap-6">
                                <div className="library-step-item">
                                    <div className="library-step-number">1</div>
                                    <div>
                                        <h3 className="library-step-title">Upload PDF</h3>
                                        <p className="library-step-description">Add your book file</p>
                                    </div>
                                </div>
                                <div className="library-step-item">
                                    <div className="library-step-number">2</div>
                                    <div>
                                        <h3 className="library-step-title">AI Processing</h3>
                                        <p className="library-step-description">We analyze the content</p>
                                    </div>
                                </div>
                                <div className="library-step-item">
                                    <div className="library-step-number">3</div>
                                    <div>
                                        <h3 className="library-step-title">Voice Chat</h3>
                                        <p className="library-step-description">Discuss with AI</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="library-books-grid">
                    {sampleBooks.map((book) => (
                        <BookCard key={book._id} title={book.title} author={book.author} coverURL={book.coverURL} slug={book.slug} />
                    ))}
                </div>
            </section>
        </main>
    )
}
export default Page
