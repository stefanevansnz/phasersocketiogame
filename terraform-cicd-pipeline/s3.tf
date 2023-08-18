
# pipeline artifact bucket
resource "aws_s3_bucket" "build_artifact_bucket" {
  bucket        = "${var.build_artifact_bucket_name}"
  force_destroy = "true"
}
