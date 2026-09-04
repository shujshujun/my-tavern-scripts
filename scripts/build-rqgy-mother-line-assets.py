#!/usr/bin/env python3
"""Build and audit the local product chain for the mother Return/Double-Inheritance CGs.

This script never deletes source candidates, never writes dist, and never publishes. It performs two
reproducible local jobs:

1. Convert the 54 approved mother-video PNG sources into runtime-ID-named WebP products for the
   independent qgy-assets repository layout.
2. Rebuild manifests for those 54 adult products and the 20 already-productized static story CGs.

On the first run, --strip-runtime-source-paths extracts the historical source mapping from the runtime
semantic TypeScript file into a build-only source-map, then removes those local output paths from the
browser/runtime module. Later runs consume that source-map and verify it still closes over the 54 runtime IDs.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image, __version__ as PILLOW_VERSION

REPO = Path(__file__).resolve().parents[1]
SEMANTIC_TS = REPO / "src/人妻公寓/脚本/游戏逻辑/母亲视频通话CG语义.ts"
VIDEO_TASK_ROOT = REPO / "output/imagegen/rqgy-reset/adult-completion/mother-video-call-sequence"
VIDEO_PRODUCT_ROOT = VIDEO_TASK_ROOT / "product-v1/cg1/mother-video-call"
VIDEO_SOURCE_MAP = VIDEO_TASK_ROOT / "product-v1/source-map.json"
VIDEO_MANIFEST = VIDEO_TASK_ROOT / "product-v1/mother-video-call.manifest.json"
STATIC_ROOT = REPO / "src/人妻公寓/素材/特殊场景"
STATIC_MANIFEST = STATIC_ROOT / "母亲线剧情CG.manifest.json"
BUILD_SCRIPT = "scripts/build-rqgy-mother-line-assets.py"

VIDEO_REPO = "shujun8520-design/qgy-assets"
VIDEO_NEXT_TAG = "cg5"
VIDEO_TARGET_PATH = "cg1/mother-video-call"
STATIC_REPO = "shujshujun/my-tavern-scripts"
STATIC_NEXT_TAG = "rq0.91"
STATIC_TARGET_PATH = "src/人妻公寓/素材/特殊场景"

STATIC_IDS: dict[str, tuple[str, ...]] = {
    "回国": (
        "回国_01_管理员室整理经营归档",
        "回国_02_302共同阅读回国消息",
        "回国_03_302清点私人物件箱",
        "回国_04_管理员室锁存私人物件箱",
        "回国_05_母亲核对平常管理记录",
        "回国_06_母亲加入姐妹茶话会",
        "回国_07_大堂接待旧维修人员",
        "回国_08_管理员室深夜夜谈",
        "回国_09_302父亲会话协同回复",
    ),
    "双重继承": (
        "双重继承_01_公寓外部检查",
        "双重继承_02_大堂检查",
        "双重继承_03_信箱区检查",
        "双重继承_04_楼梯间检查",
        "双重继承_05_垃圾房检查",
        "双重继承_06_公共洗手间检查",
        "双重继承_07_健身房检查",
        "双重继承_08_天台检查",
        "双重继承_09_管理员室完全交权",
        "双重继承_10_父亲交出公寓楼总钥匙",
        "双重继承_11_302三人早餐",
    ),
}

ID_RE = re.compile(r"\bid:\s*'([^']+)'")
SOURCE_ENTRY_RE = re.compile(
    r"\{\s*\n\s*id:\s*'(?P<id>[^']+)'(?P<body>.*?)(?=\n\s*\},)",
    re.DOTALL,
)
CANDIDATE_SOURCE_RE = re.compile(r"\b源文件:\s*`\$\{候选目录\}/([^`]+)`")
REUSED_SOURCE_RE = re.compile(r"\b源文件:\s*复用005")
SOURCE_INTERFACE_RE = re.compile(
    r"\n\s*/\*\* 仓库内原始证据路径。正式接线时再映射到不可变资源标签，不能直接把output路径当线上URL。 \*/\n"
    r"\s*源文件:\s*string;",
)
SOURCE_CONSTANTS_RE = re.compile(
    r"\nconst 候选目录 = 'output/imagegen/rqgy-reset/adult-completion/mother-video-call-sequence/candidates-v2';\n"
    r"const 复用005 =\n"
    r"\s*'output/imagegen/rqgy-reset/adult-completion/mother-video-call-preview/approved/母亲/"
    r"MVC-ADULT-001-draw1_302卧室玩家第一视角母亲口交_嘴巴.png';\n",
)
SOURCE_PROPERTY_RE = re.compile(r"\n\s*源文件:\s*(?:`\$\{候选目录\}/[^`]+`|复用005),")


@dataclass(frozen=True)
class SourceMapping:
    runtime_id: str
    source_file: str


def rel(path: Path) -> str:
    return path.relative_to(REPO).as_posix()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def runtime_ids(source: str) -> list[str]:
    ids = ID_RE.findall(source)
    # The module contains only the 54 CG objects with id properties. Keep this hard fail explicit so a later
    # interface/helper object cannot silently enter the asset contract.
    if len(ids) != 54:
        raise RuntimeError(f"expected exactly 54 runtime CG IDs in {rel(SEMANTIC_TS)}, found {len(ids)}")
    if len(set(ids)) != len(ids):
        raise RuntimeError("runtime CG IDs are not unique")
    return ids


def extract_source_mapping(source: str) -> list[SourceMapping]:
    mappings: list[SourceMapping] = []
    for match in SOURCE_ENTRY_RE.finditer(source):
        runtime_id = match.group("id")
        body = match.group("body")
        candidate = CANDIDATE_SOURCE_RE.search(body)
        if candidate:
            source_file = (
                "output/imagegen/rqgy-reset/adult-completion/mother-video-call-sequence/candidates-v2/"
                + candidate.group(1)
            )
        elif REUSED_SOURCE_RE.search(body):
            source_file = (
                "output/imagegen/rqgy-reset/adult-completion/mother-video-call-preview/approved/母亲/"
                "MVC-ADULT-001-draw1_302卧室玩家第一视角母亲口交_嘴巴.png"
            )
        else:
            continue
        mappings.append(SourceMapping(runtime_id, source_file))
    return mappings


def load_source_mapping(ids: list[str], source: str, strip_runtime_source_paths: bool) -> list[SourceMapping]:
    extracted = extract_source_mapping(source)
    if extracted:
        if [item.runtime_id for item in extracted] != ids:
            raise RuntimeError("source mapping order does not exactly match the 54 runtime IDs")
        source_map = {
            "schemaVersion": 1,
            "sourceOfTruth": rel(SEMANTIC_TS),
            "note": "Build-only provenance. This file is never imported by browser/runtime code.",
            "entries": [
                {"id": item.runtime_id, "sourceFile": item.source_file}
                for item in extracted
            ],
        }
        write_json(VIDEO_SOURCE_MAP, source_map)
        if strip_runtime_source_paths:
            stripped = SOURCE_INTERFACE_RE.sub("", source)
            stripped = SOURCE_CONSTANTS_RE.sub("\n", stripped)
            stripped, removed = SOURCE_PROPERTY_RE.subn("", stripped)
            if removed != 54:
                raise RuntimeError(f"expected to strip 54 runtime source properties, stripped {removed}")
            if "output/imagegen" in stripped or "源文件:" in stripped:
                raise RuntimeError("runtime semantic module still contains a local output source path")
            SEMANTIC_TS.write_text(stripped, encoding="utf-8", newline="\n")
        return extracted

    if not VIDEO_SOURCE_MAP.is_file():
        raise RuntimeError(
            "runtime source paths are already absent, but the build-only source-map does not exist; "
            "refusing to invent provenance"
        )
    raw = json.loads(VIDEO_SOURCE_MAP.read_text(encoding="utf-8"))
    mappings = [SourceMapping(str(item["id"]), str(item["sourceFile"])) for item in raw.get("entries", [])]
    if [item.runtime_id for item in mappings] != ids:
        raise RuntimeError("build-only source-map does not exactly match the 54 runtime IDs")
    return mappings


def image_metadata(path: Path) -> tuple[int, int, str]:
    with Image.open(path) as image:
        image.load()
        return image.width, image.height, image.format or ""


def build_video_products(mappings: Iterable[SourceMapping]) -> list[dict[str, object]]:
    VIDEO_PRODUCT_ROOT.mkdir(parents=True, exist_ok=True)
    expected_names = {f"{item.runtime_id}.webp" for item in mappings}
    existing_names = {path.name for path in VIDEO_PRODUCT_ROOT.glob("*.webp")}
    unexpected = sorted(existing_names - expected_names)
    if unexpected:
        raise RuntimeError(
            "unexpected product WebP files exist; this script never deletes untracked files: " + ", ".join(unexpected)
        )

    entries: list[dict[str, object]] = []
    for item in mappings:
        source_path = REPO / item.source_file
        if not source_path.is_file():
            raise FileNotFoundError(f"missing approved source for {item.runtime_id}: {item.source_file}")
        source_width, source_height, source_format = image_metadata(source_path)
        if source_format != "PNG" or (source_width, source_height) != (1536, 2304):
            raise RuntimeError(
                f"unexpected source image contract for {item.runtime_id}: "
                f"{source_format} {source_width}x{source_height}"
            )

        product_path = VIDEO_PRODUCT_ROOT / f"{item.runtime_id}.webp"
        with Image.open(source_path) as image:
            image = image.convert("RGB")
            image.save(product_path, format="WEBP", quality=90, method=4, exact=True)

        width, height, image_format = image_metadata(product_path)
        if image_format != "WEBP" or (width, height) != (source_width, source_height):
            raise RuntimeError(f"invalid product image for {item.runtime_id}: {image_format} {width}x{height}")
        if product_path.stat().st_size <= 100_000:
            raise RuntimeError(f"product image is suspiciously small for {item.runtime_id}")
        entries.append(
            {
                "id": item.runtime_id,
                "sourceFile": item.source_file,
                "sourceWidth": source_width,
                "sourceHeight": source_height,
                "sourceBytes": source_path.stat().st_size,
                "sourceSha256": sha256(source_path),
                "productFile": rel(product_path),
                "productWidth": width,
                "productHeight": height,
                "productBytes": product_path.stat().st_size,
                "productSha256": sha256(product_path),
            }
        )
    return entries


def build_static_manifest() -> list[dict[str, object]]:
    entries: list[dict[str, object]] = []
    expected_files: set[Path] = set()
    for route, ids in STATIC_IDS.items():
        for runtime_id in ids:
            product_path = STATIC_ROOT / route / f"{runtime_id}.webp"
            expected_files.add(product_path)
            if not product_path.is_file():
                raise FileNotFoundError(f"missing static story CG: {rel(product_path)}")
            width, height, image_format = image_metadata(product_path)
            if image_format != "WEBP" or (width, height) != (1536, 1024):
                raise RuntimeError(f"invalid static story CG: {rel(product_path)} ({image_format} {width}x{height})")
            if product_path.stat().st_size <= 100_000:
                raise RuntimeError(f"static story CG is suspiciously small: {rel(product_path)}")
            entries.append(
                {
                    "route": route,
                    "id": runtime_id,
                    "productFile": rel(product_path),
                    "width": width,
                    "height": height,
                    "bytes": product_path.stat().st_size,
                    "sha256": sha256(product_path),
                }
            )

    actual_files = {
        path
        for route in STATIC_IDS
        for path in (STATIC_ROOT / route).glob("*.webp")
    }
    missing = sorted(rel(path) for path in expected_files - actual_files)
    orphaned = sorted(rel(path) for path in actual_files - expected_files)
    if missing or orphaned:
        raise RuntimeError(f"static CG bidirectional closure failed; missing={missing}, orphaned={orphaned}")
    return entries


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--strip-runtime-source-paths",
        action="store_true",
        help="extract source provenance to product-v1/source-map.json and remove local output paths from runtime TS",
    )
    args = parser.parse_args()

    source = SEMANTIC_TS.read_text(encoding="utf-8")
    ids = runtime_ids(source)
    mappings = load_source_mapping(ids, source, args.strip_runtime_source_paths)
    video_entries = build_video_products(mappings)
    static_entries = build_static_manifest()

    write_json(
        VIDEO_MANIFEST,
        {
            "schemaVersion": 1,
            "generatedBy": BUILD_SCRIPT,
            "generator": {"python": sys.version.split()[0], "pillow": PILLOW_VERSION, "webpQuality": 90, "webpMethod": 4},
            "runtimeSource": rel(SEMANTIC_TS),
            "runtimeCount": len(ids),
            "productRoot": rel(VIDEO_PRODUCT_ROOT),
            "publishTarget": {
                "repository": VIDEO_REPO,
                "nextImmutableTag": VIDEO_NEXT_TAG,
                "path": VIDEO_TARGET_PATH,
                "status": "pending_immutable_tag_not_published",
            },
            "entries": video_entries,
        },
    )
    write_json(
        STATIC_MANIFEST,
        {
            "schemaVersion": 1,
            "generatedBy": BUILD_SCRIPT,
            "runtimeCount": sum(len(ids_for_route) for ids_for_route in STATIC_IDS.values()),
            "productRoot": rel(STATIC_ROOT),
            "publishTarget": {
                "repository": STATIC_REPO,
                "nextImmutableTag": STATIC_NEXT_TAG,
                "path": STATIC_TARGET_PATH,
                "status": "pending_immutable_tag_not_published",
            },
            "entries": static_entries,
        },
    )

    print(
        json.dumps(
            {
                "videoProducts": len(video_entries),
                "videoManifest": rel(VIDEO_MANIFEST),
                "staticProducts": len(static_entries),
                "staticManifest": rel(STATIC_MANIFEST),
                "runtimeSourcePathsStripped": "output/imagegen" not in SEMANTIC_TS.read_text(encoding="utf-8"),
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
