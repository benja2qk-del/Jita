"""
generate_assets.py
~~~~~~~~~~~~~~~~~~
Main entry point for the Shattered Dominion AI asset generation pipeline.

Generates in-game 2D character sprites and action frames via the OpenAI Images API
(gpt-image-1 by default, with transparent background) and saves them to assets/generated/.

Usage
-----
    # See what would be generated without spending API credits:
    python generate_assets.py --dry-run

    # Generate all idle sprites (main starting batch):
    python generate_assets.py --preset core_idle

    # Generate full pose set for one character (test first):
    python generate_assets.py --preset human_warrior_all

    # Quick single-image test:
    python generate_assets.py --preset test_one

    # Generate action frames for all characters:
    python generate_assets.py --preset core_actions

    # Filter by any combination:
    python generate_assets.py --race human --class warrior --pose idle
    python generate_assets.py --race elf --pose attack_melee

    # Re-generate assets even if they already exist:
    python generate_assets.py --preset core_idle --overwrite

    # Verbose output (shows full prompts):
    python generate_assets.py --preset test_one --verbose

Concurrency
-----------
The script uses a ThreadPoolExecutor limited to OPENAI_MAX_CONCURRENCY
(default 3) to send several requests in parallel without overwhelming the API.
The manifest is updated after every completed generation, so partial runs resume cleanly.
"""

import argparse
import json
import logging
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

# ---------------------------------------------------------------------------
# Ensure tools/ is importable when run as a script
# ---------------------------------------------------------------------------
_HERE = Path(__file__).parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from asset_manifest import AssetManifest, make_asset_id, make_output_filename
from openai_image_client import ImageClient, load_config
from prompt_builder import build_prompt

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_DEFS_PATH = _HERE / "unit_definitions.json"
_PROJECT_ROOT = _HERE.parent


# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------

def _setup_logging(verbose: bool) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    fmt = "%(asctime)s  %(levelname)-8s  %(message)s"
    logging.basicConfig(level=level, format=fmt, datefmt="%H:%M:%S")


# ---------------------------------------------------------------------------
# Load unit definitions
# ---------------------------------------------------------------------------

def _load_defs() -> dict:
    with _DEFS_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Build the work list
# ---------------------------------------------------------------------------

def _build_work_items(
    defs: dict,
    *,
    filter_race: str | None,
    filter_cls: str | None,
    filter_pose: str | None,
    filter_tier: str | None,
    filter_biome: str | None,
    preset: str | None,
) -> list[dict]:
    """
    Return a list of dicts, each describing one asset to potentially generate.

    Keys: race, cls, pose, tier, biome
    """
    races   = list(defs["races"].keys())
    classes = list(defs["classes"].keys())
    poses   = list(defs["pose_styles"].keys())
    tiers   = list(defs["tiers"].keys())
    biomes  = [None]   # No-biome variant always included

    # ------------------------------------------------------------------
    # If a preset is given, use its scope instead of all combinations
    # ------------------------------------------------------------------
    if preset:
        preset_def = next(
            (p for p in defs.get("batch_presets", []) if p.get("preset_name") == preset),
            None,
        )
        if preset_def is None:
            known = [p.get("preset_name") for p in defs.get("batch_presets", [])]
            raise ValueError(f"Preset {preset!r} not found. Known presets: {known}")

        races   = preset_def.get("races",   races)
        classes = preset_def.get("classes", classes)
        tiers   = preset_def.get("tiers",   tiers)

        # Pose(s) — preset can define either "pose" (single) or "poses" (list)
        if preset_def.get("pose"):
            poses = [preset_def["pose"]]
        elif preset_def.get("poses"):
            poses = preset_def["poses"]

        # Biomes — preset stores [null] to mean "no biome"
        raw_biomes = preset_def.get("biomes", [None])
        biomes = [b for b in raw_biomes]   # keep Nones

    # ------------------------------------------------------------------
    # Apply CLI filters on top of (or instead of) preset scope
    # ------------------------------------------------------------------
    if filter_race:
        races = [r for r in races if r == filter_race]
    if filter_cls:
        classes = [c for c in classes if c == filter_cls]
    if filter_pose:
        poses = [p for p in poses if p == filter_pose]
    if filter_tier:
        tiers = [t for t in tiers if t == filter_tier]
    if filter_biome is not None:
        biomes = [filter_biome] if filter_biome else [None]

    items = []
    for race in races:
        for cls in classes:
            for pose in poses:
                for tier in tiers:
                    for biome in biomes:
                        items.append(
                            dict(race=race, cls=cls, pose=pose, tier=tier, biome=biome)
                        )
    return items


# ---------------------------------------------------------------------------
# Single-asset worker (runs in thread pool)
# ---------------------------------------------------------------------------

