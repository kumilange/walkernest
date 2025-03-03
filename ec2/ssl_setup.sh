#!/bin/sh

CERT_DIR="/etc/letsencrypt/live/walkernest.com"
CERT_FILE="$CERT_DIR/fullchain.pem"
KEY_FILE="$CERT_DIR/privkey.pem"

# Function to check if the certificate is self-signed
is_self_signed() {
  if [ -f "$CERT_FILE" ]; then
    # Check if the certificate is self-signed by looking at the issuer and subject
    ISSUER=$(openssl x509 -in "$CERT_FILE" -noout -issuer | sed 's/^issuer=//')
    SUBJECT=$(openssl x509 -in "$CERT_FILE" -noout -subject | sed 's/^subject=//')
    echo "🔍 Checking certificate issuer: $ISSUER"
    echo "🔍 Checking certificate subject: $SUBJECT"
    
    # If issuer and subject are the same, it's self-signed
    if [ "$ISSUER" = "$SUBJECT" ]; then
      echo "🔍 Certificate is self-signed"
      return 0  # Self-signed certificate detected
    else
      echo "🔍 Certificate is not self-signed"
      return 1  # Not self-signed
    fi
  fi
  echo "🔍 No certificate file found"
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

# Main logic
echo "🔍 Checking SSL certificate status..."

# First check if files exist
if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
  echo "⚠️ No SSL certificate files found. Issuing a new one..."
  issue_certificate
else
  # If files exist, check if they're self-signed
  if is_self_signed; then
    echo "⚠️ Self-signed certificate detected. Removing and reissuing proper certificate..."
    rm -f "$CERT_FILE" "$KEY_FILE"
    issue_certificate
  else
    echo "✅ Valid SSL certificate already exists."
  fi
fi

echo "🔐 SSL setup completed successfully! ✅"
