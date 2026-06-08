import subprocess

class WordPressService:
    @staticmethod
    def get_site_info(path: str):
        # res = subprocess.run(["wp", "core", "version", f"--path={path}", "--allow-root"], capture_output=True, text=True)
        # return res.stdout.strip()
        return "6.4.1"

    @staticmethod
    def update_plugins(path: str):
        # subprocess.run(["wp", "plugin", "update", "--all", f"--path={path}", "--allow-root"])
        return True

    @staticmethod
    def hardening(path: str):
        # subprocess.run(["wp", "config", "set", "DISALLOW_FILE_EDIT", "true", "--raw", f"--path={path}", "--allow-root"])
        # subprocess.run(["chmod", "600", f"{path}/wp-config.php"])
        return True

    @staticmethod
    def cleanup_database(path: str):
        # subprocess.run(["wp", "db", "optimize", f"--path={path}", "--allow-root"])
        # subprocess.run(["wp", "post", "delete", "$(wp post list --post_type=revision --format=ids --allow-root)", "--force", "--allow-root"])
        return True
