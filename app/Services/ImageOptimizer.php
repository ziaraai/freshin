<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;

/**
 * Shrinks uploaded photos so storefront pages stay light.
 *
 * Large JPEG/PNG/WebP images are scaled down to MAX_SIDE pixels on their longest side and
 * re-encoded (WebP when the server supports it, otherwise JPEG for images without transparency).
 * The original file is kept whenever optimisation fails or would not make the file smaller.
 */
class ImageOptimizer
{
    public const MAX_SIDE = 1600;
    public const QUALITY = 82;
    private const SKIP_BELOW_BYTES = 150 * 1024;

    /**
     * @return array{path: string, name: string}|null optimised temp file and its file name, or null to keep the original
     */
    public function optimize(UploadedFile $file): ?array
    {
        $source = $file->getRealPath();
        $info = $source ? @getimagesize($source) : false;
        if (!$info || !in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) {
            return null;
        }

        [$width, $height, $type] = $info;
        $originalSize = (int) $file->getSize();
        if ($originalSize < self::SKIP_BELOW_BYTES && max($width, $height) <= self::MAX_SIDE) {
            return null;
        }

        $image = match ($type) {
            IMAGETYPE_JPEG => function_exists('imagecreatefromjpeg') ? @imagecreatefromjpeg($source) : false,
            IMAGETYPE_PNG => function_exists('imagecreatefrompng') ? @imagecreatefrompng($source) : false,
            IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($source) : false,
        };
        if (!$image) {
            return null;
        }

        $scale = min(1, self::MAX_SIDE / max($width, $height));
        $newWidth = max(1, (int) round($width * $scale));
        $newHeight = max(1, (int) round($height * $scale));

        $resized = imagecreatetruecolor($newWidth, $newHeight);
        imagealphablending($resized, false);
        imagesavealpha($resized, true);
        imagefilledrectangle($resized, 0, 0, $newWidth, $newHeight, imagecolorallocatealpha($resized, 255, 255, 255, 127));
        imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
        imagedestroy($image);

        $baseName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME) ?: 'image';
        $target = tempnam(sys_get_temp_dir(), 'img');
        $written = false;
        $extension = null;

        if (function_exists('imagewebp')) {
            $written = imagewebp($resized, $target, self::QUALITY);
            $extension = 'webp';
        } elseif ($type !== IMAGETYPE_PNG || !$this->hasTransparency($resized)) {
            $flattened = imagecreatetruecolor($newWidth, $newHeight);
            imagefill($flattened, 0, 0, imagecolorallocate($flattened, 255, 255, 255));
            imagecopy($flattened, $resized, 0, 0, 0, 0, $newWidth, $newHeight);
            $written = imagejpeg($flattened, $target, self::QUALITY);
            imagedestroy($flattened);
            $extension = 'jpg';
        }
        imagedestroy($resized);

        clearstatcache(true, $target);
        if (!$written || !is_file($target) || filesize($target) === 0 || filesize($target) >= $originalSize) {
            @unlink($target);

            return null;
        }

        return ['path' => $target, 'name' => $baseName.'.'.$extension];
    }

    private function hasTransparency(\GdImage $image): bool
    {
        $width = imagesx($image);
        $height = imagesy($image);
        $step = max(1, (int) floor(min($width, $height) / 50));
        for ($x = 0; $x < $width; $x += $step) {
            for ($y = 0; $y < $height; $y += $step) {
                if (((imagecolorat($image, $x, $y) >> 24) & 0x7F) > 0) {
                    return true;
                }
            }
        }

        return false;
    }
}
