resource "aws_codestarconnections_connection" "tf-github-connector" {
  name          = "github-connection"
  provider_type = "GitHub"
}

# create a pipeline
resource "aws_codepipeline" "tf-eks-pipeline" {
  name     = "tf-eks-pipeline"
  role_arn = aws_iam_role.codepipeline_role.arn

  artifact_store {
    location = aws_s3_bucket.build_artifact_bucket.bucket
    type     = "S3"

    encryption_key {
      id   = aws_kms_key.artifact_encryption_key.arn
      type = "KMS"
    }
  }

  stage {
    name = "Source"

    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeStarSourceConnection"
      version          = "1"
      output_artifacts = ["source"]

      configuration = {
        ConnectionArn    = aws_codestarconnections_connection.tf-github-connector.arn
        FullRepositoryId = "${var.repo_name}"
        BranchName       = "${var.default_branch}"
      }
    }
  }

  stage {
    name = "Build"

    action {
      name             = "Build"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["source"]
      version          = "1"

      configuration = {
        ProjectName = "${aws_codebuild_project.tf-eks-build.name}"
      }
    }
  }

 stage {
    name = "Deploy"

    action {
      name             = "Deploy"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["source"]
      version          = "1"

      configuration = {
        ProjectName = "${aws_codebuild_project.tf-eks-deploy.name}"
      }
    }
  }

}