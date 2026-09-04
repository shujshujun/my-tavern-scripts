#!/usr/bin/env python3
"""Build the 15 approved 许曼君《离婚》CGs into production WebP assets.

The source manifest is the sole selection authority. XMJ-DIV-11/12/13 must use
presentationPath/presentationSha256; all other IDs must use path/sha256.
This script never mutates or deletes image-generation source artifacts.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCE_ROOT = ROOT / "output/imagegen/rqgy-reset/adult-completion/xumanjun-divorce-ending"
SOURCE_MANIFEST = SOURCE_ROOT / "manifest-v2.json"
DEST_DIR = ROOT / "src/人妻公寓/素材/特殊场景/许曼君离婚"
DEST_MANIFEST = ROOT / "src/人妻公寓/素材/特殊场景/许曼君离婚CG.manifest.json"

EXPECTED_IDS = tuple(f"XMJ-DIV-{index:02d}" for index in range(1, 16))
PRESENTATION_IDS = frozenset({"XMJ-DIV-11", "XMJ-DIV-12", "XMJ-DIV-13"})
EXPECTED_PRESENTATION_SHA = {
    "XMJ-DIV-11": "80FFCC4FBA142899E156A135D36EA124E430E83334715266DDF4956AE01B69BE",
    "XMJ-DIV-12": "47853B03100AC97424F2A40281BDE7A19C8AD1B1ADFAFB5A40CE0CDC204BB6DF",
    "XMJ-DIV-13": "02F3BE4B28D04BBDED6EBD58CB4C0657A15D7FF6195554FB2BA58D560A101A6A",
}

SCENE_PURPOSE = {
    "XMJ-DIV-01": "办理结束",
    "XMJ-DIV-02": "旧钥匙归档",
    "XMJ-DIV-03": "换锁交新钥匙",
    "XMJ-DIV-04": "离婚后201白天背景",
    "XMJ-DIV-05": "离婚后201夜晚背景",
    "XMJ-DIV-06": "H1婚纱开门",
    "XMJ-DIV-07": "H2选择桌",
    "XMJ-DIV-08": "H7红本干净目标",
    "XMJ-DIV-09": "H7婚戒干净目标",
    "XMJ-DIV-10": "H7戒印干净目标",
    "XMJ-DIV-11": "H8红本右下分镜展示版",
    "XMJ-DIV-12": "H8婚戒右下分镜展示版",
    "XMJ-DIV-13": "H8／H9戒印右下分镜展示版",
    "XMJ-DIV-14": "H9她亲手封盒",
    "XMJ-DIV-15": "真实次晨",
}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json_if_changed(path: Path, value: dict[str, Any]) -> None:
    payload = json.dumps(value, ensure_ascii=False, indent=2, sort_keys=False) + "\n"
    if path.exists() and path.read_text(encoding="utf-8") == payload:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(payload, encoding="utf-8", newline="\n")


def classification(run_id: str) -> dict[str, bool]:
    if run_id in {"XMJ-DIV-04", "XMJ-DIV-05"}:
        return {"人物": False, "物件": False, "背景": True}
    if run_id == "XMJ-DIV-15":
        return {"人物": True, "物件": False, "背景": True}
    return {"人物": True, "物件": True, "背景": True}


def selected_source(artifact: dict[str, Any]) -> tuple[str, str, str]:
    run_id = str(artifact.get("id", ""))
    if run_id in PRESENTATION_IDS:
        if artifact.get("productPreferred") is not True:
            raise RuntimeError(f"{run_id}: productPreferred must be true")
        source_field = "presentationPath"
        sha_field = "presentationSha256"
        expected = EXPECTED_PRESENTATION_SHA[run_id]
        manifest_sha = str(artifact.get(sha_field, "")).upper()
        if manifest_sha != expected:
            raise RuntimeError(f"{run_id}: presentationSha256 differs from the second sealed value")
    else:
        if artifact.get("productPreferred"):
            raise RuntimeError(f"{run_id}: unexpected productPreferred source rule")
        source_field = "path"
        sha_field = "sha256"
        manifest_sha = str(artifact.get(sha_field, "")).upper()

    relative = str(artifact.get(source_field, ""))
    if not relative or not manifest_sha:
        raise RuntimeError(f"{run_id}: missing {source_field}/{sha_field}")
    normalized = relative.replace("\\", "/")
    forbidden = ("local-insets/", "rejectedAttempts/", "nonProductionExperiments/", "reviews/")
    if any(part in normalized for part in forbidden):
        raise RuntimeError(f"{run_id}: forbidden non-production source: {relative}")
    if run_id in PRESENTATION_IDS and not normalized.startswith("presentation-with-inset/"):
        raise RuntimeError(f"{run_id}: presentation source is not under presentation-with-inset")
    return relative, manifest_sha, f"generatedArtifacts.{source_field}/{sha_field}"


def main() -> int:
    source_manifest = load_json(SOURCE_MANIFEST)
    artifacts = source_manifest.get("generatedArtifacts")
    if not isinstance(artifacts, list):
        raise RuntimeError("manifest-v2.json: generatedArtifacts is missing")
    by_id = {str(item.get("id", "")): item for item in artifacts}
    if tuple(sorted(by_id)) != EXPECTED_IDS:
        raise RuntimeError(f"expected exactly {EXPECTED_IDS}, got {tuple(sorted(by_id))}")
    if len(artifacts) != 15:
        raise RuntimeError(f"expected 15 generatedArtifacts, got {len(artifacts)}")

    verified: list[tuple[str, dict[str, Any], Path, str, str, str, tuple[int, int]]] = []
    for run_id in EXPECTED_IDS:
        artifact = by_id[run_id]
        relative, source_sha, source_rule = selected_source(artifact)
        source_path = SOURCE_ROOT / relative
        if not source_path.is_file():
            raise FileNotFoundError(f"{run_id}: source not found: {source_path}")
        actual_sha = sha256_file(source_path)
        if actual_sha != source_sha:
            raise RuntimeError(f"{run_id}: source SHA mismatch: {actual_sha} != {source_sha}")
        with Image.open(source_path) as image:
            size = image.size
        if size != (1536, 1024):
            raise RuntimeError(f"{run_id}: unexpected source dimensions {size}")
        verified.append((run_id, artifact, source_path, relative, source_sha, source_rule, size))

    DEST_DIR.mkdir(parents=True, exist_ok=True)
    allowed_names = {f"{run_id}.webp" for run_id in EXPECTED_IDS}
    unexpected = sorted(path.name for path in DEST_DIR.iterdir() if path.is_file() and path.name not in allowed_names)
    if unexpected:
        raise RuntimeError(f"unexpected files already exist in product directory: {unexpected}")

    product_items: list[dict[str, Any]] = []
    for run_id, artifact, source_path, relative, source_sha, source_rule, source_size in verified:
        target = DEST_DIR / f"{run_id}.webp"
        temporary = target.with_name(f".{target.name}.tmp")
        with Image.open(source_path) as opened:
            image = ImageOps.exif_transpose(opened).convert("RGB")
            image.save(temporary, format="WEBP", quality=90, method=4, exact=True)
        temporary.replace(target)
        with Image.open(target) as product:
            product_size = product.size
            product_format = product.format
        if product_size != source_size or product_format != "WEBP":
            raise RuntimeError(f"{run_id}: invalid product {product_format} {product_size}")

        product_items.append(
            {
                "运行ID": run_id,
                "场景用途": SCENE_PURPOSE[run_id],
                "分类": classification(run_id),
                "允许长期背景": run_id in {"XMJ-DIV-04", "XMJ-DIV-05"},
                "发布状态": "本地产品化·待不可变标签",
                "productPreferred": bool(artifact.get("productPreferred", False)),
                "源选择规则": source_rule,
                "最终采用源路径": str((SOURCE_ROOT / relative).relative_to(ROOT)).replace("\\", "/"),
                "最终源SHA256": source_sha,
                "产品文件路径": str(target.relative_to(ROOT)).replace("\\", "/"),
                "产品尺寸": {"宽": product_size[0], "高": product_size[1]},
                "产品字节数": target.stat().st_size,
                "产品SHA256": sha256_file(target),
            }
        )

    source_manifest_sha = sha256_file(SOURCE_MANIFEST)
    product_manifest = {
        "schemaVersion": 1,
        "路线": "许曼君201正式结局:离婚",
        "产品状态": "本地产品化·待不可变标签",
        "运行ID总数": 15,
        "源manifest": str(SOURCE_MANIFEST.relative_to(ROOT)).replace("\\", "/"),
        "源manifestSHA256": source_manifest_sha,
        "源封板时间": source_manifest.get("userFinalApprovedAt") or source_manifest.get("createdAt") or "",
        "转换参数": {"格式": "WebP", "质量": 90, "方法": 4, "保留尺寸": True, "清除源元数据": True},
        "禁止运行时二次分镜": True,
        "禁止生产读取": [
            "output/imagegen/**",
            "output/imagegen/rqgy-reset/adult-completion/xumanjun-divorce-ending/local-insets/**",
        ],
        "items": product_items,
    }
    write_json_if_changed(DEST_MANIFEST, product_manifest)
    print(f"built {len(product_items)} assets into {DEST_DIR}")
    print(f"manifest: {DEST_MANIFEST}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
