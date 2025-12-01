#!/bin/bash
# Traveller VTT - AWS ECS Deployment Script
# Usage: ./deploy-aws.sh [--init] [--update]
#   --init   : First-time setup (creates all resources)
#   --update : Update existing deployment with new image

set -e

# Configuration
REGION="${AWS_REGION:-us-west-2}"
CLUSTER_NAME="traveller-vtt-cluster"
SERVICE_NAME="traveller-vtt-service"
REPO_NAME="traveller-vtt"
TASK_FAMILY="traveller-vtt"
LOG_GROUP="/ecs/traveller-vtt"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Traveller VTT - AWS Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
if [ -z "$ACCOUNT_ID" ]; then
    echo -e "${RED}Error: Unable to get AWS account ID. Is AWS CLI configured?${NC}"
    exit 1
fi
echo -e "AWS Account: ${YELLOW}$ACCOUNT_ID${NC}"
echo -e "Region: ${YELLOW}$REGION${NC}"

ECR_REPO="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO_NAME"

# Function: Create ECR repository
create_ecr_repo() {
    echo -e "\n${YELLOW}Creating ECR repository...${NC}"
    aws ecr create-repository \
        --repository-name $REPO_NAME \
        --region $REGION \
        --image-scanning-configuration scanOnPush=true \
        2>/dev/null || echo "Repository already exists"
}

# Function: Build and push Docker image
build_and_push() {
    echo -e "\n${YELLOW}Authenticating to ECR...${NC}"
    aws ecr get-login-password --region $REGION | \
        docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

    echo -e "\n${YELLOW}Building Docker image...${NC}"
    docker build -t $REPO_NAME:latest ..

    echo -e "\n${YELLOW}Tagging image...${NC}"
    docker tag $REPO_NAME:latest $ECR_REPO:latest

    echo -e "\n${YELLOW}Pushing to ECR...${NC}"
    docker push $ECR_REPO:latest

    echo -e "${GREEN}Image pushed successfully!${NC}"
}

# Function: Create CloudWatch log group
create_log_group() {
    echo -e "\n${YELLOW}Creating CloudWatch log group...${NC}"
    aws logs create-log-group --log-group-name $LOG_GROUP --region $REGION 2>/dev/null || echo "Log group already exists"
    aws logs put-retention-policy --log-group-name $LOG_GROUP --retention-in-days 7 --region $REGION
}

# Function: Create ECS cluster
create_cluster() {
    echo -e "\n${YELLOW}Creating ECS cluster...${NC}"
    aws ecs create-cluster \
        --cluster-name $CLUSTER_NAME \
        --capacity-providers FARGATE \
        --region $REGION \
        2>/dev/null || echo "Cluster already exists"
}

# Function: Register task definition
register_task_def() {
    echo -e "\n${YELLOW}Registering task definition...${NC}"

    # Get ALB URL for ALLOWED_ORIGINS (if ALB exists)
    ALB_DNS=$(aws elbv2 describe-load-balancers \
        --names traveller-vtt-alb \
        --region $REGION \
        --query 'LoadBalancers[0].DNSName' \
        --output text 2>/dev/null || echo "")

    ALLOWED_ORIGINS="http://localhost:3000"
    if [ -n "$ALB_DNS" ] && [ "$ALB_DNS" != "None" ]; then
        ALLOWED_ORIGINS="http://$ALB_DNS,http://localhost:3000"
    fi

    # Create task definition from template
    sed -e "s/{{ACCOUNT_ID}}/$ACCOUNT_ID/g" \
        -e "s/{{REGION}}/$REGION/g" \
        -e "s|{{ALLOWED_ORIGINS}}|$ALLOWED_ORIGINS|g" \
        task-definition.json > /tmp/task-def-rendered.json

    aws ecs register-task-definition \
        --cli-input-json file:///tmp/task-def-rendered.json \
        --region $REGION

    rm /tmp/task-def-rendered.json
}

# Function: Create security group
create_security_group() {
    echo -e "\n${YELLOW}Creating security group...${NC}"

    # Get default VPC
    VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" \
        --query 'Vpcs[0].VpcId' --output text --region $REGION)

    if [ -z "$VPC_ID" ] || [ "$VPC_ID" = "None" ]; then
        echo -e "${RED}Error: No default VPC found${NC}"
        exit 1
    fi

    # Create security group
    SG_ID=$(aws ec2 create-security-group \
        --group-name traveller-vtt-sg \
        --description "Traveller VTT security group" \
        --vpc-id $VPC_ID \
        --region $REGION \
        --query 'GroupId' --output text 2>/dev/null || \
        aws ec2 describe-security-groups \
            --filters "Name=group-name,Values=traveller-vtt-sg" \
            --query 'SecurityGroups[0].GroupId' --output text --region $REGION)

    # Add inbound rules
    aws ec2 authorize-security-group-ingress \
        --group-id $SG_ID \
        --protocol tcp --port 80 --cidr 0.0.0.0/0 \
        --region $REGION 2>/dev/null || true

    aws ec2 authorize-security-group-ingress \
        --group-id $SG_ID \
        --protocol tcp --port 3000 --cidr 0.0.0.0/0 \
        --region $REGION 2>/dev/null || true

    echo "Security Group: $SG_ID"
}

