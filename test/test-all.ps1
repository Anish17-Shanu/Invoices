# ==============================
# Flocci-Invoices Full Test Script
# ==============================

Write-Host "==============================="
Write-Host "1. Cleaning previous builds..."
Write-Host "==============================="
Remove-Item -Recurse -Force .\dist\* -ErrorAction SilentlyContinue

# ------------------------------
# 2. Compile TypeScript
# ------------------------------
Write-Host "==============================="
Write-Host "2. Compiling TypeScript..."
Write-Host "==============================="
npx tsc
if ($LASTEXITCODE -ne 0) {
    Write-Host "TypeScript compilation failed!" -ForegroundColor Red
    exit 1
}

# ------------------------------
# 3. Run database migrations
# ------------------------------
Write-Host "==============================="
Write-Host "3. Running TypeORM migrations..."
Write-Host "==============================="
npx typeorm migration:run -d dist/src/config/data-source.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "Migration run failed!" -ForegroundColor Red
    exit 1
}

# ------------------------------
# 4. Seed default data (optional)
# ------------------------------
Write-Host "==============================="
Write-Host "4. Seeding default data (optional)..."
Write-Host "==============================="
# Example: run a seed script if exists
if (Test-Path .\dist\seeds\seed-default-data.js) {
    node .\dist\seeds\seed-default-data.js
} else {
    Write-Host "No seed script found, skipping..."
}

# ------------------------------
# 5. Run unit tests
# ------------------------------
Write-Host "==============================="
Write-Host "5. Running unit tests..."
Write-Host "==============================="
npx jest --config jest.config.js --runInBand
if ($LASTEXITCODE -ne 0) {
    Write-Host "Unit tests failed!" -ForegroundColor Red
    exit 1
}

# ------------------------------
# 6. Run e2e tests
# ------------------------------
Write-Host "==============================="
Write-Host "6. Running e2e tests..."
Write-Host "==============================="
# Make sure e2e tests use a separate test DB
npx jest --config jest-e2e.json --runInBand
if ($LASTEXITCODE -ne 0) {
    Write-Host "E2E tests failed!" -ForegroundColor Red
    exit 1
}

Write-Host "==============================="
Write-Host "All tests completed successfully!" -ForegroundColor Green
Write-Host "==============================="
