import os
import urllib.request
import zipfile
import sys

URL = "https://github.com/git-for-windows/git/releases/download/v2.45.1.windows.1/MinGit-2.45.1-64-bit.zip"
TARGET_DIR = "C:/Users/Greater/git-portable"
ZIP_PATH = "C:/Users/Greater/git-portable.zip"

def download_and_extract():
    if os.path.exists(os.path.join(TARGET_DIR, "cmd", "git.exe")):
        print(f"Git portable already exists at {TARGET_DIR}")
        return True

    print(f"Downloading portable Git from {URL}...")
    try:
        os.makedirs(os.path.dirname(ZIP_PATH), exist_ok=True)
        # Download file
        urllib.request.urlretrieve(URL, ZIP_PATH)
        print("Download complete. Extracting...")
        
        # Unzip
        os.makedirs(TARGET_DIR, exist_ok=True)
        with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
            zip_ref.extractall(TARGET_DIR)
            
        print(f"Extraction complete! Portable Git installed at {TARGET_DIR}")
        # Clean up zip
        if os.path.exists(ZIP_PATH):
            os.remove(ZIP_PATH)
        return True
    except Exception as e:
        print(f"Failed to download/extract Git: {e}")
        if os.path.exists(ZIP_PATH):
            os.remove(ZIP_PATH)
        return False

if __name__ == "__main__":
    success = download_and_extract()
    sys.exit(0 if success else 1)
