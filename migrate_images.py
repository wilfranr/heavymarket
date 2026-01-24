
import os
import shutil
import re

SOURCE_DIR = "Pagina web"
DEST_DIR = "heavy-api/storage/app/public/landing"

def clean_name(name):
    # Remove leading numbers and spaces (e.g., "04 Hidraulicos" -> "Hidraulicos")
    name = re.sub(r'^\d+\s*', '', name)
    # Lowercase
    name = name.lower()
    # Replace spaces and special chars with hyphens
    name = re.sub(r'[^a-z0-9.]', '-', name)
    # Remove multiple hyphens
    name = re.sub(r'-+', '-', name)
    # Remove leading/trailing hyphens
    name = name.strip('-')
    return name

def migrate_images():
    if not os.path.exists(DEST_DIR):
        os.makedirs(DEST_DIR)

    for root, dirs, files in os.walk(SOURCE_DIR):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.svg')):
                # Get category from directory name
                rel_path = os.path.relpath(root, SOURCE_DIR)
                if rel_path == ".":
                    continue
                
                category_raw = os.path.basename(root)
                category_slug = clean_name(category_raw)
                
                # Create category dir in dest
                cat_dest_dir = os.path.join(DEST_DIR, category_slug)
                if not os.path.exists(cat_dest_dir):
                    os.makedirs(cat_dest_dir)
                
                # Clean filename
                filename_clean = clean_name(file)
                
                src_path = os.path.join(root, file)
                dest_path = os.path.join(cat_dest_dir, filename_clean)
                
                print(f"Copying {src_path} -> {dest_path}")
                shutil.copy2(src_path, dest_path)

if __name__ == "__main__":
    migrate_images()
