<?php

namespace App\Http\Controllers;

use App\Models\AnnualPlan;
use App\Models\Plan;
use App\Services\PlanningAccess;
use App\Services\PlanningService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AnnualPlanController extends Controller
{
    public function index(Request $r)
    {
        PlanningAccess::roles($r->user(), ['admin', 'procurement', 'mayor', 'budget']);

        return Inertia::render('AnnualPlans', ['batches' => AnnualPlan::with(['plans.office', 'plans.items'])->latest()->get(), 'eligible' => Plan::where('type', 'ppmp')->where('status', 'approved')->whereNull('annual_plan_id')->with('office')->get()]);
    }

    public function store(Request $r)
    {
        PlanningAccess::roles($r->user(), ['procurement']);
        $data = $r->validate(['title' => 'required|string|max:255', 'fiscal_year' => 'required|integer|min:2020|max:2100', 'plan_ids' => 'required|array|min:1', 'plan_ids.*' => 'required|integer|distinct|exists:plans,id']);
        DB::transaction(function () use ($r, $data) {
            $plans = Plan::whereIn('id', $data['plan_ids'])->orderBy('id')->lockForUpdate()->get();
            foreach ($plans as $plan) {
                if ($plan->type !== 'ppmp' || $plan->status !== 'approved' || $plan->annual_plan_id || $plan->fiscal_year !== (int) $data['fiscal_year']) {
                    PlanningService::fail('Select unassigned, approved PPMPs from the same fiscal year.');
                }
            }
            $app = AnnualPlan::create(['title' => $data['title'], 'fiscal_year' => $data['fiscal_year'], 'created_by' => $r->user()->id]);
            foreach ($plans as $plan) {
                $plan->update(['annual_plan_id' => $app->id]);
                PlanningService::audit($r->user(), 'plan', $plan->id, 'included in APP', $plan->office_id, null, ['annual_plan_id' => $app->id]);
            }
            PlanningService::audit($r->user(), 'app', $app->id, 'submitted', null, null, ['plan_ids' => $data['plan_ids']]);
        }, 3);

        return back()->with('success', 'APP consolidation submitted for approval.');
    }

    public function approve(Request $r, AnnualPlan $annualPlan)
    {
        PlanningAccess::roles($r->user(), ['mayor']);
        DB::transaction(function () use ($r, $annualPlan) {
            $app = AnnualPlan::whereKey($annualPlan->id)->lockForUpdate()->firstOrFail();
            abort_if($app->created_by === $r->user()->id, 403);
            if ($app->status !== 'submitted') {
                PlanningService::fail('This APP has already been reviewed.');
            }
            $app->update(['status' => 'approved']);
            PlanningService::audit($r->user(), 'app', $app->id, 'approved');
        });

        return back()->with('success', 'APP approved.');
    }
}
