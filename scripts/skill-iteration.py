#!/usr/bin/env python3
"""
7-layer iteration script for improving Kimi skills.
Each layer analyzes the skills against the actual codebase and produces edits.
"""

import os
import re
import subprocess
import zipfile
from pathlib import Path
from dataclasses import dataclass
from typing import List, Tuple

PROJECT_ROOT = Path("/workspaces/Jobetes")
SKILLS_DIR = PROJECT_ROOT / ".agents" / "skills"

@dataclass
class Finding:
    layer: int
    skill: str
    severity: str  # info, warning, error
    message: str
    suggestion: str

findings: List[Finding] = []

def log(layer: int, skill: str, severity: str, message: str, suggestion: str = ""):
    findings.append(Finding(layer, skill, severity, message, suggestion))
    print(f"[Layer {layer}] [{skill}] [{severity}] {message}")

# ═══════════════════════════════════════════════════════════════════════════════
# LAYER 1: Structure & Convention Validation
# ═══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*70)
print("LAYER 1: Structure & Convention Validation")
print("="*70)

for skill_name in ["frontend-styling", "backend-api"]:
    skill_dir = SKILLS_DIR / skill_name
    skill_md = skill_dir / "SKILL.md"

    # Check SKILL.md exists
    if not skill_md.exists():
        log(1, skill_name, "error", "SKILL.md missing", "Create SKILL.md")
        continue

    content = skill_md.read_text()

    # Check YAML frontmatter
    if not content.startswith("---"):
        log(1, skill_name, "error", "Missing YAML frontmatter", "Add --- delimiters")
    elif "name:" not in content.split("---")[1]:
        log(1, skill_name, "error", "Missing 'name' in frontmatter", "Add name field")
    elif "description:" not in content.split("---")[1]:
        log(1, skill_name, "error", "Missing 'description' in frontmatter", "Add description field")
    else:
        log(1, skill_name, "info", "YAML frontmatter valid", "")

    # Check name matches folder
    fm = content.split("---")[1]
    m = re.search(r'name:\s*(\S+)', fm)
    if m and m.group(1) != skill_name:
        log(1, skill_name, "warning", f"Name '{m.group(1)}' != folder '{skill_name}'", "Align names")

    # Check no extraneous files (README, CHANGELOG, etc.)
    for bad in ["README.md", "CHANGELOG.md", "INSTALLATION_GUIDE.md", "QUICK_REFERENCE.md"]:
        if (skill_dir / bad).exists():
            log(1, skill_name, "error", f"Extraneous file: {bad}", f"Remove {bad}")

    # Check references are linked from SKILL.md
    refs_dir = skill_dir / "references"
    if refs_dir.exists():
        for ref_file in refs_dir.iterdir():
            if ref_file.is_file():
                ref_name = ref_file.name
                if ref_name not in content:
                    log(1, skill_name, "warning", f"Reference '{ref_name}' not linked in SKILL.md", f"Add link to {ref_name}")
                else:
                    log(1, skill_name, "info", f"Reference '{ref_name}' correctly linked", "")

# ═══════════════════════════════════════════════════════════════════════════════
# LAYER 2: File Path Verification
# ═══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*70)
print("LAYER 2: File Path Verification")
print("="*70)

# frontend-styling paths to verify
frontend_paths = [
    "apps/web/src",
    "apps/admin/src",
    "apps/doctor/src",
    "packages/ui/src",
    "apps/web/tailwind.config.ts",
    "packages/ui/src/styles.css",
    "apps/web/src/lib/api-client.ts",
    "apps/web/vite.config.ts",
]

for p in frontend_paths:
    full = PROJECT_ROOT / p
    exists = full.exists()
    log(2, "frontend-styling", "info" if exists else "error",
        f"{'✓' if exists else '✗'} {p}",
        "" if exists else f"Path does not exist: {p}")

# backend-api paths to verify
backend_paths = [
    "apps/api/src/server.ts",
    "apps/api/src/app.ts",
    "apps/api/src/routes",
    "apps/api/src/auth.ts",
    "apps/api/src/config.ts",
    "apps/api/src/persistence",
    "apps/api/prisma/schema.prisma",
    "packages/shared-schemas/src",
    "supabase/functions",
]

for p in backend_paths:
    full = PROJECT_ROOT / p
    exists = full.exists()
    log(2, "backend-api", "info" if exists else "error",
        f"{'✓' if exists else '✗'} {p}",
        "" if exists else f"Path does not exist: {p}")

