# Hereket

Hereket — talyplar we toparlar üçin bir ýerde toplanan programmalar toplumy (Odoo görnüşinde). Häzirki tapgyrda esasy programma **Depderim** (sanly depder); ýakyn wagtda **Synag Ulgamy**, **Reýting**, **E-žurnal**, **Ylmy-amaly maslahat** we **Gollanma** goşulýar.

Tehniki stak: TanStack Start (React 19 + Vite 7) + Tailwind v4 + Supabase (auth/DB). Server tarapy Node.js-de işleýär, şonuň üçin öz serweriňizde-de (self-hosted) ulanyp bolýar.

---

## Bölüm 1 — Ubuntu 22.04 serwerinde gurmak

Aşakdaky ädimler täze Ubuntu 22.04 LTS serwerinde (azyndan 2 CPU / 4 GB RAM / 20 GB disk) ähli zady nol-dan ýola goýmagy görkezýär.

### 1.1 Ulgamy täzelemek we esasy gurallar

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential ca-certificates gnupg ufw
```

### 1.2 Node.js 20 LTS we Bun gurmak

```bash
# Node.js 20 (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # v20.x

# Bun (taslama Bun bilen ulanylýar)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bun -v
```

### 1.3 PostgreSQL we Supabase (self-hosted) gurmak

Hereket arka tarapy Supabase ulanýar. Öz serweriňizde Supabase-iň resmi `docker` paketini ulanmak iň ýönekeý ýoldur.

**Docker we Docker Compose:**

```bash
# Docker Engine
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker

# Tassyklaň
docker --version
docker compose version
```

**Supabase-i çekmek:**

```bash
cd /opt
sudo git clone --depth 1 https://github.com/supabase/supabase
sudo chown -R $USER:$USER /opt/supabase
cd /opt/supabase/docker
cp .env.example .env
```

`.env` faýlyny açyp aşakdakylary üýtgediň (`nano .env`):

- `POSTGRES_PASSWORD` — güýçli parol
- `JWT_SECRET` — 32+ harply tötänleýin setir (`openssl rand -base64 48`)
- `ANON_KEY` we `SERVICE_ROLE_KEY` — Supabase resminamasyndaky görkezme bilen JWT döretmek (https://supabase.com/docs/guides/self-hosting/docker)
- `SITE_URL` — `http://<serweriňiziň-LAN-IP>` (mysal: `http://192.168.1.10`)
- `API_EXTERNAL_URL` — `http://<serweriňiziň-LAN-IP>:8000`

Supabase-i başladyň:

```bash
docker compose up -d
docker compose ps
```

Studio: `http://<serwer-IP>:3000`, API: `http://<serwer-IP>:8000`.

### 1.4 Hereket kodyny almak

```bash
cd /opt
sudo git clone <siziň-repo-URL> hereket
sudo chown -R $USER:$USER /opt/hereket
cd /opt/hereket
bun install
```

### 1.5 Daşky sazlamalar (`.env`)

`/opt/hereket/.env` faýly dörediň:

```env
VITE_SUPABASE_URL=http://192.168.1.10:8000
VITE_SUPABASE_PUBLISHABLE_KEY=<.env-däki ANON_KEY>
VITE_SUPABASE_PROJECT_ID=local

# Server tarapy üçin (server functions)
SUPABASE_URL=http://192.168.1.10:8000
SUPABASE_PUBLISHABLE_KEY=<ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
```

`192.168.1.10` ýerine öz serweriňiziň LAN IP-sini ýazyň.

### 1.6 Maglumat bazasynyň migrasiýalary

```bash
# Supabase CLI gurmak
curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz \
  | sudo tar -xz -C /usr/local/bin supabase
supabase --version

# Migrasiýalary ulanmak
cd /opt/hereket
supabase db push --db-url "postgresql://postgres:<POSTGRES_PASSWORD>@127.0.0.1:5432/postgres"
```

### 1.7 Önümçilik üçin gurmak (build)

```bash
cd /opt/hereket
bun run build
```

Çykyşy `.output/` papkasynda Node.js serweri görnüşinde döredilýär.

### 1.8 `systemd` hyzmaty

`/etc/systemd/system/hereket.service` dörediň:

