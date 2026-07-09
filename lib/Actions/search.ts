import { connectToDatabase } from "@/database/mongoose";
import BookSegment from "@/database/models/book-segment.model";
import { serializeData } from "@/lib/utils";
import { Types } from 'mongoose';

export const searchBookSegmentsInternal = async (bookId: string, query: string, limit: number = 3) => {
    try {
        await connectToDatabase();

        console.log(`Searching book segments for bookId: ${bookId}, query: ${query}`);

        // Ensure bookId is a valid ObjectId before querying
        const filter: any = { $text: { $search: query } };
        
        if (Types.ObjectId.isValid(bookId)) {
            filter.bookId = new Types.ObjectId(bookId);
        } else {
            console.warn(`Provided bookId "${bookId}" is not a valid ObjectId. Searching with string value.`);
            filter.bookId = bookId;
        }

        const segments = await BookSegment.find(
            filter,
            { score: { $meta: "textScore" } }
        )
            .sort({ score: { $meta: "textScore" } })
            .limit(limit)
            .lean();

        console.log(`Found ${segments.length} segments`);

        return {
            success: true,
            data: serializeData(segments),
        }
    } catch (e) {
        console.error('Error in searchBookSegmentsInternal: ', e);
        return {
            success: false,
            error: e instanceof Error ? e.message : String(e),
        }
    }
}
