import { Head, Link, router, usePage } from "@inertiajs/react";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Heading, PlanTable, Pagination } from "../components/UI";
import type { Paginated, Plan, Shared } from "../types";
export default function Plans({
    plans,
    filters,
}: {
    plans: Paginated<Plan>;
    filters: Record<string, string>;
}) {
    const { auth } = usePage<Shared>().props;
    const [search, setSearch] = useState(filters.search || "");
    const update = (key: string, value: string) =>
        router.get(
            "/plans",
            { ...filters, [key]: value },
            { preserveState: true },
        );
    const title =
        filters.status === "submitted"
            ? "Review & approvals"
            : filters.type === "aip"
              ? "Annual investment plans"
              : filters.type === "ppmp"
                ? "Procurement plans"
                : "All planning documents";
    return (
        <>
            <Head title={title} />
            <Heading
                title={title}
                description={
                    filters.type === "ppmp"
                        ? "Translate approved activities into scheduled procurement requirements."
                        : "Prepare, track, and review your office’s planning documents."
                }
                actions={
                    ["office", "admin"].includes(auth.user.role) && (
                        <Link
                            className="button"
                            href={`/plans/create?type=${filters.type || "aip"}`}
                        >
                            <Plus size={17} /> New{" "}
                            {filters.type?.toUpperCase() || "plan"}
                        </Link>
                    )
                }
            />
            <section className="panel">
                <form
                    className="toolbar"
                    onSubmit={(e) => {
                        e.preventDefault();
                        update("search", search);
                    }}
                >
                    <div className="search-input">
                        <Search size={17} />
                        <input
                            aria-label="Search plans"
                            placeholder="Search title or reference…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        aria-label="Document type"
                        value={filters.type || ""}
                        onChange={(e) => update("type", e.target.value)}
                    >
                        <option value="">All document types</option>
                        <option value="aip">AIP</option>
                        <option value="ppmp">PPMP</option>
                    </select>
                    <select
                        aria-label="Plan status"
                        value={filters.status || ""}
                        onChange={(e) => update("status", e.target.value)}
                    >
                        <option value="">All statuses</option>
                        <option value="draft">Draft</option>
                        <option value="submitted">For review</option>
                        <option value="approved">Approved</option>
                        <option value="returned">Returned</option>
                    </select>
                    <button className="button secondary">
                        <SlidersHorizontal size={15} /> Apply
                    </button>
                </form>
                <PlanTable plans={plans.data} />
                <Pagination page={plans} />
            </section>
        </>
    );
}
