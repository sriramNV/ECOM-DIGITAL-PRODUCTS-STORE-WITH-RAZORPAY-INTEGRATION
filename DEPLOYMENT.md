# Deployment

## Prerequisites

- Docker and Docker Compose installed on the VPS
- A domain (e.g. podstore.example.com) pointing to the VPS IP

## Steps

1. Clone the repo on the VPS:

   ```bash
   git clone https://github.com/your-org/pod.git /opt/pod
   cd /opt/pod
   ```

2. Copy the environment file and fill in the values:

   ```bash
   cp .env.production.example .env.production
   ```

3. Start the services:

   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

4. Set up SSL with Certbot:

   ```bash
   docker run --rm -v ./certbot/www:/var/www/certbot \
     -v ./certbot/conf:/etc/letsencrypt certbot/certbot \
     certonly --webroot -w /var/www/certbot -d podstore.example.com
   ```

   Then reload nginx:

   ```bash
   docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
   ```

5. Monitor with:

   ```bash
   docker compose -f docker-compose.prod.yml logs -f
   ```

## Backups

A backup script is provided at `scripts/backup.sh`. It uses `pg_dump` and `rclone` to push compressed dumps to object storage. Configure `DATABASE_URL` and rclone remote before running.
