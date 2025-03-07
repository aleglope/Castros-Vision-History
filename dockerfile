# Usa una imagen base de Node
FROM node:14

# Instala glTF-Pipeline
RUN npm install -g gltf-pipeline

# Configura un directorio de trabajo
WORKDIR /usr/src/app

# Copia tu archivo GLTF al contenedor
COPY ./public/CASTROS.gltf ./

# El CMD final indica que el contenedor quedará en espera de comandos
CMD ["sh", "-c", "gltf-pipeline -i CASTROS.gltf -o ./output/CASTROS-draco.gltf --draco.compressionLevel 7 && echo 'Compresion completada. Verifica la carpeta del volumen.'"]
