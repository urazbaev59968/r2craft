 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/README.md b/README.md
index 72d70f245a4f0af43463a407365422396cc5b474..d537b1cf7e9feb746960f95d6d134742318c2df7 100644
--- a/README.md
+++ b/README.md
@@ -1,2 +1,59 @@
 # r2craft
-r2craft
+
+This repository contains a simple prototype server for an R2 Online inspired game. It provides basic HTTP APIs for user registration, login, server listing and character management, as well as a WebSocket echo server.
+
+## Requirements
+- Node.js 18 or newer
+- MySQL database (or MariaDB)
+
+## Setup
+1. Install dependencies (requires internet access):
+   ```bash
+   npm install
+   ```
+2. Configure environment variables if necessary:
+   - `HTTP_PORT` – port for the HTTP server (defaults to `8081`)
+   - `WS_PORT` – port for the WebSocket server (defaults to `8080`)
+   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` – MySQL connection settings
+
+3. Run the server:
+   ```bash
+   node server.js
+   ```
+
+The WebSocket server listens on `WS_PORT` and simply echoes messages back.
+
+## SQL Example
+See below for a minimal example of tables used by the prototype:
+```sql
+CREATE DATABASE r2c_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
+USE r2c_db;
+
+CREATE TABLE users (
+    id INT AUTO_INCREMENT PRIMARY KEY,
+    username VARCHAR(50) UNIQUE NOT NULL,
+    password_hash VARCHAR(255) NOT NULL,
+    email VARCHAR(255),
+    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
+);
+
+CREATE TABLE servers (
+    id INT AUTO_INCREMENT PRIMARY KEY,
+    name VARCHAR(50) NOT NULL,
+    host VARCHAR(255) NOT NULL,
+    port INT NOT NULL,
+    is_online TINYINT(1) DEFAULT 1
+);
+
+CREATE TABLE characters (
+    id INT AUTO_INCREMENT PRIMARY KEY,
+    user_id INT NOT NULL,
+    server_id INT NOT NULL,
+    name VARCHAR(50) NOT NULL,
+    class VARCHAR(20),
+    level INT DEFAULT 1,
+    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
+    FOREIGN KEY (user_id) REFERENCES users(id),
+    FOREIGN KEY (server_id) REFERENCES servers(id)
+);
+```
 
EOF
)
