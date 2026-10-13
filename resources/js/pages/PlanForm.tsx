import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { Heading, Field, Errors, money } from "../components/UI";
import type { Item, Office, Plan } from "../types";
type Props = {
    plan: Plan | null;
    offices: Office[];
    catalogue: Item[];
    parents: Plan[];
    initialType: "aip" | "ppmp";
    initialParentId: number;
};
export default function PlanForm({
    plan,
    offices,
    catalogue,
    parents,
    initialType,
    initialParentId,
}: Props) {
    const [selected, setSelected] = useState("");
    const type = plan?.type || initialType;
    const linkedParent = parents.find((p) => p.id === initialParentId);
    const form = useForm({
        type,
        office_id: String(
            plan?.office_id || linkedParent?.office_id || offices[0]?.id || "",
        ),
        fiscal_year: String(
            plan?.fiscal_year || linkedParent?.fiscal_year || 2027,
        ),
        reference: plan?.reference || "",
        title: plan?.title || "",
        description: plan?.description || "",
        fund_source: plan?.fund_source || "General Fund",
        expected_output: plan?.expected_output || "",
        start_date: plan?.start_date || "2027-01-01",
        end_date: plan?.end_date || "2027-12-31",
        parent_id: String(plan?.parent_id || linkedParent?.id || ""),
        version: plan?.version || 1,
        ps: String((plan?.ps_cents || 0) / 100),
        mooe: String((plan?.mooe_cents || 0) / 100),
        fe: String((plan?.fe_cents || 0) / 100),
        co: String((plan?.co_cents || 0) / 100),
        items:
            plan?.items.map((i) => ({
                catalogue_item_id: i.catalogue_item_id,
                quarterly_quantities: i.quarterly_quantities,
            })) || [],
    });
    const availableParents = parents.filter(
        (p) =>
            p.office_id === Number(form.data.office_id) &&
            p.fiscal_year === Number(form.data.fiscal_year),
    );
    const total =
        type === "aip"
            ? ["ps", "mooe", "fe", "co"].reduce(
                  (s, k) =>
                      s + Math.round(Number(form.data[k as "ps"] || 0) * 100),
                  0,
              )
            : form.data.items.reduce(
                  (s, line) =>
                      s +
                      (catalogue.find((i) => i.id === line.catalogue_item_id)
                          ?.price_cents || 0) *
                          line.quarterly_quantities.reduce((a, b) => a + b, 0),
                  0,
              );
    const quarters = [
        "Q1 (Jan–Mar)",
        "Q2 (Apr–Jun)",
        "Q3 (Jul–Sep)",
        "Q4 (Oct–Dec)",
    ];
    return (
        <>
            <Head title={plan ? "Edit plan" : "Create plan"} />
            <Link
                className="back-link"
                href={plan ? `/plans/${plan.id}` : "/plans"}
            >
                <ArrowLeft size={15} /> Back to {plan ? "plan" : "plans"}
            </Link>
            <Heading
                title={`${plan ? "Edit" : "Create"} ${type.toUpperCase()}`}
                description={
                    type === "aip"
                        ? "Define the activity, expected output, and proposed allocation."
                        : "Link requirements to an approved AIP and schedule quantities by quarter."
                }
            />
            <Errors errors={form.errors} />
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    plan ? form.put(`/plans/${plan.id}`) : form.post("/plans");
                }}
            >
                <section className="panel form-panel">
                    <div className="section-title">
                        <span>01</span>
                        <div>
                            <h2>Plan details</h2>
                            <p>
                                Information used across the planning workflow.
                            </p>
                        </div>
                    </div>
                    <div className="form-grid">
                        <Field label="Office">
                            <select
                                disabled={!!plan}
                                required
                                value={form.data.office_id}
                                onChange={(e) =>
                                    form.setData("office_id", e.target.value)
                                }
                            >
                                {offices.map((o) => (
                                    <option key={o.id} value={o.id}>
                                        {o.code} — {o.name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Fiscal year">
                            <input
                                type="number"
                                min="2020"
                                max="2100"
                                disabled={!!plan}
                                required
                                value={form.data.fiscal_year}
                                onChange={(e) =>
                                    form.setData("fiscal_year", e.target.value)
                                }
                            />
                        </Field>
                        <Field label="Reference code">
                            <input
                                required
                                maxLength={80}
                                value={form.data.reference}
                                onChange={(e) =>
                                    form.setData("reference", e.target.value)
                                }
                                placeholder="e.g. 2027-ICT-004"
                            />
                        </Field>
                        <Field label="Fund source">
                            <input
                                required
                                maxLength={120}
                                value={form.data.fund_source}
                                onChange={(e) =>
                                    form.setData("fund_source", e.target.value)
                                }
                            />
                        </Field>
                    </div>
                    {type === "ppmp" && (
                        <Field
                            label="Approved AIP / activity"
                            hint="Only approved AIPs in the same office and fiscal year are available."
                        >
                            <select
                                required
                                value={form.data.parent_id}
                                onChange={(e) =>
                                    form.setData("parent_id", e.target.value)
                                }
                            >
                                <option value="">Select an approved AIP</option>
                                {availableParents.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.reference} — {p.title}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    )}
                    <Field label="Program / project / activity title">
                        <input
                            required
                            maxLength={255}
                            value={form.data.title}
                            onChange={(e) =>
                                form.setData("title", e.target.value)
                            }
                            placeholder="What will this plan deliver?"
                        />
                    </Field>
                    <Field label="Description">
                        <textarea
                            rows={3}
                            value={form.data.description}
                            onChange={(e) =>
                                form.setData("description", e.target.value)
                            }
                        />
                    </Field>
                    <div className="form-grid">
                        <Field label="Start date">
                            <input
                                required
                                type="date"
                                value={form.data.start_date}
                                onChange={(e) =>
                                    form.setData("start_date", e.target.value)
                                }
                            />
                        </Field>
                        <Field label="Completion date">
                            <input
                                required
                                type="date"
                                min={form.data.start_date}
                                value={form.data.end_date}
                                onChange={(e) =>
                                    form.setData("end_date", e.target.value)
                                }
                            />
                        </Field>
                    </div>
                    <Field label="Expected output">
                        <textarea
                            rows={2}
                            value={form.data.expected_output}
                            onChange={(e) =>
                                form.setData("expected_output", e.target.value)
                            }
                            placeholder="Describe the measurable result."
                        />
                    </Field>
                </section>
                <section className="panel form-panel">
                    <div className="section-title">
                        <span>02</span>
                        <div>
                            <h2>
                                {type === "aip"
                                    ? "Proposed allocation"
                                    : "Item requirements"}
                            </h2>
                            <p>
                                {type === "aip"
                                    ? "Enter amounts in Philippine pesos."
                                    : "Draft saves use current catalogue prices. Submitted and approved prices remain fixed."}
                            </p>
                        </div>
                    </div>
                    {type === "aip" ? (
                        <div className="form-grid four">
                            {(
                                [
                                    ["ps", "Personal Services (PS)"],
                                    ["mooe", "Operating Expenses (MOOE)"],
                                    ["fe", "Financial Expenses (FE)"],
                                    ["co", "Capital Outlay (CO)"],
                                ] as const
                            ).map(([key, label]) => (
                                <Field key={key} label={label}>
                                    <input
                                        type="number"
                                        min="0"
                                        max="1000000000"
                                        step="0.01"
                                        required
                                        value={form.data[key]}
                                        onChange={(e) =>
                                            form.setData(key, e.target.value)
                                        }
                                    />
                                </Field>
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="add-item">
                                <select
                                    aria-label="Catalogue item"
                                    value={selected}
                                    onChange={(e) =>
                                        setSelected(e.target.value)
                                    }
                                >
                                    <option value="">
                                        Select an item from the catalogue…
                                    </option>
                                    {catalogue
                                        .filter(
                                            (c) =>
                                                !form.data.items.some(
                                                    (i) =>
                                                        i.catalogue_item_id ===
                                                        c.id,
                                                ),
                                        )
                                        .map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.code} · {c.name} ·{" "}
                                                {money(c.price_cents)}/{c.unit}
                                            </option>
                                        ))}
                                </select>
                                <button
                                    type="button"
                                    className="button secondary"
                                    disabled={!selected}
                                    onClick={() => {
                                        form.setData("items", [
                                            ...form.data.items,
                                            {
                                                catalogue_item_id:
                                                    Number(selected),
                                                quarterly_quantities:
                                                    Array(4).fill(0),
                                            },
                                        ]);
                                        setSelected("");
                                    }}
                                >
                                    <Plus size={16} /> Add item
                                </button>
                            </div>
                            {!form.data.items.length && (
                                <div className="note">
                                    Add your first item, then enter quantities
                                    in the quarters when you need it.
                                </div>
                            )}
                            {form.data.items.map((line, index) => {
                                const item = catalogue.find(
                                    (c) => c.id === line.catalogue_item_id,
                                );
                                return (
                                    <div
                                        className="requirement"
                                        key={line.catalogue_item_id}
                                    >
                                        <div className="requirement-heading">
                                            <div>
                                                <strong>
                                                    {item?.name ||
                                                        plan?.items.find(
                                                            (i) =>
                                                                i.catalogue_item_id ===
                                                                line.catalogue_item_id,
                                                        )?.name ||
                                                        "Unavailable item"}
                                                </strong>
                                                <small>
                                                    {item
                                                        ? `${item.code} · ${item.unit} · ${money(item.price_cents)} · ${item.expense_class}`
                                                        : "Item is inactive. Remove it or ask GSO to reactivate it."}
                                                </small>
                                            </div>
                                            <button
                                                type="button"
                                                className="icon-button danger"
                                                aria-label={`Remove ${item?.name || "item"}`}
                                                onClick={() =>
                                                    form.setData(
                                                        "items",
                                                        form.data.items.filter(
                                                            (_, i) =>
                                                                i !== index,
                                                        ),
                                                    )
                                                }
                                            >
                                                <Trash2 size={17} />
                                            </button>
                                        </div>
                                        <div className="quarters-grid">
                                            {quarters.map((m, quarter) => (
                                                <label key={m}>
                                                    {m}
                                                    <input
                                                        aria-label={`${item?.name || "Item"} ${m} quantity`}
                                                        type="number"
                                                        min="0"
                                                        max="300000"
                                                        step="1"
                                                        required
                                                        value={
                                                            line
                                                                .quarterly_quantities[
                                                                quarter
                                                            ]
                                                        }
                                                        onChange={(e) =>
                                                            form.setData(
                                                                "items",
                                                                form.data.items.map(
                                                                    (l, i) =>
                                                                        i ===
                                                                        index
                                                                            ? {
                                                                                  ...l,
                                                                                  quarterly_quantities:
                                                                                      l.quarterly_quantities.map(
                                                                                          (
                                                                                              q,
                                                                                              j,
                                                                                          ) =>
                                                                                              j ===
                                                                                              quarter
                                                                                                  ? Number(
                                                                                                        e
                                                                                                            .target
                                                                                                            .value,
                                                                                                    )
                                                                                                  : q,
                                                                                      ),
                                                                              }
                                                                            : l,
                                                                ),
                                                            )
                                                        }
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                        <div className="requirement-total">
                                            {[0, 1, 2, 3].map((q) => (
                                                <span key={q}>
                                                    Q{q + 1}:{" "}
                                                    <b>
                                                        {money(
                                                            line
                                                                .quarterly_quantities[
                                                                q
                                                            ] *
                                                                (item?.price_cents ||
                                                                    0),
                                                        )}
                                                    </b>
                                                </span>
                                            ))}
                                            <strong>
                                                {money(
                                                    (item?.price_cents || 0) *
                                                        line.quarterly_quantities.reduce(
                                                            (a, b) => a + b,
                                                            0,
                                                        ),
                                                )}
                                            </strong>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </section>
                <div className="save-bar">
                    <div>
                        <span>Total proposed amount</span>
                        <strong>{money(total)}</strong>
                    </div>
                    <div className="actions">
                        <Link
                            className="button secondary"
                            href={plan ? `/plans/${plan.id}` : "/plans"}
                        >
                            Cancel
                        </Link>
                        <button className="button" disabled={form.processing}>
                            <Save size={17} />
                            {form.processing ? "Saving…" : "Save draft"}
                        </button>
                    </div>
                </div>
            </form>
        </>
    );
}
