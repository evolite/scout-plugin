import re, os

version = os.environ['VERSION']
hash_   = os.environ['HASH']
date    = os.environ['DATE']
url     = os.environ['URL']

path = "/tmp/pages/index.yml"
with open(path) as f:
    content = f.read()

entry = (
    "- id: scout-plugin\n"
    "  name: Scout-Plugin\n"
    "  metadata:\n"
    "    description: Links from Stash performers and studios to Stash Scout\n"
    f"  version: {version}\n"
    f'  date: "{date}"\n'
    f"  path: {url}\n"
    f"  sha256: {hash_}"
)

if "id: scout-plugin" in content:
    content = re.sub(
        r'- id: scout-plugin\b.*?(?=\n- |\Z)',
        entry,
        content, flags=re.DOTALL
    )
else:
    content = content.rstrip('\n') + '\n' + entry + '\n'

with open(path, "w") as f:
    f.write(content)
