<?php

$config = include 'config/productos_imagenes.php';
$publicImagesObj = scandir('public/images');
$publicImages = array_flip($publicImagesObj);

print_r($publicImages);

$missing = [];
foreach ($config as $slug => $image) {
    // Some images have paths like 'landing/...'?
    // In config file Step 1506:
    // Some are just 'filename.png'.
    // Some are 'landing/category/filename.jpg'.
    
    // We only care about checking existence.
    // Ideally we check if 'public/images/' . $image exists.
    
    $path = 'public/images/' . $image;
    if (!file_exists($path)) {
        $missing[] = $image . " (for $slug)";
    }
}

echo "Missing images:\n";
foreach ($missing as $m) {
    echo $m . "\n";
}
