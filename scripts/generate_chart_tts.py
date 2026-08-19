import base64
import json
import os
from pathlib import Path
import requests

TEXT = "下面用同一组示例数据展示多系列图表。Gemini在逻辑推理、代码生成、多模态和长文本四项上的评分分别为87分、84分、95分和94分；GPT对应评分分别为94分、96分、89分和92分。首先使用分组柱状图呈现，再使用多系列折线图呈现。两种图表共用完全相同的数据参数，只需要切换图表类型。"
repo = Path(__file__).resolve().parents[1]
config = json.loads((Path.home() / ".story-claw" / "tts_config.json").read_text(encoding="utf-8"))
for key in ("HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"): os.environ.pop(key, None)
payload = {"user":{"uid":"story-claw-templates"},"req_params":{"text":TEXT,"speaker":config["narrator_voice"],"audio_params":{"format":"mp3","sample_rate":24000,"enable_timestamp":True},"additions":json.dumps({"disable_markdown_filter":True})}}
headers = {"X-Api-Key":config["api_key"],"X-Api-Resource-Id":config["resource_id"],"Content-Type":"application/json"}
response = requests.post(config["base_url"],headers=headers,json=payload,timeout=90,proxies={"http":None,"https":None}); response.raise_for_status()
chunks, words = [], []
for raw in response.text.splitlines():
    try: item=json.loads(raw.strip())
    except (ValueError,TypeError): continue
    if item.get("data") and isinstance(item["data"],str): chunks.append(base64.b64decode(item["data"]))
    words.extend((item.get("sentence") or {}).get("words") or [])
if not chunks: raise RuntimeError("TTS API returned no audio")
(repo/"public").mkdir(exist_ok=True)
(repo/"public"/"multi-series-chart-narration.mp3").write_bytes(b"".join(chunks))
(repo/"examples"/"multi-series-chart.timestamps.json").write_text(json.dumps({"text":TEXT,"words":words},ensure_ascii=False,indent=2),encoding="utf-8")
print(f"words={len(words)}")
