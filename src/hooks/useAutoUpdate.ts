import { useEffect, useRef } from "react";

/**
 * Автообновление PWA / иконки на главном экране.
 * Периодически запрашивает свежий index.html и сравнивает хэш бандла.
 * Если на сервере вышла новая версия — мягко перезагружает страницу.
 */
export function useAutoUpdate(intervalMs: number = 60_000) {
  const currentHashRef = useRef<string | null>(null);
  const reloadingRef = useRef(false);

  useEffect(() => {
    // Текущий хэш JS-бандла (Vite кладёт его в имя файла: /assets/index-XXXX.js)
    const getCurrentHash = (): string | null => {
      const scripts = Array.from(document.querySelectorAll("script[src]")) as HTMLScriptElement[];
      for (const s of scripts) {
        const m = s.src.match(/\/assets\/[^/]+\.js/);
        if (m) return m[0];
      }
      return null;
    };

    currentHashRef.current = getCurrentHash();

    const check = async () => {
      if (reloadingRef.current) return;
      try {
        const res = await fetch(`/?_=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (!res.ok) return;
        const html = await res.text();
        const m = html.match(/\/assets\/[^"'/]+\.js/);
        if (!m) return;
        const remote = m[0];
        const current = currentHashRef.current;
        if (current && remote !== current) {
          reloadingRef.current = true;
          // Мягкая перезагрузка — забираем свежий HTML
          window.location.reload();
        }
      } catch {
        // молча игнорируем (offline и т.п.)
      }
    };

    // Сразу проверяем при монтировании
    check();

    const interval = setInterval(check, intervalMs);

    // И при возврате во вкладку / разблокировке телефона
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
    };
  }, [intervalMs]);
}