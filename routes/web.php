<?php

use App\Http\Controllers\AnnualPlanController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\WorkspaceController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect('/dashboard'));
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'create'])->name('login');
    Route::post('/login', [AuthController::class, 'store'])->middleware('throttle:5,1');
});
Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'destroy']);
    Route::get('/dashboard', [WorkspaceController::class, 'dashboard']);
    Route::get('/catalogue', [WorkspaceController::class, 'catalogue']);
    Route::post('/catalogue', [WorkspaceController::class, 'saveItem']);
    Route::put('/catalogue/{item}', [WorkspaceController::class, 'saveItem']);
    Route::get('/budgets', [WorkspaceController::class, 'budgetIndex']);
    Route::post('/budgets', [WorkspaceController::class, 'saveBudget']);
    Route::get('/administration', [WorkspaceController::class, 'administration']);
    Route::post('/offices', [WorkspaceController::class, 'saveOffice']);
    Route::post('/users', [WorkspaceController::class, 'saveUser']);
    Route::get('/audit', [WorkspaceController::class, 'audit']);
    Route::get('/plans', [PlanController::class, 'index']);
    Route::get('/plans/create', [PlanController::class, 'create']);
    Route::post('/plans', [PlanController::class, 'store']);
    Route::get('/plans/{plan}', [PlanController::class, 'show']);
    Route::get('/plans/{plan}/edit', [PlanController::class, 'edit']);
    Route::put('/plans/{plan}', [PlanController::class, 'update']);
    Route::post('/plans/{plan}/transition', [PlanController::class, 'transition']);
    Route::get('/plans/{plan}/export', [PlanController::class, 'export']);
    Route::get('/annual-plans', [AnnualPlanController::class, 'index']);
    Route::post('/annual-plans', [AnnualPlanController::class, 'store']);
    Route::post('/annual-plans/{annualPlan}/approve', [AnnualPlanController::class, 'approve']);
});
