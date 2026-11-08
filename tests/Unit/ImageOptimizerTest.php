<?php

use App\Services\ImageOptimizer;
use Illuminate\Http\UploadedFile;

uses(Tests\TestCase::class);

function freshinTestImage(int $width, int $height, string $name): UploadedFile
{
    $image = imagecreatetruecolor($width, $height);
    // Smooth gradient plus noise, like a photo, so the PNG is realistically large.
    mt_srand(42);
    for ($y = 0; $y < $height; $y += 2) {
        for ($x = 0; $x < $width; $x += 2) {
            $noise = mt_rand(0, 40);
            imagefilledrectangle($image, $x, $y, $x + 1, $y + 1, imagecolorallocate($image,
                min(255, (int) (200 * $x / $width) + $noise), min(255, (int) (150 * $y / $height) + $noise), 80 + $noise));
        }
    }
    $path = tempnam(sys_get_temp_dir(), 'png');
    imagepng($image, $path);
    imagedestroy($image);

    return new UploadedFile($path, $name, 'image/png', null, true);
}

test('large photos are scaled down and stored smaller', function () {
    $file = freshinTestImage(2400, 1600, 'Chickpea Curry.png');
    $result = (new ImageOptimizer)->optimize($file);

    expect($result)->not->toBeNull();
    [$width, $height] = getimagesize($result['path']);
    expect(max($width, $height))->toBe(ImageOptimizer::MAX_SIDE)
        ->and($width / $height)->toEqualWithDelta(1.5, 0.01)
        ->and(filesize($result['path']))->toBeLessThan($file->getSize())
        ->and($result['name'])->toStartWith('Chickpea Curry.');
    @unlink($result['path']);
});

test('small images and non-images are kept as they are', function () {
    expect((new ImageOptimizer)->optimize(freshinTestImage(200, 200, 'icon.png')))->toBeNull();

    $text = tempnam(sys_get_temp_dir(), 'txt');
    file_put_contents($text, 'not an image');
    expect((new ImageOptimizer)->optimize(new UploadedFile($text, 'notes.txt', 'text/plain', null, true)))->toBeNull();
});