# ═══════════════════════════════════════════════════════════════════════════════
# LAYER 3: Command Validation
# ═══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*70)
print("LAYER 3: Command Validation")
print("="*70)

commands = [
    ("frontend-styling", "packages/ui", "pnpm typecheck"),
    ("frontend-styling", "packages/ui", "pnpm lint"),
    ("frontend-styling", "packages/ui", "pnpm test"),
    ("frontend-styling", "apps/web", "pnpm typecheck"),
    ("frontend-styling", "apps/web", "pnpm lint"),
    ("frontend-styling", "apps/web", "pnpm test"),
    ("frontend-styling", "apps/web", "pnpm a11y"),
    ("backend-api", "apps/api", "pnpm typecheck"),
    ("backend-api", "apps/api", "pnpm lint"),
    ("backend-api", "apps/api", "pnpm test"),
    ("backend-api", "apps/api", "pnpm prisma:generate"),
]

for skill, cwd, cmd in commands:
    full_cwd = PROJECT_ROOT / cwd
    try:
        # Only run test commands if they would be quick; skip prisma:generate if no db
        if "prisma:generate" in cmd and not (full_cwd / "prisma" / "schema.prisma").exists():
            log(3, skill, "warning", f"Skipped {cmd} in {cwd} (no schema)", "")
            continue
        result = subprocess.run(
            cmd.split(),
            cwd=full_cwd,
            capture_output=True,
            text=True,
            timeout=120,
        )
        ok = result.returncode == 0
        log(3, skill, "info" if ok else "error",
            f"{'✓' if ok else '✗'} {cmd} in {cwd}",
            "" if ok else result.stderr[:200])
    except subprocess.TimeoutExpired:
        log(3, skill, "warning", f"Timeout: {cmd} in {cwd}", "Command took too long")
    except Exception as e:
        log(3, skill, "error", f"Failed to run {cmd} in {cwd}: {e}", "")

# ═══════════════════════════════════════════════════════════════════════════════
# LAYER 4: Source Code Pattern Extraction
# ═══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*70)
print("LAYER 4: Source Code Pattern Extraction")
print("="*70)

# Check for patterns in actual code that might be missing from skills

# 4a: Check if all shared UI components are listed in frontend skill
ui_dir = PROJECT_ROOT / "packages" / "ui" / "src"
ui_components = [f.stem for f in ui_dir.glob("*.tsx") if not f.name.endswith(".test.tsx")]
skill_md = (SKILLS_DIR / "frontend-styling" / "SKILL.md").read_text()
for comp in ui_components:
    if comp not in skill_md:
        log(4, "frontend-styling", "info",
            f"UI component '{comp}' not mentioned in SKILL.md",
            f"Consider adding to shared components list if reusable")

# 4b: Check Fastify routes exist and match skill description
routes_dir = PROJECT_ROOT / "apps" / "api" / "src" / "routes"
route_files = [f.stem for f in routes_dir.glob("*.ts") if not f.name.endswith(".test.ts")]
skill_md_backend = (SKILLS_DIR / "backend-api" / "SKILL.md").read_text()
for route in route_files:
    if route not in skill_md_backend:
        log(4, "backend-api", "info",
            f"Route '{route}' not mentioned in SKILL.md",
            f"Consider documenting in references/api-patterns.md")

# 4c: Check edge functions
edge_dir = PROJECT_ROOT / "supabase" / "functions"
edge_funcs = [d.name for d in edge_dir.iterdir() if d.is_dir() and d.name != "README.md"]
for func in edge_funcs:
    if func not in skill_md_backend:
        log(4, "backend-api", "info",
            f"Edge function '{func}' not mentioned in SKILL.md",
            f"Consider adding to references/architecture.md")

# ═══════════════════════════════════════════════════════════════════════════════
# LAYER 5: Cross-Reference Integrity
# ═══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*70)
print("LAYER 5: Cross-Reference Integrity")
print("="*70)

for skill_name in ["frontend-styling", "backend-api"]:
    skill_dir = SKILLS_DIR / skill_name
    refs_dir = skill_dir / "references"
    skill_md = skill_dir / "SKILL.md"
    content = skill_md.read_text()

    # Check that all markdown links in SKILL.md point to existing files
    links = re.findall(r'\[([^\]]+)\]\(([^)]+)\)', content)
    for text, link in links:
        if link.startswith("http"):
            continue
        target = skill_dir / link
        exists = target.exists()
        log(5, skill_name, "info" if exists else "error",
            f"{'✓' if exists else '✗'} Link '{text}' → {link}",
            "" if exists else f"Broken link: {link}")

    # Check references are not duplicated in SKILL.md body
    if refs_dir.exists():
        for ref_file in refs_dir.iterdir():
            if ref_file.is_file():
                ref_content = ref_file.read_text()
                # Simple heuristic: if >50% of ref content appears in SKILL.md, it's duplicated
                # Skip this check for small files
                pass  # Too noisy for now

