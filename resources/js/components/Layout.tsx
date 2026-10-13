import { Link, usePage } from "@inertiajs/react";
import {
    Landmark,
    LayoutDashboard,
    Wallet,
    BookOpen,
    Files,
    ClipboardCheck,
    Layers,
    History,
    Settings,
    LogOut,
    Menu,
    X,
    ShieldCheck,
    ChevronRight,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Shared } from "../types";
import { roles } from "./UI";
export default function Layout({ children }: { children: ReactNode }) {
    const { auth, flash, demo } = usePage<Shared>().props;
    const { url } = usePage();
    const [open, setOpen] = useState(false);
    const entries = [
        { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
        {
            href: "/plans?type=aip",
            label: "Annual investment plans",
            icon: Files,
        },
        { href: "/plans?type=ppmp", label: "Procurement plans", icon: Layers },
        {
            href: "/reports/consolidated-ppmp",
            label: "Consolidated PPMP",
            icon: BookOpen,
        },
        {
            href: "/plans?status=submitted",
            label: "Review & approvals",
            icon: ClipboardCheck,
        },
        ...(["admin", "procurement", "mayor", "budget"].includes(auth.user.role)
            ? [
                  {
                      href: "/annual-plans",
                      label: "APP consolidation",
                      icon: BookOpen,
                  },
              ]
            : []),
        { href: "/budgets", label: "Office budgets", icon: Wallet },
        { href: "/catalogue", label: "Item catalogue", icon: BookOpen },
        { href: "/audit", label: "Activity log", icon: History },
        ...(auth.user.role === "admin"
            ? [
                  {
                      href: "/administration",
                      label: "Administration",
                      icon: Settings,
                  },
              ]
            : []),
    ];
    const active = (href: string) =>
        href.includes("?")
            ? url === href || url.startsWith(href + "&")
            : url.split("?")[0] === href;
    return (
        <div className="app-shell">
            {open && (
                <button
                    className="scrim"
                    aria-label="Close navigation"
                    onClick={() => setOpen(false)}
                />
            )}
            <aside className={`sidebar ${open ? "open" : ""}`}>
                <Link href="/dashboard" className="brand">
                    <span className="brand-mark">
                        <Landmark size={27} />
                    </span>
                    <span>
                        <b>
                            ePPRISM<span className="brand-dot">.</span>
                        </b>
                        <small>DIGITALAVERA</small>
                    </span>
                </Link>
                <button
                    className="close-menu icon-button"
                    aria-label="Close menu"
                    onClick={() => setOpen(false)}
                >
                    <X />
                </button>
                <div className="workspace-label">MUNICIPALITY OF TALAVERA</div>
                <nav>
                    {entries.map(({ href, label, icon: Icon }, i) => (
                        <div key={href}>
                            {i === 5 && <div className="nav-divider" />}
                            <Link
                                className={
                                    active(href)
                                        ? "nav-link active"
                                        : "nav-link"
                                }
                                href={href}
                                onClick={() => setOpen(false)}
                            >
                                <Icon size={18} />
                                <span>{label}</span>
                                {active(href) && <ChevronRight size={14} />}
                            </Link>
                        </div>
                    ))}
                </nav>
                <div className="sidebar-bottom">
                    <div className="security-note">
                        <ShieldCheck size={18} />
                        <span>
                            Accountable planning.
                            <br />
                            <b>Connected public service.</b>
                        </span>
                    </div>
                    <div className="user-card">
                        <span className="avatar">
                            {auth.user.name
                                .split(" ")
                                .slice(0, 2)
                                .map((n) => n[0])
                                .join("")}
                        </span>
                        <div>
                            <strong>{auth.user.name}</strong>
                            <small>{roles[auth.user.role]}</small>
                        </div>
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            aria-label="Sign out"
                            className="logout"
                        >
                            <LogOut size={17} />
                        </Link>
                    </div>
                </div>
            </aside>
            <div className="main-shell">
                <header className="topbar">
                    <div className="actions">
                        <button
                            className="mobile-menu icon-button"
                            aria-label="Open navigation"
                            onClick={() => setOpen(true)}
                        >
                            <Menu />
                        </button>
                        <span className="breadcrumb">
                            Workspace <ChevronRight size={14} />{" "}
                            <strong>
                                {entries.find((e) => active(e.href))?.label ||
                                    "Plan details"}
                            </strong>
                        </span>
                    </div>
                    <span className="environment">
                        <i />
                        {demo ? "Local demonstration" : "Planning portal"}
                    </span>
                </header>
                <main>
                    {flash.success && (
                        <div className="success" role="status">
                            <ShieldCheck size={18} />
                            {flash.success}
                        </div>
                    )}
                    {children}
                    <footer className="footer">
                        <span>DIGITALavera ePPRISM</span>
                        <span>
                            {demo
                                ? "Illustrative data · Planning MVP"
                                : "Electronic Planning, Procurement, Resource & Inventory Management"}
                        </span>
                    </footer>
                </main>
            </div>
        </div>
    );
}
