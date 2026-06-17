import Link from "next/link";
import { AppFrame } from "@/components/AppFrame";
import { AuthStatus } from "@/components/AuthStatus";
import { RequireSession } from "@/components/RequireSession";
import { WordCard, type WordCardData } from "@/components/WordCard";

const viewTabs = ["전체 보기", "한자 가리기", "뜻 가리기", "예문 가리기"];
const filters = ["전체", "모르는 것만", "오래 안 본 것"];

const previewWords: WordCardData[] = [
  {
    id: "taberu",
    kanji: "食べる",
    yomikataFurigana: "たべる",
    meaning: "먹다",
    exampleSentence: "朝ごはんを食べる。",
    exampleTranslation: "아침밥을 먹다.",
    status: "unknown",
    lastSeenLabel: "아직 확인 전",
  },
  {
    id: "hashiru",
    kanji: "走る",
    yomikataFurigana: "はしる",
    meaning: "달리다",
    exampleSentence: "公園で走る。",
    exampleTranslation: "공원에서 달리다.",
    status: "known",
    lastSeenLabel: "마지막 확인 2일 전",
  },
];

export default function WordsPage() {
  return (
    <AppFrame
      title="단어장"
      action={<AuthStatus />}
    >
      <RequireSession>
        <section className="sticky top-0 z-10 -mx-4 border-y border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {viewTabs.map((tab, index) => (
              <button
                key={tab}
                className={`min-h-10 shrink-0 rounded-md px-3 text-sm font-bold ${
                  index === 0
                    ? "bg-slate-950 text-white"
                    : "border border-slate-200 bg-white text-slate-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2">
            {filters.map((filter, index) => (
              <button
                key={filter}
                className={`min-h-10 rounded-md text-sm font-semibold ${
                  index === 0
                    ? "bg-blue-50 text-blue-700"
                    : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <label className="mt-3 block">
            <span className="sr-only">단어 검색</span>
            <input
              className="min-h-11 w-full rounded-lg border-slate-200 bg-white text-base"
              placeholder="한자, 뜻, 예문 검색"
            />
          </label>
        </section>

        <section className="grid gap-3 py-4">
          {previewWords.map((word) => (
            <WordCard key={word.id} word={word} />
          ))}
        </section>

        <div className="pb-24">
          <button className="min-h-12 w-full rounded-lg border border-slate-200 bg-white text-base font-bold text-slate-700">
            더 보기
          </button>
        </div>

        <Link
          href="/words/new"
          className="fixed bottom-5 right-5 grid h-14 w-14 place-items-center rounded-full bg-slate-950 text-3xl font-light leading-none text-white shadow-lg"
          aria-label="단어 추가"
        >
          +
        </Link>
      </RequireSession>
    </AppFrame>
  );
}
