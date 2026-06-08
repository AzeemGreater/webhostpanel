class DatabaseService:
    @staticmethod
    def create_database(name: str):
        # mysql -e "CREATE DATABASE $name"
        pass

    @staticmethod
    def create_user(username: str, password: str, database: str):
        # mysql -e "CREATE USER '$username'@'localhost' IDENTIFIED BY '$password';"
        # mysql -e "GRANT ALL PRIVILEGES ON $database.* TO '$username'@'localhost';"
        # mysql -e "FLUSH PRIVILEGES;"
        pass

    @staticmethod
    def delete_database(name: str):
        # mysql -e "DROP DATABASE $name"
        pass
