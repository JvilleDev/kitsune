FROM node:18-bullseye-slim

# Instala curl, bash y unzip
RUN apt-get update && apt-get install -y curl bash unzip

# Instala bun
RUN curl -fsSL https://bun.sh/install | bash

# Añade bun al PATH de todos los shells
ENV PATH="/root/.bun/bin:$PATH"

WORKDIR /app

# Copia el código del frontend al contenedor
COPY . .

# Instala dependencias
RUN /root/.bun/bin/bun install

# Verifica si el directorio .output existe y compila si es necesario
RUN if [ ! -d ".output" ]; then /root/.bun/bin/bun run build; fi

# Comando de inicio para el frontend
CMD ["bun", "run", "preview"]
