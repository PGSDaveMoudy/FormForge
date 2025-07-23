#!/bin/bash

# FormForge Deployment Validation Script
# Tests a FormForge deployment to ensure everything is working

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Logging functions
log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Get domain from user
get_domain() {
    if [[ -z "$1" ]]; then
        echo "Usage: $0 <domain>"
        echo "Example: $0 yourdomain.com"
        exit 1
    fi
    DOMAIN=$1
}

# Test functions
test_domain_resolution() {
    log_test "Testing domain resolution for $DOMAIN"
    if dig +short "$DOMAIN" | grep -E '^[0-9.]+$' > /dev/null; then
        log_pass "Domain $DOMAIN resolves to IP address"
    else
        log_fail "Domain $DOMAIN does not resolve"
        return 1
    fi
}

test_http_redirect() {
    log_test "Testing HTTP to HTTPS redirect"
    local response=$(curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN" 2>/dev/null)
    if [[ "$response" == "301" || "$response" == "302" ]]; then
        log_pass "HTTP correctly redirects to HTTPS"
    else
        log_fail "HTTP redirect not working (got $response)"
    fi
}

test_https_access() {
    log_test "Testing HTTPS access"
    if curl -s -f "https://$DOMAIN" > /dev/null 2>&1; then
        log_pass "HTTPS website accessible"
    else
        log_fail "HTTPS website not accessible"
    fi
}

test_ssl_certificate() {
    log_test "Testing SSL certificate"
    local cert_info=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    if [[ -n "$cert_info" ]]; then
        log_pass "SSL certificate is valid"
        echo "   Certificate info: $cert_info"
    else
        log_fail "SSL certificate issues"
    fi
}

test_health_endpoint() {
    log_test "Testing health endpoint"
    local response=$(curl -s "https://$DOMAIN/health" 2>/dev/null)
    if echo "$response" | grep -q '"status":"healthy"'; then
        log_pass "Health endpoint responding correctly"
        local uptime=$(echo "$response" | grep -o '"uptime":[0-9.]*' | cut -d: -f2)
        echo "   Server uptime: ${uptime}s"
    else
        log_fail "Health endpoint not responding correctly"
    fi
}

test_api_status() {
    log_test "Testing API status endpoint"
    local response=$(curl -s "https://$DOMAIN/api/status" 2>/dev/null)
    if echo "$response" | grep -q '"success":true'; then
        log_pass "API status endpoint responding correctly"
        local env=$(echo "$response" | grep -o '"environment":"[^"]*"' | cut -d: -f2 | tr -d '"')
        echo "   Environment: $env"
    else
        log_fail "API status endpoint not responding correctly"
    fi
}

test_security_headers() {
    log_test "Testing security headers"
    local headers=$(curl -s -I "https://$DOMAIN" 2>/dev/null)
    
    local tests=0
    local passed=0
    
    if echo "$headers" | grep -q "Strict-Transport-Security"; then
        ((passed++))
    fi
    ((tests++))
    
    if echo "$headers" | grep -q "X-Frame-Options"; then
        ((passed++))
    fi
    ((tests++))
    
    if echo "$headers" | grep -q "X-Content-Type-Options"; then
        ((passed++))
    fi
    ((tests++))
    
    if echo "$headers" | grep -q "X-XSS-Protection"; then
        ((passed++))
    fi
    ((tests++))
    
    if [[ $passed -eq $tests ]]; then
        log_pass "All security headers present ($passed/$tests)"
    else
        log_warn "Some security headers missing ($passed/$tests)"
    fi
}

test_backend_connectivity() {
    log_test "Testing backend connectivity"
    local response=$(curl -s "https://$DOMAIN/api/status" 2>/dev/null)
    if echo "$response" | grep -q '"uptime"'; then
        local uptime=$(echo "$response" | grep -o '"uptime":[0-9.]*' | cut -d: -f2)
        log_pass "Backend is running (uptime: ${uptime}s)"
    else
        log_fail "Backend connectivity issues"
    fi
}

test_page_load_speed() {
    log_test "Testing page load speed"
    local load_time=$(curl -s -o /dev/null -w "%{time_total}" "https://$DOMAIN" 2>/dev/null)
    local threshold=3.0
    
    if (( $(echo "$load_time < $threshold" | bc -l) )); then
        log_pass "Page loads quickly (${load_time}s)"
    else
        log_warn "Page load time is slow (${load_time}s > ${threshold}s)"
    fi
}

test_database_services() {
    log_test "Testing database services (requires server access)"
    log_warn "Database test requires SSH access to server - skipping"
}

# Main validation function
run_validation() {
    echo "🔍 FormForge Deployment Validation"
    echo "=================================="
    echo "Domain: $DOMAIN"
    echo "Timestamp: $(date)"
    echo

    # Run all tests
    test_domain_resolution
    test_http_redirect
    test_https_access
    test_ssl_certificate
    test_health_endpoint
    test_api_status
    test_security_headers
    test_backend_connectivity
    test_page_load_speed
    test_database_services

    echo
    echo "📊 Validation Summary"
    echo "===================="
    echo "Tests Passed: $TESTS_PASSED"
    echo "Tests Failed: $TESTS_FAILED"
    echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "${GREEN}✅ All tests passed! Deployment is working correctly.${NC}"
        exit 0
    else
        echo -e "${RED}❌ Some tests failed. Please check the deployment.${NC}"
        exit 1
    fi
}

# Check dependencies
check_dependencies() {
    local deps=("curl" "dig" "openssl" "bc")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            echo "❌ Required dependency '$dep' not found"
            echo "Please install: apt install curl dnsutils openssl bc"
            exit 1
        fi
    done
}

# Main execution
main() {
    get_domain "$1"
    check_dependencies
    run_validation
}

main "$@"