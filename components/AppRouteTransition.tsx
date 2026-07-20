"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type AppRouteTransitionContextValue = {
  isNavigating: boolean;
  startNavigation: () => void;
};

const AppRouteTransitionContext =
  createContext<AppRouteTransitionContextValue | null>(null);

/**
 * 앱 내부 라우트 전환 중 콘텐츠 영역에만 로딩 상태를 표시할 수 있도록 전역 전환 상태를 제공합니다.
 *
 * @param props - 전환 상태를 공유할 하위 앱 프레임입니다.
 * @param props.children - 네비게이션과 콘텐츠 영역입니다.
 * @returns 현재 URL 변경을 기준으로 자동 해제되는 라우트 전환 컨텍스트를 제공합니다.
 */
export function AppRouteTransitionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isNavigating, setIsNavigating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  const contextValue = useMemo(
    () => ({
      isNavigating,
      startNavigation: () => {
        setIsNavigating(true);

        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
          setIsNavigating(false);
        }, 1200);
      },
    }),
    [isNavigating],
  );

  return (
    <AppRouteTransitionContext.Provider value={contextValue}>
      {children}
    </AppRouteTransitionContext.Provider>
  );
}

/**
 * 앱 라우트 전환 상태를 읽거나 전환 시작을 알립니다.
 *
 * @returns 현재 전환 여부와 전환 시작 함수입니다.
 */
export function useAppRouteTransition() {
  const context = useContext(AppRouteTransitionContext);

  if (!context) {
    return {
      isNavigating: false,
      startNavigation: () => {},
    };
  }

  return context;
}
