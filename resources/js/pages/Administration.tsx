import { Head, useForm } from "@inertiajs/react";
import { Heading, Field, Errors, roles } from "../components/UI";
import type { Office, User } from "../types";
export default function Administration({
    offices,
    users,
}: {
    offices: Office[];
    users: User[];
}) {
    const office = useForm({ code: "", name: "" });
    const user = useForm({
        name: "",
        email: "",
        password: "",
        role: "office",
        office_id: "",
    });
    return (
        <>
            <Head title="Administration" />
            <Heading
                title="Administration"
                description="Manage access and the offices participating in the planning workflow."
            />
            <div className="dashboard-bottom">
                <section className="panel form-panel">
                    <h2>Create user account</h2>
                    <Errors errors={user.errors} />
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            user.post("/users", {
                                onSuccess: () => user.reset(),
                            });
                        }}
                    >
                        <Field label="Full name">
                            <input
                                required
                                value={user.data.name}
                                onChange={(e) =>
                                    user.setData("name", e.target.value)
                                }
                            />
                        </Field>
                        <Field label="Email">
                            <input
                                required
                                type="email"
                                autoComplete="off"
                                value={user.data.email}
                                onChange={(e) =>
                                    user.setData("email", e.target.value)
                                }
                            />
                        </Field>
                        <Field
                            label="Password"
                            hint="At least 12 characters. Share credentials through your approved internal process."
                        >
                            <input
                                required
                                type="password"
                                minLength={12}
                                autoComplete="new-password"
                                value={user.data.password}
                                onChange={(e) =>
                                    user.setData("password", e.target.value)
                                }
                            />
                        </Field>
                        <div className="form-grid">
                            <Field label="Role">
                                <select
                                    value={user.data.role}
                                    onChange={(e) =>
                                        user.setData("role", e.target.value)
                                    }
                                >
                                    {Object.entries(roles).map(([k, v]) => (
                                        <option key={k} value={k}>
                                            {v}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Office">
                                <select
                                    required={user.data.role === "office"}
                                    value={user.data.office_id}
                                    onChange={(e) =>
                                        user.setData(
                                            "office_id",
                                            e.target.value,
                                        )
                                    }
                                >
                                    <option value="">Select office</option>
                                    {offices.map((o) => (
                                        <option key={o.id} value={o.id}>
                                            {o.code}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        </div>
                        <button className="button" disabled={user.processing}>
                            Create account
                        </button>
                    </form>
                </section>
                <section className="panel form-panel">
                    <h2>Add an office</h2>
                    <Errors errors={office.errors} />
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            office.post("/offices", {
                                onSuccess: () => office.reset(),
                            });
                        }}
                    >
                        <Field label="Office code">
                            <input
                                required
                                maxLength={20}
                                value={office.data.code}
                                onChange={(e) =>
                                    office.setData("code", e.target.value)
                                }
                            />
                        </Field>
                        <Field label="Office name">
                            <input
                                required
                                value={office.data.name}
                                onChange={(e) =>
                                    office.setData("name", e.target.value)
                                }
                            />
                        </Field>
                        <button className="button" disabled={office.processing}>
                            Add office
                        </button>
                    </form>
                    <div className="note spaced">
                        Administrators manage access. Budget and approval
                        decisions remain with their assigned office roles.
                    </div>
                    <div className="office-list">
                        {offices.map((o) => (
                            <div key={o.id}>
                                <strong>{o.code}</strong>
                                <small>{o.name}</small>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
            <section className="panel">
                <div className="panel-heading">
                    <h2>User directory</h2>
                    <span className="muted">{users.length} accounts</span>
                </div>
                <div className="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Office</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td>
                                        <strong>{u.name}</strong>
                                    </td>
                                    <td>{u.email}</td>
                                    <td>{roles[u.role]}</td>
                                    <td>
                                        {u.office?.code || "Municipal-wide"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}
