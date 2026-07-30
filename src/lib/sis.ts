/**
 * Base URL for the SIS API, always with a trailing slash (e.g. `https://hfse-sis.vercel.app/`).
 *
 * Dev points at a locally-running SIS so server-side changes are visible without deploying;
 * prod — and `vite preview`, which sets PROD — uses `VITE_SIS_URL`.
 *
 * Every SIS caller resolves the base from here so they cannot disagree. They previously did:
 * `use-report-card` always used `VITE_SIS_URL` while `use-parent-report-cards` used localhost in
 * dev, so the term list came from the local SIS while the card itself came from the deployed one —
 * the list looked current while the payload was stale.
 */
export const SIS_BASE =
  (import.meta.env.PROD ? (import.meta.env.VITE_SIS_URL as string) : "http://localhost:3000/").replace(/\/$/, "") + "/";
