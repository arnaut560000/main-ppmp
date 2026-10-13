import { Fragment, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { Heading, money } from "../components/UI";
import type { Office, Paginated } from "../types";

type Row = {
    key: string;
    category: string;
    code: string;
    name: string;
    specification: string | null;
    unit: string;
    price_cents: number;
    offices: Record<
        number,
        {
            quantities: number[];
            amounts: number[];
            quantity: number;
            amount: number;
        }
    >;
};
type Props = {
    offices: Office[];
    rows: Paginated<Row>;
    office_totals: Record<number, number>;
    total_cents: number;
    plan_count: number;
    filters: { year: number; office_id: number | null; fund: string | null };
};

export default function ConsolidatedPpmp({
    offices,
    rows,
    office_totals,
    total_cents,
    plan_count,
    filters,
}: Props) {
    const [year, setYear] = useState(String(filters.year));
    const [fund, setFund] = useState(filters.fund || "");
    const [office, setOffice] = useState(String(filters.office_id || ""));
    const query = new URLSearchParams({
        year: String(filters.year),
        fund: filters.fund || "",
        office_id: String(filters.office_id || ""),
        download: "csv",
    });
    return (
        <>
            <Head title="Consolidated PPMP" />
            <Heading
                title={`Consolidated PPMP · FY ${filters.year}`}
                description="Approved requirements by office, item, and quarter. Amounts use saved catalogue prices."
                actions={
                    <a
                        className="button secondary"
                        href={`/reports/consolidated-ppmp?${query}`}
                    >
                        Download all rows (CSV)
                    </a>
                }
            />
            <section className="panel form-panel">
                <form
                    className="form-grid"
                    onSubmit={(event) => {
                        event.preventDefault();
                        router.get("/reports/consolidated-ppmp", {
                            year,
                            fund,
                            office_id: office,
                        });
                    }}
                >
                    <label className="field">
                        Fiscal year
                        <input
                            type="number"
                            min="2020"
                            max="2100"
                            required
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                        />
                    </label>
                    <label className="field">
                        Fund source (exact name)
                        <input
                            maxLength={120}
                            placeholder="All fund sources"
                            value={fund}
                            onChange={(e) => setFund(e.target.value)}
                        />
                    </label>
                    <label className="field">
                        Office
                        <select
                            value={office}
                            onChange={(e) => setOffice(e.target.value)}
                        >
                            <option value="">All permitted offices</option>
                            {offices.map((o) => (
                                <option key={o.id} value={o.id}>
                                    {o.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <div className="actions">
                        <button className="button">Apply filters</button>
                        <Link
                            className="button secondary"
                            href={`/reports/consolidated-ppmp?year=${filters.year}`}
                        >
                            Reset
                        </Link>
                    </div>
                </form>
                <p>
                    {plan_count} approved PPMPs · {rows.total} item/price rows ·
                    Total {money(total_cents)}
                </p>
                <p className="muted">
                    Different saved prices or specifications appear separately.
                    Legacy items without a saved expenditure category are
                    labeled unclassified.
                </p>
            </section>
            <section className="panel">
                <div
                    className="table-scroll consolidated-scroll"
                    tabIndex={0}
                    role="region"
                    aria-label="Consolidated PPMP table; scroll horizontally to view offices"
                >
                    <table className="consolidated-table">
                        <thead>
                            <tr>
                                <th rowSpan={3}>Object of expenditures</th>
                                <th rowSpan={3}>Article (item)</th>
                                <th rowSpan={3}>Unit</th>
                                <th rowSpan={3}>Unit cost</th>
                                {offices.map((o) => (
                                    <th
                                        key={o.id}
                                        colSpan={10}
                                        scope="colgroup"
                                    >
                                        {o.name}
                                    </th>
                                ))}
                            </tr>
                            <tr>
                                {offices.map((o) => (
                                    <Fragment key={o.id}>
                                        {[1, 2, 3, 4].map((q) => (
                                            <th key={q} colSpan={2}>
                                                Q{q}
                                            </th>
                                        ))}
                                        <th rowSpan={2}>Total qty</th>
                                        <th rowSpan={2}>Total amount</th>
                                    </Fragment>
                                ))}
                            </tr>
                            <tr>
                                {offices.map((o) => (
                                    <Fragment key={o.id}>
                                        {[1, 2, 3, 4].map((q) => (
                                            <Fragment key={q}>
                                                <th>Qty</th>
                                                <th>Amount</th>
                                            </Fragment>
                                        ))}
                                    </Fragment>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.data.length ? (
                                rows.data.map((row) => (
                                    <tr key={row.key}>
                                        <td>{row.category}</td>
                                        <td>
                                            <strong>{row.name}</strong>
                                            <small>
                                                {row.code}
                                                {row.specification
                                                    ? ` · ${row.specification}`
                                                    : ""}
                                            </small>
                                        </td>
                                        <td>{row.unit}</td>
                                        <td className="numeric">
                                            {money(row.price_cents)}
                                        </td>
                                        {offices.map((o) => {
                                            const cell = row.offices[o.id];
                                            return (
                                                <Fragment key={o.id}>
                                                    {[0, 1, 2, 3].map((q) => (
                                                        <Fragment key={q}>
                                                            <td className="numeric">
                                                                {cell
                                                                    ?.quantities[
                                                                    q
                                                                ] || 0}
                                                            </td>
                                                            <td className="numeric">
                                                                {money(
                                                                    cell
                                                                        ?.amounts[
                                                                        q
                                                                    ] || 0,
                                                                )}
                                                            </td>
                                                        </Fragment>
                                                    ))}
                                                    <td className="numeric">
                                                        {cell?.quantity || 0}
                                                    </td>
                                                    <td className="numeric amount">
                                                        {money(
                                                            cell?.amount || 0,
                                                        )}
                                                    </td>
                                                </Fragment>
                                            );
                                        })}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4 + offices.length * 10}>
                                        No approved PPMP items match these
                                        filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th colSpan={4}>
                                    Total amount across all pages
                                </th>
                                {offices.map((o) => (
                                    <Fragment key={o.id}>
                                        <td colSpan={9} />
                                        <th className="numeric">
                                            {money(office_totals[o.id] || 0)}
                                        </th>
                                    </Fragment>
                                ))}
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <div className="panel-heading">
                    <span>
                        Page {rows.current_page} of {rows.last_page}
                    </span>
                    <div className="actions">
                        {rows.prev_page_url && (
                            <Link
                                className="button secondary"
                                href={rows.prev_page_url}
                            >
                                Previous
                            </Link>
                        )}
                        {rows.next_page_url && (
                            <Link
                                className="button secondary"
                                href={rows.next_page_url}
                            >
                                Next
                            </Link>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}
