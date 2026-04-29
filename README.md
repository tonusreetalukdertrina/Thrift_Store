# 🛍️ Thrift Store Project

A full-stack **Thrift Store** application built with a **Laravel backend** and a **Next.js frontend**.

---

## 🧰 Tech Stack

### Backend

* Laravel 11.x
* PostgreSQL
* JWT Authentication

### Frontend

* Next.js 15.x
* Tailwind CSS
* Framer Motion

---

## 🛠️ Prerequisites

Make sure you have installed:

* PHP >= 8.3
* Composer (latest)
* Node.js >= 18.x
* npm (latest)
* PostgreSQL (running)

---

## 🚀 Getting Started

Follow these steps carefully.

---

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/betopia-btrp/Thrift_Store.git
cd Thrift_Store
```

---

## 2️⃣ Backend Setup (Laravel)

```bash
cd thrift-backend

# Install dependencies
composer install

# Create environment file
cp .env.example .env

# Generate app key
php artisan key:generate
```

---

### 🔐 Environment Configuration (Backend)

Open `thrift-backend/.env` and configure:

```env
APP_NAME=Laravel
APP_ENV=local
APP_KEY= # generated automatically
APP_DEBUG=true
APP_URL=http://localhost:9000

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=your_database_name
DB_USERNAME=your_username
DB_PASSWORD=your_password

JWT_SECRET=your_jwt_secret_here

STRIPE_KEY=your_stripe_public_key
STRIPE_SECRET=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> ⚠️ **Important**
>
> * Never commit `.env` files
> * Never expose real API keys publicly
> * Always use your own credentials

---

### 🗄️ Database Setup

```bash
php artisan migrate:fresh --seed
```

---

### ▶️ Run Backend

```bash
php -S localhost:9000 -t public
```

📍 Backend runs at:
http://localhost:9000

> ⚠️ You may see an error on the root URL — this is expected.
> The backend serves API endpoints only.

---

## 3️⃣ Frontend Setup (Next.js)

Open a new terminal:

```bash
cd thrift-frontend

npm install
```

---

### 🔐 Environment Configuration (Frontend)

Create a file:

```
thrift-frontend/.env.local
```

Add:

```env
NEXT_PUBLIC_API_URL=http://localhost:9000/api/v1
```

---

### ▶️ Run Frontend

```bash
npm run dev
```

📍 Frontend runs at:
http://localhost:3001

---

## 📂 Project Structure

```
Thrift_Store/
├── thrift-backend/     # Laravel API
├── thrift-frontend/    # Next.js frontend
├── imgforRead/         # Documentation assets
├── db_schema.sql       # Database schema
```

---

## 🔒 Security Notes

* Do NOT commit `.env` files
* Rotate keys immediately if exposed
* Use `.env.example` for safe placeholders only

---

## 🤝 Contributing

Contributions are welcome!

* Open an issue
* Submit a pull request

---

## 📄 License

This project is for educational purposes.