```ini
[Unit]
Description=Hereket platformasy
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/hereket
EnvironmentFile=/opt/hereket/.env
Environment=PORT=3001
Environment=HOST=0.0.0.0
ExecStart=/usr/bin/node /opt/hereket/.output/server/index.mjs
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Işe goýbermek:

```bash
sudo chown -R www-data:www-data /opt/hereket
sudo systemctl daemon-reload
sudo systemctl enable --now hereket
sudo systemctl status hereket
```

### 1.9 Nginx reverse proxy (port 80)

```bash
sudo apt install -y nginx
```

`/etc/nginx/sites-available/hereket`:

```nginx
server {
    listen 80;
    server_name hereket.local 192.168.1.10;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/hereket /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 1.10 Firewall (UFW)

```bash
sudo ufw allow 22/tcp        # SSH
sudo ufw allow 80/tcp        # Hereket (Nginx)
sudo ufw allow 8000/tcp      # Supabase API (LAN-içre)
sudo ufw allow 3000/tcp      # Supabase Studio (administratoryň iş ýeri)
sudo ufw enable
sudo ufw status
```

---

## Bölüm 2 — LAN-da offline ulanmak

Maksat: serwer hiç haçan internet bilen baglanyşmasa-da, ýerli torda (LAN) müşderiler Hereket-i ulanyp bilsinler.

### 2.1 Statik IP berkitmek

Serweriňize hemişelik IP beriň (router-iň DHCP-de ýa-da `/etc/netplan/`-da). Mysal: `192.168.1.10`.

### 2.2 Ýerli domen (DNS bolmazdan)

**A görnüşi — her klient kompýuterda `hosts` faýly:**

- Linux/macOS: `/etc/hosts` → `192.168.1.10  hereket.local`
- Windows: `C:\Windows\System32\drivers\etc\hosts` → `192.168.1.10  hereket.local`

**B görnüşi — bütin tor üçin DNS (maslahat berilýär):**

Serwerde `dnsmasq` guruň:

```bash
sudo apt install -y dnsmasq
echo "address=/hereket.local/192.168.1.10" | sudo tee /etc/dnsmasq.d/hereket.conf
sudo systemctl restart dnsmasq
```

Soňra router-iň DHCP sazlamalarynda DNS-i `192.168.1.10` edip görkeziň. Şondan soň LAN-daky islendik enjam `http://hereket.local` arkaly girip biler.

### 2.3 HTTPS (islege görä, LAN üçin öz-özüne gol çeken sertifikat)

```bash
sudo apt install -y openssl
sudo mkdir -p /etc/nginx/certs
sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/nginx/certs/hereket.key \
  -out /etc/nginx/certs/hereket.crt \
  -subj "/CN=hereket.local"
```

Nginx blokuna `listen 443 ssl;` we sertifikat ýollaryny goşuň. Klientler ilki sertifikaty ynamly hökmünde import etmeli.

### 2.4 Offline tassyklamak

1. Serweri internetden aýryň (router-de WAN-y öçüriň ýa-da `sudo ufw deny out`).
2. Başga bir enjamdan `http://hereket.local` açyň — giriş sahypasy gelmeli.
3. Hasap dörediň, Depderim-e giriň, ýazgy goşuň — hemmesi LAN-da işleýär.

### 2.5 Täzeleme aýlawy (internet bolan wagty)

Serweri wagtlaýyn internete birikdirip:

```bash
cd /opt/hereket
git pull
bun install
bun run build
sudo systemctl restart hereket
```

Soňra ýene LAN-only re­ýime gaýdyp barýar.

---

## Bölüm 3 — Goşmaça

### 3.1 Ätiýaçlyk nusgasy

```bash
# Maglumat bazasy
docker exec -t supabase-db pg_dumpall -U postgres > /backup/hereket-$(date +%F).sql

# Ulanyjy faýllary (storage)
sudo tar czf /backup/storage-$(date +%F).tgz /opt/supabase/docker/volumes/storage
```

`cron` arkaly her gije awtomatlaşdyryň.

### 3.2 Žurnallar

```bash
sudo journalctl -u hereket -f         # Hereket programmasy
docker compose -f /opt/supabase/docker/docker-compose.yml logs -f   # Supabase
sudo tail -f /var/log/nginx/access.log
```

### 3.3 Çykarmak we täzeden işe goýbermek

```bash
sudo systemctl restart hereket
sudo systemctl restart nginx
cd /opt/supabase/docker && docker compose restart
```

---

## Lisenziýa

Içerki ulanyş üçin. Telekeçilik maksatly ulanyşdan öň awtor bilen habarlaşyň.