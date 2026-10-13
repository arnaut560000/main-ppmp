<?php

namespace Database\Seeders;

use App\Models\Budget;
use App\Models\CatalogueItem;
use App\Models\Office;
use App\Models\User;
use App\Services\PlanningService;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            throw new \RuntimeException('Demo data is limited to local and testing environments.');
        }
        if (User::exists()) {
            $this->command?->warn('Existing users found. Demo seeding skipped to preserve your data.');

            return;
        }
        $office = Office::create(['code' => 'ICT-PIO', 'name' => 'Information & Communications Technology / Public Information Office']);
        $gso = Office::create(['code' => 'GSO', 'name' => 'General Services Office']);
        $engineering = Office::create(['code' => 'MEO', 'name' => 'Municipal Engineering Office']);
        $people = ['admin' => 'System Administrator', 'office' => 'ICT / PIO Planner', 'budget' => 'Budget Officer', 'mayor' => 'Approving Authority', 'procurement' => 'Procurement Officer', 'gso' => 'Catalogue Officer', 'inventory' => 'Supply Officer'];
        $users = [];
        foreach ($people as $role => $name) {
            $users[$role] = User::create(['name' => $name, 'email' => $role.'@epprism.test', 'password' => 'Talavera2027!', 'role' => $role, 'office_id' => $role === 'office' ? $office->id : null]);
        }
        foreach ([[$office, 250000000], [$gso, 150000000], [$engineering, 400000000]] as [$o,$cents]) {
            Budget::create(['office_id' => $o->id, 'fiscal_year' => 2027, 'ceiling_cents' => $cents]);
        }
        $items = [
            ['ICT-001', 'Business laptop', '16 GB RAM, 512 GB SSD; sample specification', 'unit', 'ICT equipment', 'CO', 6500000],
            ['ICT-002', 'Desktop workstation', '16 GB RAM, monitor and peripherals', 'set', 'ICT equipment', 'CO', 5500000],
            ['SUP-001', 'A4 multipurpose paper', '80 gsm, 500 sheets', 'ream', 'Office supplies', 'MOOE', 28000],
            ['SUP-002', 'Printer ink cartridge', 'Compatibility to be confirmed by end user', 'piece', 'Office supplies', 'MOOE', 120000],
            ['SUB-001', 'Design software subscription', 'Annual team subscription; sample estimate', 'license', 'Software & services', 'MOOE', 1800000],
            ['AV-001', 'Digital camera', 'Mirrorless camera with standard lens', 'set', 'Media equipment', 'CO', 8500000],
            ['NET-001', 'Network switch', '24-port managed gigabit switch', 'unit', 'ICT equipment', 'CO', 2200000],
            ['SUP-003', 'USB flash drive', '32 GB USB 3.0', 'piece', 'Office supplies', 'MOOE', 45000],
        ];
        foreach ($items as $i) {
            CatalogueItem::create(array_combine(['code', 'name', 'specification', 'unit', 'category', 'expense_class', 'price_cents'], $i));
        }
        $service = app(PlanningService::class);
        $base = ['type' => 'aip', 'office_id' => $office->id, 'fiscal_year' => 2027, 'fund_source' => 'General Fund', 'start_date' => '2027-01-01', 'end_date' => '2027-12-31', 'description' => 'Demonstration record for workflow testing. Values are illustrative, not imported approved amounts.', 'expected_output' => 'Reliable digital services and timely public information.', 'ps' => '0', 'fe' => '0'];
        $aip = $service->save($users['office'], [...$base, 'reference' => '2027-ICT-001', 'title' => 'ICT systems and digital services', 'mooe' => '350000', 'co' => '650000']);
        $service->transition($users['office'], $aip, 'submit', 1, null);
        $aip->refresh();
        $service->transition($users['budget'], $aip, 'approve', $aip->version, 'Sample approval for the demonstration workspace.');
        $pending = $service->save($users['office'], [...$base, 'reference' => '2027-PIO-002', 'title' => 'Public information and media services', 'mooe' => '280000', 'co' => '220000']);
        $service->transition($users['office'], $pending, 'submit', 1, null);
        $service->save($users['office'], [...$base, 'reference' => '2027-ICT-003', 'title' => 'Digital skills and capacity development', 'mooe' => '150000', 'co' => '0']);
        $ppmp = $service->save($users['office'], [...$base, 'type' => 'ppmp', 'parent_id' => $aip->id, 'reference' => 'PPMP-2027-001', 'title' => 'ICT equipment and office supplies', 'items' => [
            ['catalogue_item_id' => 1, 'quarterly_quantities' => [2, 1, 1, 0]],
            ['catalogue_item_id' => 3, 'quarterly_quantities' => [30, 30, 30, 30]],
            ['catalogue_item_id' => 5, 'quarterly_quantities' => [2, 0, 0, 0]],
        ]]);
        $service->transition($users['office'], $ppmp, 'submit', 1, null);
        $this->command?->info('Local demo created. Accounts: {role}@epprism.test; password: Talavera2027!');
    }
}
