import { useEffect, useMemo, useState } from "react";
import { ContactPage } from "./components/ContactPage";
import { CoverPage } from "./components/CoverPage";
import { DigitalCatalogPage } from "./components/DigitalCatalogPage";
import { FlipBook } from "./components/FlipBook";
import { Logo } from "./components/Logo";
import { DIGITAL_PAGES } from "./data/digitalCatalog";

type Sheet =
  | { kind: "cover"; id: string; label: string; shortLabel: string }
  | { kind: "contact"; id: string; label: string; shortLabel: string; pageNumber: string }
  | { kind: "digital"; id: string; label: string; shortLabel: string; pageIndex: number };

export function App() {
  const sheets = useMemo<Sheet[]>(
    () => [
      { kind: "cover", id: "portada", label: "Portada", shortLabel: "Portada" },
      { kind: "contact", id: "pedido", label: "Hacé tu pedido", shortLabel: "Pedido", pageNumber: "02" },
      ...DIGITAL_PAGES.map((page, pageIndex) => ({
        kind: "digital" as const,
        id: page.id,
        label: page.label,
        shortLabel: page.shortLabel,
        pageIndex,
      })),
    ],
    [],
  );

  const [pageIndex, setPageIndex] = useState(0);
  const page = sheets[pageIndex] ?? sheets[0];
  const isCover = page?.kind === "cover";

  useEffect(() => {
    DIGITAL_PAGES.forEach((digital) => {
      [digital.hero?.image, ...digital.products.map((item) => item.image)]
        .filter(Boolean)
        .forEach((src) => {
          const img = new Image();
          img.src = src!;
        });
    });
  }, []);

  const sheetNodes = sheets.map((sheet) => {
    if (sheet.kind === "cover") {
      return (
        <CoverPage
          key={sheet.id}
          productCount={DIGITAL_PAGES.length}
          onOpen={() => setPageIndex(1)}
        />
      );
    }
    if (sheet.kind === "contact") {
      return <ContactPage key={sheet.id} pageNumber={Number(sheet.pageNumber)} />;
    }
    return <DigitalCatalogPage key={sheet.id} page={DIGITAL_PAGES[sheet.pageIndex]} />;
  });

  return (
    <div className={`app ${isCover ? "app--cover" : ""}`}>
      {!isCover ? (
        <header className="logo-bar">
          <button type="button" className="logo-bar__btn" onClick={() => setPageIndex(0)} aria-label="Ir a la portada">
            <Logo size={48} />
          </button>
          <p className="logo-bar__page">{page.label}</p>
        </header>
      ) : null}

      <main className="stage">
        <FlipBook pageIndex={pageIndex} pageCount={sheets.length} onChange={setPageIndex}>
          {sheetNodes}
        </FlipBook>
      </main>

      {!isCover ? (
        <nav className="cats-rail" aria-label="Páginas del catálogo">
          {sheets.map((sheet, index) => (
            <button
              key={sheet.id}
              type="button"
              className={index === pageIndex ? "is-active" : ""}
              onClick={() => setPageIndex(index)}
            >
              {sheet.shortLabel}
            </button>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
