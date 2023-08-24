module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.1.1"

  name                 = "game-vpc"
  cidr                 = "172.16.0.0/16"
  azs                  = ["ap-southeast-2a", "ap-southeast-2b"]
  private_subnets      = ["172.16.1.0/24", "172.16.2.0/24"]
  public_subnets       = ["172.16.3.0/24", "172.16.4.0/24"]
  enable_nat_gateway   = true
  single_nat_gateway   = true
  enable_dns_hostnames = true

  public_subnet_tags = {
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
    "kubernetes.io/role/elb"                      = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
    "kubernetes.io/role/internal-elb"             = "1"
  }
}
