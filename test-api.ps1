$json = Get-Content test-data.json -Raw

$response = Invoke-WebRequest `
  -Uri 'http://localhost:3000/api/admin/users' `
  -Method POST `
  -ContentType 'application/json' `
  -Body $json

Write-Host "Status Code: $($response.StatusCode)"
Write-Host ""
Write-Host "Response:"
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
