

cat << EOF > /tmp/request.json
{
  "instances": [
    {
      "prompt": "a man riding bike"
    }
  ],
  "parameters": {
    "sampleCount": 1
  }
}
EOF

PROJECT_ID=$(gcloud config get-value project)

curl -X POST \
    -H "Authorization: Bearer $(gcloud auth print-access-token)" \
    -H "Content-Type: application/json; charset=utf-8" \
    -d @/tmp/request.json \
    "https://us-central1-aiplatform.googleapis.com/v1/projects/$PROJECT_ID/locations/us-central1/publishers/google/models/imagegeneration:predict" > /tmp/response.json


cat /tmp/response.json | \
  jq -r .predictions[0].bytesBase64Encoded | \
  base64 -d > output.png



cat << EOF > /tmp/edit_request.json
{
  "instances": [
    {
      "prompt": "remove the trees",
      "image": {
        "bytesBase64Encoded": "$(cat /tmp/response.json | jq -r .predictions[0].bytesBase64Encoded)"
      }
    }
  ],
  "parameters": {
    "sampleCount": 1
  }
}
EOF

curl -X POST \
    -H "Authorization: Bearer $(gcloud auth print-access-token)" \
    -H "Content-Type: application/json; charset=utf-8" \
    -d @/tmp/edit_request.json \
    "https://us-central1-aiplatform.googleapis.com/v1/projects/$PROJECT_ID/locations/us-central1/publishers/google/models/imagegeneration@002:predict" > /tmp/edit_response.json

cat /tmp/edit_response.json | \
   jq -r .predictions[0].bytesBase64Encoded | \
   base64 -d > edit_output.png


