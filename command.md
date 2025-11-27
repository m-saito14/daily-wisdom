gcloud auth application-default login
gcloud config set project [YOUR_PROJECT_ID]


brew tap hashicorp/tap
brew install hashicorp/tap/terraform


cd terraform
terraform init
# 実行プランの確認 (リポジトリ名は 正確に入力してください)
terraform plan -var="project_id=[YOUR_PROJECT_ID]" -var="github_repo=[YourName/RepoName]"

# 適用
terraform apply -var="project_id=[YOUR_PROJECT_ID]" -var="github_repo=[YourName/RepoName]"
