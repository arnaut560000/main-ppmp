import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { Check, Layers } from "lucide-react";
import { Heading, Field, Errors, money, Badge, Empty } from "../components/UI";
import type { Plan, Shared } from "../types";
type Batch = {
    id: number;
    title: string;
    fiscal_year: number;
    status: string;
    plans: Plan[];
};
export default function AnnualPlans({
    batches,
    eligible,
}: {
    batches: Batch[];
    eligible: Plan[];
}) {
    const { auth } = usePage<Shared>().props;
    const form = useForm({
        title: "Annual Procurement Plan 2027",
        fiscal_year: 2027,
        plan_ids: [] as number[],
    });
    const approval = useForm({});
    const choices = eligible.filter(
        (p) => p.fiscal_year === form.data.fiscal_year,
    );
    return (
        <>
            <Head title="APP consolidation" />
            <Heading
                title="APP consolidation"
                description="Bring approved procurement requirements together while retaining their office and AIP references."
            />
            <Errors errors={approval.errors} />
            {auth.user.role === "procurement" && (
                <section className="panel form-panel">
                    <div className="section-title">
                        <span>
                            <Layers size={20} />
                        </span>
                        <div>
                            <h2>Prepare an APP batch</h2>
                            <p>
                                Select approved PPMPs for the same fiscal year.
                            </p>
                        </div>
                    </div>
                    <Errors errors={form.errors} />
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.post("/annual-plans", {
                                onSuccess: () => form.reset("plan_ids"),
                            });
                        }}
                    >
                        <div className="form-grid">
                            <Field label="APP title">
                                <input
                                    required
                                    value={form.data.title}
                                    onChange={(e) =>
                                        form.setData("title", e.target.value)
                                    }
                                />
                            </Field>
                            <Field label="Fiscal year">
                                <input
                                    type="number"
                                    required
                                    min="2020"
                                    max="2100"
                                    value={form.data.fiscal_year}
                                    onChange={(e) => {
                                        form.setData({
                                            ...form.data,
                                            fiscal_year: Number(e.target.value),
                                            plan_ids: [],
                                        });
                                    }}
                                />
                            </Field>
                        </div>
                        {choices.length ? (
                            <div className="selection-list">
                                {choices.map((p) => (
                                    <label key={p.id} className="selection-row">
                                        <input
                                            type="checkbox"
                                            checked={form.data.plan_ids.includes(
                                                p.id,
                                            )}
                                            onChange={(e) =>
                                                form.setData(
                                                    "plan_ids",
                                                    e.target.checked
                                                        ? [
                                                              ...form.data
                                                                  .plan_ids,
                                                              p.id,
                                                          ]
                                                        : form.data.plan_ids.filter(
                                                              (id) =>
                                                                  id !== p.id,
                                                          ),
                                                )
                                            }
                                        />
                                        <span>
                                            <strong>{p.title}</strong>
                                            <small>
                                                {p.reference} · {p.office.code}
                                            </small>
                                        </span>
                                        <b>{money(p.total_cents)}</b>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <Empty
                                title="No PPMPs ready for consolidation"
                                description="PPMPs appear here after approval, until they are assigned to an APP batch."
                            />
                        )}
                        <div className="form-actions">
                            <span>{form.data.plan_ids.length} selected</span>
                            <button
                                className="button"
                                disabled={
                                    form.processing ||
                                    !form.data.plan_ids.length
                                }
                            >
                                Submit APP for approval
                            </button>
                        </div>
                    </form>
                </section>
            )}
            {batches.length ? (
                batches.map((b) => (
                    <section className="panel" key={b.id}>
                        <div className="panel-heading">
                            <div>
                                <h2>{b.title}</h2>
                                <p>
                                    FY {b.fiscal_year} · APP #{b.id} ·{" "}
                                    {b.plans.length} procurement plans
                                </p>
                            </div>
                            <Badge status={b.status} />
                        </div>
                        <div className="table-scroll">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Source plan</th>
                                        <th>Office</th>
                                        <th className="numeric">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {b.plans.map((p) => (
                                        <tr key={p.id}>
                                            <td>
                                                <Link
                                                    className="record-title"
                                                    href={`/plans/${p.id}`}
                                                >
                                                    {p.title}
                                                </Link>
                                                <small>{p.reference}</small>
                                            </td>
                                            <td>{p.office.code}</td>
                                            <td className="numeric">
                                                {money(p.total_cents)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="panel-heading">
                            <strong>
                                Total:{" "}
                                {money(
                                    b.plans.reduce(
                                        (s, p) => s + p.total_cents,
                                        0,
                                    ),
                                )}
                            </strong>
                            {b.status === "submitted" &&
                                auth.user.role === "mayor" && (
                                    <button
                                        className="button"
                                        disabled={approval.processing}
                                        onClick={() =>
                                            approval.post(
                                                `/annual-plans/${b.id}/approve`,
                                            )
                                        }
                                    >
                                        <Check size={17} /> Approve APP
                                    </button>
                                )}
                        </div>
                    </section>
                ))
            ) : (
                <section className="panel">
                    <Empty
                        title="No APP batches yet"
                        description="Procurement can consolidate approved PPMPs into an APP for approval."
                    />
                </section>
            )}
        </>
    );
}
