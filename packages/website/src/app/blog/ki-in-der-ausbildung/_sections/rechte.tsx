import type { ListItem } from "../post-copy";
import { Rich, type RichContext } from "./rich";
import { SectionHead, copyFor, type SectionProps } from "./shared";

function Item({ item, context }: { item: ListItem; context: RichContext }) {
  return (
    <li>
      <span>
        <Rich source={item.text} context={context} />
        {item.ref ? (
          <>
            {" "}
            <span className="wz-list__ref">
              (<Rich source={item.ref} context={context} />)
            </span>
          </>
        ) : null}
      </span>
    </li>
  );
}

export function Rechte({ locale, context }: SectionProps) {
  const copy = copyFor(locale).rechte;

  return (
    <section className="wz-section" id="rechte" aria-labelledby="rechte-h">
      <SectionHead id="rechte" index="02" locale={locale} />
      <div className="wz-body">
        <p className="wz-prose">
          <Rich source={copy.intro} context={context} />
        </p>
        <div className="wz-split">
          <div>
            <h3 className="wz-split__title">{copy.canTitle}</h3>
            <ul className="wz-list" role="list">
              {copy.can.map((item) => (
                <Item item={item} context={context} key={item.text} />
              ))}
            </ul>
          </div>
          <div>
            <h3 className="wz-split__title">{copy.cannotTitle}</h3>
            <ul className="wz-list wz-list--outline" role="list">
              {copy.cannot.map((item) => (
                <Item item={item} context={context} key={item.text} />
              ))}
            </ul>
          </div>
        </div>
        <table className="wz-table">
          <caption>{copy.tableCaption}</caption>
          <thead>
            <tr>
              {copy.columns.map((column) => (
                <th scope="col" key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {copy.rows.map(([right, kind, section]) => (
              <tr key={right}>
                <th scope="row">
                  <Rich source={right} context={context} />
                </th>
                <td data-label={copy.columns[1]}>
                  <Rich source={kind} context={context} />
                </td>
                <td data-label={copy.columns[2]}>
                  <Rich source={section} context={context} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="wz-caption">
          <Rich source={copy.note} context={context} />
        </p>
      </div>
    </section>
  );
}
