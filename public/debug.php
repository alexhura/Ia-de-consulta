<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: text/plain');

echo "=== DEBUG INFO ===\n\n";
echo "PHP Version: " . PHP_VERSION . "\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "Script: " . __FILE__ . "\n\n";

echo "=== ENV FILE ===\n";
$envPath = __DIR__ . '/../.env';
echo "Path: $envPath\n";
echo "Exists: " . (file_exists($envPath) ? 'YES' : 'NO') . "\n";
if (file_exists($envPath)) {
    echo "Content:\n" . file_get_contents($envPath) . "\n";
}

echo "\n=== AUTOLOAD ===\n";
$autoload = __DIR__ . '/../vendor/autoload.php';
echo "Path: $autoload\n";
echo "Exists: " . (file_exists($autoload) ? 'YES' : 'NO') . "\n";

echo "\n=== DIRECTORIES ===\n";
echo "Parent dir:\n";
print_r(scandir(__DIR__ . '/..'));
