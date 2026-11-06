<?php

use App\Services\InstallationDatabaseManager;
use Illuminate\Support\Facades\Artisan;
use Symfony\Component\Console\Output\BufferedOutput;

uses(Tests\TestCase::class);

beforeEach(function () {
    $this->withoutMiddleware();
});

test('a migration failure never runs seeders or reports installation success', function () {
    Artisan::shouldReceive('call')->once()->with('migrate', ['--force' => true], Mockery::type(BufferedOutput::class))->andReturn(1);
    Artisan::shouldReceive('call')->with('db:seed', Mockery::any(), Mockery::any())->never();
    $result = app(InstallationDatabaseManager::class)->migrateAndSeed();
    expect($result['status'])->toBe('error')->and($result['message'])->toContain('migrate failed');
});

test('a seeder failure is not reported as a successful database installation', function () {
    Artisan::shouldReceive('call')->once()->with('migrate', ['--force' => true], Mockery::type(BufferedOutput::class))->andReturn(0);
    Artisan::shouldReceive('call')->once()->with('db:seed', ['--force' => true], Mockery::type(BufferedOutput::class))->andReturn(1);
    expect(app(InstallationDatabaseManager::class)->migrateAndSeed()['status'])->toBe('error');
});

test('only successful migrations and seeders report success', function () {
    Artisan::shouldReceive('call')->once()->with('migrate', ['--force' => true], Mockery::type(BufferedOutput::class))->andReturn(0);
    Artisan::shouldReceive('call')->once()->with('db:seed', ['--force' => true], Mockery::type(BufferedOutput::class))->andReturn(0);
    expect(app(InstallationDatabaseManager::class)->migrateAndSeed()['status'])->toBe('success');
});

test('concurrent database installations are rejected before any database command', function () {
    $lock = fopen(storage_path('framework/installation.lock'), 'c');
    flock($lock, LOCK_EX);
    try {
        Artisan::shouldReceive('call')->never();
        $result = app(InstallationDatabaseManager::class)->migrateAndSeed();
        expect($result['status'])->toBe('error')->and($result['message'])->toContain('already running');
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
});

test('failed database setup does not run final commands or mark the app installed', function () {
    $this->mock(\RachidLaasri\LaravelInstaller\Helpers\FinalInstallManager::class)->shouldNotReceive('runFinal');
    $this->mock(\RachidLaasri\LaravelInstaller\Helpers\InstalledFileManager::class)->shouldNotReceive('update');
    $this->withSession(['message' => ['status' => 'error', 'message' => 'Migration failed', 'dbOutputLog' => 'order_items already exists']])
        ->get('/install/final')->assertStatus(422)->assertSee('Installation incomplete')
        ->assertSee('order_items already exists')->assertDontSee('Installation Completed Successfully');
});

test('opening the final URL directly cannot complete an installation', function () {
    $this->mock(\RachidLaasri\LaravelInstaller\Helpers\FinalInstallManager::class)->shouldNotReceive('runFinal');
    $this->mock(\RachidLaasri\LaravelInstaller\Helpers\InstalledFileManager::class)->shouldNotReceive('update');
    $this->get('/install/final')->assertStatus(422)->assertSee('Installation incomplete');
});
