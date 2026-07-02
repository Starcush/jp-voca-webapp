"use client";

import Link from "next/link";
import { buildWordListHref } from "@/components/words/word-list-links";
import type { Language } from "@/types/language";

type ReviewCompleteStateProps = {
  hasNextReviewSet: boolean;
  isRandomMode: boolean;
  knownCount: number;
  language: Language;
  languageLabel: string;
  notebookId?: string;
  onRestart: () => void;
  remainingReviewCount: number;
  reviewWordCount: number;
  unknownCount: number;
};

/**
 * 한 복습 세트를 모두 끝냈을 때의 완료 화면을 렌더링합니다.
 *
 * @param props - 완료 화면에 필요한 통계와 다음 액션 정보입니다.
 * @param props.reviewWordCount - 이번 세트에서 확인한 단어 개수입니다.
 * @param props.knownCount - 알았어요로 기록한 개수입니다.
 * @param props.unknownCount - 모르겠어요로 기록한 개수입니다.
 * @param props.remainingReviewCount - 아직 남아 있는 후보 단어 개수입니다.
 * @param props.hasNextReviewSet - 다음 20개 세트가 있는지 여부입니다.
 * @param props.isRandomMode - 현재 복습 모드가 전체 섞기인지 여부입니다.
 * @param props.language - 단어장 링크에 사용할 언어 코드입니다.
 * @param props.languageLabel - 현재 복습 언어의 표시 이름입니다.
 * @param props.notebookId - 단어장 링크에 유지할 노트 ID입니다.
 * @param props.onRestart - 다음 세트 또는 재시작 버튼을 눌렀을 때 호출되는 콜백입니다.
 * @returns 복습 완료 통계와 다음 액션 버튼을 렌더링합니다.
 */
export function ReviewCompleteState({
  hasNextReviewSet,
  isRandomMode,
  knownCount,
  language,
  languageLabel,
  notebookId,
  onRestart,
  remainingReviewCount,
  reviewWordCount,
  unknownCount,
}: ReviewCompleteStateProps) {
  return (
    <section className="flex flex-1 flex-col justify-center gap-5 text-center">
      <div>
        <p className="text-2xl font-bold tracking-normal text-slate-950">
          복습 완료
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          이번 세트에서 {languageLabel} 단어 {reviewWordCount}개를 확인했습니다.
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          {isRandomMode
            ? "전체 섞기는 다시 시작할 때마다 새로 섞입니다."
            : hasNextReviewSet
              ? `아직 ${remainingReviewCount}개가 더 남아 있어요.`
              : "현재 불러온 복습 세트를 모두 확인했습니다."}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-500">알았어요</p>
          <p className="mt-1 text-2xl font-bold text-green-700">{knownCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-500">모르겠어요</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{unknownCount}</p>
        </div>
      </div>
      <div className="grid gap-2">
        <button
          className="min-h-12 rounded-lg bg-slate-950 text-base font-bold text-white"
          onClick={onRestart}
          type="button"
        >
          {isRandomMode
            ? "다시 섞어서 복습"
            : hasNextReviewSet
              ? "다음 20개 복습"
              : "한 번 더 복습"}
        </button>
        <Link
          className="min-h-12 rounded-lg border border-slate-200 bg-white px-4 py-3 text-base font-bold text-slate-700"
          href={buildWordListHref({
            language,
            notebookId,
            path: "/words",
          })}
        >
          단어장으로
        </Link>
      </div>
    </section>
  );
}
