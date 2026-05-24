module.exports = {
  apps: [
    {
      name: "backend",
      script: "/root/india_portal/backend/start.sh",
      watch: false,
    },
    {
      name: "frontend",
      cwd: "/root/india_portal/frontend",
      script: "/root/india_portal/frontend/node_modules/.bin/next",
      args: "start -p 3000",
      env: {
        NODE_ENV: "production",
        NEXT_PUBLIC_API_URL: "http://72.61.237.124:8000",
      },
      watch: false,
    },
  ],
};
