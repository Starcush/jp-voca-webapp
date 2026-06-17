type WordFormProps = {
  mode: "create" | "edit";
};

export function WordForm({ mode }: WordFormProps) {
  const isEdit = mode === "edit";

  return (
    <form className="flex flex-1 flex-col gap-4">
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-slate-700">한자 / 단어</span>
        <input
          className="min-h-12 rounded-lg border-slate-200 bg-white text-base"
          defaultValue={isEdit ? "食べる" : ""}
          placeholder="食べる"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-slate-700">후리가나</span>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            className="min-h-12 rounded-lg border-slate-200 bg-white text-base"
            defaultValue={isEdit ? "たべる" : ""}
            placeholder="たべる"
          />
          <button
            type="button"
            className="min-h-12 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white"
          >
            자동 생성
          </button>
        </div>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-slate-700">뜻</span>
        <input
          className="min-h-12 rounded-lg border-slate-200 bg-white text-base"
          defaultValue={isEdit ? "먹다" : ""}
          placeholder="먹다"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-slate-700">예문</span>
        <textarea
          className="min-h-28 rounded-lg border-slate-200 bg-white text-base leading-6"
          defaultValue={isEdit ? "朝ごはんを食べる。" : ""}
          placeholder="朝ごはんを食べる。"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-slate-700">예문 번역</span>
        <textarea
          className="min-h-24 rounded-lg border-slate-200 bg-white text-base leading-6"
          defaultValue={isEdit ? "아침밥을 먹다." : ""}
          placeholder="아침밥을 먹다."
        />
      </label>

      <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 pt-4">
        <button
          type="submit"
          className="min-h-12 rounded-lg bg-slate-950 px-4 text-base font-bold text-white"
        >
          저장
        </button>
        {isEdit ? (
          <button
            type="button"
            className="min-h-12 rounded-lg border border-red-200 px-4 text-base font-bold text-red-600"
          >
            삭제
          </button>
        ) : null}
      </div>
    </form>
  );
}

