<?php

namespace Tests\Feature;

use App\Models\CatalogueItem;
use App\Models\Office;
use App\Models\Plan;
use App\Models\User;
use App\Services\ConsolidatedPpmpReport;
use App\Services\PlanningService;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\PpmpOfficeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class QuarterlyPpmpTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(DatabaseSeeder::class);
    }

    private function user(string $role): User
    {
        return User::where('role', $role)->firstOrFail();
    }

    private function payload(): array
    {
        $parent = Plan::where('type', 'aip')->where('status', 'approved')->firstOrFail();

        return ['type' => 'ppmp', 'office_id' => $parent->office_id, 'parent_id' => $parent->id,
            'fiscal_year' => 2027, 'reference' => 'Q-TEST', 'title' => 'Quarterly supplies',
            'fund_source' => 'General Fund', 'start_date' => '2027-01-01', 'end_date' => '2027-12-31',
            'items' => [['catalogue_item_id' => CatalogueItem::where('code', 'SUP-001')->firstOrFail()->id, 'quarterly_quantities' => [1, 2, 3, 4]]]];
    }

    private function approve(Plan $plan): void
    {
        $service = app(PlanningService::class);
        if ($plan->status === 'draft') {
            $service->transition($this->user('office'), $plan, 'submit', $plan->version, null);
        }
        $service->transition($this->user('mayor'), $plan->fresh(), 'approve', $plan->fresh()->version, null);
    }

    public function test_quarterly_entry_uses_server_prices_and_saves_category_snapshot(): void
    {
        $data = $this->payload();
        $data['items'][0]['price_cents'] = 1;
        $this->actingAs($this->user('office'))->post('/plans', $data)->assertSessionHasNoErrors();
        $plan = Plan::where('reference', 'Q-TEST')->firstOrFail();
        $item = $plan->items()->firstOrFail();
        $this->assertSame([1, 2, 3, 4], $item->quarterly_quantities);
        $this->assertNull($item->monthly_quantities);
        $this->assertSame(280000, $plan->total_cents);
        $this->assertSame('Office supplies', $item->object_of_expenditure);
        CatalogueItem::whereKey($item->catalogue_item_id)->update(['category' => 'Changed classification', 'price_cents' => 999]);
        $this->assertSame('Office supplies', $item->fresh()->object_of_expenditure);
        $this->assertSame(28000, $item->fresh()->price_cents);
    }

    public function test_invalid_quarters_and_legacy_monthly_payload_are_rejected(): void
    {
        foreach ([[1, 2, 3], [1, 2, 3, 4, 5], [1.5, 0, 0, 0], [-1, 0, 0, 0], [300001, 0, 0, 0]] as $quantities) {
            $data = $this->payload();
            $data['items'][0]['quarterly_quantities'] = $quantities;
            $this->actingAs($this->user('office'))->post('/plans', $data)->assertSessionHasErrors();
        }
        $data = $this->payload();
        $data['items'][0]['monthly_quantities'] = array_fill(0, 12, 1);
        $this->actingAs($this->user('office'))->post('/plans', $data)->assertSessionHasErrors('items.0.monthly_quantities');
    }

    public function test_report_totals_exclude_unapproved_plans_and_preserve_price_variants(): void
    {
        $service = app(PlanningService::class);
        $first = $service->save($this->user('office'), $this->payload());
        $this->approve($first);
        $item = CatalogueItem::where('code', 'SUP-001')->firstOrFail();
        $item->update(['price_cents' => 30000]);
        $second = $service->save($this->user('office'), [...$this->payload(), 'reference' => 'Q-SECOND']);
        $this->approve($second);
        $report = app(ConsolidatedPpmpReport::class)->build($this->user('procurement'), 2027);
        $this->assertCount(2, $report['rows']);
        $this->assertSame(2, $report['plan_count']);
        $this->assertSame(580000, $report['total_cents']);
        $this->assertSame([28000, 56000, 84000, 112000], $report['rows'][0]['offices'][$first->office_id]['amounts']);
        $this->assertSame(0, app(ConsolidatedPpmpReport::class)->build($this->user('procurement'), 2026)['total_cents']);
        $this->assertSame(0, app(ConsolidatedPpmpReport::class)->build($this->user('procurement'), 2027, null, '5% MDRRMF')['total_cents']);
    }

    public function test_report_and_export_respect_office_boundaries(): void
    {
        $other = Office::where('code', 'MEO')->firstOrFail();
        $user = User::factory()->create(['role' => 'office', 'office_id' => $other->id]);
        $this->approve(Plan::where('type', 'ppmp')->firstOrFail());
        $this->actingAs($user)->get('/reports/consolidated-ppmp?year=2027')->assertOk()->assertInertia(fn (Assert $page) => $page->component('ConsolidatedPpmp')->has('offices', 1)->has('rows.data', 0)->where('total_cents', 0));
        foreach (['', '&download=csv'] as $suffix) {
            $this->actingAs($user)->get('/reports/consolidated-ppmp?year=2027&office_id='.$this->user('office')->office_id.$suffix)->assertForbidden();
        }
        $this->actingAs($this->user('procurement'))->get('/reports/consolidated-ppmp?year=2027')->assertOk()->assertInertia(fn (Assert $page) => $page->has('rows.data', 3));
    }

    public function test_matching_items_are_merged_without_counting_app_membership_twice(): void
    {
        $original = Plan::where('type', 'ppmp')->firstOrFail();
        $this->approve($original);
        $additional = app(PlanningService::class)->save($this->user('office'), $this->payload());
        $this->approve($additional);
        $this->actingAs($this->user('procurement'))->post('/annual-plans', ['title' => 'Annual batch', 'fiscal_year' => 2027, 'plan_ids' => [$original->id, $additional->id]])->assertSessionHasNoErrors();
        $report = app(ConsolidatedPpmpReport::class)->build($this->user('procurement'), 2027);
        $this->assertCount(3, $report['rows']);
        $paper = collect($report['rows'])->firstWhere('code', 'SUP-001');
        $this->assertSame([31, 32, 33, 34], $paper['offices'][$original->office_id]['quantities']);
        $this->assertSame(130, $paper['offices'][$original->office_id]['quantity']);
        $this->assertSame($original->total_cents + $additional->total_cents, $report['total_cents']);
    }

    public function test_export_contains_quarter_amounts_and_neutralizes_formula_text(): void
    {
        CatalogueItem::where('code', 'SUP-001')->update(['name' => '=1+1']);
        $plan = app(PlanningService::class)->save($this->user('office'), $this->payload());
        $this->approve($plan);
        $csv = $this->actingAs($this->user('procurement'))->get('/reports/consolidated-ppmp?year=2027&download=csv')->assertOk()->streamedContent();
        $this->assertStringContainsString("'=1+1", $csv);
        $this->assertStringContainsString('Q4 amount (PHP)', $csv);
        $this->assertStringContainsString('2800.00', $csv);
        $this->actingAs($this->user('office'))->get('/plans/'.$plan->id.'/export')->assertOk();
    }

    public function test_office_setup_is_repeatable_and_preserves_existing_offices(): void
    {
        $existing = Office::where('code', 'MEO')->firstOrFail();
        $userCount = User::count();
        $this->seed(PpmpOfficeSeeder::class);
        $count = Office::count();
        $this->seed(PpmpOfficeSeeder::class);
        $this->assertSame($count, Office::count());
        $this->assertSame($existing->id, Office::where('code', 'MEO')->firstOrFail()->id);
        $this->assertSame($existing->name, $existing->fresh()->name);
        $this->assertSame($userCount, User::count());
        $this->assertDatabaseHas('offices', ['code' => 'BPLO']);
        $this->assertDatabaseMissing('offices', ['name' => '5% MDRRMF']);
    }
}
