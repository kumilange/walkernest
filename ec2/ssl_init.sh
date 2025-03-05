#!/bin/sh

CERT_DIR="/etc/letsencrypt/live/walkernest.com"
CERT_FILE="$CERT_DIR/fullchain.pem"
KEY_FILE="$CERT_DIR/privkey.pem"

# Ensure all necessary directories exist with proper permissions
echo "📁 Creating necessary directories..."
mkdir -p "$CERT_DIR"
chmod -R 755 "$CERT_DIR"

# Generate a self-signed certificate if one doesn't exist
if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
    echo "🔐 Generating a temporary self-signed certificate..."
    openssl req -x509 -nodes -days 7 -newkey rsa:2048 \
        -keyout "$KEY_FILE" \
        -out "$CERT_FILE" \
        -subj "/CN=walkernest.com"
    chmod 644 "$CERT_FILE"
    chmod 600 "$KEY_FILE"
    echo "✅ Self-signed certificate generated successfully!"
else
    echo "🔐 SSL certificate already exists, updating permissions..."
    chmod 644 "$CERT_FILE"
    chmod 600 "$KEY_FILE"
    chmod 755 "$CERT_DIR"
fi

# Set permissions that allow both certbot and nginx to access
chmod -R 755 "$CERT_DIR"
