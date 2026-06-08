import os

class DnsService:
    ZONE_DIR = "/etc/bind/zones"

    @staticmethod
    def create_zone_file(domain: str, records: list):
        """
        Generates a BIND zone file.
        """
        zone_content = f"""
$TTL 86400
@   IN  SOA ns1.{domain}. admin.{domain}. (
        {int(os.popen('date +%Y%m%d%H').read().strip())} ; Serial
        3600       ; Refresh
        1800       ; Retry
        604800     ; Expire
        86400 )    ; Minimum

@       IN  NS      ns1.{domain}.
@       IN  NS      ns2.{domain}.
"""
        for record in records:
            zone_content += f"{record['name']}  IN  {record['type']}  {record['content']}\n"
        
        # In real env:
        # with open(f"{DnsService.ZONE_DIR}/db.{domain}", "w") as f: f.write(zone_content)
        # reload bind9
        return zone_content
