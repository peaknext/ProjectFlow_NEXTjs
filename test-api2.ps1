$json = Get-Content test-data-ascii.json -Raw -Encoding UTF8

Write-Host "Testing ADMIN Create User API..."
Write-Host "Request Data:"
Write-Host $json
Write-Host ""

try {
  $response = Invoke-WebRequest `
    -Uri 'http://localhost:3000/api/admin/users' `
    -Method POST `
    -ContentType 'application/json; charset=utf-8' `
    -Body $json

  Write-Host "Success! Status Code: $($response.StatusCode)"
  Write-Host ""
  Write-Host "Response:"
  $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
  Write-Host "Error occurred:"
  Write-Host $_.Exception.Message

  if ($_.Exception.Response) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Response Body:"
    Write-Host $responseBody
  }
}
