import os
from .server_service import SystemCommand

class DnsService:
    @staticmethod
    def create_zone(domain: str):
        # PowerDNS zone creation (pdnsutil)
        SystemCommand.run(["pdnsutil", "create-zone", domain])
        return True

    @staticmethod
    def add_record(domain: str, name: str, record_type: str, content: str, ttl: int = 3600):
        # Format: pdnsutil add-record ZONE NAME TYPE [TTL] content
        SystemCommand.run(["pdnsutil", "add-record", domain, name, record_type, str(ttl), content])
        return True

    @staticmethod
    def delete_zone(domain: str):
        SystemCommand.run(["pdnsutil", "delete-zone", domain])
        return True
