import re, io

PATH = "src/data/grammar.js"
with io.open(PATH, encoding="utf-8") as f:
    lines = f.readlines()

q_re = re.compile(r'^(\s*\{id:")(g\d+)(".*)$')

used = set()
seen_full = set()
next_free = 409
dropped = 0
renumbered = []
out = []

for ln in lines:
    m = q_re.match(ln.rstrip("\n"))
    if not m:
        out.append(ln); continue
    indent, gid, rest = m.group(1), m.group(2), m.group(3)
    full = ln.strip()
    if full in seen_full:
        dropped += 1          # exact-content duplicate -> drop the line entirely
        continue
    seen_full.add(full)
    if gid in used:
        newid = "g%d" % next_free
        while newid in used:
            next_free += 1; newid = "g%d" % next_free
        renumbered.append((gid, newid))
        next_free += 1
        used.add(newid)
        out.append(indent + newid + rest + "\n")
    else:
        used.add(gid)
        out.append(ln)

with io.open(PATH, "w", encoding="utf-8", newline="\n") as f:
    f.writelines(out)

print("dropped exact-duplicate lines:", dropped)
print("renumbered collisions:", len(renumbered))
print("  e.g.", renumbered[:6])
print("final unique question ids:", len([x for x in used]))
