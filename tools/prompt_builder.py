"""
prompt_builder.py
~~~~~~~~~~~~~~~~~
Builds OpenAI image-generation prompts for Shattered Dominion game assets.

Target: in-game 2D character sprites and action frames, NOT painterly portraits.

Every prompt enforces:
  - Stylized 2D game asset art direction (not photorealistic, not cinematic)
  - Transparent background
  - Full-body framing for battle units
  - Consistent sprite-friendly style across all characters
  - Deterministic text (same inputs → same prompt string)
"""

import json
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_DEFS_PATH = Path(__file__).parent / "unit_definitions.json"


def _load_defs() -> dict:
    with _DEFS_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Master style constants
# ---------------------------------------------------------------------------

# Appended to every prompt — defines the art direction globally
STYLE_SUFFIX = (
    "2D fantasy game sprite, stylized game asset, designed for in-game use, "
    "clean and readable silhouette, semi-stylized illustration style. "
    "Soft directional lighting, clear readable contrast. "
    "Transparent background — isolated character only, no floor, no ground shadow, no environment. "
    "NOT photorealistic. NOT oil painting. NOT cinematic portrait. NOT concept-art poster. "
    "NOT hyper-detailed face rendering. NOT chibi. NOT goofy. NOT anime. NOT flat vector."
)

# Framing instruction for full-body battle units / action frames
BATTLE_UNIT_FRAMING = (
    "Full-body character sprite, entire figure from top of head to feet fully visible, "
    "character centered in frame, occupies 75 to 85 percent of frame height, "
    "slight 3/4 angle for readability, transparent background."
)

# Framing for simple UI portraits (waist-up only, secondary priority)
PORTRAIT_FRAMING = (
    "Waist-up character portrait for game UI card, "
    "head and upper body centered, fills 85 percent of frame, "
    "slight 3/4 angle facing slightly left, transparent background, "
    "stylized and clean, not hyper-detailed."
)

# Poses that are NOT full-body walking/attacking — they still use full-body framing
# but with a note that the character may be falling/crouching
_GROUND_POSES = {"death"}


# ---------------------------------------------------------------------------
# Internal block builders
# ---------------------------------------------------------------------------

def _race_block(race_key: str, defs: dict) -> str:
    r = defs["races"].get(race_key)
    if not r:
        raise ValueError(f"Unknown race: {race_key!r}")
    return (
        f"{r['display_name']} race character, "
        f"{r['anatomy']}, "
        f"skin: {r['skin_tone_range']}, "
        f"{r['distinguishing']}."
    )


def _class_block(class_key: str, defs: dict) -> str:
    c = defs["classes"].get(class_key)
    if not c:
        raise ValueError(f"Unknown class: {class_key!r}")
    return (
        f"{c['display_name']} class. "
        f"Wearing: {c['armor_description']}. "
        f"Weapon: {c['weapon']}. "
        f"Silhouette: {c['silhouette_notes']}."
    )


def _pose_block(pose_key: str, defs: dict) -> str:
    p = defs["pose_styles"].get(pose_key)
    if not p:
        raise ValueError(f"Unknown pose: {pose_key!r}")
    return f"Pose: {p}."


def _tier_block(tier_key: str | None, defs: dict) -> str:
    if not tier_key:
        return ""
    t = defs["tiers"].get(tier_key)
    if not t:
        raise ValueError(f"Unknown tier: {tier_key!r}")
    return f"Gear tier: {t}."


def _biome_block(biome_key: str | None, defs: dict) -> str:
    if not biome_key:
        return ""
    b = defs["biomes"].get(biome_key)
    if not b:
        raise ValueError(f"Unknown biome: {biome_key!r}")
    return f"Biome color palette: {b}."


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def build_battle_unit_prompt(
    race: str,
    cls: str,
    pose: str,
    tier: str | None = "basic",
    biome: str | None = None,
) -> str:
    """
    Build a prompt for a full-body battle-unit sprite or action frame.

    Parameters
    ----------
    race : str
        Race key — one of: human, elf, dragonkin
    cls : str
        Class key — one of: warrior, samurai, ninja, archer, mage, tank
    pose : str
        Pose key — one of: idle, walk_left, walk_right, attack_melee,
        attack_ranged, cast, hurt, death
    tier : str or None
        Gear tier — one of: basic, veteran, elite  (default: basic)
    biome : str or None
        Biome coloring — one of: forest, desert, volcanic  (or None for neutral)

    Returns
    -------
    str
        A fully composed prompt ready to pass to the OpenAI image API.
    """
    defs = _load_defs()

    parts = [
        BATTLE_UNIT_FRAMING,
        _race_block(race, defs),
        _class_block(cls, defs),
        _pose_block(pose, defs),
    ]
    if tier:
        parts.append(_tier_block(tier, defs))
    if biome:
        parts.append(_biome_block(biome, defs))

    parts.append(STYLE_SUFFIX)
    return " ".join(p.strip() for p in parts if p.strip())


def build_portrait_prompt(
    race: str,
    cls: str,
    tier: str | None = "basic",
    biome: str | None = None,
) -> str:
    """
    Build a prompt for a simple stylized UI portrait (waist-up game card art).

    Kept deliberately simpler than battle-unit prompts.
    Portraits should look like game UI cards, not standalone illustrations.
    """
    defs = _load_defs()

    parts = [
        PORTRAIT_FRAMING,
        _race_block(race, defs),
        _class_block(cls, defs),
        _pose_block("portrait", defs),
    ]
    if tier:
        parts.append(_tier_block(tier, defs))
    if biome:
        parts.append(_biome_block(biome, defs))

    parts.append(STYLE_SUFFIX)
    return " ".join(p.strip() for p in parts if p.strip())


def build_prompt(
    race: str,
    cls: str,
    pose: str,
    tier: str | None = "basic",
    biome: str | None = None,
) -> str:
    """
    Unified dispatch: portrait pose → portrait prompt, everything else → battle-unit prompt.

    This is the primary entry point used by generate_assets.py.
    """
    if pose == "portrait":
        return build_portrait_prompt(race, cls, tier, biome)
    return build_battle_unit_prompt(race, cls, pose, tier, biome)


# ---------------------------------------------------------------------------
# CLI preview — python prompt_builder.py --race human --class warrior --pose idle
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Preview a generated asset prompt without calling the API."
    )
    parser.add_argument("--race",  required=True, help="Race key (human, elf, dragonkin)")
    parser.add_argument("--class", dest="cls", required=True,
                        help="Class key (warrior, samurai, ninja, archer, mage, tank)")
    parser.add_argument("--pose",  required=True,
                        help="Pose key (idle, walk_left, walk_right, attack_melee, "
                             "attack_ranged, cast, hurt, death, portrait)")
    parser.add_argument("--tier",  default="basic",
                        help="Tier key (basic, veteran, elite) — default: basic")
    parser.add_argument("--biome", default=None,
                        help="Biome key (forest, desert, volcanic) — default: none")

    args = parser.parse_args()
    prompt = build_prompt(args.race, args.cls, args.pose, args.tier, args.biome)

    print("\n--- GENERATED PROMPT ---")
    print(prompt)
    print(f"\nLength: {len(prompt)} characters")
