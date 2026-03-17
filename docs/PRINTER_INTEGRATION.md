# Guia de Integração: Elegoo + Home Assistant

Este guia documenta o processo de instalação e configuração do Home Assistant (HA) para monitorar impressoras Elegoo (como a CC2) e servir como ponte de dados para o dashboard do sistema ImprimiAqui3D.

## 1. Instalação do Home Assistant (Docker)

No servidor Ubuntu, rodamos o Home Assistant de forma isolada usando um arquivo `docker-compose.ha.yml` para não interferir nos serviços de produção.

### Comandos:
```bash
cd ~/ImprimiAqui3D
# Criar pasta de configuração
mkdir -p docker/homeassistant/config
# Iniciar o container em modo Host (necessário para descobrir impressoras na LAN)
sudo docker compose -f docker-compose.ha.yml up -d
```

O sistema ficará disponível em `http://[IP-DO-SERVIDOR]:8123`.

## 2. Instalação do HACS (Home Assistant Community Store)

O HACS é necessário para instalar integrações da comunidade que não são nativas do HA.

### Comando:
```bash
sudo docker exec -it imprimiaqui3d-homeassistant /bin/bash -c "wget -O - https://get.hacs.xyz | bash -"
sudo docker restart imprimiaqui3d-homeassistant
```

### Ativação no Navegador:
1. Vá em **Configurações > Dispositivos e Serviços**.
2. Clique em **+ Adicionar Integração** e procure por **HACS**.
3. Siga os passos de autorização com sua conta do GitHub.

## 3. Instalação da Integração Elegoo

1. No menu lateral, clique em **HACS**.
2. Vá em **Integrações** > **Explorar e baixar repositórios**.
3. Procure por **Elegoo Printers** e instale.
4. Reinicie o Home Assistant.

## 5. Integração Flashforge (Aventure 5M, etc.)

O processo para a Flashforge é um pouco diferente, pois o repositório precisa ser adicionado manualmente ao HACS.

### Passos:
1. No menu lateral do Home Assistant, clique em **HACS**.
2. No canto superior direito, clique nos **três pontinhos** (⋮) e selecione **Custom repositories** (Repositórios personalizados).
3. No campo de busca/URL, cole: `https://github.com/joseffallman/hass_flashforge`
4. Na categoria, selecione **Integration** (Integração).
5. Clique em **Add** (Adicionar).
6. Agora vá em **HACS > Integrações > Explorar e baixar repositórios**, pesquise por **FlashForge** e faça o download.
7. Reinicie o Home Assistant: `sudo docker restart imprimiaqui3d-homeassistant`.

### Configuração Final:
1. Vá em **Configurações > Dispositivos e Serviços**.
2. Clique em **+ Adicionar Integração** e procure por **FlashForge**.
3. Insira o IP da sua impressora Flashforge.

---
*Próximos Passos: Conexão da API do HA com o Dashboard.*
