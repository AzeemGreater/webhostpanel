import subprocess

class SecurityService:
    @staticmethod
    def add_firewall_rule(port: int, protocol: str = "tcp", action: str = "allow"):
        # subprocess.run(["ufw", action, f"{port}/{protocol}"])
        pass

    @staticmethod
    def get_firewall_status():
        # result = subprocess.run(["ufw", "status"], capture_output=True, text=True)
        # return result.stdout
        return "Status: active"

    @staticmethod
    def install_ssl(domain: str, email: str):
        # subprocess.run(["certbot", "--nginx", "-d", domain, "-d", f"www.{domain}", "--non-interactive", "--agree-tos", "-m", email])
        pass
