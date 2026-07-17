#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
rust_file=${TAURI_CONTRACT_RUST_FILE:-$repo_root/frontend/src-tauri/src/lib.rs}
ts_file=${TAURI_CONTRACT_TS_FILE:-$repo_root/frontend/src/lib/types/tauri.ts}
manifest=${TAURI_CONTRACT_MANIFEST:-$repo_root/frontend/src/lib/types/tauri-command-contract.json}
rust_types_file=${TAURI_CONTRACT_RUST_TYPES_FILE:-$repo_root/frontend/src-tauri/src/audio/types.rs}

python3 - "$rust_file" "$rust_types_file" "$ts_file" "$manifest" <<'PY'
import json, re, sys
rust_path, rust_types_path, ts_path, manifest_path = sys.argv[1:]
rust = open(rust_path).read()
rust_types = open(rust_types_path).read()
ts = open(ts_path).read()
contract = json.load(open(manifest_path))
expected = sorted(contract["commands"])

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

primitive = {"String":"string", "bool":"boolean", "f64":"number", "f32":"number", "u64":"number", "u32":"number", "usize":"number", "i8":"number"}
named = {"AudioRuntimeError":"TauriRuntimeError"}
def wire_type(value):
    value=re.sub(r"\s+","",value)
    if value.startswith("Option<") and value.endswith(">"):
        return wire_type(value[7:-1])+"|null"
    if value.startswith("Vec<") and value.endswith(">"):
        return wire_type(value[4:-1])+"[]"
    return primitive.get(value, named.get(value, "Tauri"+value))

for pair, fields in contract.get("dtos", {}).items():
    rust_name, ts_name = pair.split(":",1)
    rmatch=re.search(rf"pub struct {rust_name}\s*\{{(.*?)\n\}}",rust_types,re.S)
    if not rmatch: raise SystemExit(f"Rust DTO not found: {rust_name}")
    rust_fields=sorted(f"{n}:{wire_type(t)}" for n,t in re.findall(r"pub\s+(\w+):\s*([^,]+),",rmatch.group(1)))
    tmatch=re.search(rf"export interface {ts_name}\s*\{{(.*?)\n\}}",ts,re.S)
    if not tmatch: raise SystemExit(f"TypeScript DTO not found: {ts_name}")
    ts_fields=sorted(n+":"+re.sub(r"\s+","",t) for n,t in re.findall(r"^\s*(\w+):\s*([^;]+);",tmatch.group(1),re.M))
    wanted=sorted(fields)
    if rust_fields != wanted: raise SystemExit(f"Rust DTO field drift for {rust_name}: {rust_fields} != {wanted}")
    if ts_fields != wanted: raise SystemExit(f"TypeScript DTO field drift for {ts_name}: {ts_fields} != {wanted}")
print(f"Tauri contract aligned ({len(expected)} commands, {len(contract.get('dtos',{}))} DTOs).")
PY
