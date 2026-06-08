import os
from .server_service import SystemCommand

class DatabaseService:
    @staticmethod
    def create_database(db_name: str, db_user: str, db_pass: str):
        # CyberPanel approach: Create DB, Create User, Grant Privileges
        # Assuming local MySQL/MariaDB server without password for root, or using .my.cnf
        
        create_db_cmd = f"CREATE DATABASE IF NOT EXISTS `{db_name}`;"
        create_user_cmd = f"CREATE USER IF NOT EXISTS '{db_user}'@'localhost' IDENTIFIED BY '{db_pass}';"
        grant_cmd = f"GRANT ALL PRIVILEGES ON `{db_name}`.* TO '{db_user}'@'localhost';"
        flush_cmd = "FLUSH PRIVILEGES;"
        
        full_query = f"{create_db_cmd} {create_user_cmd} {grant_cmd} {flush_cmd}"
        
        SystemCommand.run(["mysql", "-e", full_query])
        return True

    @staticmethod
    def delete_database(db_name: str):
        drop_db_cmd = f"DROP DATABASE IF EXISTS `{db_name}`;"
        SystemCommand.run(["mysql", "-e", drop_db_cmd])
        return True
