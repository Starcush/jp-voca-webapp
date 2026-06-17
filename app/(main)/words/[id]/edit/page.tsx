import Link from "next/link";
import { AppFrame } from "@/components/AppFrame";
import { WordForm } from "@/components/WordForm";

type EditWordPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditWordPage({ params }: EditWordPageProps) {
  const { id } = await params;

  return (
    <AppFrame
      title="단어 수정"
      eyebrow={id}
      action={
        <Link
          href="/words"
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600"
        >
          취소
        </Link>
      }
    >
      <WordForm mode="edit" />
    </AppFrame>
  );
}

