<?php

namespace App\Http\Controllers;

use App\Models\AuditEvent;
use App\Models\Budget;
use App\Models\CatalogueItem;
use App\Models\Office;
use App\Models\Plan;
use App\Models\User;
use App\Services\PlanningAccess;
use App\Services\PlanningService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class WorkspaceController extends Controller
{
    private function year(Request $r): int
    {
        return (int) ($r->validate(['year' => 'nullable|integer|min:2020|max:2100'])['year'] ?? 2027);
    }

    private function budgets(Request $r, int $year)
    {
        return Budget::with('office')->where('fiscal_year', $year)->when($r->user()->role === 'office', fn ($q) => $q->where('office_id', $r->user()->office_id))->get()->map(function ($budget) {
            $budget->reserved_cents = (int) Plan::where('office_id', $budget->office_id)->where('fiscal_year', $budget->fiscal_year)->where('type', 'aip')->whereIn('status', ['submitted', 'approved'])->sum('total_cents');
            $budget->available_cents = $budget->ceiling_cents - $budget->reserved_cents;

            return $budget;
        });
    }

    public function dashboard(Request $r)
    {
        $year = $this->year($r);
        $query = Plan::visibleTo($r->user())->where('fiscal_year', $year);
        $budgets = $this->budgets($r, $year);
        $counts = [];
        foreach (['draft', 'submitted', 'approved', 'returned'] as $status) {
            $counts[$status] = (clone $query)->where('status', $status)->count();
        }

        return Inertia::render('Dashboard', ['year' => $year, 'stats' => ['ceiling' => $budgets->sum('ceiling_cents'), 'reserved' => $budgets->sum('reserved_cents'), 'available' => $budgets->sum('available_cents'), 'counts' => $counts], 'budgets' => $budgets, 'recent' => (clone $query)->with('office')->latest('updated_at')->limit(6)->get(), 'activity' => AuditEvent::with('user:id,name')->when($r->user()->role === 'office', fn ($q) => $q->where('office_id', $r->user()->office_id))->latest('id')->limit(5)->get()]);
    }

    public function catalogue(Request $r)
    {
        return Inertia::render('Catalogue', ['items' => CatalogueItem::orderBy('name')->get(), 'canManage' => in_array($r->user()->role, ['admin', 'gso'])]);
    }

    public function saveItem(Request $r, ?CatalogueItem $item = null)
    {
        PlanningAccess::roles($r->user(), ['admin', 'gso']);
        $data = $r->validate(['code' => ['required', 'string', 'max:60', Rule::unique('catalogue_items')->ignore($item?->id)], 'name' => 'required|string|max:255', 'specification' => 'nullable|string|max:3000', 'unit' => 'required|string|max:40', 'category' => 'required|string|max:120', 'expense_class' => ['required', Rule::in(['MOOE', 'CO'])], 'price' => 'required|numeric|min:0.01|max:100000000|decimal:0,2', 'active' => 'required|boolean']);
        DB::transaction(function () use ($r, $data, $item) {
            $before = $item?->toArray();
            $data['price_cents'] = PlanningService::cents($data['price']);
            unset($data['price']);
            if ($item) {
                $item->update($data);
            } else {
                $item = CatalogueItem::create($data);
            } PlanningService::audit($r->user(), 'catalogue', $item->id, $before ? 'updated' : 'created', null, null, ['before' => $before, 'after' => $item->toArray()]);
        });

        return back()->with('success', 'Catalogue saved. Existing plan prices are unchanged.');
    }

    public function budgetIndex(Request $r)
    {
        $year = $this->year($r);

        return Inertia::render('Budgets', ['year' => $year, 'budgets' => $this->budgets($r, $year), 'offices' => Office::when($r->user()->role === 'office', fn ($q) => $q->whereKey($r->user()->office_id))->orderBy('name')->get(), 'canManage' => $r->user()->role === 'budget']);
    }

    public function saveBudget(Request $r)
    {
        PlanningAccess::roles($r->user(), ['budget']);
        $data = $r->validate(['office_id' => 'required|integer|exists:offices,id', 'fiscal_year' => 'required|integer|min:2020|max:2100', 'ceiling' => 'required|numeric|min:0|max:10000000000|decimal:0,2', 'comment' => 'required|string|max:1000']);
        DB::transaction(function () use ($r, $data) {
            Office::whereKey($data['office_id'])->lockForUpdate()->firstOrFail();
            $budget = Budget::where('office_id', $data['office_id'])->where('fiscal_year', $data['fiscal_year'])->lockForUpdate()->first();
            $reserved = Plan::where('office_id', $data['office_id'])->where('fiscal_year', $data['fiscal_year'])->where('type', 'aip')->whereIn('status', ['submitted', 'approved'])->sum('total_cents');
            $cents = PlanningService::cents($data['ceiling']);
            if ($cents < $reserved) {
                PlanningService::fail('The ceiling cannot be lower than submitted and approved AIP allocations.');
            }
            $before = $budget?->ceiling_cents;
            $budget = Budget::updateOrCreate(['office_id' => $data['office_id'], 'fiscal_year' => $data['fiscal_year']], ['ceiling_cents' => $cents]);
            PlanningService::audit($r->user(), 'budget', $budget->id, 'allocation adjusted', $budget->office_id, $data['comment'], ['before_cents' => $before, 'after_cents' => $cents]);
        }, 3);

        return back()->with('success', 'Budget allocation saved.');
    }

    public function administration(Request $r)
    {
        PlanningAccess::roles($r->user(), ['admin']);

        return Inertia::render('Administration', ['offices' => Office::orderBy('name')->get(), 'users' => User::with('office')->orderBy('name')->get()]);
    }

    public function saveOffice(Request $r)
    {
        PlanningAccess::roles($r->user(), ['admin']);
        $data = $r->validate(['code' => 'required|string|max:20|unique:offices', 'name' => 'required|string|max:255']);
        DB::transaction(function () use ($r, $data) {
            $office = Office::create($data);
            PlanningService::audit($r->user(), 'office', $office->id, 'created');
        });

        return back()->with('success', 'Office created.');
    }

    public function saveUser(Request $r)
    {
        PlanningAccess::roles($r->user(), ['admin']);
        $data = $r->validate(['name' => 'required|string|max:120', 'email' => 'required|email|max:255|unique:users', 'password' => 'required|string|min:12|max:128', 'role' => ['required', Rule::in(['admin', 'office', 'budget', 'mayor', 'procurement', 'gso', 'inventory'])], 'office_id' => 'nullable|required_if:role,office|integer|exists:offices,id']);
        DB::transaction(function () use ($r, $data) {
            $user = User::create($data);
            PlanningService::audit($r->user(), 'user', $user->id, 'created', null, null, ['role' => $user->role]);
        });

        return back()->with('success', 'User account created.');
    }

    public function audit(Request $r)
    {
        return Inertia::render('Audit', ['events' => AuditEvent::with('user:id,name')->when($r->user()->role === 'office', fn ($q) => $q->where('office_id', $r->user()->office_id))->latest('id')->paginate(25)]);
    }
}
