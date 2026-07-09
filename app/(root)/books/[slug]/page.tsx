import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getBookBySlug } from '@/lib/Actions/book.actions';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Mic, MicOff } from 'lucide-react';
import VapiControls from "@/components/VapiControls";

export default async function BookDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  const { slug } = await params;
  const result = await getBookBySlug(slug);

  if (!result.success || !result.data) {
    redirect('/');
  }

  const book = result.data;

  return (
    <main className="book-page-container">
      <Link href="/" className="back-btn-floating">
        <ArrowLeft className="size-6 text-black" />
      </Link>

        <VapiControls book={book}/>

    </main>
  );
}
