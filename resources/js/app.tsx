import React from "react";
import { createRoot } from "react-dom/client";
import { createInertiaApp } from "@inertiajs/react";
import Layout from "./components/Layout";
import "../css/app.css";
createInertiaApp({
    title: (title) => `${title} · ePPRISM`,
    resolve: async (name) => {
        const pages = import.meta.glob<{
            default: React.ComponentType & {
                layout?: (page: React.ReactNode) => React.ReactNode;
            };
        }>("./pages/*.tsx");
        const page = await pages[`./pages/${name}.tsx`]();
        if (name !== "Login")
            page.default.layout = (page) => <Layout>{page}</Layout>;
        return page;
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    progress: { color: "#c6a763" },
});
