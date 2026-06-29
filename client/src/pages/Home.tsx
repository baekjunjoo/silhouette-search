/**
 * Design: SpaceX.com — Pure black, condensed uppercase type, outline buttons
 * Features:
 *  1. Hero shrinks to compact bar when search is active
 *  2. Icon size slider in results header
 *  3. Korean → English auto-translation
 *  4. "FIND ANY SILHOUETTE" on one line, smaller
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const ICONIFY_API = "https://api.iconify.design";

const EXCLUDED_SETS = new Set([
  "noto", "noto-v1", "twemoji", "openmoji", "fluent-emoji-flat",
  "fluent-emoji-high-contrast", "emojione", "emojione-monotone",
  "emojione-v1", "fxemoji", "streamline-emojis", "pinhead",
  "streamline-cyber-color", "streamline-ultimate-color",
  "material-icon-theme", "vscode-icons", "logos",
]);

const PREFERRED_SETS = [
  "ph", "mingcute", "solar", "game-icons", "mdi",
  "icon-park-solid", "boxicons", "lucide", "tabler",
  "carbon", "heroicons", "ri", "bi",
];

interface IconResult {
  id: string;
  prefix: string;
  name: string;
  svgUrl: string;
  label: string;
}

function toLabel(name: string): string {
  return name.replace(/-fill$|-bold$|-solid$|-filled$/, "").replace(/-/g, " ").trim();
}

function isSolidStyle(iconId: string): boolean {
  const lower = iconId.toLowerCase();
  return (
    lower.includes("-fill") || lower.includes("-bold") ||
    lower.includes("-solid") || lower.includes("-filled") ||
    lower.startsWith("game-icons:") || lower.startsWith("mingcute:") ||
    lower.startsWith("icon-park-solid:")
  );
}

function filterAndSort(icons: string[]): string[] {
  const filtered = icons.filter((id) => !EXCLUDED_SETS.has(id.split(":")[0]));
  const solid = filtered.filter(isSolidStyle);
  const rest = filtered.filter((i) => !isSolidStyle(i));
  const sortBySet = (arr: string[]) =>
    [...arr].sort((a, b) => {
      const ai = PREFERRED_SETS.indexOf(a.split(":")[0]);
      const bi = PREFERRED_SETS.indexOf(b.split(":")[0]);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  return [...sortBySet(solid), ...sortBySet(rest)];
}

// Detect Korean characters
function isKorean(text: string): boolean {
  return /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/.test(text);
}

// Translate Korean → English via Google Translate unofficial endpoint
async function translateToEnglish(text: string): Promise<string> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    const translated: string = data?.[0]?.[0]?.[0] ?? text;
    return translated.toLowerCase().trim();
  } catch {
    return text;
  }
}

async function searchIcons(query: string): Promise<{ results: IconResult[]; translatedQuery: string | null }> {
  if (!query.trim()) return { results: [], translatedQuery: null };

  let searchQuery = query.trim();
  let translatedQuery: string | null = null;

  if (isKorean(searchQuery)) {
    const translated = await translateToEnglish(searchQuery);
    if (translated && translated !== searchQuery) {
      translatedQuery = translated;
      searchQuery = translated;
    }
  }

  const url = `${ICONIFY_API}/search?query=${encodeURIComponent(searchQuery)}&limit=64`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("검색 실패");
  const data = await res.json();
  const icons: string[] = data.icons || [];
  const sorted = filterAndSort(icons).slice(0, 32);
  const results = sorted.map((id) => {
    const [prefix, ...rest] = id.split(":");
    const name = rest.join(":");
    return {
      id, prefix, name,
      svgUrl: `${ICONIFY_API}/${prefix}/${name}.svg?color=%23ffffff`,
      label: toLabel(name),
    };
  });
  return { results, translatedQuery };
}

async function downloadSvg(icon: IconResult) {
  try {
    const blackUrl = `${ICONIFY_API}/${icon.prefix}/${icon.name}.svg?color=%23000000`;
    const res = await fetch(blackUrl);
    const text = await res.text();
    const blob = new Blob([text], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${icon.name}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${icon.label} downloaded`);
  } catch {
    toast.error("Download failed");
  }
}

function sanitizeSvg(raw: string): string {
  return raw
    .replace(/\s+width="[^"]*"/g, "")
    .replace(/\s+height="[^"]*"/g, "")
    .replace(/\s+width='[^']*'/g, "")
    .replace(/\s+height='[^']*'/g, "");
}

function SpaceXLogo() {
  return (
    <svg viewBox="0 0 200 28" fill="none" xmlns="http://www.w3.org/2000/svg"
      aria-label="Silhouette Search" style={{ height: "18px", width: "auto" }}>
      <text x="0" y="22" fill="white"
        fontFamily="'Barlow Condensed', 'Arial Narrow', sans-serif"
        fontSize="26" fontWeight="700" letterSpacing="2">
        SILHOUETTE
      </text>
    </svg>
  );
}

function LoadingGrid({ cardSize }: { cardSize: number }) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${cardSize}px, 1fr))`,
        gap: "1px",
        background: "rgba(255,255,255,0.05)",
      }}
    >
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            aspectRatio: "1",
            background: "#0a0a0a",
            animationDelay: `${i * 40}ms`,
          }}
        />
      ))}
    </div>
  );
}

interface IconCardProps {
  icon: IconResult;
  index: number;
  cardSize: number;
}

function IconCard({ icon, index, cardSize }: IconCardProps) {
  const [hovered, setHovered] = useState(false);
  const [svgContent, setSvgContent] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(icon.svgUrl)
      .then((r) => r.text())
      .then((text) => { if (!cancelled) { setSvgContent(sanitizeSvg(text)); setLoaded(true); } })
      .catch(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [icon.svgUrl]);

  const padding = Math.max(8, cardSize * 0.15);

  return (
    <button
      className="card-animate relative flex flex-col items-center justify-center transition-all duration-200 focus-visible:outline-1 focus-visible:outline-white overflow-hidden"
      style={{
        aspectRatio: "1",
        padding: `${padding}px`,
        background: hovered ? "rgba(255,255,255,0.06)" : "#000",
        border: "1px solid",
        borderColor: hovered ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)",
        animationDelay: `${Math.min(index, 12) * 30}ms`,
        transform: hovered ? "scale(1.02)" : "scale(1)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => downloadSvg(icon)}
      title={`${icon.label} — Download SVG`}
      aria-label={`${icon.label} icon download`}
    >
      <div className="w-full flex-1 flex items-center justify-center" style={{ minHeight: 0 }}>
        {loaded && svgContent ? (
          <div
            className="flex items-center justify-center"
            style={{ width: "65%", height: "65%" }}
            dangerouslySetInnerHTML={{
              __html: svgContent.replace("<svg", '<svg style="width:100%;height:100%;display:block;"'),
            }}
          />
        ) : (
          <div className="w-[65%] h-[65%] animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
        )}
      </div>

      {/* Label on hover */}
      <div
        className="absolute inset-x-0 bottom-0 px-1.5 py-1 text-center transition-opacity duration-200"
        style={{
          opacity: hovered ? 1 : 0,
          background: "rgba(0,0,0,0.85)",
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <span
          className="block truncate uppercase"
          style={{
            fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif",
            fontSize: `${Math.max(8, cardSize * 0.09)}px`,
            letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.8)",
          }}
        >
          {icon.label}
        </span>
      </div>
    </button>
  );
}

