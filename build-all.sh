#!/bin/bash

# Plateforme de Facturation Electronique - Build All Services Script
# This script builds all Docker images for the electronic billing platform

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    log_success "Docker found"
}

# Function to build a service
build_service() {
    local service_dir=$1
    local service_name=$2

    log_info "Building $service_name..."

    if [[ ! -d "$service_dir" ]]; then
        log_error "Service directory $service_dir not found"
        return 1
    fi

    cd "$service_dir"

    # Build the service with Maven (skip tests for faster builds)
    if [[ -f "pom.xml" ]]; then
        log_info "Running Maven clean package for $service_name..."
        mvn clean package -DskipTests -q
        if [[ $? -ne 0 ]]; then
            log_error "Maven build failed for $service_name"
            return 1
        fi
        log_success "Maven build completed for $service_name"
    fi

    cd - > /dev/null
    return 0
}

# Function to build frontend
build_frontend() {
    log_info "Building frontend..."

    if [[ ! -d "frontend" ]]; then
        log_error "Frontend directory not found"
        return 1
    fi

    cd frontend

    # Install dependencies and build
    if [[ -f "package.json" ]]; then
        log_info "Installing frontend dependencies..."
        npm install --silent

        log_info "Building frontend production bundle..."
        npm run build --silent

        if [[ $? -eq 0 ]]; then
            log_success "Frontend build completed"
        else
            log_error "Frontend build failed"
            return 1
        fi
    fi

    cd - > /dev/null
    return 0
}

# Function to build Docker images
build_docker_images() {
    log_info "Building Docker images..."

    # Build all services in parallel for faster builds
    local services_to_build=(
        "services/invoice-service:invoice-service"
        "services/payment-service:payment-service"
        "services/subscription-service:subscription-service"
        "services/notification-service:notification-service"
        "services/signature-service:signature-service"
        "services/user-auth-service:user-auth-service"
        "services/api-gateway:api-gateway"
    )

    local pids=()

    for service_info in "${services_to_build[@]}"; do
        IFS=':' read -r service_dir service_name <<< "$service_info"

        if [[ -d "$service_dir" ]]; then
            log_info "Building Docker image for $service_name..."
            docker build -t "plateforme-$service_name:latest" "$service_dir" &
            pids+=($!)
        else
            log_warning "Service directory $service_dir not found, skipping $service_name"
        fi
    done

    # Wait for all builds to complete
    local failed_builds=0
    for pid in "${pids[@]}"; do
        if ! wait "$pid"; then
            ((failed_builds++))
        fi
    done

    if [[ $failed_builds -eq 0 ]]; then
        log_success "All Docker images built successfully"
        return 0
    else
        log_error "$failed_builds Docker image builds failed"
        return 1
    fi
}

# Function to show usage
show_usage() {
    echo "Plateforme de Facturation Electronique - Build Script"
    echo ""
    echo "This script builds all services and creates Docker images for the platform."
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --no-cache          Build Docker images without cache"
    echo "  --java-only         Build only Java services (skip frontend and Docker)"
    echo "  --frontend-only     Build only frontend"
    echo "  --help             Show this help message"
    echo ""
}

# Main function
main() {
    local no_cache=false
    local java_only=false
    local frontend_only=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help)
                show_usage
                exit 0
                ;;
            --no-cache)
                no_cache=true
                ;;
            --java-only)
                java_only=true
                ;;
            --frontend-only)
                frontend_only=true
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
        shift
    done

    echo "=============================================="
    echo "🔨 Building Electronic Billing Platform"
    echo "=============================================="
    echo ""

    # Check prerequisites
    check_docker

    local start_time=$(date +%s)

    if [[ "$frontend_only" == true ]]; then
        build_frontend
    elif [[ "$java_only" == true ]]; then
        # Build Java services only
        local java_services=(
            "services/invoice-service:invoice-service"
            "services/payment-service:payment-service"
            "services/subscription-service:subscription-service"
            "services/notification-service:notification-service"
            "services/signature-service:signature-service"
            "services/user-auth-service:user-auth-service"
            "services/api-gateway:api-gateway"
        )

        for service_info in "${java_services[@]}"; do
            IFS=':' read -r service_dir service_name <<< "$service_info"
            if ! build_service "$service_dir" "$service_name"; then
                log_error "Failed to build $service_name"
                exit 1
            fi
        done

        log_success "All Java services built successfully"
    else
        # Full build: Java services, frontend, Docker images
        log_info "Starting full build process..."

        # Build Java services
        local java_services=(
            "services/invoice-service:invoice-service"
            "services/payment-service:payment-service"
            "services/subscription-service:subscription-service"
            "services/notification-service:notification-service"
            "services/signature-service:signature-service"
            "services/user-auth-service:user-auth-service"
            "services/api-gateway:api-gateway"
        )

        log_info "Building Java services..."
        for service_info in "${java_services[@]}"; do
            IFS=':' read -r service_dir service_name <<< "$service_info"
            if ! build_service "$service_dir" "$service_name"; then
                log_error "Failed to build $service_name"
                exit 1
            fi
        done

        # Build frontend
        if ! build_frontend; then
            exit 1
        fi

        # Build Docker images
        if [[ "$no_cache" == true ]]; then
            log_info "Building Docker images with --no-cache..."
            docker-compose build --no-cache
        else
            log_info "Building Docker images..."
            docker-compose build
        fi

        if [[ $? -eq 0 ]]; then
            log_success "All Docker images built successfully"
        else
            log_error "Docker image builds failed"
            exit 1
        fi
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo ""
    echo "=============================================="
    log_success "Build completed successfully in ${duration}s!"

    if [[ "$frontend_only" == true ]]; then
        log_info "Frontend built. Files are in frontend/build/"
    elif [[ "$java_only" == true ]]; then
        log_info "Java services built. JAR files are in target/ directories"
    else
        log_info "Ready to deploy with: docker-compose up"
        log_info "Or deploy to Kubernetes: kubectl apply -f k8s/"
    fi

    echo "=============================================="
}

# Run main function with all arguments
main "$@"