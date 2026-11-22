import Bun from "./Bun";

/** Small centered brand pill, design.how-style top bar. */
export function Brand({ right }: { right?: React.ReactNode }) {
  return (
    <div className="brand">
      <a href="/" className="brand__pill">
        <Bun size={22} />
        <span>Lussebulletestet</span>
      </a>
      {right}
    </div>
  );
}

/** Centered hero title + subtitle. */
export default function Header({ title = "Lussebulletestet", subtitle, big = false, compact = false }: { title?: string; subtitle?: string; big?: boolean; compact?: boolean }) {
  return (
    <header className={`hero ${big ? "hero--big" : ""} ${compact ? "hero--compact" : ""}`}>
      {big && <Bun size={compact ? 56 : 96} className="hero__bun" />}
      <h1 className="hero__title">{title}</h1>
      {subtitle && <p className="hero__sub">{subtitle}</p>}
    </header>
  );
}
