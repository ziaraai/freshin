<?php

require_once dirname(__DIR__, 2).'/bootstrap/installation.php';

beforeEach(function () {
    $this->installRoot = sys_get_temp_dir().'/freshin-install-'.bin2hex(random_bytes(8));
    mkdir($this->installRoot.'/bootstrap/cache', 0775, true);
    mkdir($this->installRoot.'/storage', 0775, true);
    file_put_contents($this->installRoot.'/.env.example', "APP_NAME=Freshin\nAPP_KEY=\nAPP_DEBUG=false\n");
});

afterEach(function () {
    foreach (['.env', '.env.example', 'storage/installed', 'bootstrap/cache/installation.lock'] as $file) {
        if (is_file($this->installRoot.'/'.$file)) unlink($this->installRoot.'/'.$file);
    }
    rmdir($this->installRoot.'/bootstrap/cache');
    rmdir($this->installRoot.'/bootstrap');
    rmdir($this->installRoot.'/storage');
    rmdir($this->installRoot);
});

test('a fresh installation generates a unique key and keeps it on subsequent requests', function () {
    freshinBootstrapEnvironment($this->installRoot);
    $content = file_get_contents($this->installRoot.'/.env');
    preg_match('/^APP_KEY=base64:(.+)$/m', $content, $key);
    expect(strlen(base64_decode($key[1], true)))->toBe(32)
        ->and($content)->toContain('APP_DEBUG=false')
        ->and(fileperms($this->installRoot.'/.env') & 0777)->toBe(0600);
    freshinBootstrapEnvironment($this->installRoot);
    expect(file_get_contents($this->installRoot.'/.env'))->toBe($content);
});

test('an existing environment is never overwritten', function () {
    file_put_contents($this->installRoot.'/.env', "APP_KEY=existing-fixture-key\n");
    freshinBootstrapEnvironment($this->installRoot);
    expect(file_get_contents($this->installRoot.'/.env'))->toBe("APP_KEY=existing-fixture-key\n");
});

test('an installed application without an environment is not silently rekeyed', function () {
    touch($this->installRoot.'/storage/installed');
    freshinBootstrapEnvironment($this->installRoot);
    expect(is_file($this->installRoot.'/.env'))->toBeFalse();
});
