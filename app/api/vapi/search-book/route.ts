import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { searchBookSegmentsInternal } from '@/lib/Actions/search';

// Helper function to process book search logic
async function processBookSearch(bookId: unknown, query: unknown) {
    console.log(`Processing search - bookId: ${bookId}, query: ${query}`);
    
    // Validate inputs before conversion to prevent null/undefined becoming "null"/"undefined" strings
    if (bookId == null || query == null || query === '') {
        console.warn('Missing bookId or query in processBookSearch');
        return { result: 'Missing bookId or query' };
    }

    // Convert bookId to string
    const bookIdStr = String(bookId);
    const queryStr = String(query).trim();

    // Additional validation after conversion
    if (!bookIdStr || bookIdStr === 'null' || bookIdStr === 'undefined' || !queryStr) {
        console.warn(`Invalid bookId or query after conversion: bookIdStr="${bookIdStr}", queryStr="${queryStr}"`);
        return { result: 'Missing bookId or query' };
    }

    // Execute search
    try {
        const searchResult = await searchBookSegmentsInternal(bookIdStr, queryStr, 3);

        // Return results
        if (!searchResult.success) {
            console.error('Search failed:', searchResult.error);
            return { result: `Error searching book: ${searchResult.error}` };
        }

        if (!searchResult.data?.length) {
            console.info('No segments found for query');
            return { result: 'No information found about this topic in the book.' };
        }

        const combinedText = searchResult.data
            .map((segment) => (segment as { content: string }).content)
            .join('\n\n');

        console.log(`Combined text length: ${combinedText.length}`);
        return { result: combinedText };
    } catch (e) {
        console.error('Unexpected error in processBookSearch:', e);
        return { result: 'An unexpected error occurred during search.' };
    }
}

export async function GET() {
    return NextResponse.json({ status: 'ok' });
}

// Parse tool arguments that may arrive as a JSON string or an object
function parseArgs(args: unknown): Record<string, unknown> {
    if (!args) return {};
    if (typeof args === 'string') {
        try { return JSON.parse(args); } catch { return {}; }
    }
    return args as Record<string, unknown>;
}

export async function POST(request: Request) {
    console.log('--- Vapi search-book POST start ---');
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error('ERROR: MONGODB_URI is not defined in process.env');
            return NextResponse.json({
                results: [{ result: 'Database configuration missing on server.' }]
            }, { status: 500 });
        }
        console.log('MONGODB_URI is present (obfuscated):', uri.substring(0, 20) + '...');

        let body;
        try {
            body = await request.json();
        } catch (e) {
            console.error('Failed to parse request JSON:', e);
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        console.log('Vapi Request Body:', JSON.stringify(body, null, 2));

        // Support multiple Vapi formats
        const functionCall = body?.message?.functionCall;
        const toolCallList = body?.message?.toolCallList || body?.message?.toolCalls;

        // Handle single functionCall format
        if (functionCall) {
            const { name, parameters } = functionCall;
            const parsed = parseArgs(parameters);
            console.log(`Handling single functionCall: ${name}`, parsed);

            if (name === 'searchBook' || name === 'search_book') {
                const result = await processBookSearch(parsed.bookId, parsed.query);
                return NextResponse.json(result);
            }

            return NextResponse.json({ result: `Unknown function: ${name}` });
        }

        // Handle toolCallList format (array of calls)
        if (!toolCallList || toolCallList.length === 0) {
            console.info('No tool calls or function calls found in message');
            return NextResponse.json({
                results: [{ result: 'No tool calls found in the request.' }],
            });
        }

        const results = [];

        for (const toolCall of toolCallList) {
            if (!toolCall || typeof toolCall !== 'object') {
                console.warn('Skipping invalid toolCall:', toolCall);
                continue;
            }
            const { id, function: func } = toolCall;
            const name = func?.name;
            const args = parseArgs(func?.arguments);
            console.log(`Processing tool call: ${name} (id: ${id})`, args);

            if (!id) {
                console.warn('toolCallId is missing for toolCall:', toolCall);
            }

            if (name === 'searchBook' || name === 'search_book') {
                const searchResult = await processBookSearch(args.bookId, args.query);
                results.push({ toolCallId: id, ...searchResult });
            } else {
                console.warn(`Unknown tool function: ${name}`);
                results.push({ toolCallId: id, result: `Unknown function: ${name}` });
            }
        }

        console.log('Returning results:', JSON.stringify({ results }, null, 2));
        return NextResponse.json({ results });
    } catch (error) {
        console.error('Unhandled error in Vapi search-book route:', error);
        return NextResponse.json({
            results: [{ result: 'Internal server error occurred while processing the request.' }],
        }, { status: 500 });
    }
}
