import { Link } from "@inertiajs/react";
import { ArrowLeft, ArrowRight, FileText } from "lucide-react";
import type { ReactNode } from "react";
import type { Paginated, Plan } from "../types";
export const money = (cents: number) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 2,
    }).format(cents / 100);
export const date = (value: string) =>
    new Date(
        value.includes("T") || value.endsWith("Z")
            ? value
            : value.replace(" ", "T") + "Z",
    ).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "Asia/Manila",
    });
export const roles: Record<string, string> = {
    admin: "System Administrator",
    office: "Office Planner",
    budget: "Budget Office",
    mayor: "Approving Authority",
    procurement: "BAC / Procurement",
    gso: "General Services",
    inventory: "Supply / Inventory",
};
export function Badge({ status }: { status: string }) {
    return (
        <span className={`badge ${status}`}>
            <i />
            {status === "submitted"
                ? "For review"
                : status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}
export function Heading({
    eyebrow,
    title,
    description,
    actions,
}: {
    eyebrow?: string;
    title: string;
    description: string;
    actions?: ReactNode;
}) {
    return (
        <div className="page-heading">
            <div>
                <div className="eyebrow">{eyebrow || "PLANNING WORKSPACE"}</div>
                <h1>{title}</h1>
                <p>{description}</p>
            </div>
            <div className="actions">{actions}</div>
        </div>
    );
}
export function Field({
    label,
    children,
    hint,
}: {
    label: string;
    children: ReactNode;
    hint?: string;
}) {
    return (
        <label className="field">
            <span>{label}</span>
            {children}
            {hint && <small>{hint}</small>}
        </label>
    );
}
export function Errors({ errors }: { errors: Record<string, string> }) {
    return Object.keys(errors).length ? (
        <div className="error" role="alert">
            <strong>Please check the following</strong>
            {Object.entries(errors).map(([k, v]) => (
                <div key={k}>{v}</div>
            ))}
        </div>
    ) : null;
}
export function Empty({
    title = "No records yet",
    description = "Records will appear here once they are created.",
}: {
    title?: string;
    description?: string;
}) {
    return (
        <div className="empty">
            <FileText size={30} />
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    );
}
export function Pagination({ page }: { page: Paginated<unknown> }) {
    return (
        <div className="pagination">
            <span>
                {page.total} records · Page {page.current_page} of{" "}
                {page.last_page}
            </span>
            <div className="actions">
                {page.prev_page_url && (
                    <Link
                        className="button secondary small"
                        href={page.prev_page_url}
                    >
                        <ArrowLeft size={14} /> Previous
                    </Link>
                )}
                {page.next_page_url && (
                    <Link
                        className="button secondary small"
                        href={page.next_page_url}
                    >
                        Next <ArrowRight size={14} />
                    </Link>
                )}
            </div>
        </div>
    );
}
export function PlanTable({ plans }: { plans: Plan[] }) {
    return !plans.length ? (
        <Empty
            title="No plans found"
            description="Create a plan or adjust your filters to get started."
        />
    ) : (
        <div className="table-scroll">
            <table>
                <thead>
                    <tr>
                        <th>Plan / reference</th>
                        <th>Office</th>
                        <th>Type</th>
                        <th className="numeric">Estimated amount</th>
                        <th>Status</th>
                        <th>
                            <span className="sr-only">Open</span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {plans.map((p) => (
                        <tr key={p.id}>
                            <td>
                                <Link
                                    className="record-title"
                                    href={`/plans/${p.id}`}
                                >
                                    {p.title}
                                </Link>
                                <small>
                                    {p.reference} · FY {p.fiscal_year}
                                </small>
                            </td>
                            <td>
                                <span className="office-code">
                                    {p.office.code}
                                </span>
                            </td>
                            <td>
                                <span className="type-label">
                                    {p.type.toUpperCase()}
                                </span>
                            </td>
                            <td className="numeric amount">
                                {money(p.total_cents)}
                            </td>
                            <td>
                                <Badge status={p.status} />
                            </td>
                            <td>
                                <Link
                                    className="icon-link"
                                    aria-label={`Open ${p.title}`}
                                    href={`/plans/${p.id}`}
                                >
                                    <ArrowRight size={17} />
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
