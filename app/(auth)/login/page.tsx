import { AppFrame } from "@/components/AppFrame";

export default function LoginPage() {
  return (
    <AppFrame title="로그인">
      <section className="flex flex-1 flex-col justify-center">
        <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-lg font-bold text-slate-950">username으로 입장</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              같은 username을 쓰면 같은 단어장으로 들어갑니다.
            </p>
          </div>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">username</span>
            <input
              className="min-h-12 rounded-lg border-slate-200 bg-white text-base"
              placeholder="starcush"
            />
          </label>
          <button className="min-h-12 rounded-lg bg-slate-950 text-base font-bold text-white">
            입장하기
          </button>
        </form>
      </section>
    </AppFrame>
  );
}

