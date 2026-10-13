<?php

namespace App\Http\Controllers;

use App\Models\AuditEvent;
use App\Models\CatalogueItem;
use App\Models\Office;
use App\Models\Plan;
use App\Services\PlanningAccess;
use App\Services\PlanningService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PlanController extends Controller
{
    public function index(Request $r)
    {
        $filters = $r->validate(['type' => ['nullable', Rule::in(['aip', 'ppmp'])], 'status' => ['nullable', Rule::in(['draft', 'submitted', 'approved', 'returned'])], 'search' => 'nullable|string|max:100', 'year' => 'nullable|integer|min:2020|max:2100']);
        $query = Plan::visibleTo($r->user())->with('office')->orderByDesc('updated_at');
        foreach (['type', 'status'] as $key) {
            if (! empty($filters[$key])) {
                $query->where($key, $filters[$key]);
            }
        }
        if (! empty($filters['year'])) {
            $query->where('fiscal_year', $filters['year']);
        }
        if (! empty($filters['search'])) {
            $query->where(fn ($q) => $q->where('title', 'like', '%'.$filters['search'].'%')->orWhere('reference', 'like', '%'.$filters['search'].'%'));
        }

        return Inertia::render('Plans', ['plans' => $query->paginate(12)->withQueryString(), 'filters' => $filters]);
    }

    private function formProps(Request $r, ?Plan $plan = null): array
    {
        $offices = Office::when($r->user()->role === 'office', fn ($q) => $q->whereKey($r->user()->office_id))->orderBy('name')->get();

        return ['plan' => $plan?->load('items'), 'offices' => $offices, 'catalogue' => CatalogueItem::where('active', true)->orderBy('name')->get(), 'parents' => Plan::visibleTo($r->user())->where('type', 'aip')->where('status', 'approved')->get(['id', 'office_id', 'fiscal_year', 'reference', 'title', 'mooe_cents', 'co_cents']), 'initialType' => $r->query('type') === 'ppmp' ? 'ppmp' : 'aip', 'initialParentId' => $r->integer('parent')];
    }

    public function create(Request $r)
    {
        PlanningAccess::roles($r->user(), ['admin', 'office']);

        return Inertia::render('PlanForm', $this->formProps($r));
    }

    public function edit(Request $r, Plan $plan)
    {
        PlanningAccess::edit($r->user(), $plan);

        return Inertia::render('PlanForm', $this->formProps($r, $plan));
    }

    private function validated(Request $r, ?Plan $plan = null): array
    {
        if ($plan) {
            PlanningAccess::edit($r->user(), $plan);
            $r->merge(['type' => $plan->type, 'office_id' => $plan->office_id, 'fiscal_year' => $plan->fiscal_year]);
        }

        return $r->validate([
            'type' => ['required', Rule::in(['aip', 'ppmp'])], 'office_id' => 'required|integer|exists:offices,id', 'fiscal_year' => 'required|integer|min:2020|max:2100',
            'reference' => ['required', 'string', 'max:80', Rule::unique('plans')->where('office_id', $r->input('office_id'))->where('fiscal_year', $r->input('fiscal_year'))->where('type', $r->input('type'))->ignore($plan?->id)],
            'title' => 'required|string|max:255', 'description' => 'nullable|string|max:5000', 'fund_source' => 'required|string|max:120', 'expected_output' => 'nullable|string|max:3000',
            'start_date' => 'required|date_format:Y-m-d', 'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date', 'parent_id' => 'nullable|integer|exists:plans,id',
            'version' => [$plan ? 'required' : 'nullable', 'integer', 'min:1'],
            'ps' => 'nullable|numeric|min:0|max:1000000000|decimal:0,2', 'mooe' => 'nullable|numeric|min:0|max:1000000000|decimal:0,2', 'fe' => 'nullable|numeric|min:0|max:1000000000|decimal:0,2', 'co' => 'nullable|numeric|min:0|max:1000000000|decimal:0,2',
            'items' => 'nullable|array|list|max:200', 'items.*.catalogue_item_id' => 'required|integer|distinct|exists:catalogue_items,id',
            'items.*.monthly_quantities' => 'required|array|list|size:12', 'items.*.monthly_quantities.*' => 'required|integer|min:0|max:100000',
        ]);
    }

    public function store(Request $r, PlanningService $service)
    {
        $plan = $service->save($r->user(), $this->validated($r));

        return redirect('/plans/'.$plan->id)->with('success', 'Draft saved. Review it before submitting.');
    }

    public function update(Request $r, Plan $plan, PlanningService $service)
    {
        $service->save($r->user(), $this->validated($r, $plan), $plan);

        return redirect('/plans/'.$plan->id)->with('success', 'Plan updated.');
    }

    public function show(Request $r, Plan $plan)
    {
        PlanningAccess::view($r->user(), $plan);

        return Inertia::render('PlanDetail', ['plan' => $plan->load(['office', 'items', 'parent', 'creator']), 'history' => AuditEvent::with('user:id,name')->where('subject_type', 'plan')->where('subject_id', $plan->id)->latest('id')->get()]);
    }

    public function transition(Request $r, Plan $plan, PlanningService $service)
    {
        $data = $r->validate(['action' => ['required', Rule::in(['submit', 'approve', 'return'])], 'version' => 'required|integer', 'comment' => 'nullable|string|max:2000']);
        $service->transition($r->user(), $plan, $data['action'], $data['version'], $data['comment'] ?? null);

        return back()->with('success', 'Document '.$plan->fresh()->status.'.');
    }

    public function export(Request $r, Plan $plan)
    {
        PlanningAccess::view($r->user(), $plan);
        $plan->load('items', 'office');

        return response()->streamDownload(function () use ($plan) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            $write = function ($row) use ($out) {
                fputcsv($out, array_map(fn ($v) => is_string($v) && preg_match('/^[=+@\-\t\r]/', $v) ? "'".$v : $v, $row));
            };
            $write(['ePPRISM planning export', strtoupper($plan->type), $plan->reference, $plan->status]);
            $write(['Office', $plan->office->name, 'Fiscal year', $plan->fiscal_year]);
            $write(['Title', $plan->title]);
            $write(['Fund source', $plan->fund_source]);
            if ($plan->type === 'aip') {
                $write(['PS (PHP)', 'MOOE (PHP)', 'FE (PHP)', 'CO (PHP)', 'Total (PHP)']);
                $write(array_map(fn ($k) => number_format($plan->$k / 100, 2, '.', ''), ['ps_cents', 'mooe_cents', 'fe_cents', 'co_cents', 'total_cents']));
            } else {
                $write(['Code', 'Item', 'Unit', 'Unit cost (PHP)', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Quantity', 'Total (PHP)']);
                foreach ($plan->items as $item) {
                    $write([$item->code, $item->name, $item->unit, number_format($item->price_cents / 100, 2, '.', ''), ...$item->monthly_quantities, $item->quantity, number_format($item->total_cents / 100, 2, '.', '')]);
                }
            }
            fclose($out);
        }, strtoupper($plan->type).'-'.$plan->id.'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
