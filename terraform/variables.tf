variable "project_id" {
  description = "gcp-learning-lab-476308"
  type        = string
}

variable "region" {
  description = "Default region"
  type        = string
  default     = "asia-northeast1"
}

variable "github_repo" {
  description = "m-saito14/daily-wisdom"
  type        = string
}

# Cloud Run にデプロイするコンテナイメージのタグ。
# CI（deploy.yml）から `-var="image_tag=<commit sha>"` で渡すことで、
# デプロイのたびに image 属性が変化し、Cloud Run の新リビジョンが作成される。
# 手動 apply やローカルでは既定の "latest" を使用する。
variable "image_tag" {
  description = "Container image tag to deploy to Cloud Run (commit SHA in CI)"
  type        = string
  default     = "latest"
}