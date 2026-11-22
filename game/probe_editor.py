import os
import re

base = os.path.join("workspace", "editor", "static")
files = [
    "style.css", "app.js",
    "css/base.css", "css/layout.css", "css/editor.css",
    "css/tree.css", "css/ai.css",
]

for rel in files:
    path = os.path.join(base, rel)
    if not os.path.exists(path):
        print(f"{rel:20} — НЕТ ФАЙЛА")
        continue
    with open(path, "r", encoding="utf-8") as fh:
        text = fh.read()
    lines = text.count("\n") + 1
    print(f"{rel:20} {lines:5} строк  {len(text):7} символов")

print("\n--- медиа-запросы в style.css ---")
p = os.path.join(base, "style.css")
if os.path.exists(p):
    with open(p, "r", encoding="utf-8") as fh:
        for i, line in enumerate(fh, 1):
            if "@media" in line or "grid-template-columns" in line:
                print(f"{i:5}: {line.rstrip()}")

print("\n--- медиа-запросы в css/*.css ---")
for rel in ["css/base.css", "css/layout.css", "css/editor.css", "css/tree.css", "css/ai.css"]:
    p = os.path.join(base, rel)
    if not os.path.exists(p):
        continue
    with open(p, "r", encoding="utf-8") as fh:
        for i, line in enumerate(fh, 1):
            if "@media" in line:
                print(f"{rel} {i:5}: {line.rstrip()}")