const SUGGESTIONS = ["cat", "rocket", "bird", "tree", "car", "star", "moon", "fire"];

export default function Home() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<IconResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [focused, setFocused] = useState(false);
  const [translatedQuery, setTranslatedQuery] = useState<string | null>(null);
  const [cardSize, setCardSize] = useState(120);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) { setDebouncedQuery(""); return; }
    timerRef.current = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  // Search
  useEffect(() => {
    if (!debouncedQuery) { setResults([]); setSearched(false); setTranslatedQuery(null); return; }
    let cancelled = false;
    setLoading(true);
    setSearched(true);
    searchIcons(debouncedQuery)
      .then(({ results: res, translatedQuery: tq }) => {
        if (!cancelled) {
          setResults(res);
          setTranslatedQuery(tq);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) { toast.error("Search failed"); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const handleSuggestion = useCallback((s: string) => {
    setQuery(s);
    inputRef.current?.focus();
  }, []);

  const handleClear = useCallback(() => {
    setQuery("");
    setResults([]);
    setSearched(false);
    setTranslatedQuery(null);
    inputRef.current?.focus();
  }, []);

  const isEmpty = searched && !loading && results.length === 0;
  const isActive = searched || query.length > 0; // hero shrinks when typing

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#000", color: "#fff", fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif" }}
    >
      {/* ── NAV ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10"
        style={{
          height: "56px",
          background: "rgba(0,0,0,0.9)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex items-center gap-3">
          <SpaceXLogo />
          <span style={{
            fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif",
            fontSize: "11px", letterSpacing: "0.18em",
            color: "rgba(255,255,255,0.4)", textTransform: "uppercase",
            paddingLeft: "12px", borderLeft: "1px solid rgba(255,255,255,0.2)",
          }}>
            SEARCH
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          {["SILHOUETTES", "ICONS", "SVG"].map((item) => (
            <span key={item} style={{
              fontSize: "11px", letterSpacing: "0.14em",
              color: "rgba(255,255,255,0.35)", textTransform: "uppercase", cursor: "default",
            }}>
              {item}
            </span>
          ))}
        </div>
      </nav>

      {/* ── HERO — shrinks when active ── */}
      <section
        className="relative flex flex-col items-center justify-center"
        style={{
          paddingTop: "56px",
          minHeight: isActive ? "auto" : "100vh",
          height: isActive ? "auto" : undefined,
          paddingBottom: isActive ? "0" : undefined,
          transition: "min-height 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
          background: "#000",
          overflow: "hidden",
        }}
      >
        {/* Background grid — fades out when active */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
            opacity: isActive ? 0 : 0.6,
            transition: "opacity 0.4s ease",
          }}
          aria-hidden="true"
        />

        {/* Radial glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "600px", height: "600px",
            background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)",
            opacity: isActive ? 0 : 1,
            transition: "opacity 0.4s ease",
          }}
          aria-hidden="true"
        />

        <div
          className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center"
          style={{
            padding: isActive ? "24px 32px 0" : "0 32px 64px",
            transition: "padding 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        >
          {/* Label — hides when active */}
          <p
            style={{
              fontSize: "11px", letterSpacing: "0.2em",
              color: "rgba(255,255,255,0.4)", textTransform: "uppercase",
              marginBottom: isActive ? "0" : "12px",
              maxHeight: isActive ? "0" : "24px",
              overflow: "hidden",
              opacity: isActive ? 0 : 1,
              transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
            }}
          >
            OPEN SOURCE ICON LIBRARY
          </p>

          {/* Title — one line, shrinks when active */}
          <h1
            style={{
              fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif",
              fontSize: isActive ? "clamp(20px, 3vw, 28px)" : "clamp(36px, 6vw, 64px)",
              fontWeight: 700,
              letterSpacing: isActive ? "0.06em" : "-0.01em",
              textTransform: "uppercase",
              lineHeight: 1,
              textAlign: "center",
              whiteSpace: "nowrap",
              marginBottom: isActive ? "16px" : "20px",
              transition: "font-size 0.5s cubic-bezier(0.23, 1, 0.32, 1), margin 0.4s ease, letter-spacing 0.4s ease",
            }}
          >
            FIND ANY SILHOUETTE
          </h1>

          {/* Description — hides when active */}
          <p
            style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize: "14px", fontWeight: 300,
              color: "rgba(255,255,255,0.6)", lineHeight: 1.6,
              textAlign: "center",
              maxHeight: isActive ? "0" : "80px",
              overflow: "hidden",
              opacity: isActive ? 0 : 1,
              marginBottom: isActive ? "0" : "28px",
              transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
            }}
          >
            Search 200,000+ open source SVG icons by keyword.
            No AI. No account. Click to download.
          </p>

          {/* Search bar */}
          <div
            className="flex items-center gap-3"
            style={{
              borderBottom: `1px solid ${focused ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)"}`,
              paddingBottom: "10px",
              width: "100%",
              maxWidth: "520px",
              marginBottom: "16px",
              transition: "border-color 0.2s",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"
              style={{ color: focused ? "#fff" : "rgba(255,255,255,0.4)", flexShrink: 0, transition: "color 0.2s" }}>
              <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M13 13L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="ENTER KEYWORD... (한국어 가능)"
              autoComplete="off"
              spellCheck={false}
              className="flex-1 bg-transparent outline-none"
              style={{
                fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif",
                fontSize: "18px", fontWeight: 500,
                letterSpacing: "0.08em", color: "#fff",
              }}
              aria-label="Icon search"
            />
            {query && (
              <button onClick={handleClear}
                className="flex-shrink-0 transition-opacity hover:opacity-60"
                aria-label="Clear search">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2L12 12M12 2L2 12" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          {/* Translation notice */}
          {translatedQuery && (
            <p style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize: "12px", color: "rgba(255,255,255,0.4)",
              marginBottom: "12px", letterSpacing: "0.05em",
            }}>
              번역됨: <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>"{translatedQuery}"</span>
            </p>
          )}

          {/* Suggestion chips — only when no query */}
          {!query && (
            <div className="flex flex-wrap gap-2 justify-center" style={{ marginBottom: "8px" }}>
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => handleSuggestion(s)}
                  className="btn-spacex" style={{ padding: "6px 14px", fontSize: "11px" }}>
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scroll indicator — only on initial state */}
        {!isActive && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
            style={{ opacity: 0.3 }} aria-hidden="true">
            <div style={{ width: "1px", height: "40px", background: "linear-gradient(to bottom, transparent, white)" }} />
          </div>
        )}
      </section>

      {/* ── RESULTS ── */}
      {(loading || searched) && (
        <section
          className="flex-1 px-6 md:px-10 pt-6 pb-20"
          style={{ background: "#000", borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Results header with size slider */}
          {!loading && results.length > 0 && (
            <div
              className="flex items-center justify-between flex-wrap gap-4 mb-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}
            >
              <div className="flex items-center gap-4">
                <span style={{
                  fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif",
                  fontSize: "11px", letterSpacing: "0.18em",
                  color: "rgba(255,255,255,0.35)", textTransform: "uppercase",
                }}>
                  RESULTS FOR
                </span>
                <span style={{
                  fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif",
                  fontSize: "18px", fontWeight: 600,
                  letterSpacing: "0.1em", textTransform: "uppercase", color: "#fff",
                }}>
                  {debouncedQuery}
                </span>
                <span style={{
                  fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif",
                  fontSize: "11px", letterSpacing: "0.12em",
                  color: "rgba(255,255,255,0.3)",
                }}>
                  — {results.length} ICONS
                </span>
              </div>

              {/* Size slider */}
              <div className="flex items-center gap-3">
                <span style={{
                  fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif",
                  fontSize: "10px", letterSpacing: "0.15em",
                  color: "rgba(255,255,255,0.3)", textTransform: "uppercase",
                }}>
                  SIZE
                </span>
                {/* Small icon */}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <rect x="2" y="2" width="6" height="6" fill="rgba(255,255,255,0.3)" />
                </svg>
                <input
                  type="range"
                  min={60}
                  max={220}
                  step={10}
                  value={cardSize}
                  onChange={(e) => setCardSize(Number(e.target.value))}
                  aria-label="Icon size"
                  style={{
                    width: "100px",
                    accentColor: "rgba(255,255,255,0.6)",
                    cursor: "pointer",
                    background: "transparent",
                  }}
                />
                {/* Large icon */}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="2" y="2" width="12" height="12" fill="rgba(255,255,255,0.3)" />
                </svg>
              </div>
            </div>
          )}

          {loading && <LoadingGrid cardSize={cardSize} />}

          {!loading && results.length > 0 && (
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(${cardSize}px, 1fr))`,
                gap: "1px",
                background: "rgba(255,255,255,0.05)",
              }}
            >
              {results.map((icon, i) => (
                <IconCard key={icon.id} icon={icon} index={i} cardSize={cardSize} />
              ))}
            </div>
          )}

          {isEmpty && (
            <div className="flex flex-col items-start py-20 gap-4">
              <p style={{
                fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif",
                fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.02em",
                color: "rgba(255,255,255,0.15)",
              }}>
                NO RESULTS FOR "{debouncedQuery.toUpperCase()}"
              </p>
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.3)" }}>
                Try a different keyword
              </p>
            </div>
          )}
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer
        className="px-8 md:px-16 py-6 flex items-center justify-between flex-wrap gap-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        <span style={{
          fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif",
          fontSize: "11px", letterSpacing: "0.15em",
          color: "rgba(255,255,255,0.25)", textTransform: "uppercase",
        }}>
          © 2026 SILHOUETTE SEARCH
        </span>
        <div className="flex items-center gap-6">
          {[
            { label: "ICONIFY", href: "https://iconify.design" },
            { label: "OPEN SOURCE", href: "https://github.com/iconify/iconify" },
          ].map(({ label, href }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer"
              style={{
                fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif",
                fontSize: "11px", letterSpacing: "0.15em",
                color: "rgba(255,255,255,0.3)", textTransform: "uppercase",
                textDecoration: "none", transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
            >
              {label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
