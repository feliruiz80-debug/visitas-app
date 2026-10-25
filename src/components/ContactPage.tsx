import { PageChrome } from "./PageChrome";

type ContactPageProps = {
  pageNumber: number;
};

export function ContactPage({ pageNumber }: ContactPageProps) {
  return (
    <PageChrome pageNumber={pageNumber} className="contact-page">
      <div className="contact">
        <h2 className="contact__title">
          <span className="contact__title-soft">HACÉ TU</span>
          <span className="contact__title-strong">PEDIDO</span>
        </h2>

        <a
          className="contact__qr"
          href="https://wa.me/5493517865153"
          target="_blank"
          rel="noreferrer"
          aria-label="Escribir por WhatsApp"
        >
          <div className="contact__qr-box">
            <QrMark />
          </div>
          <span className="contact__qr-btn">¡Escaneame!</span>
        </a>

        <ul className="contact__list">
          <li>
            <PhoneIcon />
            <div>
              <strong>Felipe Ruiz</strong>
              <a href="tel:+5493517865153">351 7865153</a>
            </div>
          </li>
          <li>
            <WebIcon />
            <div>
              <a href="https://mayoristasofia.com.ar" target="_blank" rel="noreferrer">
                Mayoristasofia.com.ar
              </a>
            </div>
          </li>
          <li>
            <IgIcon />
            <div>
              <a href="https://instagram.com/Libreriasofia" target="_blank" rel="noreferrer">
                @Libreriasofia
              </a>
            </div>
          </li>
          <li>
            <MailIcon />
            <div>
              <a href="mailto:Sofiamayoristaventas@gmail.com">Sofiamayoristaventas@gmail.com</a>
            </div>
          </li>
          <li>
            <PinIcon />
            <div>
              <span>Buenos Aires 346, Córdoba</span>
            </div>
          </li>
        </ul>
      </div>
    </PageChrome>
  );
}

function QrMark() {
  return (
    <svg viewBox="0 0 120 120" width="160" height="160" aria-hidden="true">
      <rect width="120" height="120" fill="#fff" />
      <g fill="#0B1F6B">
        <rect x="10" y="10" width="34" height="34" />
        <rect x="16" y="16" width="22" height="22" fill="#fff" />
        <rect x="22" y="22" width="10" height="10" />
        <rect x="76" y="10" width="34" height="34" />
        <rect x="82" y="16" width="22" height="22" fill="#fff" />
        <rect x="88" y="22" width="10" height="10" />
        <rect x="10" y="76" width="34" height="34" />
        <rect x="16" y="82" width="22" height="22" fill="#fff" />
        <rect x="22" y="88" width="10" height="10" />
        <rect x="54" y="10" width="8" height="8" />
        <rect x="66" y="22" width="8" height="8" />
        <rect x="54" y="34" width="8" height="8" />
        <rect x="54" y="54" width="12" height="12" />
        <rect x="72" y="54" width="8" height="8" />
        <rect x="88" y="54" width="8" height="8" />
        <rect x="104" y="54" width="8" height="8" />
        <rect x="54" y="72" width="8" height="8" />
        <rect x="72" y="72" width="16" height="8" />
        <rect x="96" y="72" width="8" height="16" />
        <rect x="72" y="88" width="8" height="8" />
        <rect x="88" y="96" width="16" height="8" />
        <rect x="54" y="96" width="8" height="8" />
        <rect x="104" y="104" width="8" height="8" />
      </g>
    </svg>
  );
}

function PhoneIcon() {
  return (
    <span className="contact__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M6.6 10.8a15 15 0 006.6 6.6l2.2-2.2a1 1 0 011-.24 11 11 0 003.4.54 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11 11 0 00.54 3.4 1 1 0 01-.25 1z" />
      </svg>
    </span>
  );
}

function WebIcon() {
  return (
    <span className="contact__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
      </svg>
    </span>
  );
}

function IgIcon() {
  return (
    <span className="contact__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}

function MailIcon() {
  return (
    <span className="contact__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M4 7l8 6 8-6" />
      </svg>
    </span>
  );
}

function PinIcon() {
  return (
    <span className="contact__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
      </svg>
    </span>
  );
}
