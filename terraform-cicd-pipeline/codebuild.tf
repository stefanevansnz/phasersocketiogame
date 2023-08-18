# build image and push to ECR
resource "aws_codebuild_project" "tf-eks-build" {
  name          = "ttf-eks-build"
  description   = "Terraform EKS Build"
  service_role  = "${aws_iam_role.codepipeline_role.arn}"

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type    = "BUILD_GENERAL1_SMALL"
    image           = "${var.build_image}"
    type            = "LINUX_CONTAINER"
    privileged_mode = true

    dynamic "environment_variable" {
      for_each = var.environment_variables
      content {
        name  = environment_variable.key
        value = environment_variable.value
      }
    }
  }

  source {
    type            = "CODEPIPELINE"
    buildspec       = "${var.build_spec}"
  }

}

# Deploy to EKS
resource "aws_codebuild_project" "tf-eks-deploy" {
  name          = "ttf-eks-deploy"
  description   = "Terraform EKS deploy"
  service_role  = "${aws_iam_role.codepipeline_role.arn}"

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type    = "BUILD_GENERAL1_SMALL"
    image           = "${var.build_image}"
    type            = "LINUX_CONTAINER"
    privileged_mode = true

    dynamic "environment_variable" {
      for_each = var.environment_variables
      content {
        name  = environment_variable.key
        value = environment_variable.value
      }
    }
  }

  source {
    type            = "CODEPIPELINE"
    buildspec       = "${var.build_deploy_spec}"
  }

}