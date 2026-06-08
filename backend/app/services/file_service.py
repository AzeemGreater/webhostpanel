import os
import shutil

class FileService:
    @staticmethod
    def list_dir(path: str):
        if not os.path.exists(path):
            return []
        items = []
        for entry in os.scandir(path):
            items.append({
                "name": entry.name,
                "is_dir": entry.is_dir(),
                "size": entry.stat().st_size,
                "modified": entry.stat().st_mtime
            })
        return items

    @staticmethod
    def read_file(path: str):
        with open(path, 'r') as f:
            return f.read()

    @staticmethod
    def write_file(path: str, content: str):
        with open(path, 'w') as f:
            f.write(content)
        return True

    @staticmethod
    def delete_item(path: str):
        if os.path.isdir(path):
            shutil.rmtree(path)
        else:
            os.remove(path)
        return True
