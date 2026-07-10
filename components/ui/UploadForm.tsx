'use client'

import React, {useState, useRef, useEffect} from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UploadSchema } from '@/lib/zod'
import { z } from 'zod'
import { 
    Form, 
    FormControl, 
    FormField, 
    FormItem, 
    FormLabel, 
    FormMessage 
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Upload, ImageIcon, X, CheckCircle2 } from 'lucide-react'
import {voiceOptions, voiceCategories, DEFAULT_VOICE} from '@/lib/constants'
import LoadingOverlay from './LoadingOverlay'
//import {cn, parsePDFFile} from '@/lib/utils'
import {useAuth} from "@clerk/nextjs";
import { toast } from 'sonner';
import {BookUploadFormValues} from "@/types";
import {checkBookExists, createBook, saveBookSegments} from "@/lib/Actions/book.actions";
import {useRouter} from "next/navigation";
import {cn, parsePDFFile} from "@/lib/utils";
import {upload} from "@vercel/blob/client";


type FormValues = z.infer<typeof UploadSchema>

const UploadForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const { userId } = useAuth()
    const pdfInputRef = useRef<HTMLInputElement>(null)
    const coverInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter();

        useEffect(() => {
            setIsMounted(true);
        }, []);


    const form = useForm<BookUploadFormValues>({
        resolver: zodResolver(UploadSchema),
        defaultValues: {
            title: '',
            author: '',
            persona: '',
            pdfFile: undefined,
            coverImage: undefined,
        }
    })

    const onSubmit = async (data: BookUploadFormValues) => {
        if(!userId) {
            return toast.error("You must be logged in to upload a book.")
        }

        setIsSubmitting(true)

        // PostHog -> Track Book Uploads ...
        try {
            const existsCheck = await checkBookExists(data.title);

            if (existsCheck.exists && existsCheck.book) {
                toast.info("A book with this title already exists.");
            form.reset()
            router.push(`/books/${existsCheck.book.slug}`);
            return;
        }
                const fileTitle = data.title.replace(/\s+/g, '-').toLowerCase();
                const pdfFile = data.pdfFile;

                const parsedPDF = await parsePDFFile(pdfFile);

                if(parsedPDF.content.length === 0) {
                    toast.error("The PDF file is empty.");
                    return;
                }

                const uploadedPdfBlob = await upload(fileTitle, pdfFile, {
                    access: 'public',
                    handleUploadUrl: '/api/upload',
                    contentType: 'application/pdf',
                });

                let coverUrl: string;

                if(data.coverImage) {
                    const coverFile = data.coverImage;
                    const uploadedCoverBlob = await upload(`${fileTitle}_cover.png`, coverFile, {
                        access: 'public',
                        handleUploadUrl: '/api/upload',
                        contentType: coverFile.type
                    });
                    coverUrl = uploadedCoverBlob.url;
                } else {
                    const response = await fetch(parsedPDF.cover)
                    const blob = await response.blob();

                    const uploadedCoverBlob = await upload(`${fileTitle}_cover.png`, blob, {
                        access: 'public',
                        handleUploadUrl: '/api/upload',
                        contentType: 'image/png'
                    });
                    coverUrl = uploadedCoverBlob.url;
                }
            const book = await createBook({
                clerkId: userId,
                title: data.title,
                author: data.author,
                persona: data.persona,
                fileURL: uploadedPdfBlob.url,
                fileBlobKey: uploadedPdfBlob.pathname,
                coverURL: coverUrl,
                fileSize: pdfFile.size
            })

            if (!book.success) {
                toast.error(typeof book.error === 'string' ? book.error : "Failed to create book.");
                return;
            }

            if (book.alreadyExists) {
                toast.info("A book with this title already exists.");
                form.reset()
                router.push(`/books/${existsCheck.book.slug}`);
                return;
            }

            const segments = await saveBookSegments(book.data._id, userId, parsedPDF.content);

            if(!segments.success) {
                toast.error("Failed to save book segments.");
                throw new Error("Failed to save book segments.");
            }

            form.reset();
            router.push('/');
        } catch (error) {
            console.error(error);

            toast.error("An error occurred while uploading the book.")
        } finally {
            setIsSubmitting(false)
        }
        console.log(data);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 3000));
        setIsSubmitting(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
        const file = e.target.files?.[0]
        if (file) {
            field.onChange(file)
        }
    }

    const removeFile = (field: any, e: React.MouseEvent) => {
        e.stopPropagation()
        field.onChange(undefined)
    }

    return (
        <div className="new-book-wrapper">
            {isSubmitting && <LoadingOverlay />}
            
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* PDF File Upload */}
                    <FormField
                        control={form.control}
                        name="pdfFile"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Book PDF File</FormLabel>
                                <FormControl>
                                    <div 
                                        className={cn(
                                            "upload-dropzone",
                                            field.value && "upload-dropzone-uploaded border-2 border-dashed border-[#663820]"
                                        )}
                                        onClick={() => pdfInputRef.current?.click()}
                                    >
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="application/pdf"
                                            ref={pdfInputRef}
                                            onChange={(e) => handleFileChange(e, field)}
                                        />
                                        {field.value ? (
                                            <div className="flex flex-col items-center">
                                                <CheckCircle2 className="upload-dropzone-icon text-[#663820]" />
                                                <div className="flex items-center gap-2">
                                                    <span className="upload-dropzone-text truncate max-w-[200px]">{field.value.name}</span>
                                                    <button 
                                                        type="button" 
                                                        onClick={(e) => removeFile(field, e)}
                                                        className="upload-dropzone-remove"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <Upload className="upload-dropzone-icon" />
                                                <span className="upload-dropzone-text">Click to upload PDF</span>
                                                <span className="upload-dropzone-hint">PDF file (max 50MB)</span>
                                            </div>
                                        )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Cover Image Upload */}
                    <FormField
                        control={form.control}
                        name="coverImage"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cover Image (Optional)</FormLabel>
                                <FormControl>
                                    <div 
                                        className={cn(
                                            "upload-dropzone",
                                            field.value && "upload-dropzone-uploaded border-2 border-dashed border-[#663820]"
                                        )}
                                        onClick={() => coverInputRef.current?.click()}
                                    >
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*"
                                            ref={coverInputRef}
                                            onChange={(e) => handleFileChange(e, field)}
                                        />
                                        {field.value ? (
                                            <div className="flex flex-col items-center">
                                                <CheckCircle2 className="upload-dropzone-icon text-[#663820]" />
                                                <div className="flex items-center gap-2">
                                                    <span className="upload-dropzone-text truncate max-w-[200px]">{field.value.name}</span>
                                                    <button 
                                                        type="button" 
                                                        onClick={(e) => removeFile(field, e)}
                                                        className="upload-dropzone-remove"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <ImageIcon className="upload-dropzone-icon" />
                                                <span className="upload-dropzone-text">Click to upload cover image</span>
                                                <span className="upload-dropzone-hint">Leave empty to auto-generate from PDF</span>
                                            </div>
                                        )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Title Input */}
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="ex: Rich Dad Poor Dad" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Author Input */}
                    <FormField
                        control={form.control}
                        name="author"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Author Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="ex: Robert Kiyosaki" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Voice Selector */}
                    <FormField
                        control={form.control}
                        name="persona"
                        render={({ field }) => (
                            <FormItem className="space-y-4">
                                <FormLabel>Choose Assistant Voice</FormLabel>
                                <FormControl>
                                    <div className="space-y-6">
                                        {/* Male Voices */}
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium text-[#8B7355]">Male Voices</p>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {voiceCategories.male.map((voiceKey) => {
                                                    const voice = voiceOptions[voiceKey as keyof typeof voiceOptions]
                                                    return (
                                                        <div 
                                                            key={voiceKey}
                                                            className={cn(
                                                                "voice-selector-option",
                                                                field.value === voiceKey && "voice-selector-option-selected"
                                                            )}
                                                            onClick={() => field.onChange(voiceKey)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn(
                                                                    "w-4 h-4 rounded-full border border-[#663820] flex items-center justify-center",
                                                                    field.value === voiceKey && "bg-[#663820]"
                                                                )}>
                                                                    {field.value === voiceKey && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-[#663820]">{voice.name}</span>
                                                                    <span className="text-[10px] text-[#8B7355] leading-tight line-clamp-2">{voice.description}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {/* Female Voices */}
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium text-[#8B7355]">Female Voices</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {voiceCategories.female.map((voiceKey) => {
                                                    const voice = voiceOptions[voiceKey as keyof typeof voiceOptions]
                                                    return (
                                                        <div 
                                                            key={voiceKey}
                                                            className={cn(
                                                                "voice-selector-option",
                                                                field.value === voiceKey && "voice-selector-option-selected shadow-inner bg-[#fdfaf3]"
                                                            )}
                                                            onClick={() => field.onChange(voiceKey)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn(
                                                                    "w-4 h-4 rounded-full border border-[#663820] flex items-center justify-center",
                                                                    field.value === voiceKey && "bg-[#663820]"
                                                                )}>
                                                                    {field.value === voiceKey && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-[#663820]">{voice.name}</span>
                                                                    <span className="text-[10px] text-[#8B7355] leading-tight line-clamp-2">{voice.description}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <button type="submit" className="form-btn">
                        Begin Synthesis
                    </button>
                </form>
            </Form>
        </div>
    )
}
export default UploadForm
