import os

# Define the target directory
target_dir = 'src'

# Define allowed extensions
allowed_files = {'.ts'}

# Only process the top-level files in the 'src' directory
try:
    for file in os.listdir(target_dir):
        file_path = os.path.join(target_dir, file)
        
        if os.path.isfile(file_path) and os.path.splitext(file)[1] in allowed_files:
            rel_path = os.path.relpath(file_path)
            print(f"\n📄 File: {rel_path}\n{'=' * (8 + len(rel_path))}")
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    print(content)
            except Exception as e:
                print(f"⚠️ Could not read file: {e}")
except Exception as e:
    print(f"⚠️ Error accessing '{target_dir}': {e}")
