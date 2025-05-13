# Restaurant Review App Backend Setup

This is the backend for the Restaurant Review application. It is built using **Django** and **PostgreSQL**. Follow the instructions below to set up the development environment.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Project Setup](#project-setup)
- [Running the Development Server](#running-the-development-server)
- [Managing Dependencies](#managing-dependencies)
- [Contributing](#contributing)

---

## Prerequisites

Make sure you have the following installed on your local machine:
- Python 3.8+ ([Install Python](https://www.python.org/downloads/))
- PostgreSQL ([Install PostgreSQL](https://www.postgresql.org/download/))

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/gopinathsjsu/team-project-20201-code-avengers.git
cd Restaurant/Backend
```

### 2. Create and Activate a Virtual Environment

#### On macOS/Linux:

```bash
python3 -m venv venv   
source venv/bin/activate   
```

### 3. Install Dependencies

Once the virtual environment is activated, install the necessary dependencies from the `requirements.txt` file:

```bash
pip install -r requirements.txt
```
or 
```bash
pip3 install -r requirements.txt
```

## Running the Development Server

After setting up the environment and the database, run the Django development server:

```bash
python manage.py runserver
```

You can now access the app in your browser at `http://127.0.0.1:8000/`.

## Managing Dependencies

### Adding New Dependencies

If you need to install new Python packages, use `pip` or `pip3` as usual:

```bash
pip install package-name
```

Then, update the `requirements.txt` file to reflect the new dependencies:

```bash
pip freeze > requirements.txt
```

Commit the updated `requirements.txt` to version control.

### Setting Up the Environment for Other Developers

For other developers, the setup process involves:
1. Cloning the repository.
2. Creating a virtual environment.
3. Installing dependencies via `requirements.txt`.

This ensures everyone has the same environment.

## Contributing

### Steps for Contributing:
1. Create a new branch for your feature/bug fix:
   ```bash
   git checkout -b feature/branch-name 
   ```

3. Make your changes and commit them:
   ```bash
   git add .
   git commit -m "Description of the changes"
   ```

4. Push your changes to the remote branch:
   ```bash
   git push origin feature/branch-name
   ```

5. Create a pull request for code review and merging.

---

Thank you for contributing!

