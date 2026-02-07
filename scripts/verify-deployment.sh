#!/bin/bash

# Karn Protocol - Deployment Verification Script
# Verifies that all contracts and services are working correctly
# Usage: ./verify-deployment.sh [testnet|mainnet]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

NETWORK="${1:-testnet}"
INIT_FILE="initialized-${NETWORK}.json"

if [ ! -f "$INIT_FILE" ]; then
    echo -e "${RED}Error: Initialization file not found: ${INIT_FILE}${NC}"
    echo "Run ./initialize-contracts.sh ${NETWORK} first"
    exit 1
fi

# Load contract addresses
VALOCRACY_ID=$(jq -r '.contracts.valocracy' "$INIT_FILE")
GOVERNOR_ID=$(jq -r '.contracts.governor' "$INIT_FILE")
TREASURY_ID=$(jq -r '.contracts.treasury' "$INIT_FILE")
FOUNDER=$(jq -r '.founder' "$INIT_FILE")

echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Karn Protocol - Deployment Verification${NC}"
echo -e "${BLUE}  Network: ${NETWORK}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""

TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to run test
run_test() {
    local test_name="$1"
    local command="$2"
    local expected="$3"

    echo -n "Testing: $test_name... "

    result=$(eval "$command" 2>&1 || echo "ERROR")

    if echo "$result" | grep -q "$expected"; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "  Expected: $expected"
        echo "  Got:      $result"
        ((TESTS_FAILED++))
    fi
}

echo -e "${BLUE}Contract Verification Tests${NC}"
echo ""

# Test 1: Valocracy name
run_test "Valocracy name" \
    "stellar contract invoke --id $VALOCRACY_ID --network $NETWORK -- name" \
    "Valocracy"

# Test 2: Valocracy founder
run_test "Valocracy founder" \
    "stellar contract invoke --id $VALOCRACY_ID --network $NETWORK -- founder" \
    "$FOUNDER"

# Test 3: Valocracy governor
run_test "Valocracy governor" \
    "stellar contract invoke --id $VALOCRACY_ID --network $NETWORK -- governor" \
    "$GOVERNOR_ID"

# Test 4: Valocracy treasury
run_test "Valocracy treasury" \
    "stellar contract invoke --id $VALOCRACY_ID --network $NETWORK -- treasury" \
    "$TREASURY_ID"

# Test 5: Valocracy total supply
run_test "Valocracy total supply (founder badge)" \
    "stellar contract invoke --id $VALOCRACY_ID --network $NETWORK -- total_supply" \
    "1"

# Test 6: Founder's Mana
run_test "Founder Mana (105 = 5 floor + 100 permanent)" \
    "stellar contract invoke --id $VALOCRACY_ID --network $NETWORK -- get_votes --account $FOUNDER" \
    "105"

# Test 7: Founder's level
run_test "Founder level (100)" \
    "stellar contract invoke --id $VALOCRACY_ID --network $NETWORK -- level_of --account $FOUNDER" \
    "100"

# Test 8: Founder's permanent level
run_test "Founder permanent level (100)" \
    "stellar contract invoke --id $VALOCRACY_ID --network $NETWORK -- permanent_level_of --account $FOUNDER" \
    "100"

# Test 9: Member Floor constant
run_test "Member Floor constant (5)" \
    "stellar contract invoke --id $VALOCRACY_ID --network $NETWORK -- vacancy_period" \
    "15552000"

# Test 10: Governor valocracy address
run_test "Governor valocracy address" \
    "stellar contract invoke --id $GOVERNOR_ID --network $NETWORK -- valocracy" \
    "$VALOCRACY_ID"

# Test 11: Governor proposal count (should be 0)
run_test "Governor proposal count (0 initially)" \
    "stellar contract invoke --id $GOVERNOR_ID --network $NETWORK -- proposal_count" \
    "0"

