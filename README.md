# 🛍️ Thrift Store Project

Welcome to the **Thrift Store** project! This repository contains a full-stack application with a Laravel backend and a Next.js frontend. Follow the instructions below to get the project up and running on your local machine.

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

*   **PHP** (>= 8.3)
*   **Composer** (Latest version)
*   **Node.js** (>= 18.x)
*   **npm** (Latest version)
*   **postgresSQL** (must be running in the background)

---

## 🚀 Getting Started

Follow these steps in order to set up the project. **Do not skip any steps.**

### 1. Clone the Repository

```bash
git clone https://github.com/betopia-btrp/Thrift_Store.git
cd Thrift_Store
```

### 2. Backend Setup (Laravel)

Navigate to the backend directory and set up the environment.

```bash
cd thrift-backend

# Install dependencies
composer install

# Create environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

#### 🗄️ Database Configuration
Open the `.env` file in `thrift-backend` and ensure your database connection details are correct:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

#### 🏗️ Migration and Seeding
Once the database is configured, run the migrations and seed the data:
```bash
php artisan migrate:fresh --seed
```

#### ▶️ Run the Backend
Start the Laravel development server on port 9000:
```bash
php -S localhost:9000 -t public
```

> [!IMPORTANT]  
> ### ⚠️ Important: Ignore the Home Page Error
> When you navigate to `http://localhost:9000`, you might see an error message. **Please ignore this error.** The backend is designed to serve API requests, and this message does not affect the application's functionality.
>
> ![Laravel Home Error](imgforRead/laravelHomeError.png)

---

### 3. Frontend Setup (Next.js)

Open a **new terminal window**, navigate to the frontend directory, and set up the environment.

```bash
cd thrift-frontend

# Install dependencies
npm install

# Create environment file
# Create a .env.local file in the thrift-frontend root and add the following:
echo "NEXT_PUBLIC_API_URL=http://localhost:9000/api/v1" > .env.local
```

#### ▶️ Run the Frontend
Start the Next.js development server:
```bash
npm run dev
```

The frontend will be available at:  
[**http://localhost:3001**](http://localhost:3001)

---

## 📂 Project Structure

*   `thrift-backend/`: Laravel 11.x API.
*   `thrift-frontend/`: Next.js 15.x with Tailwind CSS and Framer Motion.
*   `imgforRead/`: Documentation assets.
*   `db_schema.sql`: Database schema reference.

---

## 🤝 Contributing

Feel free to open issues or submit pull requests to improve the project!

