# Phaser Socket IO Game

## To install and run locally
To get the game running locally just clone this repo to your local machine, make sure you have NodeJS and NPM installed and then run the following commands:
```
npm install

npm run start
```

Open the following link on your browser
http://localhost:3070/

## Steps for deployment to AWS EKS
### 1) Install AWS EKS Cluster

Change to the “terraform” directory and then initialize and apply the terraform in your AWS account (remember to set you AWS_PROFILE first):  

```
export AWS_PROFILE=<<PUT_YOUR_AWS_PROFILE_HERE>>

cd terraform
terraform init
terraform apply
```
### 2) Use Docker to build an image from the bundle to upload to AWS ECR

You’ll need to install docker locally and then use it to build an image that can be uploaded to AWS ECR (Elastic Container Registry). Go out of the ‘terraform’ directory and back to the main directory locally to do this. Make sure you have docker running locally.

```
cd ..
docker build -f Dockerfile -t gameimage .

aws ecr create-repository --repository-name game-repo --image-scanning-configuration scanOnPush=true --image-tag-mutability IMMUTABLE --region ap-southeast-2

aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 012345678901.dkr.ecr.ap-southeast-2.amazonaws.com

docker tag gameimage:latest 012345678901.dkr.ecr.ap-southeast-2.amazonaws.com/game-repo:v1

docker push 012345678901.dkr.ecr.ap-southeast-2.amazonaws.com/game-repo:v1
```

### 3) Deploy the image from ECR to EKS.

Once the AWS EKS cluster has been deployed with Terraform above then change back terraform directory and set up the Kubernetes configuration:

```
cd terraform

export KUBECONFIG="${PWD}/kubeconfig_gamecluster"

aws eks update-kubeconfig --name gamecluster --region ap-southeast-2
```
Then change to the kubernetes directory and create a namespace for “games” and a secret to link to the AWS ECR repository. You’ll need to install the “kubectl” tool for this so you can run commands on Kubernetes in AWS EKS:
```
cd ../kubernetes

kubectl create namespace games

kubectl create secret docker-registry regcred \
  --docker-server=012345678901.dkr.ecr.ap-southeast-2.amazonaws.com \
  --docker-username=AWS \
  --docker-password=$(aws ecr get-login-password) \
  --namespace=games

kubectl config set-context --current --namespace=games
```
Next, use the “kubectl” tool to deploy the pod and ingress access:
```
kubectl apply -f deployment.yaml

kubectl apply -f service-nodeport.yaml

kubectl apply -f ingress.yaml
```
Applying the “ingress controller” above actually triggers off the creation of an AWS ALB (Application Load Balancer) which you should be able to see in your AWS Console under the EC2. Use this to access the URL for the game.

Please note the user needs the permissions below:
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "eks:ListFargateProfiles",
                "eks:DescribeNodegroup",
                "eks:ListNodegroups",
                "eks:ListUpdates",
                "eks:AccessKubernetesApi",
                "eks:ListAddons",
                "eks:DescribeCluster",
                "eks:DescribeAddonVersions",
                "eks:ListClusters",
                "eks:ListIdentityProviderConfigs",
                "iam:ListRoles"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": "ssm:GetParameter",
            "Resource": "arn:aws:ssm:*:<<ACCOUNT_ID>>:parameter/*"
        }
    ]
}
```
export AWS_PROFILE=sandpit

eksctl get iamidentitymapping --cluster gamecluster --region=ap-southeast-2

eksctl create iamidentitymapping \
    --cluster gamecluster \
    --region=ap-southeast-2 \
    --arn arn:aws:iam::915922766016:role/my-console-viewer-role \
    --group eks-console-dashboard-full-access-group \
    --no-duplicate-arns

eksctl create iamidentitymapping \
    --cluster gamecluster \
    --region=ap-southeast-2 \
    --arn arn:aws:iam::915922766016:user/stefan.evans@consegna.cloud  \
    --group eks-console-dashboard-full-access-group \
    --no-duplicate-arns

eksctl delete iamidentitymapping \
    --cluster gamecluster \
    --region=ap-southeast-2 \
    --arn arn:aws:iam::915922766016:user/stefan.evans@consegna.cloud  \

my-console-viewer-role

eks_viewer

eksctl create iamidentitymapping \
    --cluster gamecluster \
    --region=ap-southeast-2 \
    --arn arn:aws:iam::915922766016:user/eks_viewer  \
    --group eks-console-dashboard-full-access-group \
    --no-duplicate-arns