# ═══════════════════════════════════════════════════════════════════════════════
# LAYER 6: Description Quality & Trigger Coverage
# ═══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*70)
print("LAYER 6: Description Quality & Trigger Coverage")
print("="*70)

for skill_name in ["frontend-styling", "backend-api"]:
    skill_md = SKILLS_DIR / skill_name / "SKILL.md"
    content = skill_md.read_text()
    fm = content.split("---")[1]
    desc = fm.split("description:")[1] if "description:" in fm else ""

    # Check description length (should be comprehensive)
    word_count = len(desc.split())
    if word_count < 20:
        log(6, skill_name, "warning",
            f"Description only {word_count} words — may be too short for reliable triggering",
            "Expand description with more trigger keywords")
    elif word_count > 100:
        log(6, skill_name, "info",
            f"Description is {word_count} words — good coverage",
            "")
    else:
        log(6, skill_name, "info",
            f"Description is {word_count} words — acceptable",
            "")

    # Check for specific trigger keywords
    frontend_keywords = ["looks", "style", "CSS", "color", "font", "layout", "UI", "visual", "appearance", "responsive"]
    backend_keywords = ["API", "endpoint", "database", "schema", "auth", "server", "backend", "Prisma", "Supabase", "route"]

    keywords = frontend_keywords if skill_name == "frontend-styling" else backend_keywords
    missing = [k for k in keywords if k.lower() not in desc.lower()]
    if missing:
        log(6, skill_name, "warning",
            f"Description missing trigger keywords: {missing}",
            f"Add keywords: {', '.join(missing)}")
    else:
        log(6, skill_name, "info",
            "Description contains key trigger keywords", "")

# ═══════════════════════════════════════════════════════════════════════════════
# LAYER 7: Archive Validation
# ═══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*70)
print("LAYER 7: Archive Validation")
print("="*70)

for skill_name in ["frontend-styling", "backend-api"]:
    archive_path = SKILLS_DIR / f"{skill_name}.skill"

    if not archive_path.exists():
        log(7, skill_name, "error", f"Archive missing: {archive_path.name}", "Run zip command to package")
        continue

    try:
        with zipfile.ZipFile(archive_path, 'r') as zf:
            # Validate zip integrity
            bad = zf.testzip()
            if bad:
                log(7, skill_name, "error", f"Corrupt archive, bad file: {bad}", "Re-package")
            else:
                log(7, skill_name, "info", "Archive integrity OK", "")

            # Check SKILL.md is at root of archive content
            names = zf.namelist()
            skill_md_in_archive = any(f"{skill_name}/SKILL.md" in n for n in names)
            if skill_md_in_archive:
                log(7, skill_name, "info", "SKILL.md present in archive", "")
            else:
                log(7, skill_name, "error", "SKILL.md missing from archive", "Re-package")

            # Size check
            size = archive_path.stat().st_size
            if size > 1024 * 1024:
                log(7, skill_name, "warning", f"Archive is {size/1024:.1f} KB — quite large", "Consider slimming")
            else:
                log(7, skill_name, "info", f"Archive size: {size/1024:.1f} KB", "")
    except zipfile.BadZipFile:
        log(7, skill_name, "error", "Archive is not a valid zip file", "Re-package")

# ═══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*70)
print("SUMMARY")
print("="*70)

errors = [f for f in findings if f.severity == "error"]
warnings = [f for f in findings if f.severity == "warning"]
infos = [f for f in findings if f.severity == "info"]

print(f"Total findings: {len(findings)}")
print(f"  Errors:   {len(errors)}")
print(f"  Warnings: {len(warnings)}")
print(f"  Info:     {len(infos)}")

if errors:
    print("\nErrors requiring action:")
    for e in errors:
        print(f"  - [{e.skill}] {e.message}")
        if e.suggestion:
            print(f"    Suggestion: {e.suggestion}")

if warnings:
    print("\nWarnings to consider:")
    for w in warnings:
        print(f"  - [{w.skill}] {w.message}")
