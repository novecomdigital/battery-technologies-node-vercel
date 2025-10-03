#!/bin/bash

# Node Vercel Template - Automated Migration Script
# 
# This script automates the migration of legacy Next.js projects to the
# node-vercel-template standard.
# 
# Based on lessons learned from the service-desk migration.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to validate prerequisites
validate_prerequisites() {
    print_status "Validating prerequisites..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm and try again."
        exit 1
    fi
    
    if ! command_exists git; then
        print_error "git is not installed. Please install git and try again."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_success "All prerequisites validated"
}

# Function to display usage
show_usage() {
    echo "Usage: $0 <source-project-path> <target-project-name>"
    echo ""
    echo "Arguments:"
    echo "  source-project-path  Path to the legacy project to migrate"
    echo "  target-project-name  Name for the new migrated project"
    echo ""
    echo "Example:"
    echo "  $0 ../my-old-project my-new-project"
    echo ""
    echo "This script will:"
    echo "  1. Create a new project from the node-vercel-template"
    echo "  2. Analyze the source project structure and dependencies"
    echo "  3. Merge dependencies and configuration"
    echo "  4. Copy source code and fix common issues"
    echo "  5. Set up runtime configuration for Prisma compatibility"
    echo "  6. Validate the migration"
}

# Main migration function
migrate_project() {
    local SOURCE_PROJECT="$1"
    local TARGET_PROJECT="$2"
    
    print_status "Starting migration from $SOURCE_PROJECT to $TARGET_PROJECT"
    echo ""
    
    # Step 1: Validate source project
    print_status "Step 1: Validating source project..."
    if [ ! -d "$SOURCE_PROJECT" ]; then
        print_error "Source project directory does not exist: $SOURCE_PROJECT"
        exit 1
    fi
    
    if [ ! -f "$SOURCE_PROJECT/package.json" ]; then
        print_error "Source project does not have a package.json file"
        exit 1
    fi
    
    print_success "Source project validated"
    
    # Step 2: Create target project from template
    print_status "Step 2: Creating target project from template..."
    if [ -d "$TARGET_PROJECT" ]; then
        print_warning "Target directory already exists. Removing..."
        rm -rf "$TARGET_PROJECT"
    fi
    
    # Clone the template
    git clone https://github.com/novecomdigital/node-vercel-template.git "$TARGET_PROJECT"
    cd "$TARGET_PROJECT"
    
    # Remove template git history
    rm -rf .git
    git init
    git add .
    git commit -m "Initial commit from node-vercel-template"
    
    print_success "Target project created"
    
    # Step 3: Analyze source project
    print_status "Step 3: Analyzing source project..."
    node scripts/migrate/analyze-source.js "../$SOURCE_PROJECT"
    print_success "Source project analyzed"
    
    # Step 4: Merge package.json
    print_status "Step 4: Merging dependencies..."
    node scripts/migrate/merge-package-json.js "../$SOURCE_PROJECT/package.json"
    print_success "Dependencies merged"
    
    # Step 5: Install dependencies
    print_status "Step 5: Installing dependencies..."
    npm install
    print_success "Dependencies installed"
    
    # Step 6: Copy source code
    print_status "Step 6: Copying source code..."
    node scripts/migrate/copy-source-code.js "../$SOURCE_PROJECT"
    print_success "Source code copied"
    
    # Step 7: Fix common issues
    print_status "Step 7: Fixing common issues..."
    node scripts/setup/fix-variable-refs.js
    print_success "Variable reference issues fixed"
    
    # Step 8: Configure runtime
    print_status "Step 8: Configuring runtime..."
    node scripts/setup/fix-runtime-config.js
    print_success "Runtime configuration applied"
    
    # Step 9: Validate migration
    print_status "Step 9: Validating migration..."
    node scripts/setup/validate-dependencies.js
    print_success "Migration validated"
    
    # Step 10: Update project configuration
    print_status "Step 10: Updating project configuration..."
    npm pkg set name="$TARGET_PROJECT"
    npm pkg set version="0.1.0"
    npm pkg set description="Migrated from $SOURCE_PROJECT"
    print_success "Project configuration updated"
    
    # Final commit
    git add .
    git commit -m "Complete migration from $SOURCE_PROJECT
    
    ✅ Migration completed successfully:
    - Dependencies merged and installed
    - Source code copied and fixed
    - Runtime configuration applied
    - Common issues resolved
    - Migration validated"
    
    print_success "Migration completed successfully!"
    echo ""
    print_status "Next steps:"
    echo "  1. Review the migrated application: cd $TARGET_PROJECT"
    echo "  2. Update environment variables: cp ../$SOURCE_PROJECT/.env .env"
    echo "  3. Configure database: npx prisma db push"
    echo "  4. Seed database: npm run db:seed"
    echo "  5. Start development: npm run dev"
    echo "  6. Run tests: npm test"
    echo ""
    print_status "Migration analysis saved to: migration-analysis.json"
}

# Main execution
main() {
    echo -e "${BLUE}🚀 Node Vercel Template - Automated Migration${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""
    
    # Check arguments
    if [ $# -ne 2 ]; then
        print_error "Invalid number of arguments"
        echo ""
        show_usage
        exit 1
    fi
    
    # Validate prerequisites
    validate_prerequisites
    echo ""
    
    # Run migration
    migrate_project "$1" "$2"
}

# Run main function with all arguments
main "$@"
