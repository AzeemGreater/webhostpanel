import subprocess

class EmailService:
    @staticmethod
    def add_domain(domain: str):
        # In Postfix/Dovecot with virtual users (SQL backed):
        # We just need to add the domain to the email_domains table in our DB
        # and ensure Postfix/Dovecot are configured to read from it.
        pass

    @staticmethod
    def create_account(email: str, password_hash: str, quota_mb: int):
        # Add to email_accounts table
        pass

    @staticmethod
    def generate_dkim(domain: str):
        # subprocess.run(["opendkim-genkey", "-s", "default", "-d", domain])
        pass
