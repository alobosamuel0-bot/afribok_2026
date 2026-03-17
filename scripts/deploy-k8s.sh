#!/bin/bash

# Kubernetes Deployment Script

set -e

echo "========================================="
echo "Afribok Kubernetes Deployment"
echo "========================================="

KUBE_NAMESPACE="afribok"
DOCKER_REGISTRY="docker.io"
IMAGE_TAG=${IMAGE_TAG:-"latest"}

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "Error: kubectl is not installed"
    exit 1
fi

# Check if Helm is installed
if ! command -v helm &> /dev/null; then
    echo "Error: Helm is not installed"
    exit 1
fi

echo "[1/6] Creating namespace..."
kubectl create namespace $KUBE_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

echo "[2/6] Creating secrets..."
kubectl create secret generic afribok-secrets \
  --from-literal=database-url="postgresql://admin:admin_password@postgres:5432/afribok" \
  --from-literal=redis-url="redis://redis:6379/0" \
  --from-literal=secret-key="your-super-secret-key" \
  --from-literal=jwt-secret="your-jwt-secret" \
  -n $KUBE_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

echo "[3/6] Deploying infrastructure (Database, Redis)..."
kubectl apply -f kubernetes/infrastructure.yaml

echo "[4/6] Deploying backend services..."
kubectl apply -f kubernetes/backend-deployment.yaml

echo "[5/6] Deploying monitoring stack..."
kubectl apply -f kubernetes/prometheus-monitoring.yaml
kubectl apply -f kubernetes/grafana-monitoring.yaml

echo "[6/6] Verifying deployments..."
kubectl rollout status deployment/afribok-backend -n $KUBE_NAMESPACE --timeout=5m
kubectl rollout status deployment/postgres -n $KUBE_NAMESPACE --timeout=5m
kubectl rollout status deployment/redis -n $KUBE_NAMESPACE --timeout=5m

echo ""
echo "========================================="
echo "Deployment successful!"
echo "========================================="

# Print service information
echo ""
echo "Service endpoints:"
kubectl get svc -n $KUBE_NAMESPACE -o wide

# Print pod status
echo ""
echo "Pod status:"
kubectl get pods -n $KUBE_NAMESPACE -o wide