# Function: Create ALB and target group
create_alb() {
    echo -e "\n${YELLOW}Creating Application Load Balancer...${NC}"

    # Get subnets
    SUBNETS=$(aws ec2 describe-subnets \
        --filters "Name=default-for-az,Values=true" \
        --query 'Subnets[*].SubnetId' --output text --region $REGION | tr '\t' ',')

    # Get security group
    SG_ID=$(aws ec2 describe-security-groups \
        --filters "Name=group-name,Values=traveller-vtt-sg" \
        --query 'SecurityGroups[0].GroupId' --output text --region $REGION)

    # Get VPC
    VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" \
        --query 'Vpcs[0].VpcId' --output text --region $REGION)

    # Create target group
    TG_ARN=$(aws elbv2 create-target-group \
        --name traveller-vtt-tg \
        --protocol HTTP \
        --port 3000 \
        --vpc-id $VPC_ID \
        --target-type ip \
        --health-check-path /health \
        --health-check-interval-seconds 30 \
        --healthy-threshold-count 2 \
        --unhealthy-threshold-count 3 \
        --region $REGION \
        --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || \
        aws elbv2 describe-target-groups \
            --names traveller-vtt-tg \
            --query 'TargetGroups[0].TargetGroupArn' --output text --region $REGION)

    # Create ALB
    ALB_ARN=$(aws elbv2 create-load-balancer \
        --name traveller-vtt-alb \
        --subnets ${SUBNETS//,/ } \
        --security-groups $SG_ID \
        --scheme internet-facing \
        --type application \
        --ip-address-type ipv4 \
        --region $REGION \
        --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>/dev/null || \
        aws elbv2 describe-load-balancers \
            --names traveller-vtt-alb \
            --query 'LoadBalancers[0].LoadBalancerArn' --output text --region $REGION)

    # Set ALB idle timeout for WebSocket
    aws elbv2 modify-load-balancer-attributes \
        --load-balancer-arn $ALB_ARN \
        --attributes Key=idle_timeout.timeout_seconds,Value=300 \
        --region $REGION

    # Create listener
    aws elbv2 create-listener \
        --load-balancer-arn $ALB_ARN \
        --protocol HTTP \
        --port 80 \
        --default-actions Type=forward,TargetGroupArn=$TG_ARN \
        --region $REGION 2>/dev/null || echo "Listener already exists"

    # Get ALB DNS
    ALB_DNS=$(aws elbv2 describe-load-balancers \
        --load-balancer-arns $ALB_ARN \
        --query 'LoadBalancers[0].DNSName' --output text --region $REGION)

    echo -e "${GREEN}ALB created: http://$ALB_DNS${NC}"
}

# Function: Create ECS service
create_service() {
    echo -e "\n${YELLOW}Creating ECS service...${NC}"

    # Get subnets
    SUBNETS=$(aws ec2 describe-subnets \
        --filters "Name=default-for-az,Values=true" \
        --query 'Subnets[*].SubnetId' --output json --region $REGION)

    # Get security group
    SG_ID=$(aws ec2 describe-security-groups \
        --filters "Name=group-name,Values=traveller-vtt-sg" \
        --query 'SecurityGroups[0].GroupId' --output text --region $REGION)

    # Get target group ARN
    TG_ARN=$(aws elbv2 describe-target-groups \
        --names traveller-vtt-tg \
        --query 'TargetGroups[0].TargetGroupArn' --output text --region $REGION)

    aws ecs create-service \
        --cluster $CLUSTER_NAME \
        --service-name $SERVICE_NAME \
        --task-definition $TASK_FAMILY \
        --desired-count 1 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=$SUBNETS,securityGroups=[$SG_ID],assignPublicIp=ENABLED}" \
        --load-balancers "targetGroupArn=$TG_ARN,containerName=traveller-vtt,containerPort=3000" \
        --region $REGION
}

# Function: Update service with new image
update_service() {
    echo -e "\n${YELLOW}Updating ECS service...${NC}"
    aws ecs update-service \
        --cluster $CLUSTER_NAME \
        --service $SERVICE_NAME \
        --force-new-deployment \
        --region $REGION

    echo -e "${GREEN}Service update initiated!${NC}"
    echo "Monitor deployment: https://console.aws.amazon.com/ecs/home?region=$REGION#/clusters/$CLUSTER_NAME/services/$SERVICE_NAME"
}

# Function: Get deployment status
get_status() {
    echo -e "\n${YELLOW}Deployment Status:${NC}"

    # Get ALB DNS
    ALB_DNS=$(aws elbv2 describe-load-balancers \
        --names traveller-vtt-alb \
        --region $REGION \
        --query 'LoadBalancers[0].DNSName' --output text 2>/dev/null || echo "N/A")

    echo -e "ALB URL: ${GREEN}http://$ALB_DNS${NC}"

    # Get service status
    aws ecs describe-services \
        --cluster $CLUSTER_NAME \
        --services $SERVICE_NAME \
        --region $REGION \
        --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount}' \
        --output table
}

# Main execution
case "${1:-}" in
    --init)
        echo -e "\n${YELLOW}Initializing AWS infrastructure...${NC}"
        create_ecr_repo
        build_and_push
        create_log_group
        create_cluster
        create_security_group
        create_alb
        register_task_def
        create_service
        get_status
        ;;
    --update)
        echo -e "\n${YELLOW}Updating deployment...${NC}"
        build_and_push
        register_task_def
        update_service
        get_status
        ;;
    --status)
        get_status
        ;;
    *)
        echo "Usage: $0 [--init|--update|--status]"
        echo "  --init   : First-time setup (creates all resources)"
        echo "  --update : Update existing deployment with new image"
        echo "  --status : Show current deployment status"
        exit 1
        ;;
esac

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment script completed!${NC}"
echo -e "${GREEN}========================================${NC}"
