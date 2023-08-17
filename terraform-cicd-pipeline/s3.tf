
# pipeline artifact bucket
resource "aws_s3_bucket" "build_artifact_bucket" {
  bucket        = "${var.repo_name}"
  force_destroy = "true"
}
