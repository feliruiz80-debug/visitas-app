type PageChromeProps = {
  pageNumber: number;
  children: React.ReactNode;
  className?: string;
};

export function PageChrome({ pageNumber, children, className = "" }: PageChromeProps) {
  const label = `.${String(pageNumber).padStart(2, "0")}`;

  return (
    <article className={`mag-page ${className}`.trim()}>
      <div className="mag-page__body">{children}</div>
      <footer className="mag-page__footer">
        <span>Mayoristasofia.com.ar</span>
        <span className="mag-page__num">{label}</span>
      </footer>
    </article>
  );
}
