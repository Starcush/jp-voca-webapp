import { redirect } from "next/navigation";
import { DEFAULT_LANGUAGE, isLanguage } from "@/lib/languages";

type ImportPhotoWordsPageProps = {
  searchParams: Promise<{
    lang?: string;
    notebookId?: string;
  }>;
};

/**
 * 기존 사진 선택 테스트 주소를 통합 가져오기의 사진 모드로 연결합니다.
 *
 * @param props - 기존 주소에 전달된 언어와 노트 query입니다.
 * @returns 이 페이지는 렌더링하지 않고 통합 가져오기 주소로 이동합니다.
 */
export default async function ImportPhotoWordsPage({
  searchParams,
}: ImportPhotoWordsPageProps) {
  const { lang, notebookId } = await searchParams;
  const params = new URLSearchParams({
    lang: isLanguage(lang) ? lang : DEFAULT_LANGUAGE,
    mode: "photo",
  });

  if (notebookId) {
    params.set("notebookId", notebookId);
  }

  redirect(`/words/import?${params.toString()}`);
}
