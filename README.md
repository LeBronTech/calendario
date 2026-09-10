# 🕊️ Eu Missionário — Agenda do LeBron
> **Gestão Integrada de Missões, Secretaria Paroquial e Eventos Católicos**

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC.svg)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore_%26_Auth-FFCA28.svg)](https://firebase.google.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-API_3.5_Flash-8E75B2.svg)](https://ai.google.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-000000.svg)](https://expressjs.com/)

---

## 📌 Sobre o Projeto

O **Eu Missionário — Agenda do LeBron** é uma aplicação completa e moderna desenvolvida especialmente para coordenadores pastorais, líderes de grupos e missionários católicos. O sistema centraliza o planejamento de missões, retiros, encontros de oração, terços, missas de preceito e eventos paroquiais em uma experiência visual intuitiva, rica e acolhedora.

Conta com suporte a inteligência artificial pastoral integrada (Irmã Maria — assistente virtual via **Google Gemini**), persistência em nuvem em tempo real com **Firebase Firestore**, modo offline e visualização interativa do calendário litúrgico.

---

## ✨ Principais Funcionalidades

### 📅 Gestão de Missões & Eventos
- **Movimentos Católicos Integrados**: Categorização com cores e identidades litúrgicas oficiais (Paroquial, RCC, Shalom, Canção Nova, Vicentinos, Terço dos Homens, EJNS, etc.) e suporte completo à criação de movimentos customizados.
- **Ciclo de Vida do Evento**: Acompanhe o status de preparação (`preparing`), confirmado (`confirmed`) e concluído (`completed`).
- **Checklists & Equipes**: Atribuição de equipes de liturgia, leitores, ministério de música, materiais e itens de checklist.
- **Recorrência & Horários Flexíveis**: Configuração de dias e horários para eventos semanais, mensais ou missões intensivas.

### 🗓️ Calendário Mensal e Litúrgico Interativo
- Visualização em grade mensal adaptativa com marcação de solenidades e preceitos dominicais.
- **Modal de Detalhes do Dia**: Visão detalhada de todas as atividades, horários e locais programados para a data selecionada.

### 🔔 Carrossel de Próximas Missões & Alertas
- Carrossel dinâmico no topo da tela com contagem regressiva em tempo real para os próximos eventos.
- Alerta visual de proximidade e urgência para manter os missionários sempre preparados.

### 🖼️ Visualizador de Imagens em Tela Cheia (Lightbox)
- Ao clicar em qualquer banner, foto de evento ou post associado (Instagram), a imagem se expande em tela cheia com alta resolução.
- Controles acessíveis com botão de fechar (**X**), atalho via teclado (**ESC**), abertura em nova aba e fundo escuro com desfoque (*backdrop blur*).

### 🤖 Secretária Virtual Paroquial (Irmã Maria)
- Assistente com IA pastoral desenvolvida com a **Google Gemini API** (`@google/genai`).
- Criação e sugestão automática de compromissos litúrgicos direto na conversa (identifica datas, horários, leituras e movimentos e agenda no sistema com um clique).
- Sugestão de roteiros, checklists de preparação e palavras de encorajamento pastoral.

### 📋 Backlog Pastoral & Linha de Ação
- Gestão em formato Kanban/Lista para projetos futuros, ideias de retiros e missões ainda sem data definida.

### 📊 Retrospectiva & Métricas de Evangelização
- Histórico visual dos eventos concluídos, total de missões realizadas e memorial de atividades da comunidade.

### ☁️ Sincronização em Nuvem & Suporte Offline
- Integração com **Firebase Firestore** e **Firebase Authentication** para sincronização segura e em tempo real.
- Suporte offline automático com armazenamento local (`localStorage`) e alertas visuais de conectividade.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 19** & **TypeScript**
- **Vite 6** (Empacotador rápido com Hot Module Replacement)
- **Tailwind CSS v4** (Estilização utilitária moderna)
- **Motion** (Animações fluidas e transições suaves)
- **Lucide React** (Pacote de ícones vetoriais modernos)

### Backend & Serviços
- **Node.js** com **Express**
- **@google/genai** (Google Gemini API — Modelo `gemini-3.5-flash`)
- **Firebase** (Firestore Database e Firebase Authentication)
- **esbuild** & **tsx** (Compilação e execução TypeScript full-stack)

---

## 📁 Estrutura do Projeto

```text
├── index.html                    # Entrada HTML principal da aplicação
├── server.ts                     # Servidor Node.js / Express (API Gemini e Vite middleware)
├── vite.config.ts                # Configuração do Vite e Tailwind CSS
├── tsconfig.json                 # Configuração do TypeScript
├── package.json                  # Dependências e scripts do projeto
├── metadata.json                 # Metadados e permissões da aplicação
├── firestore.rules               # Regras de segurança do Firebase Firestore
├── .env.example                  # Modelo de variáveis de ambiente
└── src/
    ├── main.tsx                  # Ponto de montagem do React
    ├── App.tsx                   # Componente raiz e orquestrador de estado
    ├── index.css                 # Estilos globais e importação do Tailwind
    ├── types.ts                  # Definições de tipos e interfaces TypeScript
    ├── components/
    │   ├── CalendarView.tsx      # Calendário mensal e grade de dias
    │   ├── CatholicEventsCalendar.tsx # Integração do calendário litúrgico
    │   ├── DayActivityModal.tsx  # Modal de atividades e detalhes do dia
    │   ├── WarningCarousel.tsx   # Carrossel de próximas missões com contagem regressiva
    │   ├── MissionCard.tsx       # Card expansível individual da missão
    │   ├── MissionModal.tsx      # Modal de criação e edição de missões
    │   ├── ImagePreviewModal.tsx # Visualizador de imagem em tela cheia (Lightbox)
    │   ├── SecretariaVirtual.tsx # Chat com a assistente pastoral Irmã Maria (Gemini)
    │   ├── RetrospectivaView.tsx # Painel de métricas e histórico de missões
    │   ├── BacklogView.tsx       # Gestão de backlog e ideias de missões
    │   └── OfflineAlert.tsx      # Indicador de status de rede offline/online
    └── utils/
        ├── catholicData.ts       # Dados litúrgicos, cores dos movimentos e helpers
        ├── firebaseDb.ts         # Métodos de leitura/escrita no Firestore
        ├── firebaseAuth.ts       # Autenticação e sincronização de usuário
        └── restoredData.ts       # Dados de semente e recuperação local
```

---

## 🚀 Como Executar o Projeto Localmente

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior
- Gerenciador de pacotes: `npm`, `yarn` ou `pnpm`

### 2. Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/eu-missionario-agenda.git
cd eu-missionario-agenda
```

### 3. Instalar as Dependências
```bash
npm install
```

### 4. Configurar as Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais:
```env
# Chave da API do Google Gemini (necessária para a Secretária Virtual Irmã Maria)
GEMINI_API_KEY="sua_chave_gemini_aqui"

# URL da aplicação (opcional para desenvolvimento local)
APP_URL="http://localhost:3000"
```

> **Obter Chave Gemini:** Você pode gerar sua chave gratuitamente no [Google AI Studio](https://aistudio.google.com/).

### 5. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```

Acesse no navegador: **`http://localhost:3000`**

---

## 📦 Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor full-stack de desenvolvimento em `http://localhost:3000` via `tsx` |
| `npm run build` | Compila os assets do Vite e gera o bundle do servidor para produção (`dist/server.cjs`) |
| `npm start` | Inicia o servidor compilado de produção |
| `npm run lint` | Executa a verificação estática de tipos com o compilador TypeScript (`tsc --noEmit`) |
| `npm run clean` | Remove pastas de build (`dist/`) e arquivos temporários |

---

## 🤝 Contribuindo

Contribuições são sempre bem-vindas para enriquecer a evangelização e apoiar as comunidades:

1. Faça um Fork do projeto
2. Crie uma branch para sua funcionalidade (`git checkout -b feature/NovaFuncionalidade`)
3. Faça commit das alterações (`git commit -m 'Adiciona nova funcionalidade'`)
4. Faça push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

---

## 📄 Licença

Distribuído sob a licença **Apache-2.0**. Consulte o arquivo de licença para obter mais informações.

---

<div align="center">
  <sub>"Ide por todo o mundo e pregai o Evangelho a toda criatura." — Mc 16, 15</sub>
</div>
