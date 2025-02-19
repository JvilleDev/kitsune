FROM oven/bun:latest

WORKDIR /app

# Actualiza e instala dependencias adicionales
RUN apt update && apt install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libx11-xcb1 libxcomposite1 libxrandr2 libgbm1

# Copia el código del backend al contenedor
COPY . .

# Instala dependencias
RUN bun install

# Comando de inicio para el backend
WORKDIR /app
ENTRYPOINT ["bun", "run", "start"]