# ePPRISM delivery roadmap

## Delivered: initial planning slice

Laravel/React application, authentication, office accounts, budgets, catalogue, AIP activities, PPMP item schedules, AIP/PPMP review, basic APP batching/approval, audit records, CSV and print summaries. The pilot database is synthetic demonstration data.

The current AIP record represents one PPA/activity, not an entire municipal AIP header. Multiple office/year activities form the working AIP list. PPMPs currently represent item schedules; formal procurement projects/packages will be modeled separately.

## Next: complete planning requirements

- Confirm approval routing, separation of preparation/review/signature, and authority delegation. Current Budget → AIP and Mayor → PPMP/APP rules are provisional interpretations of the supplied context diagram.
- Add fiscal-year administration, deadlines, planning cycles, and office division hierarchy.
- Add AIP sector/subsector, climate-change tagging, performance indicators, physical targets, historical accomplishments, and appropriated/obligated comparisons from the workbook.
- Add procurement project/package details, mode, fund allocation splits, timelines, and attachment support.
- Add full APP preparation, returns/rejection, cancellation, amendments, and versioned snapshots. Preserve prior membership when revising APP batches.
- Add user deactivation, credential reset, forced initial password change, MFA, and configurable signatory assignments.
- Improve large-catalogue lookup with server pagination/search and bulk line entry.
- Add approval notifications and signed-off official templates for AIP, PPMP, APP, PR, and LBP-2. Treat application approvals separately from legally recognized digital signatures.
- Build a preview-first Excel import with row-level errors, duplicate checks, source references, and reconciled totals. Resolve the source workbook's broken references, external dependencies, and year-label inconsistencies before import. Do not copy its formula errors into production data.

## Procurement

PRs, suppliers, RFQs, quotations, abstracts, purchase orders, procurement modes/milestones, partial awards, cancellation, and supporting documents. Confirm the roles of Accounting and Treasury for obligations, cash availability, and vouchers. No automatic payment or obligation is triggered by the current planning approvals.

## Inventory and property

Separate supplier delivery and inspection/acceptance from RIS stock issuance. Implement partial receipts, stock ledgers, adjustments, returns, locations, custodians, property accountability, and reconciliation. Distinguish consumables, equipment, and services/subscriptions so non-stock purchases do not create stock.

## Pilot and integrations

Start with ICT/PIO. Validate one full planning cycle with Budget, GSO, BAC, and the approving authority. Then test procurement and inventory independently before expanding office access. DBM/COA/PhilGEPS/LGU finance integrations need confirmed interfaces, credentials, ownership, and data exchange contracts. No external integrations are active in this build.

## Data relationships

Office + fiscal year → budget envelope → AIP activity → PPMP → monthly item schedules.

Approved PPMPs → APP batch. Future procurement records will refer to approved PPMP requirements and procurement package allocations, followed by receipts and stock/property transactions.

Budget allocation checks use a shared office/year row lock and document version counter. Production database concurrency, restore drills, and operational hardening must be validated before real financial records are entered.
