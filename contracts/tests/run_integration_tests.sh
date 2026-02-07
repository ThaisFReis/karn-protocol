#!/bin/bash

# Integration Tests Runner
# Builds contracts and runs all integration tests

set -e  # Exit on error

echo "========================================="
echo "Karn Protocol Integration Tests"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build all contracts
echo -e "${YELLOW}Step 1: Building smart contracts...${NC}"
cd ..  # Go to contracts/ directory

if stellar contract build; then
    echo -e "${GREEN}✓ Contracts built successfully${NC}"
else
    echo -e "${RED}✗ Contract build failed${NC}"
    exit 1
fi

echo ""

# Step 2: Verify WASM files exist
echo -e "${YELLOW}Step 2: Verifying WASM files...${NC}"

WASM_DIR="target/wasm32-unknown-unknown/release"
REQUIRED_WASMS=("valocracy.wasm" "governor.wasm" "treasury.wasm" "soroban_token_contract.wasm")

for wasm in "${REQUIRED_WASMS[@]}"; do
    if [ -f "$WASM_DIR/$wasm" ]; then
        SIZE=$(ls -lh "$WASM_DIR/$wasm" | awk '{print $5}')
        echo -e "${GREEN}✓${NC} $wasm ($SIZE)"
    else
        echo -e "${RED}✗${NC} $wasm not found"
        exit 1
    fi
done

echo ""

# Step 3: Run integration tests
echo -e "${YELLOW}Step 3: Running integration tests...${NC}"
echo ""

cd tests  # Go to tests/ directory

if [ "$1" == "--verbose" ] || [ "$1" == "-v" ]; then
    # Verbose mode
    cargo test -- --nocapture --test-threads=1
elif [ "$1" == "--specific" ] || [ "$1" == "-s" ]; then
    # Run specific test
    if [ -z "$2" ]; then
        echo -e "${RED}Error: Please specify test name${NC}"
        echo "Usage: ./run_integration_tests.sh --specific test_name"
        exit 1
    fi
    cargo test "$2" -- --nocapture
else
    # Normal mode
    cargo test
fi

TEST_EXIT_CODE=$?

echo ""

# Step 4: Report results
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}========================================="
    echo "✓ All integration tests passed!"
    echo "=========================================${NC}"
    exit 0
else
    echo -e "${RED}========================================="
    echo "✗ Some tests failed"
    echo "=========================================${NC}"
    echo ""
    echo "Debugging tips:"
    echo "  1. Run with --verbose flag for detailed output"
    echo "  2. Check contract implementations"
    echo "  3. Verify WASM files are up to date"
    echo ""
    exit 1
fi
