<?php

namespace App\Services;

use Illuminate\Support\Facades\Artisan;
use RachidLaasri\LaravelInstaller\Helpers\DatabaseManager;
use Symfony\Component\Console\Output\BufferedOutput;

class InstallationDatabaseManager extends DatabaseManager
{
    public function migrateAndSeed()
    {
        $output = new BufferedOutput;
        $lock = fopen(storage_path('framework/installation.lock'), 'c');
        if ($lock === false) {
            return ['status' => 'error', 'message' => 'The storage/framework directory must be writable.', 'dbOutputLog' => ''];
        }
        $locked = false;
        try {
            $locked = flock($lock, LOCK_EX | LOCK_NB);
            if (!$locked) {
                return ['status' => 'error', 'message' => 'An installation is already running. Wait for it to finish.', 'dbOutputLog' => ''];
            }
            foreach (['migrate', 'db:seed'] as $command) {
                if (Artisan::call($command, ['--force' => true], $output) !== 0) {
                    return ['status' => 'error', 'message' => 'Installation stopped: '.$command.' failed. Review the database output before retrying.', 'dbOutputLog' => $output->fetch()];
                }
            }
            return ['status' => 'success', 'message' => 'The database was migrated and seeded successfully.', 'dbOutputLog' => $output->fetch()];
        } catch (\Throwable $exception) {
            report($exception);
            return ['status' => 'error', 'message' => 'The database installation failed. Check the application log before retrying.', 'dbOutputLog' => $output->fetch()];
        } finally {
            if ($locked) {
                flock($lock, LOCK_UN);
            }
            fclose($lock);
        }
    }
}
