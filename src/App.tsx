import { useEffect, useState } from "react";
import { CatalogPhotoPage } from "./components/CatalogPhotoPage";
import { ContactPage } from "./components/ContactPage";
import { CoverPage } from "./components/CoverPage";
import { FlipBook } from "./components/FlipBook";
import { Logo } from "./components/Logo";
import { CATALOG_SHEETS } from "./data/pages";

export function App() {
  const [pageIndex, setPageIndex] = useState(0);
  const page = CATALOG_SHEETS[pageIndex] ?? CATALOG_SHEETS[0];
  const isCover = page?.kind === "cover";
  const photoCount = CATALOG_SHEETS.filter((sheet) => sheet.kind === "photo").length;

  useEffect(() => {
    CATALOG_SHEETS.forEach((sheet) => {
      if (!sheet.src) return;
      const img = new Image();
      img.src = sheet.src;
    });
  }, []);

  const sheetNodes = CATALOG_SHEETS.map((sheet) => {
    if (sheet.kind === "cover") {
      return <CoverPage key={sheet.id} productCount={photoCount} onOpen={() => setPageIndex(1)} />;
    }
    if (sheet.kind === "contact") {
      return <ContactPage key={sheet.id} pageNumber={Number(sheet.pageNumber) || 2} />;
    }
    return (
      <CatalogPhotoPage
        key={sheet.id}
        src={sheet.src!}
        label={sheet.label}
        pageNumber={sheet.pageNumber}
      />
    );
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
        <FlipBook pageIndex={pageIndex} pageCount={CATALOG_SHEETS.length} onChange={setPageIndex}>
          {sheetNodes}
        </FlipBook>
      </main>

      {!isCover ? (
        <nav className="cats-rail" aria-label="Páginas del catálogo">
          {CATALOG_SHEETS.map((sheet, index) => (
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
