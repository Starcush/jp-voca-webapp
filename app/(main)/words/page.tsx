import Link from "next/link";
import { AppFrame } from "@/components/AppFrame";
import { AuthStatus } from "@/components/AuthStatus";
import { RequireSession } from "@/components/RequireSession";
import { WordList } from "@/components/WordList";

const viewTabs = ["전체 보기", "한자 가리기", "뜻 가리기", "예문 가리기"];
const filters = ["전체", "모르는 것만", "오래 안 본 것"];

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

        <WordList />

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
