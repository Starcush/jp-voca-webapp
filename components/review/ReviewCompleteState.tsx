"use client";

import Link from "next/link";
import { CheckCircle2, HelpCircle, RotateCcw } from "lucide-react";
import { buildWordListHref } from "@/components/words/word-list-links";
import type { Language } from "@/types/language";

type ReviewCompleteStateProps = {
  hasNextReviewSet: boolean;
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
 * @param props.language - 단어장 링크에 사용할 언어 코드입니다.
 * @param props.languageLabel - 현재 복습 언어의 표시 이름입니다.
 * @param props.notebookId - 단어장 링크에 유지할 노트 ID입니다.
 * @param props.onRestart - 다음 세트 또는 재시작 버튼을 눌렀을 때 호출되는 콜백입니다.
 * @returns 복습 완료 통계와 다음 액션 버튼을 렌더링합니다.
 */
export function ReviewCompleteState({
  hasNextReviewSet,
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
    <section className="flex flex-1 flex-col justify-center gap-5 pb-20 text-center md:pb-0">
      <div>
        <p className="text-2xl font-black tracking-normal text-brand-text">
          복습 완료
        </p>
        <p className="mt-2 text-sm font-medium leading-6 text-brand-muted">
          이번 세트에서 {languageLabel} 단어 {reviewWordCount}개를 확인했습니다.
        </p>
        <p className="mt-1 text-sm font-medium leading-6 text-brand-muted">
          {hasNextReviewSet
            ? `아직 ${remainingReviewCount}개가 더 남아 있어요.`
            : "현재 불러온 복습 세트를 모두 확인했습니다."}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-primary-border bg-white p-4 shadow-[0_2px_10px_rgba(36,28,61,0.05)]">
          <p className="inline-flex items-center justify-center gap-1 text-xs font-bold text-primary-text">
            <CheckCircle2 aria-hidden className="size-4" strokeWidth={2.2} />
            알았어요
          </p>
          <p className="mt-1 text-2xl font-black text-brand-text">{knownCount}</p>
        </div>
        <div className="rounded-xl border border-brand-border bg-white p-4 shadow-[0_2px_10px_rgba(36,28,61,0.05)]">
          <p className="inline-flex items-center justify-center gap-1 text-xs font-bold text-brand-muted">
            <HelpCircle aria-hidden className="size-4" strokeWidth={2.2} />
            모르겠어요
          </p>
          <p className="mt-1 text-2xl font-black text-brand-text">
            {unknownCount}
          </p>
        </div>
      </div>
      <div className="grid gap-2">
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-base font-black text-white shadow-sm"
          onClick={onRestart}
          type="button"
        >
          <RotateCcw aria-hidden className="size-5" strokeWidth={2.2} />
          {hasNextReviewSet ? "다음 20개 복습" : "한 번 더 복습"}
        </button>
        <Link
          className="min-h-12 rounded-lg border border-brand-border bg-white px-4 py-3 text-base font-bold text-brand-text shadow-sm"
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
