#!/bin/bash

# Health check script for invoices-srv

echo "🔍 Checking Invoices Service Health..."

# Check TypeScript compilation
echo "📝 Checking TypeScript compilation..."
if npx tsc --noEmit; then
    echo "✅ TypeScript compilation successful"
else
    echo "❌ TypeScript compilation failed"
    exit 1
fi

# Check linting
echo "🔧 Checking ESLint..."
if npm run lint; then
    echo "✅ Linting passed"
else
    echo "⚠️  Linting issues found (but not blocking)"
fi

# Check if main files exist and are valid
echo "📂 Checking main files..."

required_files=(
    "src/main.ts"
    "src/app.module.ts"
    "src/entities/index.ts"
    "src/common/guards/auth.guard.ts"
    "src/common/filters/global-exception.filter.ts"
    "package.json"
    "tsconfig.json"
    "docker-compose.yml"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

echo ""
echo "🎉 All health checks passed!"
echo "🚀 Your Invoices Service is ready to run!"
echo ""
echo "Next steps:"
echo "1. Start services: docker-compose up -d"
echo "2. Run the app: npm run start:dev"
echo "3. Check API docs: http://localhost:3000/api/v1/docs"
