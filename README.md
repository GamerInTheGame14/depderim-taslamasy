# Hereket

Hereket — talyplar we mugallymlar üçin bir ýerde toplanan programmalar toplumy (Odoo görnüşinde). Häzirki esasy programma **Depderim** (sanly depder); ýakyn wagtda **Synag Ulgamy**, **Reýting**, **E-žurnal**, **Ylmy-amaly maslahat** we **Gollanma** goşulýar.

**Tehniki stak:** TanStack Start (React 19 + Vite 7) + Tailwind v4 + Supabase (self-hosted, auth/DB/storage). Server tarapy Node.js-de işleýär — Ubuntu serwerinde-de, Windows kompýuterinde-de işläp bilýär we LAN içinde **internet bolmazdan** ulanyp bolýar.

---

## Mazmuny

1. [Bölüm 1 — Ubuntu 22.04 serwerinde nol-dan gurmak](#bölüm-1--ubuntu-2204-serwerinde-nol-dan-gurmak)
2. [Bölüm 2 — Windows 10 kompýuterde nol-dan gurmak](#bölüm-2--windows-10-kompýuterde-nol-dan-gurmak)
3. [Bölüm 3 — LAN-da offline ulanmak](#bölüm-3--lan-da-offline-ulanmak)
4. [Bölüm 4 — Bar bolan gurnamany TÄZELEMEK (upgrade)](#bölüm-4--bar-bolan-gurnamany-täzelemek-upgrade)
5. [Bölüm 5 — Ätiýaçlyk we žurnallar](#bölüm-5--ätiýaçlyk-we-žurnallar)

---

## Bölüm 1 — Ubuntu 22.04 serwerinde nol-dan gurmak

Talaplar: täze Ubuntu 22.04 LTS serweri, azyndan **2 CPU / 4 GB RAM / 20 GB disk**, `sudo` hukugy bolan ulanyjy.

### 1.1 Ulgamy täzelemek

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential ca-certificates gnupg ufw nano openssl
```

### 1.2 Node.js 20 LTS we Bun gurmak

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # v20.x

curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bun -v
```

### 1.3 Docker we self-hosted Supabase

```bash
# Docker Engine
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
docker --version
docker compose version

# Supabase çekmek
sudo mkdir -p /opt && cd /opt
sudo git clone --depth 1 https://github.com/supabase/supabase
sudo chown -R $USER:$USER /opt/supabase
cd /opt/supabase/docker
cp .env.example .env
```

`/opt/supabase/docker/.env` faýly açyň (`nano .env`) we şu meýdanlary üýtgediň:

- `POSTGRES_PASSWORD` — güýçli parol (saklap goýuň, soň gerek bolar).
- `JWT_SECRET` — `openssl rand -base64 48` netijesi.
- `ANON_KEY` we `SERVICE_ROLE_KEY` — Supabase resminamasyna görä JWT döretmek: <https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys>.
- `SITE_URL` — `http://<serweriňiziň-LAN-IP>` (mysal: `http://192.168.1.10`).
- `API_EXTERNAL_URL` — `http://<serweriňiziň-LAN-IP>:8000`.

Supabase-i işe goýbermek:

```bash
cd /opt/supabase/docker
docker compose up -d
docker compose ps
```

- Studio: `http://<serwer-IP>:3000`
- API: `http://<serwer-IP>:8000`

### 1.4 Hereket kodyny almak

```bash
cd /opt
sudo git clone <siziň-repo-URL> hereket
sudo chown -R $USER:$USER /opt/hereket
cd /opt/hereket
bun install
```

### 1.5 Daşky sazlamalar (`/opt/hereket/.env`)

```env
# Brauzer (Vite)
VITE_SUPABASE_URL=http://192.168.1.10:8000
VITE_SUPABASE_PUBLISHABLE_KEY=<ANON_KEY>
VITE_SUPABASE_PROJECT_ID=local

# Server tarapy (TanStack server functions)
SUPABASE_URL=http://192.168.1.10:8000
SUPABASE_PUBLISHABLE_KEY=<ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
```

`192.168.1.10` ýerine öz serweriňiziň hakyky LAN IP-sini ýazyň.

### 1.6 Maglumat bazasynyň migrasiýalaryny ulanmak

```bash
# Supabase CLI
curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz \
  | sudo tar -xz -C /usr/local/bin supabase
supabase --version

cd /opt/hereket
supabase db push \
  --db-url "postgresql://postgres:<POSTGRES_PASSWORD>@127.0.0.1:5432/postgres"
```

### 1.7 Önümçilik build-i

```bash
cd /opt/hereket
bun run build
```

Çykyşy `.output/` papkasynda Node.js serweri görnüşinde döredilýär.

### 1.8 `systemd` hyzmaty

`/etc/systemd/system/hereket.service`:

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
sudo ufw allow 8000/tcp      # Supabase API (LAN içre)
sudo ufw allow 3000/tcp      # Supabase Studio
sudo ufw enable
sudo ufw status
```

Indi LAN-daky islendik enjamdan `http://192.168.1.10` arkaly Hereket-e girip bilersiňiz.

---

## Bölüm 2 — Windows 10 kompýuterde nol-dan gurmak

Bu görnüş, aýratyn Linux serweri bolmadyk ýerlerde — mysal üçin **klassada bir Windows 10 kompýuter** bolanda — peýdaly. Şol kompýuter hem serwer, hem-de LAN-daky beýleki enjamlar üçin host bolup işleýär.

Talaplar: Windows 10 (64-bit, 1903+), administrator hukugy, azyndan **8 GB RAM**, WSL2 üçin Hyper-V/Virtualization BIOS-da açylgy bolmaly.

### 2.1 WSL2 we Ubuntu gurmak

PowerShell-i **administrator** hökmünde açyp:

```powershell
wsl --install -d Ubuntu-22.04
```

Kompýuter täzeden açylanda Ubuntu özüni gurar — ulanyjy ady we parol soraýar. Şondan soň:

```powershell
wsl --set-default-version 2
wsl -l -v        # Ubuntu-22.04 -> VERSION 2 bolmaly
```

### 2.2 Docker Desktop gurmak

1. <https://www.docker.com/products/docker-desktop/> sahypadan **Docker Desktop for Windows** ýükläň we guruň.
2. Gurnamada **“Use the WSL 2 based engine”** belligini saklap goýuň.
3. Açylandan soň: *Settings → Resources → WSL Integration* → `Ubuntu-22.04` üçin integrasiýany açyň.

### 2.3 Ubuntu içinde gurşaw taýýarlamak

PowerShell-de:

```powershell
wsl -d Ubuntu-22.04
```

Indi Ubuntu kabuk-a düşdüňiz. Bölüm 1-iň **1.1, 1.2, 1.3 (diňe Supabase çekmek bölegi), 1.4, 1.5, 1.6, 1.7** ädimlerini şol bir şekilde geçiň. Docker-i WSL içinde gurmagyň hökman däldigine üns beriň — Docker Desktop ony hödürleýär.

> **Bellik:** `192.168.1.10` ýerine **Windows host-yň** LAN IP-sini ulanyň
> (PowerShell-de `ipconfig` arkaly görüň, adatça `Ethernet adapter` ýa-da
> `Wi-Fi` bölüminde `IPv4 Address`).

### 2.4 Hereket-i Windows hyzmaty hökmünde işletmek

WSL içinde dowamly işleýän prosesi awtomatiki başlatmak üçin **NSSM** ulanýarys.

1. <https://nssm.cc/download> sahypadan NSSM ýükläň, `C:\nssm\` papkasyna goýuň.
2. PowerShell-i administrator hökmünde açyp:

```powershell
C:\nssm\win64\nssm.exe install Hereket "C:\Windows\System32\wsl.exe" `
  "-d Ubuntu-22.04 -- bash -lc 'cd /opt/hereket && PORT=3001 HOST=0.0.0.0 node .output/server/index.mjs'"
C:\nssm\win64\nssm.exe set Hereket Start SERVICE_AUTO_START
C:\nssm\win64\nssm.exe start Hereket
```

Hyzmatyň ýagdaýyny barlamak: `Get-Service Hereket`.

### 2.5 LAN-a portlary açmak (WSL2 → Windows host)

WSL2 öz içki tor adresinde işleýär, şonuň üçin LAN-daky beýleki kompýuterleriň görmegi üçin port forwarding gerek.

PowerShell (administrator):

```powershell
# WSL içindäki IP
$wsl = (wsl -d Ubuntu-22.04 hostname -I).Trim().Split(" ")[0]

# Hereket (3001) we Supabase API (8000) üçin port forwarding
netsh interface portproxy add v4tov4 listenport=80   listenaddress=0.0.0.0 connectport=3001 connectaddress=$wsl
netsh interface portproxy add v4tov4 listenport=8000 listenaddress=0.0.0.0 connectport=8000 connectaddress=$wsl

# Windows Firewall düzgünleri
New-NetFirewallRule -DisplayName "Hereket HTTP"     -Direction Inbound -LocalPort 80   -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Hereket Supabase" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```

Indi LAN-daky enjamlar `http://<Windows-LAN-IP>` arkaly Hereket-e girip bilýär.

> **Bellik:** WSL2-iň içki IP-si käbir täzeden açylyşlardan soň üýtgäp bilýär.
> Şol bir komandalary `Task Scheduler → At startup` arkaly her açylyşda awtomatiki ýerine ýetirip bolýar.

---

## Bölüm 3 — LAN-da offline ulanmak

Maksat: serwer/Windows host internet bilen baglanyşmasa-da, ýerli torda Hereket işlemeli.

### 3.1 Statik IP berkitmek

Router-iň DHCP sazlamalarynda host enjama hemişelik IP beriň (mysal: `192.168.1.10`).

### 3.2 Ýerli domen `hereket.local`

**A görnüşi — her klient kompýuterda `hosts` faýly:**

- Linux/macOS: `/etc/hosts`
- Windows: `C:\Windows\System32\drivers\etc\hosts`

Setir goşuň:

```
192.168.1.10  hereket.local
```

**B görnüşi — bütin tor üçin DNS (Ubuntu host):**

```bash
sudo apt install -y dnsmasq
echo "address=/hereket.local/192.168.1.10" | sudo tee /etc/dnsmasq.d/hereket.conf
sudo systemctl restart dnsmasq
```

Router-iň DHCP sazlamalarynda DNS-i `192.168.1.10` edip görkeziň.

### 3.3 HTTPS (islege görä, öz-özüne gol çeken sertifikat)

```bash
sudo mkdir -p /etc/nginx/certs
sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/nginx/certs/hereket.key \
  -out /etc/nginx/certs/hereket.crt \
  -subj "/CN=hereket.local"
```

Nginx blokuna `listen 443 ssl;` we sertifikat ýollaryny goşuň. Klientler ilki sertifikaty ynamly hökmünde import etmeli.

### 3.4 Offline tassyklamak

1. Router-de WAN-y öçüriň (ýa-da `sudo ufw deny out` Ubuntu host-da).
2. Başga bir enjamdan `http://hereket.local` açyň — giriş sahypasy gelmeli.
3. Hasap dörediň, Depderim-e giriň, ýazgy goşuň — hemmesi diňe LAN-da işleýär.

---

## Bölüm 4 — Bar bolan gurnamany TÄZELEMEK (upgrade)

Bu bölüm **eýýäm işläp duran** Hereket gurnamasyny täze wersiýa geçirmek üçin. Nol-dan gaýtadan gurnamak gerek däl.

> **Möhüm:** Täzelemezden öň **hemişe ätiýaçlyk nusgasyny alyň** (Bölüm 5.1).

### 4.1 Ubuntu serwerinde täzelemek

Serweri wagtlaýyn internete birikdirip:

```bash
# 1. Ätiýaçlyk
sudo mkdir -p /backup
docker exec -t supabase-db pg_dumpall -U postgres > /backup/hereket-$(date +%F).sql

# 2. Hyzmaty saklamak
sudo systemctl stop hereket

# 3. Täze kody çekmek
cd /opt/hereket
git fetch --all
git pull --ff-only

# 4. Bagly paketleri täzelemek
bun install

# 5. Täze migrasiýalary ulanmak
supabase db push \
  --db-url "postgresql://postgres:<POSTGRES_PASSWORD>@127.0.0.1:5432/postgres"

# 6. Täze build
bun run build

# 7. Hyzmaty täzeden işletmek
sudo systemctl start hereket
sudo systemctl status hereket

# 8. Tassyklama
curl -I http://127.0.0.1:3001
```

Eger Supabase-iň özüni hem täzelemek isleseňiz:

```bash
cd /opt/supabase
git pull
cd docker
docker compose pull
docker compose up -d
```

Şondan soň ýene internetden aýyrsaňyz bolýar.

### 4.2 Windows 10 kompýuterde täzelemek

PowerShell (administrator):

```powershell
# 1. Hyzmaty saklamak
Stop-Service Hereket

# 2. WSL-e geçmek we ätiýaçlyk + täzeleme
wsl -d Ubuntu-22.04 bash -lc @"
set -e
sudo mkdir -p /backup
docker exec -t supabase-db pg_dumpall -U postgres > /backup/hereket-\$(date +%F).sql

cd /opt/hereket
git fetch --all
git pull --ff-only
bun install
supabase db push --db-url 'postgresql://postgres:<POSTGRES_PASSWORD>@127.0.0.1:5432/postgres'
bun run build
"@

# 3. Hyzmaty täzeden işletmek
Start-Service Hereket
Get-Service Hereket
```

### 4.3 Offline ýagdaýda täzelemek (internet ýok)

Eger serwer hemişe LAN-da bolup, internete çykyp bilmeýän bolsa:

1. **Başga bir internet bolan kompýuterde** taslamany alyň:

   ```bash
   git clone <repo-URL> hereket-update
   cd hereket-update
   git pull
   bun install
   bun run build
   tar czf hereket-update-$(date +%F).tgz . --exclude=node_modules
   ```

2. Şol arhiwi USB ýa-da LAN üsti bilen serwere geçiriň.
3. Serwerde:

   ```bash
   sudo systemctl stop hereket
   cp -r /opt/hereket /opt/hereket.bak-$(date +%F)   # ätiýaçlyk
   tar xzf hereket-update-YYYY-MM-DD.tgz -C /opt/hereket --strip-components=0
   cd /opt/hereket
   bun install --offline || bun install
   supabase db push --db-url "postgresql://postgres:<POSTGRES_PASSWORD>@127.0.0.1:5432/postgres"
   bun run build
   sudo systemctl start hereket
   ```

4. Bir zat ýalňyş gitse, yza dolanmak (rollback):

   ```bash
   sudo systemctl stop hereket
   sudo rm -rf /opt/hereket
   sudo mv /opt/hereket.bak-YYYY-MM-DD /opt/hereket
   sudo systemctl start hereket
   ```

### 4.4 Täzelemeden soň barlag sanawy

- [ ] `systemctl status hereket` — `active (running)`.
- [ ] Brauzerden `http://hereket.local` — giriş sahypasy açylýar.
- [ ] Bar bolan ulanyjy giripi bilýär.
- [ ] Depderim-de öňki ýazgylar görünýär.
- [ ] Mugallym/talyp paýlaşma akymy işleýär.
- [ ] `sudo journalctl -u hereket -n 100 --no-pager` — täze ýalňyşlyk ýok.

---

## Bölüm 5 — Ätiýaçlyk we žurnallar

### 5.1 Ätiýaçlyk nusgasy

```bash
# Maglumat bazasy
docker exec -t supabase-db pg_dumpall -U postgres > /backup/hereket-$(date +%F).sql

# Ulanyjy faýllary (storage)
sudo tar czf /backup/storage-$(date +%F).tgz /opt/supabase/docker/volumes/storage

# .env we sazlamalar
sudo tar czf /backup/config-$(date +%F).tgz /opt/hereket/.env /opt/supabase/docker/.env /etc/nginx/sites-available/hereket
```

Awtomatlaşdyrmak üçin `cron` (Ubuntu, her gije sagat 2:00-da):

```cron
0 2 * * *  /usr/local/bin/hereket-backup.sh
```

### 5.2 Ätiýaçdan dikeltmek

```bash
sudo systemctl stop hereket
cat /backup/hereket-YYYY-MM-DD.sql | docker exec -i supabase-db psql -U postgres
sudo tar xzf /backup/storage-YYYY-MM-DD.tgz -C /
sudo systemctl start hereket
```

### 5.3 Žurnallar

```bash
sudo journalctl -u hereket -f                                            # Hereket programmasy
docker compose -f /opt/supabase/docker/docker-compose.yml logs -f         # Supabase
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log           # Nginx
```

Windows-da:

```powershell
Get-EventLog -LogName Application -Source Hereket -Newest 50
wsl -d Ubuntu-22.04 -- journalctl -u hereket -n 100 --no-pager
```

### 5.4 Çykarmak we täzeden işe goýbermek

```bash
sudo systemctl restart hereket
sudo systemctl restart nginx
cd /opt/supabase/docker && docker compose restart
```

---

## Lisenziýa

Içerki ulanyş üçin. Telekeçilik maksatly ulanyşdan öň awtor bilen habarlaşyň.
