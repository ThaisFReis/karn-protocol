#!/bin/bash

# Karn Protocol Test Runner
# Builds contracts and runs all test suites: integration, fuzzing, and invariant tests

set -e  # Exit on error

echo "========================================="
echo "Karn Protocol Test Suite"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
VERBOSE=false
SPECIFIC=""
TEST_SUITE="all"

while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -s|--specific)
            SPECIFIC="$2"
            shift 2
            ;;
        --integration)
            TEST_SUITE="integration"
            shift
            ;;
        --fuzz)
            TEST_SUITE="fuzz"
            shift
            ;;
        --invariant)
            TEST_SUITE="invariant"
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Usage: ./run_integration_tests.sh [OPTIONS]"
            echo "Options:"
            echo "  -v, --verbose        Verbose output"
            echo "  -s, --specific TEST  Run specific test"
            echo "  --integration        Run only integration tests"
            echo "  --fuzz              Run only fuzzing tests"
            echo "  --invariant         Run only invariant tests"
            exit 1
            ;;
    esac
done

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

# Step 3: Run tests
cd tests  # Go to tests/ directory

run_test_suite() {
    local suite_name=$1
    local test_flag=$2

    echo -e "${BLUE}Running $suite_name tests...${NC}"

    if [ "$VERBOSE" == "true" ]; then
        cargo test $test_flag -- --nocapture --test-threads=1
    elif [ -n "$SPECIFIC" ]; then
        cargo test $test_flag "$SPECIFIC" -- --nocapture
    else
        cargo test $test_flag
    fi

    return $?
}

echo -e "${YELLOW}Step 3: Running test suites...${NC}"
echo ""

INTEGRATION_EXIT=0
FUZZ_EXIT=0
INVARIANT_EXIT=0

case $TEST_SUITE in
    integration)
        run_test_suite "integration" "--test integration_tests"
        INTEGRATION_EXIT=$?
        ;;
    fuzz)
        run_test_suite "fuzzing" "--test fuzz_tests"
        FUZZ_EXIT=$?
        ;;
    invariant)
        run_test_suite "invariant" "--test invariant_tests"
        INVARIANT_EXIT=$?
        ;;
    all)
        echo -e "${BLUE}=== Integration Tests ===${NC}"
        run_test_suite "integration" "--test integration_tests"
        INTEGRATION_EXIT=$?
        echo ""

        echo -e "${BLUE}=== Fuzzing Tests ===${NC}"
        run_test_suite "fuzzing" "--test fuzz_tests"
        FUZZ_EXIT=$?
        echo ""

        echo -e "${BLUE}=== Invariant Tests ===${NC}"
        run_test_suite "invariant" "--test invariant_tests"
        INVARIANT_EXIT=$?
        ;;
esac

echo ""

# Step 4: Report results
ALL_PASSED=true

echo "========================================="
echo "Test Results Summary"
echo "========================================="

if [ "$TEST_SUITE" == "all" ] || [ "$TEST_SUITE" == "integration" ]; then
    if [ $INTEGRATION_EXIT -eq 0 ]; then
        echo -e "${GREEN}✓ Integration Tests: PASSED${NC}"
    else
        echo -e "${RED}✗ Integration Tests: FAILED${NC}"
        ALL_PASSED=false
    fi
fi

if [ "$TEST_SUITE" == "all" ] || [ "$TEST_SUITE" == "fuzz" ]; then
    if [ $FUZZ_EXIT -eq 0 ]; then
        echo -e "${GREEN}✓ Fuzzing Tests: PASSED${NC}"
    else
        echo -e "${RED}✗ Fuzzing Tests: FAILED${NC}"
        ALL_PASSED=false
    fi
fi

if [ "$TEST_SUITE" == "all" ] || [ "$TEST_SUITE" == "invariant" ]; then
    if [ $INVARIANT_EXIT -eq 0 ]; then
        echo -e "${GREEN}✓ Invariant Tests: PASSED${NC}"
    else
        echo -e "${RED}✗ Invariant Tests: FAILED${NC}"
        ALL_PASSED=false
    fi
fi

echo "========================================="

if [ "$ALL_PASSED" == "true" ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo ""
    echo "Debugging tips:"
    echo "  1. Run with --verbose flag: $0 --verbose"
    echo "  2. Run specific suite: $0 --integration|--fuzz|--invariant"
    echo "  3. Run specific test: $0 --specific test_name"
    echo "  4. Check contract implementations"
    echo "  5. Verify WASM files are up to date"
    echo ""
    exit 1
fi
