# Gunakan Nginx sebagai base image untuk menyajikan file statis
FROM nginx:alpine

# Salin file-file frontend dari direktori 'frontend' lokal Anda (build context)
# ke direktori default Nginx di dalam container.
# Karena 'context: ./frontend' di docker-compose.yml, '.' di sini merujuk ke isi folder 'frontend'.
COPY . /usr/share/nginx/html

# Ekspos port 80 (default Nginx untuk HTTP)
EXPOSE 80

# Perintah untuk memulai Nginx saat container dijalankan
CMD ["nginx", "-g", "daemon off;"]