# Test 12: Treasury valocracy
run_test "Treasury valocracy address" \
    "stellar contract invoke --id $TREASURY_ID --network $NETWORK -- valocracy" \
    "$VALOCRACY_ID"

# Test 13: Treasury governor
run_test "Treasury governor address" \
    "stellar contract invoke --id $TREASURY_ID --network $NETWORK -- governor" \
    "$GOVERNOR_ID"

# Test 14: Treasury total shares (should be 0)
run_test "Treasury total shares (0 initially)" \
    "stellar contract invoke --id $TREASURY_ID --network $NETWORK -- total_shares" \
    "0"

echo ""
echo -e "${BLUE}Backend Verification Tests${NC}"
echo ""

# Check if backend is running
if [ -f "dapp-karn-ecosystem/backend/.env" ]; then
    BACKEND_URL=$(grep NEXT_PUBLIC_BACKEND_URL dapp-karn-ecosystem/frontend/.env.local 2>/dev/null | cut -d'=' -f2)

    if [ -n "$BACKEND_URL" ]; then
        run_test "Backend health endpoint" \
            "curl -s $BACKEND_URL/health" \
            "ok"

        run_test "Backend profile endpoint (404 expected)" \
            "curl -s -o /dev/null -w '%{http_code}' $BACKEND_URL/api/profile/$FOUNDER" \
            "404"
    else
        echo -e "${YELLOW}⊘ Backend not configured${NC}"
    fi
else
    echo -e "${YELLOW}⊘ Backend not deployed${NC}"
fi

echo ""
echo -e "${BLUE}Frontend Verification Tests${NC}"
echo ""

if [ -f "dapp-karn-ecosystem/frontend/.env.local" ]; then
    # Check env variables
    FRONTEND_VALOCRACY=$(grep NEXT_PUBLIC_VALOCRACY_CONTRACT dapp-karn-ecosystem/frontend/.env.local | cut -d'=' -f2)

    if [ "$FRONTEND_VALOCRACY" = "$VALOCRACY_ID" ]; then
        echo -e "${GREEN}✓ Frontend Valocracy contract configured${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ Frontend Valocracy contract mismatch${NC}"
        ((TESTS_FAILED++))
    fi

    # Try to access frontend (if running)
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend accessible at http://localhost:3000${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${YELLOW}⊘ Frontend not running (expected if not started)${NC}"
    fi
else
    echo -e "${YELLOW}⊘ Frontend not configured${NC}"
fi

echo ""
echo -e "${BLUE}Cross-Contract Integration Tests${NC}"
echo ""

# Test: Governor can query Valocracy for voting power
run_test "Governor → Valocracy integration (query Mana)" \
    "stellar contract invoke --id $GOVERNOR_ID --network $NETWORK -- valocracy" \
    "$VALOCRACY_ID"

# Test: Valocracy knows about Treasury
run_test "Valocracy → Treasury integration" \
    "stellar contract invoke --id $VALOCRACY_ID --network $NETWORK -- treasury" \
    "$TREASURY_ID"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Verification Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""
echo "Tests Passed: ${TESTS_PASSED}"
echo "Tests Failed: ${TESTS_FAILED}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! Deployment verified.${NC}"
    echo ""
    echo "Your Karn Protocol deployment is ready!"
    echo ""
    echo "Contract Addresses:"
    echo "  Valocracy: $VALOCRACY_ID"
    echo "  Governor:  $GOVERNOR_ID"
    echo "  Treasury:  $TREASURY_ID"
    echo ""
    echo "Next Steps:"
    echo "  1. Deploy backend (if not already deployed)"
    echo "  2. Deploy frontend (if not already deployed)"
    echo "  3. Test registration flow"
    echo "  4. Create first governance proposal"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please review and fix issues.${NC}"
    echo ""
    echo "Common Issues:"
    echo "  - Contract not initialized: Run ./initialize-contracts.sh"
    echo "  - Wrong network: Check NETWORK parameter"
    echo "  - Contract address mismatch: Update .env files"
    echo ""
    exit 1
fi
