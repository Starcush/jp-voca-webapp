import { AppFrame } from "@/components/AppFrame";
import { OcrPhotoImportForm } from "@/components/ocr/OcrPhotoImportForm";
import { RequireSession } from "@/components/RequireSession";
import { DEFAULT_LANGUAGE, isLanguage } from "@/lib/languages";

type ImportPhotoWordsPageProps = {
  searchParams: Promise<{
    lang?: string;
    notebookId?: string;
  }>;
};

/**
 * 사진 위 OCR 영역을 직접 선택하는 실험형 가져오기 페이지입니다.
 *
 * @param props - URL search param으로 전달되는 언어와 노트입니다.
 * @param props.searchParams - 현재 언어와 저장 노트 query입니다.
 * @returns 사진 위 선택 기반 OCR 가져오기 화면을 렌더링합니다.
 */
export default async function ImportPhotoWordsPage({
  searchParams,
}: ImportPhotoWordsPageProps) {
  const { lang, notebookId } = await searchParams;
  const selectedLanguage = isLanguage(lang) ? lang : DEFAULT_LANGUAGE;

  return (
    <AppFrame title="사진에서 고르기" language={selectedLanguage}>
      <RequireSession>
        <OcrPhotoImportForm
          key={`${selectedLanguage}:${notebookId ?? "unfiled"}`}
          language={selectedLanguage}
          notebookId={notebookId}
        />
      </RequireSession>
    </AppFrame>
  );
}
