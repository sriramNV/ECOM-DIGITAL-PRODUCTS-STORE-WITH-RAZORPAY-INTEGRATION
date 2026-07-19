#!/bin/bash
# MinIO bucket initialization — runs on first app boot
mc alias set podminio http://minio:9000 minioadmin minioadmin
mc mb podminio/pod-assets --ignore-existing
mc policy set public podminio/pod-assets
echo "MinIO buckets initialized"
