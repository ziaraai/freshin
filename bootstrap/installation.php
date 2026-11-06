<?php

/** Prepare a fresh web installation without distributing an application key. */
function freshinBootstrapEnvironment(string $root): void
{
    if (is_file($root.'/.env') || is_file($root.'/storage/installed')) {
        return;
    }

    $template = $root.'/.env.example';
    if (!is_file($template)) {
        return;
    }

    $lock = fopen($root.'/bootstrap/cache/installation.lock', 'c');
    if ($lock === false) {
        throw new RuntimeException('The installation cache directory must be writable.');
    }

    try {
        if (!flock($lock, LOCK_EX)) {
            throw new RuntimeException('Could not prepare the installation environment.');
        }
        if (is_file($root.'/.env') || is_file($root.'/storage/installed')) {
            return;
        }

        $content = file_get_contents($template);
        if ($content === false) {
            throw new RuntimeException('Could not read the installation template.');
        }
        $content = preg_replace('/^APP_KEY=.*$/m', 'APP_KEY=base64:'.base64_encode(random_bytes(32)), $content, 1, $count);
        if ($content === null || $count !== 1) {
            throw new RuntimeException('The installation template must contain APP_KEY.');
        }

        $temporary = tempnam($root.'/bootstrap/cache', 'environment-');
        if ($temporary === false) {
            throw new RuntimeException('Could not create the installation environment.');
        }
        try {
            chmod($temporary, 0600);
            if (file_put_contents($temporary, $content) !== strlen($content) || !rename($temporary, $root.'/.env')) {
                throw new RuntimeException('The application directory must be writable during installation.');
            }
        } finally {
            if (is_file($temporary)) {
                unlink($temporary);
            }
        }
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}
