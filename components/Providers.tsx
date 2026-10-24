"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

/* Toast ------------------------------------------------------------------ */

type ToastApi = { show: (message: string) => void };
const ToastContext = createContext<ToastApi>({ show: () => {} });
export const useToast = () => useContext(ToastContext);

/* Booking intent: lets ride cards pre-fill the booking form ------------- */

export type BookingIntent = { trip: string; dropoff?: string; nonce: number };
type BookingApi = { intent: BookingIntent | null; openBooking: (trip: string, dropoff?: string) => void };
const BookingContext = createContext<BookingApi>({ intent: null, openBooking: () => {} });
export const useBooking = () => useContext(BookingContext);

export function Providers({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [intent, setIntent] = useState<BookingIntent | null>(null);

  const show = useCallback((text: string) => {
    setMessage(text);
    setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), 4200);
  }, []);

  const openBooking = useCallback((trip: string, dropoff?: string) => {
    setIntent({ trip, dropoff, nonce: Date.now() });
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const toast = useMemo(() => ({ show }), [show]);
  const booking = useMemo(() => ({ intent, openBooking }), [intent, openBooking]);

  return (
    <ToastContext.Provider value={toast}>
      <BookingContext.Provider value={booking}>
        {children}
        <div
          role="status"
          aria-live="polite"
          className={`pointer-events-none fixed bottom-6 left-1/2 z-[200] max-w-[min(440px,calc(100vw-2rem))] -translate-x-1/2 rounded-full border border-white/10 bg-ink px-5 py-3 text-center text-sm font-medium text-cream shadow-2xl transition duration-300 ${
            visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {message}
        </div>
      </BookingContext.Provider>
    </ToastContext.Provider>
  );
}
