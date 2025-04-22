# video-processing-system

# 📽️ Video Processing System

Sistema de processamento de vídeos em microsserviços com upload, autenticação, processamento, zipagem e notificação por e-mail.

## 🚀 Funcionalidades

- Upload de vídeos
- Processamento em background (RabbitMQ)
- Geração de thumbnails e arquivos ZIP
- Autenticação de usuários com JWT
- Notificação por e-mail em caso de erro
- Gateway unificado de entrada

## 🧱 Microsserviços

- `auth-service` - Gerencia autenticação e registro de usuários
- `gateway-service` - Roteia requisições para os serviços corretos
- `upload-service` - Gerencia upload de vídeos
- `processing-service` - Processa os vídeos enviados
- `zipping-service` - Gera arquivos .zip com as imagens
- `notification-service` - Envia e-mails em caso de erro

## 📁 Estrutura do Projeto

video-processing-system/ │ ├── services/ │ ├── auth-service/ │ ├── gateway-service/ │ ├── upload-service/ │ ├── processing-service/ │ ├── zipping-service/ │ └── notification-service/ │ ├── docker-compose.yml ├── README.md └── .env (opcional)

---


## 🔧 Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) ou local
- [RabbitMQ](https://www.rabbitmq.com/) (via Docker)

---

## 📦 Executando localmente com Docker

1. **Clone o projeto:**

1. Clone o repositório:
   ```bash
   git clone git@github.com:RaildoBru/video-processing-system.git
   cd video-processing-system
   ```

2. Copie o `.env.example` para `.env` e configure as variáveis:
   ```bash
   cp .env.example .env
   ```

3. Suba os containers com Docker Compose:
   ```bash
   docker-compose up --build
   ```

4. Acesse os serviços:
   - Gateway: [http://localhost:3000](http://localhost:3000)
   - RabbitMQ: [http://localhost:15672](http://localhost:15672) (usuário/pwd: guest)

📄 Documentação da API (Swagger)
Acesse:

```http
http://localhost:3000/api-docs

```

## ✅ Testes

Execute os testes com:

```bash
cd services/auth-service
npm install
npm test
```

## 📁 Estrutura

```
video-processing-system/
├── docker-compose.yml
├── .env.example
├── services/
│   ├── auth-service/
│   ├── upload-service/
│   ├── processing-service/
│   ├── zipping-service/
│   ├── notification-service/
│   └── gateway-service/
```

## 🛠 Tecnologias

- Node.js
- Docker
- RabbitMQ
- MongoDB
- JWT
- Nodemailer
