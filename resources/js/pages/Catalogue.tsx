import { Head, useForm } from "@inertiajs/react";
import { Plus, Search, Pencil, X, Package } from "lucide-react";
import { useState } from "react";
import { Heading, Field, Errors, money, Empty } from "../components/UI";
import type { Item } from "../types";
export default function Catalogue({
    items,
    canManage,
}: {
    items: Item[];
    canManage: boolean;
}) {
    const [search, setSearch] = useState("");
    const [editing, setEditing] = useState<number | null>(null);
    const [show, setShow] = useState(false);
    const blank = {
        code: "",
        name: "",
        specification: "",
        unit: "piece",
        category: "Office supplies",
        expense_class: "MOOE",
        price: "",
        active: true,
    };
    const form = useForm(blank);
    const filtered = items.filter((i) =>
        `${i.code} ${i.name} ${i.category}`
            .toLowerCase()
            .includes(search.toLowerCase()),
    );
    const open = (item?: Item) => {
        setEditing(item?.id || null);
        form.clearErrors();
        form.setData(
            item
                ? {
                      code: item.code,
                      name: item.name,
                      specification: item.specification || "",
                      unit: item.unit,
                      category: item.category,
                      expense_class: item.expense_class,
                      price: String(item.price_cents / 100),
                      active: item.active,
                  }
                : blank,
        );
        setShow(true);
    };
    return (
        <>
            <Head title="Item catalogue" />
            <Heading
                title="Item catalogue"
                description="A shared source of item specifications, units, and estimated prices."
                actions={
                    canManage && (
                        <button className="button" onClick={() => open()}>
                            <Plus size={17} /> Add item
                        </button>
                    )
                }
            />
            <div className="compact-metrics">
                <span>
                    <Package size={18} />
                    <b>{items.length}</b> catalogue items
                </span>
                <span>
                    <b>{items.filter((i) => i.active).length}</b> active
                </span>
                <span>Prices in Philippine pesos</span>
            </div>
            {show && (
                <section className="panel form-panel">
                    <div className="panel-heading flush">
                        <h2>
                            {editing
                                ? "Edit catalogue item"
                                : "New catalogue item"}
                        </h2>
                        <button
                            className="icon-button"
                            aria-label="Close item form"
                            onClick={() => setShow(false)}
                        >
                            <X size={18} />
                        </button>
                    </div>
                    <Errors errors={form.errors} />
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const opts = { onSuccess: () => setShow(false) };
                            editing
                                ? form.put(`/catalogue/${editing}`, opts)
                                : form.post("/catalogue", opts);
                        }}
                    >
                        <div className="form-grid">
                            <Field label="Item code">
                                <input
                                    required
                                    value={form.data.code}
                                    onChange={(e) =>
                                        form.setData("code", e.target.value)
                                    }
                                />
                            </Field>
                            <Field label="Article / item name">
                                <input
                                    required
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData("name", e.target.value)
                                    }
                                />
                            </Field>
                            <Field label="Category">
                                <input
                                    required
                                    value={form.data.category}
                                    onChange={(e) =>
                                        form.setData("category", e.target.value)
                                    }
                                />
                            </Field>
                            <Field label="Unit of measure">
                                <input
                                    required
                                    value={form.data.unit}
                                    onChange={(e) =>
                                        form.setData("unit", e.target.value)
                                    }
                                />
                            </Field>
                            <Field label="Expense class">
                                <select
                                    value={form.data.expense_class}
                                    onChange={(e) =>
                                        form.setData(
                                            "expense_class",
                                            e.target.value,
                                        )
                                    }
                                >
                                    <option>MOOE</option>
                                    <option>CO</option>
                                </select>
                            </Field>
                            <Field label="Estimated unit price (PHP)">
                                <input
                                    required
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={form.data.price}
                                    onChange={(e) =>
                                        form.setData("price", e.target.value)
                                    }
                                />
                            </Field>
                        </div>
                        <Field label="Specifications">
                            <textarea
                                rows={2}
                                value={form.data.specification}
                                onChange={(e) =>
                                    form.setData(
                                        "specification",
                                        e.target.value,
                                    )
                                }
                            />
                        </Field>
                        <div className="form-actions">
                            <label className="checkbox">
                                <input
                                    type="checkbox"
                                    checked={form.data.active}
                                    onChange={(e) =>
                                        form.setData("active", e.target.checked)
                                    }
                                />{" "}
                                Available for new plans
                            </label>
                            <button
                                className="button"
                                disabled={form.processing}
                            >
                                Save item
                            </button>
                        </div>
                    </form>
                </section>
            )}
            <section className="panel">
                <div className="toolbar">
                    <div className="search-input">
                        <Search size={17} />
                        <input
                            aria-label="Search catalogue"
                            placeholder="Search items, codes, or categories…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <span className="muted">{filtered.length} items</span>
                </div>
                {filtered.length ? (
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Item / specification</th>
                                    <th>Category</th>
                                    <th>Unit</th>
                                    <th className="numeric">Unit price</th>
                                    <th>Status</th>
                                    {canManage && <th />}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((i) => (
                                    <tr key={i.id}>
                                        <td>
                                            <strong>{i.name}</strong>
                                            <small>
                                                {i.code} · {i.specification}
                                            </small>
                                        </td>
                                        <td>
                                            {i.category}
                                            <small>{i.expense_class}</small>
                                        </td>
                                        <td>{i.unit}</td>
                                        <td className="numeric amount">
                                            {money(i.price_cents)}
                                        </td>
                                        <td>
                                            <span
                                                className={`badge ${i.active ? "approved" : "draft"}`}
                                            >
                                                <i />
                                                {i.active
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </td>
                                        {canManage && (
                                            <td>
                                                <button
                                                    className="icon-button"
                                                    aria-label={`Edit ${i.name}`}
                                                    onClick={() => open(i)}
                                                >
                                                    <Pencil size={16} />
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
                        title="No matching items"
                        description="Try another search or add a catalogue item."
                    />
                )}
            </section>
        </>
    );
}
