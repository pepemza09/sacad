#!/usr/bin/env python3
import fitz
import re
import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sacad.settings.development")

import django
django.setup()

from sacad.apps.nomenclador.models import Disciplina, Subdisciplina, Especialidad

# ── Parse PDF ─────────────────────────────────────────────────────
doc = fitz.open("/tmp/tabla.pdf")
text = ""
for page in doc:
    text += page.get_text()

lines = text.split("\n")

rows = []
i = 0
while i < len(lines):
    line = lines[i].strip()
    if not line or line.startswith("Tabla de") or line.startswith("DISCIPLINA"):
        i += 1
        continue

    if re.match(r"^[1-9]\d?$", line):
        disc = line
        j = i + 1
        while j < len(lines) and not lines[j].strip():
            j += 1
        if j >= len(lines):
            break
        sub_line = lines[j].strip()
        k = j + 1
        while k < len(lines) and not lines[k].strip():
            k += 1
        if k >= len(lines):
            break
        esp_line = lines[k].strip()
        l = k + 1
        while l < len(lines) and not lines[l].strip():
            l += 1
        if l >= len(lines):
            break
        desc_line = lines[l].strip()

        if (
            re.match(r"^[1-9]\d?$", disc)
            and re.match(r"^\d{2}$", sub_line)
            and re.match(r"^\d{2}$", esp_line)
        ):
            desc = desc_line
            desc = re.sub(r"\s+v\s*$", "", desc)
            desc = re.sub(r'"', "", desc)
            desc = re.sub(r"\s+", " ", desc).strip()
            if len(desc) > 2 and not desc.startswith("de "):
                rows.append((disc, sub_line, esp_line, desc))
                i = l + 1
                continue
    i += 1

print(f"Parsed {len(rows)} rows from PDF")

# ── Clear existing data ────────────────────────────────────────────
print("\nClearing existing nomenclador data...")
Especialidad.objects.all().delete()
Subdisciplina.objects.all().delete()
Disciplina.objects.all().delete()
print("Done.")

# ── Create Disciplinas (sub=00, esp=00) ────────────────────────────
disciplina_map = {}
for disc, sub, esp, desc in rows:
    if sub == "00" and esp == "00":
        d = Disciplina.objects.create(codigo=disc, descripcion=desc)
        disciplina_map[disc] = d
        print(f"  Disciplina {disc}: {desc}")

# ── Create Subdisciplinas (sub!=00, esp=00) ────────────────────────
subdisc_map = {}  # (disc, sub) -> Subdisciplina instance
for disc, sub, esp, desc in rows:
    if sub != "00" and esp == "00":
        parent = disciplina_map.get(disc)
        if not parent:
            print(f"  WARNING: No disciplina {disc} for sub {sub} {desc}")
            continue
        sd = Subdisciplina.objects.create(
            codigo=sub, descripcion=desc, disciplina=parent
        )
        subdisc_map[(disc, sub)] = sd
        print(f"  Subdisciplina {disc}.{sub}: {desc}")

# ── Create Especialidades (esp!=00) ────────────────────────────────
count = 0
for disc, sub, esp, desc in rows:
    if esp == "00":
        continue
    parent = subdisc_map.get((disc, sub))
    if not parent:
        # Try direct disciplina parent
        parent_disc = disciplina_map.get(disc)
        if parent_disc:
            # Create subdisciplina on the fly
            sd = Subdisciplina.objects.create(
                codigo=sub, descripcion=desc, disciplina=parent_disc
            )
            subdisc_map[(disc, sub)] = sd
            parent = sd
            print(f"  Auto-created Subdisciplina {disc}.{sub} for especialidad {desc}")
        else:
            print(f"  WARNING: No disciplina {disc} for espec {desc}")
            continue
    Especialidad.objects.create(
        codigo=esp, descripcion=desc, subdisciplina=parent
    )
    count += 1

print(f"\nCreated {count} especialidades")
print(
    f"Total: Disciplinas={Disciplina.objects.count()}, "
    f"Subdisciplinas={Subdisciplina.objects.count()}, "
    f"Especialidades={Especialidad.objects.count()}"
)
print("Done!")
