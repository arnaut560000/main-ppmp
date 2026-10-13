<?php

namespace Database\Seeders;

use App\Models\Office;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PpmpOfficeSeeder extends Seeder
{
    public function run(): void
    {
        // Office labels from PPMP.xlsx, Sheet1 row 4. Preserve existing IDs.
        // Service/fund headings are not departments and must be mapped separately.
        $offices = [
            'MAYOR' => "MAYOR'S OFFICE", 'BPLO' => 'BPLO', 'PLEB' => 'PLEB',
            'SB' => 'SANGGUNIANG BAYAN', 'HRMO' => 'HRMO', 'MPDO' => 'MPDO',
            'MCR' => 'MCR', 'GSO' => 'GSO', 'BUDGET' => 'BUDGET',
            'ACCOUNTING' => 'ACCOUNTING', 'TREASURY' => 'TREASURY', 'ASSESSOR' => 'ASSESSOR',
            'COA' => 'COA', 'LIBRARY' => 'LIBRARY', 'LEGAL' => 'LEGAL OFFICE',
            'MTC' => 'MTC', 'MDRRMO' => 'MDRRMO', 'PNP' => 'PNP', 'BJMP' => 'BJMP',
            'BFP' => 'BFP', 'NEUST-TOC' => 'NEUST-TOC', 'MHO-NUTRITION' => 'MHO - NUTRITION',
            'MHO' => 'MHO', 'OMPESM' => 'OMPESM', 'MSWDO' => 'MSWDO', 'MYDO' => 'MYDO',
            'OSCA' => 'OSCA', 'PDAO' => 'PDAO', 'TOURISM' => 'TOURISM',
            'AGRICULTURE' => 'AGRICULTURE', 'MABEU' => 'MABEU', 'MENRO' => 'MENRO',
            'MEO' => 'ENGINEERING', 'MCEDO' => 'MCEDO',
        ];
        DB::transaction(function () use ($offices) {
            foreach ($offices as $code => $name) {
                if (! Office::where('code', $code)->orWhere('name', $name)->exists()) {
                    Office::create(['code' => $code, 'name' => $name]);
                }
            }
        });
        // No users, credentials, budgets, or approvals are fabricated.
    }
}
