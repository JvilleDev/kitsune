FROM oven/bun:latest

WORKDIR /app

# Copia el código del backend al contenedor
COPY . .

# Instala dependencias
RUN bun install

# Comando de inicio para el backend
CMD ["bun", "run", "start"]
