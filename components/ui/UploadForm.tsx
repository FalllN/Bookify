'use client'

import React, { useState, useRef } from 'react'
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
import { Label } from '@/components/ui/label'
import { Upload, ImageIcon, X, CheckCircle2 } from 'lucide-react'
import { voiceOptions, voiceCategories } from '@/lib/constants'
import LoadingOverlay from './LoadingOverlay'
import { cn } from '@/lib/utils'

type FormValues = z.infer<typeof UploadSchema>

const UploadForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const pdfInputRef = useRef<HTMLInputElement>(null)
    const coverInputRef = useRef<HTMLInputElement>(null)

    const form = useForm<FormValues>({
        resolver: zodResolver(UploadSchema),
        defaultValues: {
            title: '',
            author: '',
            voice: 'rachel',
        }
    })

    const onSubmit = async (values: FormValues) => {
        setIsSubmitting(true)
        console.log('Form Values:', values)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 3000))
        setIsSubmitting(false)
    }

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
                        name="pdf"
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
                        name="cover"
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
                        name="voice"
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
