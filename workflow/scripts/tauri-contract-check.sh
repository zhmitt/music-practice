#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
rust_file=${TAURI_CONTRACT_RUST_FILE:-$repo_root/frontend/src-tauri/src/lib.rs}
ts_file=${TAURI_CONTRACT_TS_FILE:-$repo_root/frontend/src/lib/types/tauri.ts}
manifest=${TAURI_CONTRACT_MANIFEST:-$repo_root/frontend/src/lib/types/tauri-command-contract.json}

python3 - "$rust_file" "$ts_file" "$manifest" <<'PY'
import json, re, sys
rust_path, ts_path, manifest_path = sys.argv[1:]
rust = open(rust_path).read()
ts = open(ts_path).read()
expected = sorted(json.load(open(manifest_path))["commands"])

def camel(name):
    head, *tail = name.split("_")
    return head + "".join(x.title() for x in tail)

types = {
    "String": "string", "Option<String>": "string|null", "f64": "number",
    "i8": "number", "()": "void", "bool": "boolean",
    "Vec<AudioDeviceInfo>": "TauriAudioDeviceInfo[]",
    "Option<PitchResult>": "TauriPitchResult|null", "PitchResult": "TauriPitchResult",
    "AudioLevel": "TauriAudioLevel", "AudioDebugSnapshot": "TauriAudioDebugSnapshot",
    "DroneRuntimeStatus": "TauriDroneRuntimeStatus",
}

def split_args(value):
    result, current, depth = [], [], 0
    for char in value:
        depth += char in "<({["
        depth -= char in ">)}]"
        if char == "," and depth == 0:
            result.append("".join(current).strip()); current = []
        else: current.append(char)
    if "".join(current).strip(): result.append("".join(current).strip())
    return result

rust_signatures = []
rust_by_name = {}
pattern = re.compile(r"#\[tauri::command\]\s*fn\s+(\w+)\s*\((.*?)\)\s*->\s*Result<(.+?),\s*String>\s*\{", re.S)
for name, raw_args, result_type in pattern.findall(rust):
    args = []
    for arg in split_args(raw_args):
        if "State<" in arg: continue
        arg_name, arg_type = [x.strip() for x in arg.split(":", 1)]
        if arg_type not in types: raise SystemExit(f"Unmapped Rust argument type: {arg_type}")
        args.append(f"{camel(arg_name)}:{types[arg_type]}")
    result_type = re.sub(r"\s+", "", result_type)
    if result_type not in types: raise SystemExit(f"Unmapped Rust result type: {result_type}")
    signature = f"{name}({','.join(args)})->{types[result_type]}"
    if name in rust_by_name: raise SystemExit(f"Duplicate parsed Rust command: {name}")
    rust_by_name[name] = signature

handler_block = re.search(r"tauri::generate_handler!\[(.*?)\]", rust, re.S)
if not handler_block: raise SystemExit("tauri::generate_handler! inventory not found")
handlers = [x.strip() for x in handler_block.group(1).split(",") if x.strip()]
if len(handlers) != len(set(handlers)): raise SystemExit("Duplicate command in generate_handler inventory")
unparsed = sorted(set(handlers) - set(rust_by_name))
if unparsed:
    raise SystemExit("Exported handlers lack a supported signature: " + ", ".join(unparsed))
rust_signatures = [rust_by_name[name] for name in handlers]

block = re.search(r"export interface TauriCommandMap \{(.*?)\n\}", ts, re.S)
if not block: raise SystemExit("TauriCommandMap not found")
ts_signatures = []
entries, current, depth = [], [], 0
for line in block.group(1).splitlines():
    if not current and re.match(r"^  \w+:\s*\{", line):
        current = [line]
        depth = line.count("{") - line.count("}")
    elif current:
        current.append(line)
        depth += line.count("{") - line.count("}")
    if current and depth == 0:
        entries.append("\n".join(current)); current = []
entry_pattern = re.compile(r"^  (\w+):\s*\{\s*args:\s*(.*?);\s*result:\s*(.*?)\s*\};$", re.S)
for entry in entries:
    match = entry_pattern.match(entry)
    if not match: raise SystemExit(f"Could not parse TypeScript command entry:\n{entry}")
    name, raw_args, result = match.groups()
    raw_args = re.sub(r"\s+", "", raw_args)
    result = re.sub(r"\s+", "", result).rstrip(";")
    args = "" if raw_args == "undefined" else raw_args.removeprefix("{").removesuffix("}").replace(";", ",").rstrip(",")
    ts_signatures.append(f"{name}({args})->{result}")

def compare(label, actual):
    actual = sorted(actual)
    if actual != expected:
        import difflib
        sys.stderr.writelines(difflib.unified_diff(expected, actual, fromfile="manifest", tofile=label, lineterm="\n"))
        raise SystemExit(f"Tauri signature drift detected in {label}.")

compare("Rust", rust_signatures)
compare("TypeScript", ts_signatures)
print(f"Tauri signature contract is aligned ({len(expected)} commands).")
PY
