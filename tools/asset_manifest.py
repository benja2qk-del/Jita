"""
asset_manifest.py
~~~~~~~~~~~~~~~~~
Persistent manifest for the Shattered Dominion asset generation pipeline.

The manifest tracks every generation attempt so the pipeline can:
  - Skip already-generated assets (skip-existing behaviour)
  - Resume after crashes without re-generating everything
  - Provide a human-readable audit trail of what was generated, when,
    and with which prompt / model

File location: assets/generated/manifest.json  (relative to project root)
Format:        JSON object; keys are deterministic asset IDs, values are records.

The manifest is written atomically (temp file → rename) to prevent corruption
if the process is killed mid-write.
"""

import json
import logging
import os
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Default manifest path (project_root/assets/generated/manifest.json)
# ---------------------------------------------------------------------------
_DEFAULT_MANIFEST_PATH = (
    Path(__file__).parent.parent / "assets" / "generated" / "manifest.json"
)


# ---------------------------------------------------------------------------
# Record schema
# ---------------------------------------------------------------------------

@dataclass
class AssetRecord:
    """One entry in the manifest — represents a single generated (or failed) asset."""

    # Identity
    asset_id: str           # Deterministic key, e.g. "human__warrior__idle__basic__"
    race: str
    cls: str                # "class" is a Python keyword — we use cls in code
    pose: str
    tier: str               # "basic" | "veteran" | "elite"
    biome: str              # "" for no biome

    # Generation metadata
    status: str             # "success" | "failed" | "skipped"
    filename: str           # Relative path from project root, e.g. assets/generated/units/...
    prompt: str
    model: str
    revised_prompt: str     # DALL-E-3 may revise the prompt; empty string if not
    timestamp: float        # Unix timestamp of this record's creation/update
    attempts: int
    elapsed_seconds: float
    error: str              # Empty string on success

    # Any extra API-specific info (e.g. generation_id, cost estimate)
    extra: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls_ref, d: dict) -> "AssetRecord":
        # Accept extra keys from future schema versions gracefully
        known = {f for f in AssetRecord.__dataclass_fields__}
        filtered = {k: v for k, v in d.items() if k in known}
        # Provide defaults for fields added after initial release
        filtered.setdefault("extra", {})
        filtered.setdefault("revised_prompt", "")
        filtered.setdefault("error", "")
        return AssetRecord(**filtered)


# ---------------------------------------------------------------------------
# Asset ID and filename helpers
# ---------------------------------------------------------------------------

def make_asset_id(
    race: str,
    cls: str,
    pose: str,
    tier: str,
    biome: str | None,
) -> str:
    """
    Produce a deterministic, sortable string key for a given asset combination.

    Format:  "{race}__{cls}__{pose}__{tier}__{biome}"
    Example: "human__warrior__idle__basic__forest"
             "elf__mage__portrait__elite__"          (no biome → empty string)
    """
    return f"{race}__{cls}__{pose}__{tier}__{biome or ''}"


def make_output_filename(
    race: str,
    cls: str,
    pose: str,
    tier: str,
    biome: str | None,
    asset_type: str = "units",
) -> str:
    """
    Produce the relative output path from project root.

    Examples
    --------
    units:    assets/generated/units/human/warrior/idle_basic.png
    portrait: assets/generated/portraits/human/warrior/portrait_basic.png

    When biome is set:
              assets/generated/units/human/warrior/idle_basic_forest.png
    """
    if pose == "portrait":
        asset_type = "portraits"

    parts = [pose, tier]
    if biome:
        parts.append(biome)
    filename = "_".join(parts) + ".png"

    return str(
        Path("assets") / "generated" / asset_type / race / cls / filename
    ).replace(os.sep, "/")


# ---------------------------------------------------------------------------
# Manifest class
# ---------------------------------------------------------------------------

