import { Head, router, useForm } from "@inertiajs/react";
import { Plus, Wallet } from "lucide-react";
import { useState } from "react";
import { Heading, Field, Errors, money, Empty } from "../components/UI";
import type { Budget, Office } from "../types";
export default function Budgets({
    year,
    budgets,
    offices,
    canManage,
}: {
    year: number;
    budgets: Budget[];
    offices: Office[];
    canManage: boolean;
}) {
    const [show, setShow] = useState(false);
    const form = useForm({
        office_id: String(offices[0]?.id || ""),
        fiscal_year: year,
        ceiling: "",
        comment: "",
    });
    const open = (b?: Budget) => {
        form.setData({
            office_id: String(b?.office_id || offices[0]?.id || ""),
            fiscal_year: year,
            ceiling: b ? String(b.ceiling_cents / 100) : "",
            comment: "",
        });
        form.clearErrors();
        setShow(true);
    };
    return (
        <>
            <Head title="Office budgets" />
            <Heading
                title="Office budgets"
                description="Set the boundaries for responsible planning, one office at a time."
                actions={
                    <>
                        <select
                            aria-label="Fiscal year"
                            value={year}
                            onChange={(e) =>
                                router.get("/budgets", { year: e.target.value })
                            }
                        >
                            {[2026, 2027, 2028, 2029].map((y) => (
                                <option key={y} value={y}>
                                    FY {y}
                                </option>
                            ))}
                        </select>
                        {canManage && (
                            <button className="button" onClick={() => open()}>
                                <Plus size={16} /> Set allocation
                            </button>
                        )}
                    </>
                }
            />
            <div className="note">
                <Wallet size={20} />
                <p>
                    <strong>Planning balance</strong> is the ceiling less
                    submitted and approved AIP amounts. Procurement plans draw
                    from their linked AIP, so they are not deducted twice. This
                    is separate from obligations and payments.
                </p>
            </div>
            {show && (
                <section className="panel form-panel">
                    <h2>Set office allocation</h2>
                    <Errors errors={form.errors} />
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.post("/budgets", {
                                onSuccess: () => setShow(false),
                            });
                        }}
                    >
                        <div className="form-grid">
                            <Field label="Office">
                                <select
                                    value={form.data.office_id}
                                    onChange={(e) =>
                                        form.setData(
                                            "office_id",
                                            e.target.value,
                                        )
                                    }
                                >
                                    {offices.map((o) => (
                                        <option key={o.id} value={o.id}>
                                            {o.code} — {o.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label={`Ceiling for FY ${year} (PHP)`}>
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.data.ceiling}
                                    onChange={(e) =>
                                        form.setData("ceiling", e.target.value)
                                    }
                                />
                            </Field>
                        </div>
                        <Field label="Reason / allocation reference">
                            <textarea
                                required
                                rows={2}
                                value={form.data.comment}
                                onChange={(e) =>
                                    form.setData("comment", e.target.value)
                                }
                                placeholder="Record the basis of this allocation or adjustment."
                            />
                        </Field>
                        <div className="actions">
                            <button
                                className="button"
                                disabled={form.processing}
                            >
                                Save allocation
                            </button>
                            <button
                                type="button"
                                className="button secondary"
                                onClick={() => setShow(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </section>
            )}
            <section className="panel">
                {budgets.length ? (
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Office</th>
                                    <th className="numeric">Budget ceiling</th>
                                    <th className="numeric">AIP allocations</th>
                                    <th className="numeric">Available</th>
                                    {canManage && <th />}
                                </tr>
                            </thead>
                            <tbody>
                                {budgets.map((b) => (
                                    <tr key={b.id}>
                                        <td>
                                            <strong>{b.office.code}</strong>
                                            <small>{b.office.name}</small>
                                        </td>
                                        <td className="numeric">
                                            {money(b.ceiling_cents)}
                                        </td>
                                        <td className="numeric">
                                            {money(b.reserved_cents)}
                                        </td>
                                        <td className="numeric amount green">
                                            {money(b.available_cents)}
                                        </td>
                                        {canManage && (
                                            <td>
                                                <button
                                                    className="button secondary small"
                                                    onClick={() => open(b)}
                                                >
                                                    Adjust
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <Empty
                        title="No allocations for this year"
                        description="The Budget Office can set an allocation to begin planning."
                    />
                )}
            </section>
        </>
    );
}
