<?php

namespace App\Http\Controllers;

use RachidLaasri\LaravelInstaller\Controllers\FinalController;
use RachidLaasri\LaravelInstaller\Helpers\EnvironmentManager;
use RachidLaasri\LaravelInstaller\Helpers\FinalInstallManager;
use RachidLaasri\LaravelInstaller\Helpers\InstalledFileManager;

class InstallerFinalController extends FinalController
{
    public function finish(InstalledFileManager $fileManager, FinalInstallManager $finalInstall, EnvironmentManager $environment)
    {
        $result = session('message');
        if (!is_array($result) || ($result['status'] ?? null) !== 'success') {
            return response()->view('installer-failed', ['result' => $result ?? []], 422);
        }

        return parent::finish($fileManager, $finalInstall, $environment);
    }
}
