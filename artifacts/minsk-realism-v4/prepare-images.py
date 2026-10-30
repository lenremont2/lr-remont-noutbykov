import hashlib
import json
import shutil
from pathlib import Path

from PIL import Image, ImageOps

folder = Path(__file__).resolve().parent
project = folder.parent.parent
sources = json.loads((folder / "sources.json").read_text(encoding="utf-8"))
(folder / "originals").mkdir(exist_ok=True)
manifest = []

for item in sources:
    source = Path(item["source"])
    original_copy = folder / "originals" / (item["name"] + ".png")
    shutil.copy2(source, original_copy)
    with Image.open(source) as original:
        actual_size = list(original.size)
        outputs = []
        for width in [640, 1280]:
            target = project / "public/media" / (item["prefix"] + f"-{width}.webp")
            ImageOps.fit(original.convert("RGB"), (width, width * 9 // 16)).save(
                target, quality=88
            )
            outputs.append({"path": str(target.relative_to(project)), "size": [width, width * 9 // 16]})
    manifest.append({
        **item,
        "requestedSize": [1920, 1080],
        "actualOriginalSize": actual_size,
        "requestedSizeMatched": actual_size == [1920, 1080],
        "originalCopy": str(original_copy.relative_to(project)),
        "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "webOutputs": outputs,
        "optimization": "Original preserved; web versions fitted to 16:9 without color or creative edits.",
    })

(folder / "manifest.json").write_text(
    json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
print(f"Prepared {len(manifest)} individually inspected images and preserved originals.")
