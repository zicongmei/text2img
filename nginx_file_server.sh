
CERT_DIR="${HOME}/cert"
NGINX_CONF_PATH="/tmp/nginx.conf"

echo "Ensuring certificate directory exists: ${CERT_DIR}"
mkdir -p "${CERT_DIR}"

echo "Generating self-signed SSL certificate (valid for 365 days)..."
# The CN (Common Name) should ideally match the hostname, 
# but for local testing 'localhost' is used.
# NOTE: Browsers will show a warning because this is a self-signed certificate.
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "${CERT_DIR}/nginx.key" \
    -out "${CERT_DIR}/nginx.crt" \
    -subj "/C=US/ST=State/L=City/O=Organization/OU=IT/CN=localhost" 2>/dev/null
echo "Certificate generated in ${CERT_DIR}"



#   Create NGINX Configuration File (nginx.conf)
echo "Creating nginx.conf in ${NGINX_CONF_PATH}..."
# We use 'EOF' to prevent shell variable expansion inside the NGINX config
cat << 'EOF' > "${NGINX_CONF_PATH}"
# Server block for HTTP (Port 80)
# This handles the forwarding/redirecting of all HTTP requests to HTTPS
server {
    listen 80;
    server_name localhost;

    # Forward all HTTP traffic to HTTPS
    return 301 https://$host$request_uri;
}

# Server block for HTTPS (Port 443)
server {
    listen 443 ssl;
    server_name localhost;

    # Set the document root for NGINX. 
    # This will be mapped to the user's $HOME directory via the Docker volume mount.
    root /usr/share/nginx/html; 
    index index.html index.htm; # Default files to look for

    # SSL Configuration
    ssl_certificate /etc/nginx/certs/nginx.crt;
    ssl_certificate_key /etc/nginx/certs/nginx.key;

    # Recommended SSL settings (modern and secure)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    # Serve files from the document root
    location / {
        # Try to serve the requested file, if not found, 
        # return a 404 (or you can use a fallback file like /index.html)
        try_files $uri $uri/ =404; 
    }
}
EOF
echo "nginx.conf created."



docker rm nginx-proxy --force

echo "Starting NGINX Proxy container on host network on ports 80 and 443..."
# PWD is the current directory where nginx.conf must be located
docker run -d \
  --network host \
  -v "${CERT_DIR}":/etc/nginx/certs:ro \
  -v "${NGINX_CONF_PATH}":/etc/nginx/conf.d/default.conf:ro \
  --name nginx-proxy \
  --restart always \
  nginx:latest



