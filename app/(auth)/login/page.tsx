import { AppFrame } from "@/components/AppFrame";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <AppFrame title="로그인">
      <section className="flex flex-1 flex-col pt-6 sm:justify-center sm:pt-0">
        <LoginForm />
      </section>
    </AppFrame>
  );
}
