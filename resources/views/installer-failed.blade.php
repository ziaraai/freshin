<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Freshin installation incomplete</title></head>
<body style="font-family:system-ui,sans-serif;max-width:850px;margin:3rem auto;padding:1rem">
    <h1>Installation incomplete</h1>
    <p>{{ $result['message'] ?? 'Run the database installation successfully before completing setup.' }}</p>
    <p>The application has not been marked as installed. Existing database tables have been preserved.</p>
    @if(!empty($result['dbOutputLog']))
        <h2>Database output</h2>
        <pre style="white-space:pre-wrap;overflow-wrap:anywhere">{{ $result['dbOutputLog'] }}</pre>
    @endif
    <p>Review the error and use an empty database for a new installation. Do not delete existing tables to bypass an error.</p>
    <p><a href="{{ route('LaravelInstaller::environmentWizard') }}">Return to configuration</a></p>
</body>
</html>
