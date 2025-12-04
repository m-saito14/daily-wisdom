terraform {
  backend "gcs" {
    bucket  = "tfstate-gcp-learning-lab-476308"
    prefix  = "terraform/state"
  }
}