#!/bin/sh

CERT_DIR="/etc/letsencrypt/live/walkernest.com"
CERT_FILE="$CERT_DIR/fullchain.pem"
KEY_FILE="$CERT_DIR/privkey.pem"

# Function to check if the certificate is self-signed
is_self_signed() {
  if [ -f "$CERT_FILE" ]; then
    ISSUER=$(openssl x509 -in "$CERT_FILE" -noout -issuer)
    echo "🔍 Checking certificate issuer: $ISSUER"
    if echo "$ISSUER" | grep -q "O=Internet Security Research Group"; then
      return 1  # Not self-signed (issued by Let's Encrypt)
    else
      return 0  # Self-signed certificate detected
    fi
  fi
  return 0  # Assume self-signed if no certificate is found
}

# Function to issue or renew a certificate
issue_certificate() {
  echo "🔐 Issuing/Renewing SSL certificate for walkernest.com..."
  if certbot certonly --webroot -w /var/www/certbot -d walkernest.com -d www.walkernest.com \
    --agree-tos --no-eff-email --register-unsafely-without-email --force-renewal -v; then
    echo "✅ SSL certificate issued successfully!"
  else
    echo "❌ Failed to issue/renew SSL certificate. Please check the certbot logs for more details."
    exit 1
  fi
}

# Detect and handle certificate scenarios
if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
  echo "⚠️ No valid SSL certificate found. Issuing a new one..."
  issue_certificate
elif is_self_signed; then
  echo "⚠️ Temporary self-signed certificate detected. Removing and reissuing proper certificate..."
  rm -f "$CERT_FILE" "$KEY_FILE"
  issue_certificate
else
  echo "✅ Valid Let's Encrypt SSL certificate already exists."
fi

echo "🔐 SSL setup completed successfully! ✅"