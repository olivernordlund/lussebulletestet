import Bun from "./Bun";

export default function Header({ subtitle, big = false, compact = false }: { subtitle?: string; big?: boolean; compact?: boolean }) {
  return (
    <header className={`header ${big ? "header--big" : ""} ${compact ? "header--compact" : ""}`}>
      <Bun size={big ? 150 : 76} className="header__bun" />
      <div>
        <h1 className="header__title">Lussebulletestet</h1>
        {subtitle && <p className="header__sub">{subtitle}</p>}
      </div>
    </header>
  );
}
