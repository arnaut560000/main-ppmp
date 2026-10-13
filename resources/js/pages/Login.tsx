import { Head, useForm, usePage } from "@inertiajs/react";
import {
    Landmark,
    ArrowRight,
    ShieldCheck,
    Layers,
    ChartNoAxesCombined,
} from "lucide-react";
import { Errors, Field } from "../components/UI";
import type { Shared } from "../types";
export default function Login() {
    const form = useForm({ email: "", password: "" });
    const { demo } = usePage<Shared>().props;
    return (
        <div className="login">
            <Head title="Sign in" />
            <section className="login-story">
                <div className="brand">
                    <span className="brand-mark">
                        <Landmark />
                    </span>
                    <span>
                        <b>ePPRISM.</b>
                        <small>DIGITALAVERA</small>
                    </span>
                </div>
                <div>
                    <div className="eyebrow">MUNICIPALITY OF TALAVERA</div>
                    <h1>
                        Better planning.
                        <br />
                        Better public service.
                    </h1>
                    <p>
                        One connected workspace for your office’s plans,
                        budgets, and procurement requirements.
                    </p>
                    <div className="login-features">
                        <span>
                            <Layers />
                            Plan with clarity
                        </span>
                        <span>
                            <ChartNoAxesCombined />
                            Keep budgets in view
                        </span>
                        <span>
                            <ShieldCheck />
                            Make every approval traceable
                        </span>
                    </div>
                </div>
                <small>
                    Electronic Planning, Procurement, Resource & Inventory
                    Management
                </small>
            </section>
            <section className="login-form">
                <div>
                    <span className="eyebrow">YOUR PLANNING WORKSPACE</span>
                    <h2>Welcome back</h2>
                    <p>Sign in with your assigned office account.</p>
                    <Errors errors={form.errors} />
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.post("/login", {
                                onFinish: () => form.reset("password"),
                            });
                        }}
                    >
                        <Field label="Email address">
                            <input
                                type="email"
                                autoComplete="username"
                                required
                                value={form.data.email}
                                onChange={(e) =>
                                    form.setData("email", e.target.value)
                                }
                                placeholder="you@your-office.gov.ph"
                            />
                        </Field>
                        <Field label="Password">
                            <input
                                type="password"
                                autoComplete="current-password"
                                required
                                value={form.data.password}
                                onChange={(e) =>
                                    form.setData("password", e.target.value)
                                }
                            />
                        </Field>
                        <button
                            className="button wide"
                            disabled={form.processing}
                        >
                            Sign in <ArrowRight size={18} />
                        </button>
                    </form>
                    <p className="login-help">
                        Need access? Contact your system administrator.
                    </p>
                    {demo && (
                        <div className="note">
                            <strong>Local demonstration</strong>
                            <p>
                                Use an account listed in the project README. All
                                sample amounts are illustrative.
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
