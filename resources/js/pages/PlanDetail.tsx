import { Head, Link, useForm, usePage } from "@inertiajs/react";
import {
    ArrowLeft,
    Download,
    Pencil,
    Send,
    Check,
    CornerUpLeft,
    Lock,
    Printer,
} from "lucide-react";
import { Badge, Heading, money, date, Errors, Field } from "../components/UI";
import type { Event, Plan, Shared } from "../types";
export default function PlanDetail({
    plan,
    history,
}: {
    plan: Plan;
    history: Event[];
}) {
    const { auth } = usePage<Shared>().props;
    const editable =
        ["draft", "returned"].includes(plan.status) &&
        ["admin", "office"].includes(auth.user.role);
    const reviewer =
        plan.status === "submitted" &&
        auth.user.role === (plan.type === "aip" ? "budget" : "mayor") &&
        auth.user.id !== plan.created_by;
    const form = useForm({ action: "", version: plan.version, comment: "" });
    function transition(action: string) {
        form.transform((data) => ({ ...data, action, version: plan.version }));
        form.post(`/plans/${plan.id}/transition`, {
            preserveScroll: true,
            onSuccess: () => form.reset("comment"),
        });
    }
    return (
        <>
            <Head title={plan.reference} />
            <Link
                className="back-link no-print"
                href={`/plans?type=${plan.type}`}
            >
                <ArrowLeft size={15} /> Back to {plan.type.toUpperCase()} plans
            </Link>
            <Heading
                eyebrow={`${plan.type.toUpperCase()} · ${plan.reference}`}
                title={plan.title}
                description={`${plan.office.name} · Fiscal year ${plan.fiscal_year}`}
                actions={
                    <>
                        <a
                            className="button secondary"
                            href={`/plans/${plan.id}/export`}
                        >
                            <Download size={16} /> CSV
                        </a>
                        <button
                            className="button secondary"
                            onClick={() => window.print()}
                        >
                            <Printer size={16} /> Print
                        </button>
                        {editable && (
                            <Link
                                href={`/plans/${plan.id}/edit`}
                                className="button"
                            >
                                <Pencil size={16} /> Edit draft
                            </Link>
                        )}
                    </>
                }
            />
            <Errors errors={form.errors} />
            <div className="detail-grid">
                <div>
                    <section className="panel form-panel">
                        <div className="detail-top">
                            <Badge status={plan.status} />
                            <span className="muted">
                                Version {plan.version}
                            </span>
                        </div>
                        <div className="detail-amount">
                            <span>Total estimated amount</span>
                            <strong>{money(plan.total_cents)}</strong>
                            <small>
                                Planning amount · not an obligation or payment
                            </small>
                        </div>
                        <div className="definition-grid">
                            <div>
                                <span>Fund source</span>
                                <strong>{plan.fund_source}</strong>
                            </div>
                            <div>
                                <span>Implementation period</span>
                                <strong>
                                    {plan.start_date} — {plan.end_date}
                                </strong>
                            </div>
                            <div>
                                <span>Prepared by</span>
                                <strong>{plan.creator?.name}</strong>
                            </div>
                            <div>
                                <span>Linked AIP</span>
                                {plan.parent ? (
                                    <Link
                                        className="text-link"
                                        href={`/plans/${plan.parent.id}`}
                                    >
                                        {plan.parent.reference}
                                    </Link>
                                ) : (
                                    <strong>Not applicable</strong>
                                )}
                            </div>
                        </div>
                        {plan.description && (
                            <div className="prose">
                                <h3>Description</h3>
                                <p>{plan.description}</p>
                            </div>
                        )}
                        {plan.expected_output && (
                            <div className="prose">
                                <h3>Expected output</h3>
                                <p>{plan.expected_output}</p>
                            </div>
                        )}
                    </section>
                    {plan.type === "aip" ? (
                        <section className="panel form-panel">
                            <h2>Allocation by expense class</h2>
                            <div className="expense-grid">
                                {(
                                    [
                                        ["PS", plan.ps_cents],
                                        ["MOOE", plan.mooe_cents],
                                        ["FE", plan.fe_cents],
                                        ["CO", plan.co_cents],
                                    ] as const
                                ).map(([k, v]) => (
                                    <div key={k}>
                                        <span>{k}</span>
                                        <strong>{money(v)}</strong>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : (
                        <section className="panel">
                            <div className="panel-heading">
                                <div>
                                    <h2>Item requirements</h2>
                                    <p>
                                        {plan.items.length} items · saved
                                        catalogue prices
                                    </p>
                                </div>
                            </div>
                            <div className="table-scroll">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th className="numeric">
                                                Unit cost
                                            </th>
                                            {[1, 2, 3, 4].map((q) => (
                                                <th key={q} className="numeric">
                                                    Q{q}
                                                </th>
                                            ))}
                                            <th className="numeric">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {plan.items.map((i) => (
                                            <tr key={i.id}>
                                                <td>
                                                    <strong>{i.name}</strong>
                                                    <small>
                                                        {i.code} · {i.unit} ·{" "}
                                                        {i.expense_class}
                                                    </small>
                                                </td>
                                                <td className="numeric">
                                                    {money(i.price_cents)}
                                                </td>
                                                {[0, 1, 2, 3].map((q) => (
                                                    <td
                                                        key={q}
                                                        className="numeric"
                                                    >
                                                        {i.monthly_quantities
                                                            .slice(
                                                                q * 3,
                                                                q * 3 + 3,
                                                            )
                                                            .reduce(
                                                                (a, b) => a + b,
                                                                0,
                                                            )}
                                                    </td>
                                                ))}
                                                <td className="numeric amount">
                                                    {money(i.total_cents)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </div>
                <aside>
                    <section className="panel form-panel no-print">
                        <h2>Next step</h2>
                        {editable ? (
                            <>
                                <p>
                                    Check the details, then submit to the{" "}
                                    {plan.type === "aip"
                                        ? "Budget Office"
                                        : "Approving Authority"}
                                    .
                                </p>
                                <button
                                    className="button wide"
                                    disabled={form.processing}
                                    onClick={() => transition("submit")}
                                >
                                    <Send size={16} /> Submit for review
                                </button>
                            </>
                        ) : reviewer ? (
                            <>
                                <p>
                                    Review the allocation and requirements
                                    before recording your decision.
                                </p>
                                <Field label="Review comment">
                                    <textarea
                                        rows={4}
                                        value={form.data.comment}
                                        onChange={(e) =>
                                            form.setData(
                                                "comment",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Required when returning for revision"
                                    />
                                </Field>
                                <button
                                    className="button wide"
                                    disabled={form.processing}
                                    onClick={() => transition("approve")}
                                >
                                    <Check size={16} /> Approve plan
                                </button>
                                <button
                                    className="button secondary wide spaced"
                                    disabled={
                                        form.processing ||
                                        !form.data.comment.trim()
                                    }
                                    onClick={() => transition("return")}
                                >
                                    <CornerUpLeft size={16} /> Return for
                                    revision
                                </button>
                            </>
                        ) : (
                            <div className="note">
                                <Lock size={20} />
                                <p>
                                    {plan.status === "approved"
                                        ? "This approved document is locked to preserve its allocation and prices."
                                        : plan.status === "submitted"
                                          ? "This document is awaiting review. Editing is locked."
                                          : "This document can be edited by its office planner."}
                                </p>
                            </div>
                        )}
                        {plan.status === "approved" &&
                            plan.type === "aip" &&
                            ["office", "admin"].includes(auth.user.role) && (
                                <Link
                                    className="button secondary wide spaced"
                                    href={`/plans/create?type=ppmp&parent=${plan.id}`}
                                >
                                    Create linked PPMP
                                </Link>
                            )}
                    </section>
                    <section className="panel form-panel">
                        <h2>Document history</h2>
                        <div className="timeline">
                            {history.map((e) => (
                                <div key={e.id}>
                                    <strong>
                                        {e.action.charAt(0).toUpperCase() +
                                            e.action.slice(1)}
                                    </strong>
                                    <span>{e.user?.name || "System"}</span>
                                    <small>{date(e.created_at)}</small>
                                    {e.comment && <p>{e.comment}</p>}
                                </div>
                            ))}
                        </div>
                    </section>
                </aside>
            </div>
        </>
    );
}
