import Link from "next/link";
import { AppFrame } from "@/components/AppFrame";
import { RequireSession } from "@/components/RequireSession";
import { DEFAULT_LANGUAGE, isLanguage } from "@/lib/languages";

type OrganizeNotebooksPageProps = {
  searchParams: Promise<{
    lang?: string;
  }>;
};

export default async function OrganizeNotebooksPage({
  searchParams,
}: OrganizeNotebooksPageProps) {
  const { lang } = await searchParams;
  const selectedLanguage = isLanguage(lang) ? lang : DEFAULT_LANGUAGE;

  return (
    <AppFrame title="노트 관리" language={selectedLanguage}>
      <RequireSession>
        <section className="grid gap-4 rounded-xl border border-brand-border bg-white p-5 shadow-[0_1px_3px_rgba(25,25,25,0.06)]">
          <div>
            <p className="text-lg font-bold text-brand-text">
              노트 관리 화면을 준비 중입니다
            </p>
            <p className="mt-2 text-sm font-medium leading-6 text-brand-muted">
              다음 단계에서 노트 생성, 이름 수정, 삭제 기능을 이 화면에 붙일 예정입니다.
            </p>
          </div>
          <Link
            className="grid min-h-11 place-items-center rounded-lg border border-brand-border bg-white px-4 text-sm font-bold text-brand-text"
            href={`/words/organize?lang=${selectedLanguage}`}
          >
            정리 메뉴로 돌아가기
          </Link>
        </section>
      </RequireSession>
    </AppFrame>
  );
}
