from pathlib import Path
import json, os, time
os.environ['HF_HUB_DISABLE_XET'] = '1'
import wave, numpy as np
from faster_whisper import WhisperModel, BatchedInferencePipeline
base = Path(__file__).resolve().parent
print('Loading model', flush=True)
model = WhisperModel('small', device='cpu', compute_type='int8', cpu_threads=4, download_root=str(base / 'models'))
model = BatchedInferencePipeline(model=model)
print('Transcribing', flush=True)
with wave.open(str(base/'audio.wav')) as wav:
    audio = np.frombuffer(wav.readframes(wav.getnframes()), dtype=np.int16).astype(np.float32)/32768
segments, info = model.transcribe(audio, language='ru', beam_size=5, vad_filter=True, batch_size=8)
rows=[]
def stamp(t):
    return f'{int(t)//60:02d}:{int(t)%60:02d}'
with (base/'transcript-raw.txt').open('w',encoding='utf-8') as f:
    for s in segments:
        row={'start':s.start,'end':s.end,'text':s.text,'avg_logprob':s.avg_logprob}
        rows.append(row)
        line=f'[{stamp(s.start)}–{stamp(s.end)}] {s.text.strip()}'
        f.write(line+'\n'); f.flush()
        print(line,flush=True)
(base/'segments.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
print('DONE',info.duration,flush=True)


