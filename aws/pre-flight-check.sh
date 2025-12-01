#!/bin/bash
# Traveller VTT - Pre-flight Check Script
# Run this before deploying to AWS to verify prerequisites

set -e

REGION="${AWS_REGION:-us-west-2}"
CLUSTER_NAME="traveller-vtt-cluster"
REPO_NAME="traveller-vtt"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Traveller VTT - Pre-flight Checks${NC}"
echo -e "${YELLOW}========================================${NC}"

ERRORS=0

# Check 1: AWS CLI installed
echo -n "AWS CLI installed... "
if command -v aws &> /dev/null; then
    echo -e "${GREEN}OK${NC} ($(aws --version 2>&1 | head -1))"
else
    echo -e "${RED}FAIL${NC}"
    echo "  Install: sudo apt install awscli"
    ERRORS=$((ERRORS+1))
fi

# Check 2: AWS credentials configured
echo -n "AWS credentials configured... "
if aws sts get-caller-identity &> /dev/null; then
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    echo -e "${GREEN}OK${NC} (Account: $ACCOUNT_ID)"
else
    echo -e "${RED}FAIL${NC}"
    echo "  Run: aws configure"
    ERRORS=$((ERRORS+1))
fi

# Check 3: Docker installed
echo -n "Docker installed... "
if command -v docker &> /dev/null; then
    echo -e "${GREEN}OK${NC} ($(docker --version))"
else
    echo -e "${RED}FAIL${NC}"
    echo "  Install: sudo apt install docker.io"
    ERRORS=$((ERRORS+1))
fi

# Check 4: Docker running
echo -n "Docker daemon running... "
if sudo docker info &> /dev/null; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAIL${NC}"
    echo "  Start: sudo systemctl start docker"
    ERRORS=$((ERRORS+1))
fi

# Check 5: Default VPC exists
echo -n "Default VPC exists... "
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" \
    --query 'Vpcs[0].VpcId' --output text --region $REGION 2>/dev/null || echo "None")
if [ -n "$VPC_ID" ] && [ "$VPC_ID" != "None" ]; then
    echo -e "${GREEN}OK${NC} ($VPC_ID)"
else
    echo -e "${RED}FAIL${NC}"
    echo "  No default VPC in $REGION. Create one or specify custom VPC."
    ERRORS=$((ERRORS+1))
fi

# Check 6: Subnets available
echo -n "Subnets available... "
SUBNET_COUNT=$(aws ec2 describe-subnets \
    --filters "Name=default-for-az,Values=true" \
    --query 'length(Subnets)' --output text --region $REGION 2>/dev/null || echo "0")
if [ "$SUBNET_COUNT" -ge 2 ]; then
    echo -e "${GREEN}OK${NC} ($SUBNET_COUNT subnets)"
else
    echo -e "${RED}FAIL${NC}"
    echo "  ALB requires at least 2 subnets in different AZs."
    ERRORS=$((ERRORS+1))
fi

# Check 7: ECS Task Execution Role
echo -n "ecsTaskExecutionRole exists... "
if aws iam get-role --role-name ecsTaskExecutionRole &> /dev/null; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${YELLOW}MISSING${NC}"
    echo "  Creating ecsTaskExecutionRole..."
    cat > /tmp/trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
    aws iam create-role \
        --role-name ecsTaskExecutionRole \
        --assume-role-policy-document file:///tmp/trust-policy.json \
        --description "ECS Task Execution Role"
    aws iam attach-role-policy \
        --role-name ecsTaskExecutionRole \
        --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
    rm /tmp/trust-policy.json
    echo -e "  ${GREEN}Created!${NC}"
fi

# Check 8: Dockerfile exists
echo -n "Dockerfile exists... "
if [ -f "../Dockerfile" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAIL${NC}"
    echo "  Dockerfile not found in parent directory"
    ERRORS=$((ERRORS+1))
fi

# Check 9: npm test passes
echo -n "npm test passes... "
cd ..
if npm test &> /dev/null; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAIL${NC}"
    echo "  Run: npm test to see failures"
    ERRORS=$((ERRORS+1))
fi
cd aws

# Check 10: Docker can build
echo -n "Docker can build image... "
cd ..
if sudo docker build -t test-build . &> /dev/null; then
    echo -e "${GREEN}OK${NC}"
    sudo docker rmi test-build &> /dev/null || true
else
    echo -e "${RED}FAIL${NC}"
    echo "  Docker build failed. Check Dockerfile."
    ERRORS=$((ERRORS+1))
fi
cd aws

echo -e "\n${YELLOW}========================================${NC}"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}All checks passed! Ready to deploy.${NC}"
    echo -e "Run: ${YELLOW}./deploy-aws.sh --init${NC}"
else
    echo -e "${RED}$ERRORS check(s) failed. Fix issues before deploying.${NC}"
fi
echo -e "${YELLOW}========================================${NC}"

exit $ERRORS
