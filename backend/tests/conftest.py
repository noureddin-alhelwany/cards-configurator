from __future__ import annotations

import os
import shutil
import socket
import subprocess
import time
from collections.abc import Iterator
from contextlib import closing
from pathlib import Path

import httpx
import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]


def _find_free_port() -> int:
    with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def _frontend_build_command() -> list[str] | None:
    """First available package-manager invocation that can build the frontend.

    Hard-coding `corepack` made the render tests ERROR during fixture setup on any machine
    without it (`subprocess.run` raises `FileNotFoundError`), which reads as a broken test
    rather than a missing tool.
    """
    if shutil.which("corepack"):
        return ["corepack", "pnpm", "--dir", "frontend", "build"]
    for manager in ("pnpm", "npm"):
        binary = shutil.which(manager)
        if binary:
            return [binary, "--dir", "frontend", "build"] if manager == "pnpm" else [binary, "--prefix", "frontend", "run", "build"]
    return None


@pytest.fixture(scope="session")
def build_frontend() -> Iterator[None]:
    command = _frontend_build_command()
    if command is None:
        if (REPO_ROOT / "frontend" / "dist" / "index.html").exists():
            # A bundle is present; render against it rather than skipping needlessly.
            yield
            return
        pytest.skip("no package manager found to build the frontend; run `make build` first")

    env = os.environ.copy()
    env["COREPACK_HOME"] = "/tmp/corepack"
    subprocess.run(command, cwd=REPO_ROOT, env=env, check=True)
    yield


@pytest.fixture(scope="session")
def chromium_available() -> None:
    """Skip render tests with a reason instead of failing when no browser is installed."""
    from cards_configurator_backend.rendering.service import (
        CHROME_ENV_VAR,
        _find_browser_binary,
    )

    try:
        _find_browser_binary()
    except RuntimeError as exc:
        pytest.skip(f"{exc} (set {CHROME_ENV_VAR} to point at one)")


@pytest.fixture(scope="session")
def live_server(build_frontend: None) -> Iterator[str]:
    port = _find_free_port()
    env = os.environ.copy()
    env["PYTHONPATH"] = str(REPO_ROOT / "backend" / "src")
    process = subprocess.Popen(
        [
            str(REPO_ROOT / "backend" / ".venv" / "bin" / "python"),
            "-m",
            "uvicorn",
            "cards_configurator_backend.app:app",
            "--host",
            "127.0.0.1",
            "--port",
            str(port),
        ],
        cwd=REPO_ROOT,
        env=env,
    )

    base_url = f"http://127.0.0.1:{port}"
    deadline = time.time() + 60
    try:
        while time.time() < deadline:
            try:
                response = httpx.get(f"{base_url}/api/healthz", timeout=1.0)
                if response.status_code == 200:
                    break
            except httpx.HTTPError:
                pass
            time.sleep(0.25)
        else:
            raise RuntimeError("Backend server did not start")

        yield base_url
    finally:
        process.terminate()
        try:
            process.wait(timeout=20)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=20)
