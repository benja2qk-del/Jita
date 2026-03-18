"""
openai_image_client.py
~~~~~~~~~~~~~~~~~~~~~~
Low-level OpenAI image generation client for the Shattered Dominion asset pipeline.

Responsibilities:
  - Load and validate configuration from environment variables (via .env)
  - Never log or print raw API keys
  - Call openai.images.generate with model-aware parameters
  - Support gpt-image-1 (transparent background, output_format=png)
  - Support dall-e-3 as fallback (response_format=b64_json)
  - Retry with exponential backoff on transient errors and rate-limits
  - Save generated PNG to disk (creates parent directories as needed)
  - Return a structured result dict — never raises on generation failure
"""

import base64
import logging
import os
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

# python-dotenv is optional — if absent, env vars must be set externally
try:
    from dotenv import load_dotenv as _load_dotenv
    _HAS_DOTENV = True
except ImportError:
    _HAS_DOTENV = False

try:
    import openai
except ImportError as _e:
    raise ImportError(
        "openai package is required. Install it with: pip install openai"
    ) from _e

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Models with native transparent background support
_TRANSPARENT_BG_MODELS = {"gpt-image-1"}
# Models that require response_format=b64_json
_DALLE_MODELS = {"dall-e-3", "dall-e-2"}


@dataclass
class ClientConfig:
    api_key: str
    org_id: str | None
    model: str = "gpt-image-1"
    size: str = "1024x1024"
    quality: str = "medium"     # gpt-image-1: low/medium/high/auto; dall-e-3: standard/hd
    max_concurrency: int = 3
    timeout_seconds: int = 120
    max_retries: int = 3
    base_backoff_seconds: float = 2.0


def load_config(env_file: str | Path | None = None) -> ClientConfig:
    """
    Load configuration from environment variables (optionally from a .env file).

    The API key is validated to be non-empty but is never logged.

    Parameters
    ----------
    env_file : str or Path, optional
        Path to a .env file. If None, looks for .env in the project root
        (two levels above this file: tools/../.env).

    Returns
    -------
    ClientConfig

    Raises
    ------
    EnvironmentError
        If OPENAI_API_KEY is missing or empty.
    ValueError
        If a numeric config value cannot be parsed.
    """
    if _HAS_DOTENV:
        if env_file is None:
            # Default: project root .env (one level up from tools/)
            env_file = Path(__file__).parent.parent / ".env"
        if Path(env_file).exists():
            _load_dotenv(env_file, override=False)
            logger.debug("Loaded .env from %s", env_file)
        else:
            logger.debug(".env not found at %s — using existing environment vars", env_file)
    else:
        logger.debug("python-dotenv not installed — using existing environment vars only")

    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise EnvironmentError(
            "OPENAI_API_KEY is not set. "
            "Copy .env.example to .env and add your key, "
            "or set the environment variable directly."
        )

    def _int(name: str, default: int) -> int:
        raw = os.environ.get(name, "").strip()
        if not raw:
            return default
        try:
            return int(raw)
        except ValueError:
            raise ValueError(f"Environment variable {name}={raw!r} must be an integer.")

    def _float(name: str, default: float) -> float:
        raw = os.environ.get(name, "").strip()
        if not raw:
            return default
        try:
            return float(raw)
        except ValueError:
            raise ValueError(f"Environment variable {name}={raw!r} must be a number.")

    return ClientConfig(
        api_key=api_key,
        org_id=os.environ.get("OPENAI_ORG_ID") or None,
        model=os.environ.get("OPENAI_IMAGE_MODEL", "gpt-image-1").strip(),
        size=os.environ.get("OPENAI_IMAGE_SIZE", "1024x1024").strip(),
        quality=os.environ.get("OPENAI_IMAGE_QUALITY", "medium").strip(),
        max_concurrency=_int("OPENAI_MAX_CONCURRENCY", 3),
        timeout_seconds=_int("OPENAI_TIMEOUT_SECONDS", 120),
    )


# ---------------------------------------------------------------------------
# Result type
# ---------------------------------------------------------------------------

@dataclass
class GenerationResult:
    success: bool
    output_path: Path | None = None
    prompt: str = ""
    model: str = ""
    revised_prompt: str | None = None   # DALL-E-3 may return a revised prompt
    error: str | None = None
    attempts: int = 0
    elapsed_seconds: float = 0.0
    extra: dict[str, Any] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# Client
# ---------------------------------------------------------------------------

