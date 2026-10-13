<?php

namespace App\Http\Controllers;

use App\Services\ConsolidatedPpmpReport;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;

class ConsolidatedPpmpController extends Controller
{
    public function __invoke(Request $request, ConsolidatedPpmpReport $report)
    {
        $filters = $request->validate([
            'year' => 'nullable|integer|min:2020|max:2100',
            'office_id' => 'nullable|integer|exists:offices,id',
            'fund' => 'nullable|string|max:120', 'page' => 'nullable|integer|min:1',
            'download' => 'nullable|in:csv',
        ]);
        $year = (int) ($filters['year'] ?? now()->year);
        $officeId = ! empty($filters['office_id']) ? (int) $filters['office_id'] : null;
        $fund = $filters['fund'] ?? null;
        $data = $report->build($request->user(), $year, $officeId, $fund);
        if (($filters['download'] ?? null) === 'csv') {
            return response()->streamDownload(function () use ($data, $year, $fund) {
                $out = fopen('php://output', 'w');
                fwrite($out, "\xEF\xBB\xBF");
                $write = function (array $row) use ($out) {
                    fputcsv($out, array_map(fn ($value) => is_string($value) && preg_match('/^[\s]*[=+@\-]/u', $value) ? "'".$value : $value, $row));
                };
                $write(['Consolidated PPMP', 'FY '.$year, 'Approved plans only', $fund ?: 'All fund sources']);
                $headers = ['Object of expenditures', 'Article (item)', 'Unit of measurement', 'Unit cost (PHP)'];
                foreach ($data['offices'] as $office) {
                    foreach (range(1, 4) as $q) {
                        array_push($headers, $office->name.' Q'.$q.' quantity', $office->name.' Q'.$q.' amount (PHP)');
                    }
                    array_push($headers, $office->name.' total quantity', $office->name.' total amount (PHP)');
                }
                $write($headers);
                foreach ($data['rows'] as $row) {
                    $cells = [$row['category'], $row['name'].($row['specification'] ? ' — '.$row['specification'] : ''), $row['unit'], number_format($row['price_cents'] / 100, 2, '.', '')];
                    foreach ($data['offices'] as $office) {
                        $values = $row['offices'][$office->id] ?? null;
                        foreach (range(0, 3) as $q) {
                            array_push($cells, $values['quantities'][$q] ?? 0, number_format(($values['amounts'][$q] ?? 0) / 100, 2, '.', ''));
                        }
                        array_push($cells, $values['quantity'] ?? 0, number_format(($values['amount'] ?? 0) / 100, 2, '.', ''));
                    }
                    $write($cells);
                }
                $totals = ['TOTAL AMOUNT (PHP)', '', '', ''];
                foreach ($data['offices'] as $office) {
                    array_push($totals, '', '', '', '', '', '', '', '', '', number_format($data['office_totals'][$office->id] / 100, 2, '.', ''));
                }
                $write($totals);
                fclose($out);
            }, 'consolidated-ppmp-'.$year.'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
        }
        $page = (int) ($filters['page'] ?? 1);
        $data['rows'] = (new LengthAwarePaginator(array_slice($data['rows'], ($page - 1) * 50, 50), count($data['rows']), 50, $page, ['path' => $request->url()]))->withQueryString();

        return Inertia::render('ConsolidatedPpmp', [...$data, 'filters' => ['year' => $year, 'office_id' => $officeId, 'fund' => $fund]]);
    }
}
