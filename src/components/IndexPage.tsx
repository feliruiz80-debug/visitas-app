import type { CategoryGroup } from "../data/types";
import { PageChrome } from "./PageChrome";

type IndexPageProps = {
  groups: CategoryGroup[];
  pageNumber: number;
  onJump: (categoryKey: string) => void;
};

export function IndexPage({ groups, pageNumber, onJump }: IndexPageProps) {
  return (
    <PageChrome pageNumber={pageNumber} className="index-page">
      <header className="category-head">
        <p className="category-head__eyebrow">ESCOLAR</p>
        <h2>ÍNDICE</h2>
        <div className="category-head__rule" />
      </header>

      <ol className="index-list">
        {groups.map((group, index) => (
          <li key={group.key}>
            <button type="button" onClick={() => onJump(group.key)}>
              <span className="index-list__num">{String(index + 1).padStart(2, "0")}</span>
              <span className="index-list__label">{group.label}</span>
              <span className="index-list__count">{group.products.length}</span>
            </button>
          </li>
        ))}
      </ol>
    </PageChrome>
  );
}
