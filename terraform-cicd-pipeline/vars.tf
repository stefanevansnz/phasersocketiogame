# define aws region
variable "region" {
  default = "ap-southeast-2"
}

# CodeCommit and ECR repo name, also as artifact bucket prefix
variable "repo_name" {
  default = "stefanevansnz/phasersocketiogame"
}

# define default git branch
variable "default_branch" {
  default = "master"
}


variable "build_artifact_bucket_name" {
  default = "tf-eks-build-bucket-phasersocketiogame"
}

# define docker image for build stage
variable "build_image" {
  default = "aws/codebuild/standard:4.0"
}

# define build spec for build stage
variable "build_spec" {
  default = "buildspec/build.yml"
}

# define build spec for deploy stage
variable "build_deploy_spec" {
  default = "buildspec/build-deploy.yml"
}

variable "environment_variables" {
  description = "Environment variables"
  type = map(string)
}