class ImageClient:
    """
    Thin wrapper around openai.images.generate with retry logic.

    Usage
    -----
    config = load_config()
    client = ImageClient(config)
    result = client.generate(prompt, output_path=Path("output/human_warrior_idle.png"))
    if result.success:
        print("Saved to", result.output_path)
    else:
        print("Failed:", result.error)
    """

    def __init__(self, config: ClientConfig):
        self._cfg = config
        self._client = openai.OpenAI(
            api_key=config.api_key,
            organization=config.org_id,
            timeout=config.timeout_seconds,
        )

    def generate(
        self,
        prompt: str,
        output_path: Path,
        *,
        dry_run: bool = False,
    ) -> GenerationResult:
        """
        Generate one image and save it to *output_path*.

        Parameters
        ----------
        prompt : str
            The full image-generation prompt.
        output_path : Path
            Destination file path (parent dirs are created automatically).
        dry_run : bool
            If True, skip the actual API call and return a fake success result.

        Returns
        -------
        GenerationResult
            Never raises — errors are captured in result.error.
        """
        if dry_run:
            logger.info("[DRY RUN] Would generate: %s", output_path.name)
            return GenerationResult(
                success=True,
                output_path=output_path,
                prompt=prompt,
                model=self._cfg.model,
                attempts=0,
                elapsed_seconds=0.0,
                extra={"dry_run": True},
            )

        t_start = time.monotonic()
        last_error: str = ""
        attempt = 0

        for attempt in range(1, self._cfg.max_retries + 1):
            try:
                logger.debug("API call attempt %d for %s", attempt, output_path.name)

                # Build model-specific kwargs
                gen_kwargs: dict = {
                    "model": self._cfg.model,
                    "prompt": prompt,
                    "n": 1,
                    "size": self._cfg.size,
                    "quality": self._cfg.quality,
                }
                if self._cfg.model in _TRANSPARENT_BG_MODELS:
                    # gpt-image-1: native transparent background + PNG output
                    gen_kwargs["background"] = "transparent"
                    gen_kwargs["output_format"] = "png"
                else:
                    # DALL-E models: base64 JSON response required
                    gen_kwargs["response_format"] = "b64_json"

                response = self._client.images.generate(**gen_kwargs)
                image_data = response.data[0]
                revised = getattr(image_data, "revised_prompt", None)
                png_bytes = base64.b64decode(image_data.b64_json)

                # Atomic-ish write: write to .tmp then rename
                output_path.parent.mkdir(parents=True, exist_ok=True)
                tmp_path = output_path.with_suffix(".tmp.png")
                tmp_path.write_bytes(png_bytes)
                tmp_path.replace(output_path)

                elapsed = time.monotonic() - t_start
                logger.info("Saved %s (%.1fs, attempt %d)", output_path.name, elapsed, attempt)

                return GenerationResult(
                    success=True,
                    output_path=output_path,
                    prompt=prompt,
                    revised_prompt=revised,
                    model=self._cfg.model,
                    attempts=attempt,
                    elapsed_seconds=elapsed,
                )

            except openai.RateLimitError as exc:
                last_error = f"RateLimitError: {exc}"
                backoff = self._backoff(attempt, extra=30.0)
                logger.warning("Rate-limited on attempt %d — sleeping %.0fs: %s", attempt, backoff, exc)
                time.sleep(backoff)

            except openai.APITimeoutError as exc:
                last_error = f"TimeoutError: {exc}"
                backoff = self._backoff(attempt)
                logger.warning("Timeout on attempt %d — sleeping %.0fs: %s", attempt, backoff, exc)
                time.sleep(backoff)

            except openai.APIConnectionError as exc:
                last_error = f"ConnectionError: {exc}"
                backoff = self._backoff(attempt)
                logger.warning("Connection error on attempt %d — sleeping %.0fs: %s", attempt, backoff, exc)
                time.sleep(backoff)

            except openai.BadRequestError as exc:
                # Content policy / invalid prompt — do not retry
                last_error = f"BadRequestError (not retrying): {exc}"
                logger.error("Non-retryable error for %s: %s", output_path.name, exc)
                break

            except openai.OpenAIError as exc:
                last_error = f"OpenAIError: {exc}"
                backoff = self._backoff(attempt)
                logger.warning("OpenAI error on attempt %d — sleeping %.0fs: %s", attempt, backoff, exc)
                time.sleep(backoff)

            except Exception as exc:
                last_error = f"UnexpectedError: {exc}"
                logger.exception("Unexpected error generating %s", output_path.name)
                break

        elapsed = time.monotonic() - t_start
        return GenerationResult(
            success=False,
            output_path=None,
            prompt=prompt,
            model=self._cfg.model,
            error=last_error,
            attempts=attempt,
            elapsed_seconds=elapsed,
        )

    def _backoff(self, attempt: int, extra: float = 0.0) -> float:
        """Exponential backoff: 2^(attempt-1) * base, plus optional extra for rate-limits."""
        delay = (self._cfg.base_backoff_seconds ** attempt) + extra
        return min(delay, 120.0)  # cap at 2 minutes


# ---------------------------------------------------------------------------
# CLI smoke-test (does NOT save anything by default — use --output to save)
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import argparse

    logging.basicConfig(level=logging.DEBUG, format="%(levelname)s  %(message)s")

    parser = argparse.ArgumentParser(
        description="Smoke-test the OpenAI image client with a single prompt."
    )
    parser.add_argument("--prompt", required=True, help="Image generation prompt")
    parser.add_argument("--output", default="test_output.png", help="Output file path")
    parser.add_argument("--dry-run", action="store_true", help="Skip API call")
    args = parser.parse_args()

    cfg = load_config()
    client = ImageClient(cfg)
    result = client.generate(args.prompt, Path(args.output), dry_run=args.dry_run)

    if result.success:
        print(f"SUCCESS — saved to {result.output_path}  ({result.elapsed_seconds:.1f}s)")
        if result.revised_prompt:
            print(f"Revised prompt: {result.revised_prompt}")
    else:
        print(f"FAILED after {result.attempts} attempt(s): {result.error}")