def _generate_one(
    item: dict,
    *,
    client: ImageClient,
    manifest: AssetManifest,
    overwrite: bool,
    dry_run: bool,
    verbose: bool,
    project_root: Path,
) -> dict:
    """
    Generate (or skip) a single asset. Returns a status dict for the summary.

    This function is designed to be called from a thread pool — it does NOT
    mutate the manifest itself (the caller does, under a lock).
    """
    race  = item["race"]
    cls   = item["cls"]
    pose  = item["pose"]
    tier  = item["tier"]
    biome = item["biome"]

    asset_id = make_asset_id(race, cls, pose, tier, biome)
    rel_path = make_output_filename(race, cls, pose, tier, biome)
    abs_path = project_root / rel_path

    # Skip check
    if not overwrite and manifest.is_generated(asset_id):
        logging.debug("SKIP (exists)  %s", asset_id)
        return {"status": "skipped", "asset_id": asset_id, "item": item}

    # Build prompt
    try:
        prompt = build_prompt(race, cls, pose, tier, biome)
    except ValueError as exc:
        logging.error("Prompt build error for %s: %s", asset_id, exc)
        return {"status": "failed", "asset_id": asset_id, "item": item, "error": str(exc)}

    if verbose:
        logging.debug("Prompt for %s:\n  %s", asset_id, prompt[:200] + ("..." if len(prompt) > 200 else ""))

    # Generate
    result = client.generate(prompt, abs_path, dry_run=dry_run)

    return {
        "status": "success" if result.success else "failed",
        "asset_id": asset_id,
        "item": item,
        "result": result,
        "rel_path": rel_path,
        "prompt": prompt,
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        prog="generate_assets.py",
        description="Generate Shattered Dominion game assets via OpenAI Images API.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )

    # Scope filters
    parser.add_argument("--race",  default=None, metavar="RACE",
                        help="Only generate assets for this race (human|elf|dragonkin)")
    parser.add_argument("--class", dest="cls", default=None, metavar="CLASS",
                        help="Only generate assets for this class (warrior|samurai|ninja|archer|mage|tank)")
    parser.add_argument("--pose",  default=None, metavar="POSE",
                        help="Only generate this pose "
                             "(idle|walk_left|walk_right|attack_melee|attack_ranged|cast|hurt|death|portrait)")
    parser.add_argument("--tier",  default=None, metavar="TIER",
                        help="Only generate this tier (basic|veteran|elite)")
    parser.add_argument("--biome", default=None, metavar="BIOME",
                        help="Only generate this biome variant (forest|desert|volcanic); "
                             "use 'none' for no-biome assets only")
    parser.add_argument("--preset", default=None, metavar="PRESET",
                        help="Run a named batch preset from unit_definitions.json")

    # Behaviour flags
    parser.add_argument("--overwrite", action="store_true",
                        help="Re-generate assets even if they already exist in the manifest")
    parser.add_argument("--dry-run",   action="store_true",
                        help="Print what would be generated without calling the API")
    parser.add_argument("--verbose",   action="store_true",
                        help="Show debug-level output including prompt previews")

    # Config overrides
    parser.add_argument("--env-file", default=None, metavar="PATH",
                        help="Path to .env file (default: project root .env)")
    parser.add_argument("--manifest", default=None, metavar="PATH",
                        help="Path to manifest.json (default: assets/generated/manifest.json)")

    args = parser.parse_args()
    _setup_logging(args.verbose)
    log = logging.getLogger(__name__)

    # ------------------------------------------------------------------
    # Config + client
    # ------------------------------------------------------------------
    log.info("Loading configuration...")
    try:
        config = load_config(args.env_file)
    except (EnvironmentError, ValueError) as exc:
        log.error("Configuration error: %s", exc)
        return 1

    log.info(
        "Model: %s | Size: %s | Quality: %s | Concurrency: %d | Timeout: %ds",
        config.model, config.size, config.quality,
        config.max_concurrency, config.timeout_seconds,
    )

    client = ImageClient(config)

    # ------------------------------------------------------------------
    # Unit definitions
    # ------------------------------------------------------------------
    log.info("Loading unit definitions from %s", _DEFS_PATH)
    try:
        defs = _load_defs()
    except (OSError, json.JSONDecodeError) as exc:
        log.error("Failed to load unit_definitions.json: %s", exc)
        return 1

    # ------------------------------------------------------------------
    # Manifest
    # ------------------------------------------------------------------
    manifest = AssetManifest(args.manifest)
    existing_counts = manifest.count_by_status()
    if existing_counts:
        log.info("Existing manifest entries: %s", existing_counts)

    # ------------------------------------------------------------------
    # Build work list
    # ------------------------------------------------------------------
    biome_filter = None if args.biome is None else (None if args.biome == "none" else args.biome)
    try:
        work_items = _build_work_items(
            defs,
            filter_race=args.race,
            filter_cls=args.cls,
            filter_pose=args.pose,
            filter_tier=args.tier,
            filter_biome=biome_filter,
            preset=args.preset,
        )
    except ValueError as exc:
        log.error("Work list error: %s", exc)
        return 1

    log.info("Total assets in scope: %d", len(work_items))
    if not work_items:
        log.warning("No assets matched the given filters — nothing to do.")
        return 0

    if args.dry_run:
        log.info("DRY RUN — no API calls will be made.")

    # ------------------------------------------------------------------
    # Determine what to actually generate (pre-filter skips for display)
    # ------------------------------------------------------------------
    will_generate = 0
    will_skip = 0
    for item in work_items:
        aid = make_asset_id(item["race"], item["cls"], item["pose"], item["tier"], item["biome"])
        if not args.overwrite and manifest.is_generated(aid):
            will_skip += 1
        else:
            will_generate += 1

    log.info("Will generate: %d  |  Will skip (already done): %d", will_generate, will_skip)

    if will_generate == 0:
        log.info("All assets already generated. Use --overwrite to re-generate.")
        return 0

    # ------------------------------------------------------------------
    # Generate — threaded
    # ------------------------------------------------------------------
    t_start = time.monotonic()
    summary = {"success": 0, "failed": 0, "skipped": 0}
    failed_ids: list[str] = []

    # Shared lock for manifest writes from multiple threads
    import threading
    manifest_lock = threading.Lock()

    def _worker(item: dict) -> dict:
        return _generate_one(
            item,
            client=client,
            manifest=manifest,
            overwrite=args.overwrite,
            dry_run=args.dry_run,
            verbose=args.verbose,
            project_root=_PROJECT_ROOT,
        )

    with ThreadPoolExecutor(max_workers=config.max_concurrency) as pool:
        futures = {pool.submit(_worker, item): item for item in work_items}

        done_count = 0
        for future in as_completed(futures):
            done_count += 1
            outcome = future.result()
            status = outcome["status"]
            asset_id = outcome["asset_id"]
            item = outcome["item"]

            summary[status] = summary.get(status, 0) + 1

            if status == "skipped":
                log.info("[%d/%d] SKIP  %s", done_count, len(work_items), asset_id)
                continue

            result = outcome.get("result")
            log.info(
                "[%d/%d] %s  %s  (%.1fs)",
                done_count, len(work_items),
                "OK  " if status == "success" else "FAIL",
                asset_id,
                result.elapsed_seconds if result else 0.0,
            )

            if status == "failed":
                error_msg = outcome.get("error") or (result.error if result else "unknown")
                log.error("  -> %s", error_msg)
                failed_ids.append(asset_id)

            # Persist to manifest after every result
            with manifest_lock:
                if status == "success" and result:
                    manifest.record_success(
                        race=item["race"],
                        cls=item["cls"],
                        pose=item["pose"],
                        tier=item["tier"],
                        biome=item["biome"],
                        filename=outcome.get("rel_path", ""),
                        prompt=outcome.get("prompt", ""),
                        model=config.model,
                        revised_prompt=result.revised_prompt or "",
                        attempts=result.attempts,
                        elapsed_seconds=result.elapsed_seconds,
                        extra=result.extra,
                    )
                elif status == "failed":
                    error_msg = outcome.get("error") or (result.error if result else "unknown")
                    manifest.record_failure(
                        race=item["race"],
                        cls=item["cls"],
                        pose=item["pose"],
                        tier=item["tier"],
                        biome=item["biome"],
                        filename=make_output_filename(
                            item["race"], item["cls"], item["pose"], item["tier"], item["biome"]
                        ),
                        prompt=outcome.get("prompt", ""),
                        model=config.model,
                        error=error_msg,
                        attempts=result.attempts if result else 0,
                        elapsed_seconds=result.elapsed_seconds if result else 0.0,
                    )

                # Save manifest after every entry (crash-safe progress)
                if not args.dry_run:
                    try:
                        manifest.save()
                    except OSError as exc:
                        log.error("Manifest save failed: %s", exc)

    # ------------------------------------------------------------------
    # Summary report
    # ------------------------------------------------------------------
    elapsed = time.monotonic() - t_start
    log.info("")
    log.info("=" * 60)
    log.info("GENERATION COMPLETE  (%.1fs total)", elapsed)
    log.info("  Succeeded : %d", summary.get("success", 0))
    log.info("  Failed    : %d", summary.get("failed",  0))
    log.info("  Skipped   : %d", summary.get("skipped", 0))
    if args.dry_run:
        log.info("  (dry run — no actual API calls were made)")
    if failed_ids:
        log.info("")
        log.info("Failed asset IDs:")
        for fid in failed_ids:
            log.info("  %s", fid)
    log.info("=" * 60)

    return 0 if summary.get("failed", 0) == 0 else 2


if __name__ == "__main__":
    sys.exit(main())
