import { z } from 'zod';
import { ACCEPTED_PDF_TYPES, MAX_FILE_SIZE } from './constants';

export const UploadSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100),
    author: z.string().min(1, 'Author Name is required').max(100),
    voice: z.string().min(1, 'Please select a voice'),
    pdf: z
        .custom<File>((val) => val instanceof File, 'PDF file is required')
        .refine((file) => file.size <= MAX_FILE_SIZE, `File size must be less than 50MB`)
        .refine((file) => ACCEPTED_PDF_TYPES.includes(file.type), 'Only PDF files are accepted'),
    cover: z
        .custom<File>((val) => val instanceof File)
        .optional()
        .refine((file) => !file || file.size <= 10 * 1024 * 1024, `Image size must be less than 10MB`),
});
