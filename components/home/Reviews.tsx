"use client";

import { useEffect, useState } from "react";
import { StarIcon } from "../Icons";
import { useToast } from "../Providers";
import { friendlyError, getSupabase } from "@/lib/supabase";

type Review = { reviewer_name: string; rating: number; rider_name: string | null; comment: string | null; created_at: string };

function Stars({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} className={`${size} ${n <= Math.round(value) ? "text-[#e9a500]" : "text-[#e0d9c8]"}`} />
      ))}
    </span>
  );
}

function monthYear(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

export function Reviews() {
  const { show } = useToast();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [riders, setRiders] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [rider, setRider] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.rpc("get_reviews").then(({ data, error }) => setReviews(error ? [] : ((data ?? []) as Review[])));
    supabase.rpc("get_available_riders").then(({ data }) => {
      if (Array.isArray(data)) setRiders(data.map((r: { name: string }) => r.name).filter(Boolean));
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return show("Add your name");
    if (!rating) return show("Tap the stars to rate your ride");
    setBusy(true);
    const { error } = await getSupabase().rpc("submit_review", {
      p_name: name,
      p_rating: rating,
      p_rider: rider.trim() || null,
      p_comment: comment.trim() || null,
    });
    setBusy(false);
    if (error) return show(friendlyError(error));
    setSent(true);
    setName("");
    setRating(0);
    setRider("");
    setComment("");
  }

  const count = reviews?.length ?? 0;
  const average = count ? reviews!.reduce((sum, r) => sum + r.rating, 0) / count : 0;
  const shownRating = hover || rating;

  return (
    <section id="reviews" className="section border-t border-line" aria-labelledby="reviews-title">
      <div className="container-x grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <div>
          <p className="eyebrow">Reviews</p>
          <h2 id="reviews-title" className="section-title mt-3.5">What riders and visitors say</h2>

          {count > 0 && (
            <p className="mt-4 flex items-center gap-3 text-ink-soft">
              <Stars value={average} size="h-5 w-5" />
              <span>
                <strong className="text-ink">{average.toFixed(1)}</strong> from {count} review{count === 1 ? "" : "s"}
              </span>
            </p>
          )}

          {reviews === null ? (
            <p className="mt-8 text-ink-soft">Loading reviews…</p>
          ) : count === 0 ? (
            <div className="card mt-8 p-7 text-ink-soft">
              <p className="font-display text-xl font-bold text-ink">No reviews yet</p>
              <p className="mt-1.5 max-w-[420px] text-[0.93rem] leading-relaxed">
                Taken a ride with us? Be the first to tell others how it went. Your review appears after we check it.
              </p>
            </div>
          ) : (
            <ul className="mt-8 grid gap-4">
              {reviews.map((r, i) => (
                <li key={`${r.created_at}-${i}`} className="card p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Stars value={r.rating} />
                    <span className="text-xs text-muted">{monthYear(r.created_at)}</span>
                  </div>
                  {r.comment && <p className="mt-3 text-[0.97rem] leading-relaxed text-ink">&ldquo;{r.comment}&rdquo;</p>}
                  <p className="mt-3 text-sm text-ink-soft">
                    <strong className="text-ink">{r.reviewer_name}</strong>
                    {r.rider_name ? ` · rode with ${r.rider_name}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form onSubmit={submit} noValidate className="card h-fit self-start p-6 sm:p-8 lg:sticky lg:top-28" aria-label="Leave a review">
          {sent ? (
            <div className="grid gap-3 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-green text-paper">
                <StarIcon className="h-6 w-6" />
              </span>
              <h3 className="text-2xl font-bold tracking-tight">Thank you!</h3>
              <p className="text-[0.93rem] leading-relaxed text-ink-soft">We will check your review and show it here soon.</p>
              <button type="button" onClick={() => setSent(false)} className="btn btn-outline mx-auto mt-2">Write another</button>
            </div>
          ) : (
            <div className="grid gap-4">
              <div>
                <h3 className="text-2xl font-bold tracking-tight">Rate your ride</h3>
                <p className="mt-1 text-sm text-ink-soft">Tell us how your rider was.</p>
              </div>

              <div className="grid gap-1">
                <label htmlFor="rv-name" className="label">Your name</label>
                <input id="rv-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" className="input" />
              </div>

              <fieldset className="grid gap-1.5">
                <legend className="label mb-1">Your rating</legend>
                <div className="flex gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Star rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={rating === n}
                      aria-label={`${n} star${n === 1 ? "" : "s"}`}
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHover(n)}
                      className="rounded-lg p-1 transition hover:scale-110"
                    >
                      <StarIcon className={`h-9 w-9 ${n <= shownRating ? "text-[#e9a500]" : "text-[#e0d9c8]"}`} />
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-1">
                <label htmlFor="rv-rider" className="label">Rider&apos;s name (optional)</label>
                <input id="rv-rider" value={rider} onChange={(e) => setRider(e.target.value)} maxLength={60} list="rv-riders" placeholder="Who drove you?" className="input" autoComplete="off" />
                <datalist id="rv-riders">
                  {riders.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </div>

              <div className="grid gap-1">
                <label htmlFor="rv-comment" className="label">Your review (optional)</label>
                <textarea id="rv-comment" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={600} rows={4} className="input resize-y" placeholder="What did you like? What could be better?" />
              </div>

              <button type="submit" disabled={busy} className="btn btn-dark btn-block py-3.5">{busy ? "Sending…" : "Send review"}</button>
              <p className="text-center text-[0.76rem] text-muted">Reviews show on the site after we check them. Please leave out phone numbers and links.</p>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
