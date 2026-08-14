/*
 * GrafCenter — processos PM2 de produção
 *
 *  pm2 start ecosystem.config.cjs
 *  pm2 save
 *  pm2 logs grafcenter-whatsapp
 *
 * O diretório data/whatsapp-auth precisa estar em volume persistente e com
 * permissões restritas (chmod 700). Nunca versionar esse diretório.
 */
module.exports = {
  apps: [
    {
      name: "grafcenter-web",
      script: "npm",
      args: "start",
      cwd: __dirname,
      env: { NODE_ENV: "production", PORT: process.env.PORT || 3000 },
      max_restarts: 10,
      restart_delay: 3000,
    },
    {
      name: "grafcenter-email",
      script: "scripts/email-worker.mjs",
      cwd: __dirname,
      interpreter: "node",
      env: { NODE_ENV: "production" },
      max_restarts: 10,
      restart_delay: 5000,
    },
    {
      name: "grafcenter-whatsapp",
      script: "scripts/whatsapp-gateway.mjs",
      cwd: __dirname,
      interpreter: "node",
      env: { NODE_ENV: "production" },
      max_restarts: 12,
      restart_delay: 5000,
    },
  ],
};
