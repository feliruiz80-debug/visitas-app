import { Logo } from "./Logo";

type CoverPageProps = {
  onOpen: () => void;
  productCount: number;
};

export function CoverPage({ onOpen, productCount }: CoverPageProps) {
  return (
    <section className="cover">
      <div className="cover__photo" aria-hidden="true">
        <img src="/catalog/portada.jpg" alt="" />
        <div className="cover__photo-scrim" />
      </div>

      <div className="cover__panel">
        <Logo size={86} />
        <div className="cover__titles">
          <h1>CATÁLOGO ESCOLAR</h1>
          <p className="cover__brand">MAYORISTA SOFIA</p>
          <p className="cover__meta">{productCount} productos · Córdoba</p>
        </div>

        <button type="button" className="cover__cta" onClick={onOpen}>
          Abrir revista
        </button>

        <ul className="cover__perks">
          <li>
            <span className="perk perk--navy" aria-hidden="true">
              <CartIcon />
            </span>
            <span>VARIEDAD MARCAS</span>
          </li>
          <li>
            <span className="perk perk--orange" aria-hidden="true">
              <TruckIcon />
            </span>
            <span>ENVÍOS A TODO EL PAÍS</span>
          </li>
          <li>
            <span className="perk perk--white" aria-hidden="true">
              <PeopleIcon />
            </span>
            <span>ATENCIÓN PERSONALIZADA</span>
          </li>
        </ul>
      </div>
    </section>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <path d="M3 4h2l2.4 11h10.2l2-7H7.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7V10z" strokeLinejoin="round" />
      <circle cx="7.5" cy="18.5" r="1.6" />
      <circle cx="17.5" cy="18.5" r="1.6" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="2.2" />
      <circle cx="7" cy="9.5" r="1.7" />
      <circle cx="17" cy="9.5" r="1.7" />
      <path d="M4 18c.8-2.4 2.8-3.6 5-3.6h6c2.2 0 4.2 1.2 5 3.6" strokeLinecap="round" />
    </svg>
  );
}
