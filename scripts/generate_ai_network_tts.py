import base64
import json
import os
from pathlib import Path

import requests

TEXT = "当前人工智能产业的核心关系，可以从六家公司看清楚。OpenAI与微软深度合作，微软既是重要投资方，也通过Azure提供云计算资源。Anthropic则同时连接亚马逊和谷歌：亚马逊是重要投资方和云计算伙伴，谷歌也投资了Anthropic，并提供Google Cloud基础设施。英伟达位于这些公司的共同上游，它提供训练和推理所需的GPU，并通过微软、亚马逊和谷歌的云平台触达开发者。与此同时，OpenAI与Anthropic在前沿模型市场直接竞争，微软、亚马逊和谷歌也在云端人工智能服务上彼此竞争。因此，这不是一条简单产业链，而是一张同时包含投资、云服务、芯片供应与市场竞争的关系网络。"

repo = Path(__file__).resolve().parents[1]
config = json.loads((Path.home() / ".story-claw" / "tts_config.json").read_text(encoding="utf-8"))
for key in ("HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"):
    os.environ.pop(key, None)

payload = {
    "user": {"uid": "story-claw-templates"},
    "req_params": {
        "text": TEXT,
        "speaker": config["narrator_voice"],
        "audio_params": {"format": "mp3", "sample_rate": 24000, "enable_timestamp": True},
        "additions": json.dumps({"disable_markdown_filter": True}),
    },
}
headers = {
    "X-Api-Key": config["api_key"],
    "X-Api-Resource-Id": config["resource_id"],
    "Content-Type": "application/json",
}
response = requests.post(config["base_url"], headers=headers, json=payload, timeout=90, proxies={"http": None, "https": None})
response.raise_for_status()

chunks = []
words = []
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

public_dir = repo / "public"
public_dir.mkdir(exist_ok=True)
(public_dir / "ai-company-network-narration.mp3").write_bytes(b"".join(chunks))
(repo / "examples" / "ai-company-network.timestamps.json").write_text(
    json.dumps({"text": TEXT, "words": words}, ensure_ascii=False, indent=2), encoding="utf-8"
)
print(f"audio={public_dir / 'ai-company-network-narration.mp3'}")
print(f"words={len(words)}")
