#!/bin/bash
# Quick expose server via ngrok for remote players
# Run this AFTER starting the server with: npm start

echo "Starting ngrok tunnel to localhost:3000..."
echo "Share the https URL with your players."
echo ""
npx ngrok http 3000
