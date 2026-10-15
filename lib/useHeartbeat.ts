import { useEffect, useRef } from "react";

/**
 * Hook для автоматического обновления статуса онлайн пользователя
 * Отправляет heartbeat каждые 2 минуты
 */
export function useHeartbeat() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        await fetch("/api/users/heartbeat", {
          method: "POST",
          credentials: "include",
        });
      } catch (error) {
        // Игнорируем ошибки heartbeat, чтобы не мешать работе приложения
        console.debug("[Heartbeat] Failed to send:", error);
      }
    };

    // Отправляем первый heartbeat сразу
    sendHeartbeat();

    // Устанавливаем интервал 2 минуты (120000 мс)
    intervalRef.current = setInterval(sendHeartbeat, 120000);

    // Также отправляем heartbeat при активности пользователя
    const handleActivity = () => {
      sendHeartbeat();
    };

    // Throttle функция для ограничения частоты вызовов
    let lastActivityTime = 0;
    const throttledActivity = () => {
      const now = Date.now();
      if (now - lastActivityTime > 60000) { // Не чаще раза в минуту
        lastActivityTime = now;
        handleActivity();
      }
    };

    window.addEventListener("click", throttledActivity);
    window.addEventListener("keydown", throttledActivity);
    window.addEventListener("scroll", throttledActivity);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener("click", throttledActivity);
      window.removeEventListener("keydown", throttledActivity);
      window.removeEventListener("scroll", throttledActivity);
    };
  }, []);
}
