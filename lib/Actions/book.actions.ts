'use server';
import {CreateBook, TextSegment} from "@/types";
import {connectToDatabase} from "@/database/mongoose";
import {generateSlug, serializeData, escapeRegex} from "@/lib/utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";
import { searchBookSegmentsInternal } from "@/lib/Actions/search";
import {revalidatePath} from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { getUserPlanWithLimits } from "@/lib/subscription";

export const getAllBooks = async (query?: string) => {
    try {
        await connectToDatabase();

        let filter = {};
        if (query) {
            const regex = new RegExp(escapeRegex(query), 'i');
            filter = {
                $or: [
                    { title: { $regex: regex } },
                    { author: { $regex: regex } }
                ]
            };
        }

        const books = await Book.find(filter).sort({createdAt: -1}).lean();

        return{
            success: true,
            data: serializeData(books),
        }
    } catch (e) {
        console.error('Error fetching books ', e);
        return {
            success: false,
            error: e,
        }
    }
}

export const checkBookExists = async (title: string) => {
    try{
        await connectToDatabase();

        const slug = generateSlug(title);

        const existingBook = await Book.findOne({ slug }).lean();

        if(existingBook) {
            return {
                exists: true, book: serializeData(existingBook)
            }
        }
        return {
            exists: false,
        }
    } catch (e) {
        console.error('Error checking book existence ', e);
        return {
            exists: false,
            error: e,
        }
    }
}

export const createBook = async (data: CreateBook) => {
    try {
        await connectToDatabase();

        const slug = generateSlug(data.title);

        const existingBook = await Book.findOne({ slug }).lean();

        if(existingBook) {
            return {
                success: true,
                data: serializeData(existingBook),
                alreadyExists: true,
            }
        }

        // Check subscription limits before creating a book
        const { has } = await auth();
        const { limits } = getUserPlanWithLimits(has);

        const currentBookCount = await Book.countDocuments({ clerkId: data.clerkId });

        if (currentBookCount >= limits.maxBooks) {
            return {
                success: false,
                error: `Plan limit reached. Your ${limits.maxBooks === 1 ? 'Free' : 'Standard'} plan allows for up to ${limits.maxBooks} books. Please upgrade to ${limits.maxBooks === 1 ? 'Standard' : 'Pro'} for more.`,
            }
        }

        const book = await Book.create({...data, slug, totalSegments: 0});

        revalidatePath('/');

        return {
            success: true,
            data: serializeData(book),
        }
    } catch (e) {
        console.error('Error creating book ', e);
        return{
            success: false,
            error: e,
    }
    }

}

export const getBookBySlug = async (slug: string) => {
    try {
        await connectToDatabase();

        const book = await Book.findOne({ slug }).lean();

        if (!book) {
            return {
                success: false,
                error: 'Book not found',
            }
        }

        return {
            success: true,
            data: serializeData(book),
        }
    } catch (e) {
        console.error('Error fetching book by slug ', e);
        return {
            success: false,
            error: e,
        }
    }
}

export const saveBookSegments = async (bookId: string, clerkId: string, segments: TextSegment[]) => {
    try{
        await connectToDatabase();

        console.log('Saving book segments...');

        const segmentsToInsert = segments.map(({ text, segmentIndex, pageNumber, wordCount }) => ({
            clerkId, bookId, content: text, segmentIndex, pageNumber, wordCount,
        }));

        await BookSegment.insertMany(segmentsToInsert);

        await Book.findByIdAndUpdate(bookId, { totalSegments: segments.length });

        console.log('Book segments saved successfully.');

        return {
            success: true,
            data: {segmentsCreated: segments.length}
        }
    } catch (e) {
        console.error('Error saving book segments ', e);

        await BookSegment.deleteMany({ bookId });
        await Book.findByIdAndDelete(bookId);
        console.log('Book and segments deleted due to failure to save segments.');
        return {
            success: false,
            error: e,
        }
    }
}

export const searchBookSegments = async (bookId: string, query: string, limit: number = 3) => {
    return searchBookSegmentsInternal(bookId, query, limit);
}

export const getBookSegments = async (bookId: string) => {
    try {
        await connectToDatabase();

        const segments = await BookSegment.find({ bookId }).sort({ segmentIndex: 1 }).lean();

        return {
            success: true,
            data: serializeData(segments),
        }
    } catch (e) {
        console.error('Error fetching book segments ', e);
        return {
            success: false,
            error: e,
        }
    }
}

