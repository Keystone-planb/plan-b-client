// 인증 만료(토큰 정리) 시 앱 전역에 알려 로그인 화면으로 보내기 위한 간단한 이벤트 버스.
// axios 인터셉터(React 바깥)에서 emit하고, App에서 구독해 네비게이션을 처리한다.

type Listener = () => void;

let listeners: Listener[] = [];

export const onAuthExpired = (listener: Listener): (() => void) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((item) => item !== listener);
  };
};

export const emitAuthExpired = (): void => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // 리스너 오류는 무시 (다른 리스너 실행 보장)
    }
  });
};
