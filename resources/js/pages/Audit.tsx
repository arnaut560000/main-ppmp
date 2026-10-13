import { Head, Link } from "@inertiajs/react";
import { Heading, Pagination, date, Empty } from "../components/UI";
import type { Event, Paginated } from "../types";
export default function Audit({ events }: { events: Paginated<Event> }) {
    return (
        <>
            <Head title="Activity log" />
            <Heading
                title="Activity log"
                description="A chronological record of who changed what, and the reasons behind decisions."
            />
            <section className="panel">
                {events.data.length ? (
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Person</th>
                                    <th>Action</th>
                                    <th>Record</th>
                                    <th>Comment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.data.map((e) => (
                                    <tr key={e.id}>
                                        <td>{date(e.created_at)}</td>
                                        <td>{e.user?.name || "System"}</td>
                                        <td>
                                            <span className="type-label">
                                                {e.action}
                                            </span>
                                        </td>
                                        <td>
                                            {e.subject_type === "plan" ? (
                                                <Link
                                                    className="text-link"
                                                    href={`/plans/${e.subject_id}`}
                                                >
                                                    Plan #{e.subject_id}
                                                </Link>
                                            ) : (
                                                `${e.subject_type.toUpperCase()} #${e.subject_id}`
                                            )}
                                        </td>
                                        <td className="comment-cell">
                                            {e.comment || "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <Empty title="No events yet" />
                )}
                <Pagination page={events} />
            </section>
        </>
    );
}
