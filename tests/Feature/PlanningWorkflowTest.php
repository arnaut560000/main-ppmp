<?php

namespace Tests\Feature;

use App\Models\AnnualPlan;
use App\Models\Budget;
use App\Models\CatalogueItem;
use App\Models\Office;
use App\Models\Plan;
use App\Models\User;
use App\Services\PlanningService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PlanningWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $planner;

    private User $budgetOfficer;

    private User $mayor;

    private Office $office;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->office = Office::create(['code' => 'ICT', 'name' => 'ICT Office']);
        $this->planner = User::factory()->create(['role' => 'office', 'office_id' => $this->office->id]);
        $this->budgetOfficer = User::factory()->create(['role' => 'budget']);
        $this->mayor = User::factory()->create(['role' => 'mayor']);
        Budget::create(['office_id' => $this->office->id, 'fiscal_year' => 2027, 'ceiling_cents' => 10000000]);
    }

    private function payload(array $overrides = []): array
    {
        return [...['type' => 'aip', 'office_id' => $this->office->id, 'fiscal_year' => 2027, 'reference' => 'AIP-'.Plan::count(), 'title' => 'Digital services', 'fund_source' => 'General Fund', 'start_date' => '2027-01-01', 'end_date' => '2027-12-31', 'ps' => '0', 'mooe' => '10000', 'fe' => '0', 'co' => '50000', 'items' => []], ...$overrides];
    }

    private function plan(array $overrides = []): Plan
    {
        return app(PlanningService::class)->save($this->planner, $this->payload($overrides))->fresh();
    }

    private function submit(Plan $plan)
    {
        return $this->actingAs($this->planner)->post('/plans/'.$plan->id.'/transition', ['action' => 'submit', 'version' => $plan->fresh()->version]);
    }

    private function approvedAip(): Plan
    {
        $p = $this->plan();
        $this->submit($p)->assertSessionHasNoErrors();
        $this->actingAs($this->budgetOfficer)->post('/plans/'.$p->id.'/transition', ['action' => 'approve', 'version' => $p->fresh()->version])->assertSessionHasNoErrors();

        return $p->fresh();
    }

    private function item(): CatalogueItem
    {
        return CatalogueItem::create(['code' => 'LAP-1', 'name' => 'Laptop', 'unit' => 'unit', 'category' => 'ICT', 'expense_class' => 'CO', 'price_cents' => 2000000]);
    }

    public function test_guest_is_redirected_and_login_logout_work(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');
        $this->post('/login', ['email' => $this->planner->email, 'password' => 'wrong'])->assertSessionHasErrors('email');
        $this->post('/login', ['email' => $this->planner->email, 'password' => 'password'])->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($this->planner);
        $this->post('/logout')->assertRedirect('/login');
        $this->assertGuest();
    }

    public function test_aip_can_be_created_submitted_and_approved_with_audit(): void
    {
        $this->actingAs($this->planner)->post('/plans', $this->payload())->assertSessionHasNoErrors()->assertRedirect();
        $p = Plan::firstOrFail();
        $this->assertSame(6000000, $p->total_cents);
        $this->submit($p)->assertSessionHasNoErrors();
        $this->actingAs($this->budgetOfficer)->post('/plans/'.$p->id.'/transition', ['action' => 'approve', 'version' => $p->fresh()->version, 'comment' => 'Budget reviewed'])->assertSessionHasNoErrors();
        $this->assertSame('approved', $p->fresh()->status);
        $this->assertDatabaseHas('audit_events', ['subject_id' => $p->id, 'action' => 'approve', 'comment' => 'Budget reviewed']);
    }

    public function test_budget_ceiling_counts_other_submitted_plans_and_return_releases_reservation(): void
    {
        $first = $this->plan();
        $this->submit($first)->assertSessionHasNoErrors();
        $second = $this->plan();
        $this->submit($second)->assertSessionHasErrors('workflow');
        $this->assertSame('draft', $second->fresh()->status);
        $this->actingAs($this->budgetOfficer)->post('/plans/'.$first->id.'/transition', ['action' => 'return', 'version' => $first->fresh()->version, 'comment' => 'Revise scope'])->assertSessionHasNoErrors();
        $this->submit($second)->assertSessionHasNoErrors();
    }

    public function test_office_cannot_access_edit_export_or_submit_another_offices_plan(): void
    {
        $p = $this->plan();
        $other = Office::create(['code' => 'OTHER', 'name' => 'Other']);
        $user = User::factory()->create(['role' => 'office', 'office_id' => $other->id]);
        foreach (['', '/edit', '/export'] as $suffix) {
            $this->actingAs($user)->get('/plans/'.$p->id.$suffix)->assertForbidden();
        }
        $this->actingAs($user)->post('/plans/'.$p->id.'/transition', ['action' => 'submit', 'version' => 1])->assertForbidden();
        $this->actingAs($user)->get('/plans')->assertInertia(fn (Assert $page) => $page->component('Plans')->has('plans.data', 0));
        $this->actingAs($user)->post('/plans', $this->payload(['reference' => 'ATTACK']))->assertForbidden();
    }

    public function test_approvals_require_correct_role_and_submitted_state(): void
    {
        $p = $this->plan();
        $this->submit($p);
        foreach ([$this->planner, $this->mayor, User::factory()->create(['role' => 'admin'])] as $user) {
            $this->actingAs($user)->post('/plans/'.$p->id.'/transition', ['action' => 'approve', 'version' => $p->fresh()->version])->assertForbidden();
        }
        $draft = $this->plan();
        $this->actingAs($this->budgetOfficer)->post('/plans/'.$draft->id.'/transition', ['action' => 'approve', 'version' => 1])->assertSessionHasErrors('workflow');
    }

    public function test_return_requires_reason_and_stale_writes_are_rejected(): void
    {
        $p = $this->plan();
        $this->submit($p);
        $this->actingAs($this->budgetOfficer)->post('/plans/'.$p->id.'/transition', ['action' => 'return', 'version' => 2, 'comment' => ' '])->assertSessionHasErrors('workflow');
        $this->actingAs($this->budgetOfficer)->post('/plans/'.$p->id.'/transition', ['action' => 'approve', 'version' => 1])->assertSessionHasErrors('workflow');
        $this->assertSame('submitted', $p->fresh()->status);
    }

    public function test_approved_plans_are_immutable(): void
    {
        $p = $this->approvedAip();
        $this->actingAs($this->planner)->put('/plans/'.$p->id, $this->payload(['reference' => $p->reference, 'version' => $p->version, 'co' => 1]))->assertStatus(409);
        $this->assertSame(6000000, $p->fresh()->total_cents);
    }

    public function test_ppmp_calculates_money_server_side_and_freezes_catalogue_snapshot(): void
    {
        $aip = $this->approvedAip();
        $item = $this->item();
        $this->actingAs($this->planner)->post('/plans', $this->payload(['type' => 'ppmp', 'parent_id' => $aip->id, 'total_cents' => 1, 'items' => [['catalogue_item_id' => $item->id, 'price_cents' => 1, 'quarterly_quantities' => [1, 0, 1, 0]]]]))->assertSessionHasNoErrors();
        $p = Plan::where('type', 'ppmp')->firstOrFail();
        $this->assertSame(4000000, $p->total_cents);
        $item->update(['price_cents' => 9000000, 'name' => 'Changed name']);
        $this->assertSame(2000000, $p->items()->first()->price_cents);
        $this->assertSame('Laptop', $p->items()->first()->name);
        $this->submit($p)->assertSessionHasNoErrors();
        $this->actingAs($this->mayor)->post('/plans/'.$p->id.'/transition', ['action' => 'approve', 'version' => $p->fresh()->version])->assertSessionHasNoErrors();
        $this->assertSame('approved', $p->fresh()->status);
    }

    public function test_ppmp_cannot_exceed_approved_aip_expense_class_or_duplicate_reserved_requirements(): void
    {
        $aip = $this->approvedAip();
        $item = $this->item();
        $data = ['type' => 'ppmp', 'parent_id' => $aip->id, 'items' => [['catalogue_item_id' => $item->id, 'quarterly_quantities' => [2, 0, 0, 0]]]];
        $p = $this->plan($data);
        $this->submit($p)->assertSessionHasNoErrors();
        $other = $this->plan($data);
        $this->submit($other)->assertSessionHasErrors('workflow');
    }

    public function test_ppmp_rejects_unapproved_parent_duplicate_items_and_fractional_quantities(): void
    {
        $parent = $this->plan();
        $item = $this->item();
        $line = ['catalogue_item_id' => $item->id, 'quarterly_quantities' => [1, 0, 0, 0]];
        $data = $this->payload(['type' => 'ppmp', 'parent_id' => $parent->id, 'items' => [$line]]);
        $this->actingAs($this->planner)->post('/plans', $data)->assertSessionHasErrors('workflow');
        $this->actingAs($this->planner)->post('/plans', [...$data, 'items' => [$line, $line]])->assertSessionHasErrors('items.0.catalogue_item_id');
        $line['quarterly_quantities'][0] = 1.5;
        $this->actingAs($this->planner)->post('/plans', [...$data, 'items' => [$line]])->assertSessionHasErrors('items.0.quarterly_quantities.0');
    }

    public function test_budget_reduction_cannot_undercut_reservations(): void
    {
        $p = $this->plan();
        $this->submit($p);
        $data = ['office_id' => $this->office->id, 'fiscal_year' => 2027, 'ceiling' => '50000', 'comment' => 'Adjustment'];
        $this->actingAs($this->budgetOfficer)->post('/budgets', $data)->assertSessionHasErrors('workflow');
        $this->actingAs($this->planner)->post('/budgets', [...$data, 'ceiling' => '150000'])->assertForbidden();
        $this->assertSame(10000000, Budget::first()->ceiling_cents);
    }

    public function test_app_consolidation_is_traceable_and_cannot_double_assign_ppmp(): void
    {
        $aip = $this->approvedAip();
        $item = $this->item();
        $p = $this->plan(['type' => 'ppmp', 'parent_id' => $aip->id, 'items' => [['catalogue_item_id' => $item->id, 'quarterly_quantities' => [1, 0, 0, 0]]]]);
        $this->submit($p);
        $this->actingAs($this->mayor)->post('/plans/'.$p->id.'/transition', ['action' => 'approve', 'version' => $p->fresh()->version]);
        $procurement = User::factory()->create(['role' => 'procurement']);
        $data = ['title' => 'APP 2027', 'fiscal_year' => 2027, 'plan_ids' => [$p->id]];
        $this->actingAs($procurement)->post('/annual-plans', $data)->assertSessionHasNoErrors();
        $app = AnnualPlan::firstOrFail();
        $this->assertSame($app->id, $p->fresh()->annual_plan_id);
        $this->actingAs($procurement)->post('/annual-plans', $data)->assertSessionHasErrors('workflow');
        $this->assertSame(1, AnnualPlan::count());
        $this->actingAs($this->mayor)->post('/annual-plans/'.$app->id.'/approve')->assertSessionHasNoErrors();
        $this->assertSame('approved', $app->fresh()->status);
    }

    public function test_csv_protects_formula_like_user_input(): void
    {
        $p = $this->plan(['title' => '=HYPERLINK("https://example.com")']);
        $response = $this->actingAs($this->planner)->get('/plans/'.$p->id.'/export')->assertOk();
        $this->assertStringContainsString("'=HYPERLINK", $response->streamedContent());
    }

    public function test_all_main_screens_render_for_authorized_roles(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        foreach (['dashboard', 'plans', 'plans/create', 'catalogue', 'budgets', 'annual-plans', 'audit', 'administration'] as $path) {
            $this->actingAs($admin)->get('/'.$path)->assertOk();
        }
        $this->actingAs($this->planner)->get('/administration')->assertForbidden();
        $this->actingAs($this->planner)->get('/annual-plans')->assertForbidden();
    }

    public function test_stale_edit_does_not_overwrite_a_newer_draft(): void
    {
        $p = $this->plan();
        $data = $this->payload(['reference' => $p->reference, 'version' => 1, 'title' => 'Newer title']);
        $this->actingAs($this->planner)->put('/plans/'.$p->id, $data)->assertSessionHasNoErrors();
        $this->actingAs($this->planner)->put('/plans/'.$p->id, [...$data, 'title' => 'Stale title'])->assertSessionHasErrors('workflow');
        $this->assertSame('Newer title', $p->fresh()->title);
    }
}
