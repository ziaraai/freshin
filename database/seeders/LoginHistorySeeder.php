<?php

namespace Database\Seeders;

use App\Models\LoginHistory;
use App\Models\User;
use App\Models\Store;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class LoginHistorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $ipAddresses = [
            '192.168.1.100', '10.0.0.50', '172.16.0.25', '203.0.113.45',
            '198.51.100.78', '127.0.0.1', '192.168.0.15', '10.1.1.200',
            '45.33.32.156', '104.244.42.1', '185.199.108.153', '140.82.112.4'
        ];

        $browserData = [
            ['browser_name' => 'Chrome', 'os_name' => 'Windows', 'device_type' => 'desktop', 'browser_language' => 'en'],
            ['browser_name' => 'Firefox', 'os_name' => 'Linux', 'device_type' => 'desktop', 'browser_language' => 'en'],
            ['browser_name' => 'Safari', 'os_name' => 'macOS', 'device_type' => 'desktop', 'browser_language' => 'en'],
            ['browser_name' => 'Chrome', 'os_name' => 'Android', 'device_type' => 'mobile', 'browser_language' => 'en'],
            ['browser_name' => 'Safari', 'os_name' => 'iOS', 'device_type' => 'mobile', 'browser_language' => 'en'],
            ['browser_name' => 'Edge', 'os_name' => 'Windows', 'device_type' => 'desktop', 'browser_language' => 'en'],
        ];

        $locationData = [
            ['country' => 'United States', 'countryCode' => 'US', 'region' => 'CA', 'regionName' => 'California', 'city' => 'San Francisco', 'zip' => '94102', 'lat' => 37.7749, 'lon' => -122.4194, 'timezone' => 'America/Los_Angeles', 'isp' => 'Comcast Cable', 'org' => 'Comcast Cable Communications'],
            ['country' => 'United Kingdom', 'countryCode' => 'GB', 'region' => 'ENG', 'regionName' => 'England', 'city' => 'London', 'zip' => 'SW1A', 'lat' => 51.5074, 'lon' => -0.1278, 'timezone' => 'Europe/London', 'isp' => 'British Telecom', 'org' => 'BT Group'],
            ['country' => 'Germany', 'countryCode' => 'DE', 'region' => 'BE', 'regionName' => 'Berlin', 'city' => 'Berlin', 'zip' => '10115', 'lat' => 52.5200, 'lon' => 13.4050, 'timezone' => 'Europe/Berlin', 'isp' => 'Deutsche Telekom', 'org' => 'T-Systems'],
            ['country' => 'India', 'countryCode' => 'IN', 'region' => 'MH', 'regionName' => 'Maharashtra', 'city' => 'Mumbai', 'zip' => '400001', 'lat' => 19.0760, 'lon' => 72.8777, 'timezone' => 'Asia/Kolkata', 'isp' => 'Jio', 'org' => 'Reliance Jio'],
            ['country' => 'Canada', 'countryCode' => 'CA', 'region' => 'ON', 'regionName' => 'Ontario', 'city' => 'Toronto', 'zip' => 'M5H', 'lat' => 43.6532, 'lon' => -79.3832, 'timezone' => 'America/Toronto', 'isp' => 'Rogers', 'org' => 'Rogers Communications'],
        ];

        // 1. Seed Superadmin Login History records
        $superAdmin = User::where('type', 'superadmin')->first();
        if ($superAdmin) {
            for ($i = 0; $i < 5; $i++) {
                $browser = $browserData[array_rand($browserData)];
                $location = $locationData[array_rand($locationData)];
                $ip = $ipAddresses[array_rand($ipAddresses)];

                $details = array_merge($browser, $location, [
                    'status' => 'success',
                    'query' => $ip,
                    'referrer_host' => fake()->randomElement(['localhost', 'example.com', 'google.com', null]),
                    'referrer_path' => fake()->randomElement(['/login', '/dashboard', '/home', null]),
                    'as' => null
                ]);

                $daysAgo = ($i * 3) + 1;
                $createdAt = Carbon::now()->subDays($daysAgo)->subHours(rand(1, 23))->subMinutes(rand(1, 59));

                LoginHistory::create([
                    'user_id' => $superAdmin->id,
                    'store_id' => null,
                    'ip' => $ip,
                    'date' => $createdAt->toDateString(),
                    'details' => $details,
                    'type' => $superAdmin->type,
                    'created_by' => $superAdmin->id,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);
            }
        }

        // 2. Seed Company (created_by = 2) Login History records store-wise
        $companyUser = User::where('email', 'company@example.com')->first();

        if (!$companyUser) {
            $this->command->warn('User company@example.com not found. Please run UserSeeder first.');
            return;
        }

        $stores = Store::where('user_id', $companyUser->id)->get();

        if ($stores->isEmpty()) {
            $this->command->warn('No stores found for company@example.com. Please run StoreSeeder first.');
            return;
        }

        $totalRecords = 0;

        foreach ($stores as $store) {
            // Get staff users for this store created by company (created_by = 2)
            $staffUsers = User::where('created_by', $companyUser->id)
                ->where('current_store', $store->id)
                ->get();

            // Group staff by their role/type so we can select users with different roles
            $staffByType = $staffUsers->groupBy('type');

            // Build a list of 10 users for this store with diverse roles
            $selectedUsers = [];

            // 1) Add company user (2 records per store)
            $selectedUsers[] = $companyUser;
            $selectedUsers[] = $companyUser;

            // 2) Add staff users with different roles (8 records per store)
            if ($staffByType->isNotEmpty()) {
                $types = $staffByType->keys()->all();
                $typeCount = count($types);
                $remainingSlots = 8;

                // Pick from each role type in rotation to ensure variety of roles
                for ($s = 0; $s < $remainingSlots; $s++) {
                    $type = $types[$s % $typeCount];
                    $usersOfThisType = $staffByType[$type];
                    $selectedUsers[] = $usersOfThisType->random();
                }
            } else {
                // Fallback if no staff users exist for this store
                while (count($selectedUsers) < 10) {
                    $selectedUsers[] = $companyUser;
                }
            }

            // Shuffle the order so the history entries are distributed across dates
            shuffle($selectedUsers);

            // Create 10 login history records for this store
            foreach ($selectedUsers as $index => $user) {
                $browser = $browserData[array_rand($browserData)];
                $location = $locationData[array_rand($locationData)];
                $ip = $ipAddresses[array_rand($ipAddresses)];

                $details = array_merge($browser, $location, [
                    'status' => 'success',
                    'query' => $ip,
                    'referrer_host' => fake()->randomElement(['localhost', 'example.com', 'google.com', null]),
                    'referrer_path' => fake()->randomElement(['/login', '/dashboard', '/home', null]),
                    'as' => null
                ]);

                $daysAgo = ($index * 2) + 1;
                $createdAt = Carbon::now()->subDays($daysAgo)->subHours(rand(1, 23))->subMinutes(rand(1, 59));

                LoginHistory::create([
                    'user_id' => $user->id,
                    'store_id' => $store->id,
                    'ip' => $ip,
                    'date' => $createdAt->toDateString(),
                    'details' => $details,
                    'type' => $user->type,
                    'created_by' => $companyUser->id,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);

                $totalRecords++;
            }
        }

        $this->command->info("Created {$totalRecords} login history records for created_by={$companyUser->id} across {$stores->count()} stores (10 per store with different user roles), plus superadmin login records.");
    }
}
