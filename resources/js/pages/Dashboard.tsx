import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    Plus,
    ArrowUpRight,
    Wallet,
    CircleCheck,
    Clock3,
    ArrowRight,
    CalendarDays,
} from "lucide-react";
import { Heading, money, PlanTable, Empty, date } from "../components/UI";
import type { Budget, Event, Plan, Shared } from "../types";
type Props = {
    year: number;
    stats: {
        ceiling: number;
        reserved: number;
        available: number;
        counts: Record<string, number>;
    };
    budgets: Budget[];
    recent: Plan[];
    activity: Event[];
};
export default function Dashboard({
    year,
    stats,
    budgets,
    recent,
    activity,
}: Props) {
    const { auth } = usePage<Shared>().props;
    const canCreate = ["office", "admin"].includes(auth.user.role);
    const percent = stats.ceiling
        ? Math.round((stats.reserved / stats.ceiling) * 100)
        : 0;
    return (
        <>
            <Head title="Overview" />
            <Heading
                eyebrow="PLAN WITH PURPOSE"
                title="Planning overview"
                description="A clear view of your plans, allocations, and what needs attention."
                actions={
                    <>
                        <div className="year-control">
                            <CalendarDays size={16} />
                            <select
                                aria-label="Fiscal year"
                                value={year}
                                onChange={(e) =>
                                    router.get("/dashboard", {
                                        year: e.target.value,
                                    })
                                }
                            >
                                {[2026, 2027, 2028, 2029].map((y) => (
                                    <option key={y} value={y}>
                                        FY {y}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {canCreate && (
                            <Link
                                href="/plans/create?type=aip"
                                className="button"
                            >
                                <Plus size={17} /> Create AIP
                            </Link>
                        )}
                    </>
                }
            />
            <section className="overview-hero">
                <div>
                    <span className="eyebrow">FISCAL YEAR {year}</span>
                    <h2>
                        From a good plan
                        <br />
                        to meaningful progress.
                    </h2>
                    <p>
                        Keep every requirement connected to its purpose,
                        <br className="desktop-only" /> its budget, and the
                        people who approve it.
                    </p>
                    <Link href="/plans" className="hero-link">
                        Explore your plans <ArrowUpRight size={18} />
                    </Link>
                </div>
                <div className="hero-summary">
                    <div
                        className="hero-ring"
                        style={{
                            background: `conic-gradient(#d8bd80 ${percent}%, #42675d 0)`,
                        }}
                    >
                        <div>
                            <strong>{percent}%</strong>
                            <span>allocated to AIP</span>
                        </div>
                    </div>
                    <div>
                        <span>Available for planning</span>
                        <strong>{money(stats.available)}</strong>
                        <small>After submitted & approved AIPs</small>
                    </div>
                </div>
                <span className="hero-watermark">
                    <LandmarkArt />
                </span>
            </section>
            <div className="stats-grid">
                <div className="stat">
                    <span>
                        Total office ceilings <Wallet />
                    </span>
                    <strong>{money(stats.ceiling)}</strong>
                    <small>Across {budgets.length} office allocations</small>
                </div>
                <div className="stat">
                    <span>
                        AIP allocations <ArrowUpRight />
                    </span>
                    <strong>{money(stats.reserved)}</strong>
                    <small>Submitted and approved plans</small>
                </div>
                <Link
                    href={`/plans?status=submitted&year=${year}`}
                    className="stat"
                >
                    <span>
                        Awaiting review <Clock3 />
                    </span>
                    <strong>
                        {stats.counts.submitted}
                        <em>documents</em>
                    </strong>
                    <small>
                        Open the review queue <ArrowRight size={13} />
                    </small>
                </Link>
                <Link
                    href={`/plans?status=approved&year=${year}`}
                    className="stat"
                >
                    <span>
                        Approved plans <CircleCheck />
                    </span>
                    <strong>
                        {stats.counts.approved}
                        <em>documents</em>
                    </strong>
                    <small>AIP and PPMP approvals</small>
                </Link>
            </div>
            <section className="panel">
                <div className="panel-heading">
                    <div>
                        <h2>Recent plans</h2>
                        <p>Your most recently updated planning documents.</p>
                    </div>
                    <Link className="text-link" href="/plans">
                        View all plans <ArrowRight size={15} />
                    </Link>
                </div>
                <PlanTable plans={recent} />
            </section>
            <div className="dashboard-bottom">
                <section className="panel">
                    <div className="panel-heading">
                        <div>
                            <h2>Office allocations</h2>
                            <p>
                                Planning reservations against each office
                                ceiling.
                            </p>
                        </div>
                        <Link
                            className="icon-link"
                            aria-label="View budgets"
                            href="/budgets"
                        >
                            <ArrowUpRight />
                        </Link>
                    </div>
                    <div className="allocation-list">
                        {budgets.length ? (
                            budgets.map((b) => (
                                <div key={b.id}>
                                    <div className="allocation-label">
                                        <strong>{b.office.code}</strong>
                                        <span>
                                            {money(b.reserved_cents)}{" "}
                                            <small>
                                                / {money(b.ceiling_cents)}
                                            </small>
                                        </span>
                                    </div>
                                    <div className="progress">
                                        <i
                                            style={{
                                                width: `${b.ceiling_cents ? Math.min(100, (b.reserved_cents / b.ceiling_cents) * 100) : 0}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <Empty
                                title="No allocations yet"
                                description="The Budget Office can assign ceilings for this year."
                            />
                        )}
                    </div>
                </section>
                <section className="panel">
                    <div className="panel-heading">
                        <div>
                            <h2>Latest activity</h2>
                            <p>A record of decisions and updates.</p>
                        </div>
                        <Link
                            href="/audit"
                            className="icon-link"
                            aria-label="View activity log"
                        >
                            <ArrowUpRight />
                        </Link>
                    </div>
                    <div className="activity-list">
                        {activity.map((a) => (
                            <div key={a.id}>
                                <span className="activity-dot" />
                                <div>
                                    <p>
                                        <strong>
                                            {a.user?.name || "System"}
                                        </strong>{" "}
                                        {a.action}{" "}
                                        {a.subject_type.toUpperCase()} #
                                        {a.subject_id}
                                    </p>
                                    <small>{date(a.created_at)}</small>
                                </div>
                            </div>
                        ))}
                        {!activity.length && <Empty title="No activity yet" />}
                    </div>
                </section>
            </div>
        </>
    );
}
function LandmarkArt() {
    return (
        <svg width="260" height="220" viewBox="0 0 260 220" fill="none">
            <path
                d="M20 85L130 20L240 85M35 95H225M45 188H215M25 205H235M65 105V175M105 105V175M155 105V175M195 105V175"
                stroke="currentColor"
                strokeWidth="10"
            />
            <circle
                cx="130"
                cy="64"
                r="10"
                stroke="currentColor"
                strokeWidth="7"
            />
        </svg>
    );
}