class AssetManifest:
    """
    Load, query, update, and persist the generation manifest.

    Usage
    -----
    manifest = AssetManifest()          # loads from default path (or starts fresh)
    manifest = AssetManifest(path)      # custom path

    # Check before generating:
    if manifest.is_generated("human__warrior__idle__basic__"):
        print("Already done, skipping")

    # Record a success:
    manifest.record(record)
    manifest.save()
    """

    def __init__(self, path: Path | str | None = None):
        self._path = Path(path) if path else _DEFAULT_MANIFEST_PATH
        self._records: dict[str, AssetRecord] = {}
        self._load()

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def _load(self) -> None:
        if not self._path.exists():
            logger.debug("No manifest at %s — starting fresh", self._path)
            return
        try:
            with self._path.open("r", encoding="utf-8") as f:
                raw = json.load(f)
            for asset_id, rec_dict in raw.items():
                try:
                    self._records[asset_id] = AssetRecord.from_dict(rec_dict)
                except Exception as exc:
                    logger.warning("Skipping malformed manifest entry %r: %s", asset_id, exc)
            logger.debug("Loaded %d manifest entries from %s", len(self._records), self._path)
        except (json.JSONDecodeError, OSError) as exc:
            logger.error("Failed to load manifest from %s: %s — starting fresh", self._path, exc)

    def save(self) -> None:
        """
        Persist the manifest to disk atomically.

        Writes to a .tmp file then renames over the target so a crash mid-write
        never produces a corrupt manifest.
        """
        self._path.parent.mkdir(parents=True, exist_ok=True)
        tmp_path = self._path.with_suffix(".tmp.json")
        serialised = {k: v.to_dict() for k, v in sorted(self._records.items())}
        try:
            with tmp_path.open("w", encoding="utf-8") as f:
                json.dump(serialised, f, indent=2, ensure_ascii=False)
            tmp_path.replace(self._path)
            logger.debug("Manifest saved (%d entries) to %s", len(self._records), self._path)
        except OSError as exc:
            logger.error("Failed to save manifest to %s: %s", self._path, exc)
            raise

    # ------------------------------------------------------------------
    # Query
    # ------------------------------------------------------------------

    def is_generated(self, asset_id: str) -> bool:
        """Return True if a *successful* record exists for this asset_id."""
        rec = self._records.get(asset_id)
        return rec is not None and rec.status == "success"

    def get(self, asset_id: str) -> AssetRecord | None:
        return self._records.get(asset_id)

    def all_records(self) -> list[AssetRecord]:
        return list(self._records.values())

    def count_by_status(self) -> dict[str, int]:
        counts: dict[str, int] = {}
        for rec in self._records.values():
            counts[rec.status] = counts.get(rec.status, 0) + 1
        return counts

    # ------------------------------------------------------------------
    # Mutation
    # ------------------------------------------------------------------

    def record(self, entry: AssetRecord) -> None:
        """Insert or replace a manifest record (in-memory only; call save() to persist)."""
        self._records[entry.asset_id] = entry

    def record_success(
        self,
        *,
        race: str,
        cls: str,
        pose: str,
        tier: str,
        biome: str | None,
        filename: str,
        prompt: str,
        model: str,
        revised_prompt: str = "",
        attempts: int = 1,
        elapsed_seconds: float = 0.0,
        extra: dict | None = None,
    ) -> AssetRecord:
        """Convenience method: build and store a 'success' record."""
        asset_id = make_asset_id(race, cls, pose, tier, biome)
        rec = AssetRecord(
            asset_id=asset_id,
            race=race,
            cls=cls,
            pose=pose,
            tier=tier,
            biome=biome or "",
            status="success",
            filename=filename,
            prompt=prompt,
            model=model,
            revised_prompt=revised_prompt,
            timestamp=time.time(),
            attempts=attempts,
            elapsed_seconds=elapsed_seconds,
            error="",
            extra=extra or {},
        )
        self.record(rec)
        return rec

    def record_failure(
        self,
        *,
        race: str,
        cls: str,
        pose: str,
        tier: str,
        biome: str | None,
        filename: str,
        prompt: str,
        model: str,
        error: str,
        attempts: int,
        elapsed_seconds: float = 0.0,
        extra: dict | None = None,
    ) -> AssetRecord:
        """Convenience method: build and store a 'failed' record."""
        asset_id = make_asset_id(race, cls, pose, tier, biome)
        rec = AssetRecord(
            asset_id=asset_id,
            race=race,
            cls=cls,
            pose=pose,
            tier=tier,
            biome=biome or "",
            status="failed",
            filename=filename,
            prompt=prompt,
            model=model,
            revised_prompt="",
            timestamp=time.time(),
            attempts=attempts,
            elapsed_seconds=elapsed_seconds,
            error=error,
            extra=extra or {},
        )
        self.record(rec)
        return rec


# ---------------------------------------------------------------------------
# CLI inspect tool
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import argparse

    logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")

    parser = argparse.ArgumentParser(description="Inspect the asset generation manifest.")
    parser.add_argument("--manifest", default=None, help="Path to manifest.json")
    parser.add_argument("--status",   default=None, help="Filter by status (success/failed/skipped)")
    parser.add_argument("--race",     default=None)
    parser.add_argument("--class",    dest="cls", default=None)
    args = parser.parse_args()

    m = AssetManifest(args.manifest)
    records = m.all_records()

    if args.status:
        records = [r for r in records if r.status == args.status]
    if args.race:
        records = [r for r in records if r.race == args.race]
    if args.cls:
        records = [r for r in records if r.cls == args.cls]

    print(f"\nManifest at: {m._path}")
    print(f"Total entries: {len(m.all_records())}  |  Filtered: {len(records)}")
    print(f"Status counts: {m.count_by_status()}\n")

    for r in records:
        ts = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(r.timestamp))
        err = f"  ERROR: {r.error}" if r.error else ""
        print(f"  [{r.status:8s}] {r.asset_id:<50s}  {ts}{err}")
