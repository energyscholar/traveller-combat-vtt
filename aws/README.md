# AWS Deployment Guide

This directory contains scripts and configuration for deploying Traveller VTT to AWS ECS (Fargate).

## Prerequisites

Before deploying, ensure you have:

1. **AWS CLI** installed and configured with credentials
2. **Docker** installed and running
3. **AWS Account** with appropriate permissions (ECS, ECR, EC2, IAM, CloudWatch)

## Quick Start

### 1. Run Pre-flight Checks

```bash
cd aws
chmod +x pre-flight-check.sh deploy-aws.sh
./pre-flight-check.sh
```

This verifies all prerequisites and creates the `ecsTaskExecutionRole` if missing.

### 2. First-Time Deployment

```bash
./deploy-aws.sh --init
```

This will:
- Create ECR repository
- Build and push Docker image
- Create CloudWatch log group
- Create ECS cluster
- Create security group
- Create Application Load Balancer
- Register task definition
- Create ECS service

### 3. Update Deployment

After making code changes:

```bash
./deploy-aws.sh --update
```

This will:
- Build and push new Docker image
- Update task definition
- Force new deployment

### 4. Check Status

```bash
./deploy-aws.sh --status
```

## Architecture

```
                    ┌──────────────────┐
                    │   Internet       │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Application     │
                    │  Load Balancer   │
                    │  (HTTP:80)       │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  ECS Service     │
                    │  (Fargate)       │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Container       │
                    │  (Port 3000)     │
                    └──────────────────┘
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Application port | `3000` |
| `ALLOWED_ORIGINS` | CORS allowed origins | ALB URL + localhost |

### AWS Resources Created

| Resource | Name | Purpose |
|----------|------|---------|
| ECR Repository | `traveller-vtt` | Docker image storage |
| ECS Cluster | `traveller-vtt-cluster` | Container orchestration |
| ECS Service | `traveller-vtt-service` | Service management |
| Task Definition | `traveller-vtt` | Container config |
| Security Group | `traveller-vtt-sg` | Network rules |
| ALB | `traveller-vtt-alb` | Load balancing |
| Target Group | `traveller-vtt-tg` | Health checks |
| Log Group | `/ecs/traveller-vtt` | Application logs |

## Costs

Estimated monthly costs (us-west-2):

| Component | Cost |
|-----------|------|
| ECS Fargate (256 CPU, 512MB) | ~$10/month |
| Application Load Balancer | ~$20/month |
| CloudWatch Logs (5GB) | ~$3/month |
| ECR Storage | ~$1/month |
| **Total** | **~$34/month** |

## Monitoring

### Health Check

```bash
curl http://<ALB-DNS>/health
```

### CloudWatch Logs

```bash
aws logs tail /ecs/traveller-vtt --follow --region us-west-2
```

### ECS Service Status

```bash
aws ecs describe-services \
  --cluster traveller-vtt-cluster \
  --services traveller-vtt-service \
  --region us-west-2
```

## Troubleshooting

### Container not starting

1. Check CloudWatch logs:
   ```bash
   aws logs tail /ecs/traveller-vtt --since 30m --region us-west-2
   ```

2. Check task status:
   ```bash
   aws ecs describe-tasks \
     --cluster traveller-vtt-cluster \
     --tasks $(aws ecs list-tasks --cluster traveller-vtt-cluster --query 'taskArns[0]' --output text) \
     --region us-west-2
   ```

### Health check failing

1. Verify locally: `curl http://localhost:3000/health`
2. Check security group allows port 3000 inbound
3. Verify container logs for startup errors

### WebSocket not working

1. ALB idle timeout should be 300s (set by deploy script)
2. Verify CORS allows ALB origin
3. Check browser console for connection errors

## Cleanup

To delete all AWS resources:

```bash
# Delete ECS service
aws ecs update-service --cluster traveller-vtt-cluster --service traveller-vtt-service --desired-count 0 --region us-west-2
aws ecs delete-service --cluster traveller-vtt-cluster --service traveller-vtt-service --region us-west-2

# Delete ECS cluster
aws ecs delete-cluster --cluster traveller-vtt-cluster --region us-west-2

# Delete ALB and target group
ALB_ARN=$(aws elbv2 describe-load-balancers --names traveller-vtt-alb --query 'LoadBalancers[0].LoadBalancerArn' --output text --region us-west-2)
aws elbv2 delete-load-balancer --load-balancer-arn $ALB_ARN --region us-west-2
aws elbv2 delete-target-group --target-group-arn $(aws elbv2 describe-target-groups --names traveller-vtt-tg --query 'TargetGroups[0].TargetGroupArn' --output text --region us-west-2) --region us-west-2

# Delete security group
SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=traveller-vtt-sg" --query 'SecurityGroups[0].GroupId' --output text --region us-west-2)
aws ec2 delete-security-group --group-id $SG_ID --region us-west-2

# Delete ECR repository
aws ecr delete-repository --repository-name traveller-vtt --force --region us-west-2

# Delete log group
aws logs delete-log-group --log-group-name /ecs/traveller-vtt --region us-west-2
```
