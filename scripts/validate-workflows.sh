#!/bin/bash

# Workflow Validation Script
# This script validates GitHub workflow configurations before they reach main branch

set -e

echo "🔍 Validating GitHub workflow configurations..."

WORKFLOW_DIR=".github/workflows"
CI_WORKFLOW="$WORKFLOW_DIR/ci.yml"

# Function to check if a file exists
check_file_exists() {
    if [ ! -f "$1" ]; then
        echo "❌ ERROR: $1 not found"
        exit 1
    fi
}

# Function to validate YAML syntax
validate_yaml_syntax() {
    echo "📝 Checking YAML syntax for $1..."
    if ! python3 -c "import yaml; yaml.safe_load(open('$1'))" >/dev/null 2>&1; then
        echo "❌ ERROR: Invalid YAML syntax in $1"
        exit 1
    fi
    echo "✅ YAML syntax valid"
}

# Function to validate GitHub Pages deployment configuration
validate_pages_deployment() {
    echo "🚀 Validating GitHub Pages deployment configuration..."
    
    # Check if deploy job exists
    if ! grep -q "deploy:" "$CI_WORKFLOW"; then
        echo "⚠️  WARNING: No deploy job found in $CI_WORKFLOW"
        return 0
    fi
    
    # Check if deploy job has environment configuration
    if ! grep -A 10 "deploy:" "$CI_WORKFLOW" | grep -q "environment:"; then
        echo "❌ ERROR: Deploy job missing environment configuration"
        echo "   GitHub Pages deployment requires environment.name to be set to 'github-pages'"
        echo "   Add the following to your deploy job:"
        echo "   environment:"
        echo "     name: github-pages"
        echo "     url: \${{ steps.deployment.outputs.page_url }}"
        exit 1
    fi
    
    # Check if environment name is correctly set
    if ! grep -A 15 "deploy:" "$CI_WORKFLOW" | grep -q "name: github-pages"; then
        echo "❌ ERROR: Deploy job environment name must be 'github-pages'"
        exit 1
    fi
    
    # Check if required permissions are set
    if ! grep -q "pages: write" "$CI_WORKFLOW"; then
        echo "❌ ERROR: Missing 'pages: write' permission"
        echo "   Add 'pages: write' to the permissions section"
        exit 1
    fi
    
    if ! grep -q "id-token: write" "$CI_WORKFLOW"; then
        echo "❌ ERROR: Missing 'id-token: write' permission"
        echo "   Add 'id-token: write' to the permissions section"
        exit 1
    fi
    
    echo "✅ GitHub Pages deployment configuration is valid"
}

# Main validation
echo "Starting workflow validation..."

# Check if workflow directory exists
if [ ! -d "$WORKFLOW_DIR" ]; then
    echo "❌ ERROR: $WORKFLOW_DIR directory not found"
    exit 1
fi

# Validate each workflow file
for workflow in "$WORKFLOW_DIR"/*.yml "$WORKFLOW_DIR"/*.yaml; do
    if [ -f "$workflow" ]; then
        echo "📁 Found workflow: $workflow"
        validate_yaml_syntax "$workflow"
    fi
done

# Validate CI workflow specifically
if [ -f "$CI_WORKFLOW" ]; then
    validate_pages_deployment
fi

echo ""
echo "🎉 All workflow validations passed!"
echo "💡 Run this script in your pre-commit hooks to catch issues early."