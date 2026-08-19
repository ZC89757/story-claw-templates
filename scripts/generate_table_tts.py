import base64
import json
import os
from pathlib import Path

import requests

TEXT = "总体来看，Gemini的优势在于多模态处理、超长文本理解以及与Google搜索、Workspace等生态的结合，适合资料整合、办公协作和处理图片、视频等复杂内容；GPT则通常在逻辑推理、代码生成、长文本写作、对话连贯性和工具调用方面表现突出，适合创作、编程和复杂任务处理。两者的不足是都可能产生事实错误或幻觉，Gemini不同版本之间的表现差异较明显，GPT部分高级功能可能受订阅、额度或联网能力限制，因此实际选择应根据任务类型、生态需求、价格和具体版本来判断。"
repo = Path(__file__).resolve().parents[1]
config = json.loads((Path.home() / ".story-claw" / "tts_config.json").read_text(encoding="utf-8"))
for key in ("HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"):
    os.environ.pop(key, None)
payload = {"user": {"uid": "story-claw-templates"}, "req_params": {"text": TEXT, "speaker": config["narrator_voice"], "audio_params": {"format": "mp3", "sample_rate": 24000, "enable_timestamp": True}, "additions": json.dumps({"disable_markdown_filter": True})}}
headers = {"X-Api-Key": config["api_key"], "X-Api-Resource-Id": config["resource_id"], "Content-Type": "application/json"}
response = requests.post(config["base_url"], headers=headers, json=payload, timeout=90, proxies={"http": None, "https": None})
response.raise_for_status()
chunks, words = [], []
for raw_line in response.text.splitlines():
    try:
        item = json.loads(raw_line.strip())
    except (ValueError, TypeError):
        continue
    if item.get("data") and isinstance(item["data"], str):
        chunks.append(base64.b64decode(item["data"]))
    words.extend((item.get("sentence") or {}).get("words") or [])
if not chunks:
    raise RuntimeError("TTS API returned no audio")
(repo / "public").mkdir(exist_ok=True)
(repo / "public" / "gemini-gpt-table-narration.mp3").write_bytes(b"".join(chunks))
(repo / "examples" / "gemini-gpt-table.timestamps.json").write_text(json.dumps({"text": TEXT, "words": words}, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"words={len(words)}")
