# iam role for codebuild and codepipeline
resource "aws_iam_role" "codepipeline_role" {
  name = "tf-eks-codepipeline_role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": [
          "codebuild.amazonaws.com",
          "codepipeline.amazonaws.com"
        ]
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

# iam policy for codepipeline role
resource "aws_iam_role_policy" "codepipeline_role_policy" {
  role = "${aws_iam_role.codepipeline_role.name}"

  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "ec2:CreateNetworkInterface",
        "ec2:DescribeDhcpOptions",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DeleteNetworkInterface",
        "ec2:DescribeSubnets",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeVpcs",
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:GetRepositoryPolicy",
        "ecr:DescribeRepositories",
        "ecr:ListImages",
        "ecr:DescribeImages",
        "ecr:BatchGetImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage",
        "eks:DescribeCluster",
        "eks:ListClusters",
        "codecommit:CancelUploadArchive",
        "codecommit:GetBranch",
        "codecommit:GetCommit",
        "codecommit:GetUploadArchiveStatus",
        "codecommit:UploadArchive",
        "codebuild:BatchGetBuilds",
        "codebuild:StartBuild",
        "sts:AssumeRole"
      ],
      "Resource": "*"
    },
    {
        "Action": [
            "s3:*"
        ],
        "Resource": [
           "${aws_s3_bucket.build_artifact_bucket.arn}",
           "${aws_s3_bucket.build_artifact_bucket.arn}/*"
        ],
        "Effect": "Allow"
    },
    {
        "Action": [
            "kms:DescribeKey",
            "kms:GenerateDataKey*",
            "kms:Encrypt",
            "kms:ReEncrypt*",
            "kms:Decrypt"
        ],
        "Resource": "${aws_kms_key.artifact_encryption_key.arn}",
        "Effect": "Allow"
    },
    {
      "Action": [
          "codestar-connections:UseConnection"
      ],
      "Resource": "*",
      "Effect": "Allow"
    },
    {
      "Action": [
          "appconfig:StartDeployment",
          "appconfig:GetDeployment",
          "appconfig:StopDeployment"
      ],
      "Resource": "*",
      "Effect": "Allow"
    },
    {
      "Action": [
          "codecommit:GetRepository"
      ],
      "Resource": "*",
      "Effect": "Allow"
    }
  ]
}
POLICY
}



resource "aws_iam_role" "ekscodebuild_role" {
  name = "EksCodeBuildKubectl_role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::915922766016:root"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}




# iam policy for codepipeline role
resource "aws_iam_role_policy" "ekscodebuild_policy" {
  role = "${aws_iam_role.ekscodebuild_role.name}"

  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "eks:*",
        "ecr:*"
      ], 
      "Resource": "*"
    }
  ]
}
POLICY
}