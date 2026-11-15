from pathlib import Path
import subprocess,time,json
import numpy as np
from scipy.signal import resample_poly
import sherpa_onnx as s
import soundfile as sf
M=Path('/home/mathieu/.local/share/story-studio-voix/modeles')
R=Path('/home/mathieu/Documents/story-studio/voix-donjons-dragons')
p=Path('/home/mathieu/Documents/story-studio/transcriptions-donjons-dragons/dans-les-bas-fonds-deauprofonde/scenes/A18.json')
d=json.loads(p.read_text())
x=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',d['audio'],'-t','60','-f','f32le','-ar','44100','-ac','2','-']),np.float32).reshape(-1,2)
sep=s.OfflineSourceSeparation(s.OfflineSourceSeparationConfig(model=s.OfflineSourceSeparationModelConfig(spleeter=s.OfflineSourceSeparationSpleeterModelConfig(vocals=str(M/'sherpa-onnx-spleeter-2stems-fp16/vocals.fp16.onnx'),accompaniment=str(M/'sherpa-onnx-spleeter-2stems-fp16/accompaniment.fp16.onnx')),num_threads=2)))
t=time.monotonic();o=sep.process(sample_rate=44100,samples=np.ascontiguousarray(x.T));print('séparation',time.monotonic()-t,flush=True)
v=o.stems[0].data.T
sf.write(R/'essai-A18-original.wav',x,44100,subtype='PCM_16')
sf.write(R/'essai-A18-voix.wav',v,44100,subtype='PCM_16')
a=resample_poly(v.mean(axis=1),160,441).astype(np.float32)
cfg=s.OfflineSpeakerDiarizationConfig(segmentation=s.OfflineSpeakerSegmentationModelConfig(pyannote=s.OfflineSpeakerSegmentationPyannoteModelConfig(model=str(M/'sherpa-onnx-pyannote-segmentation-3-0/model.onnx'),window_shift_ratio=.5),num_threads=2),embedding=s.SpeakerEmbeddingExtractorConfig(model=str(M/'wespeaker_en_voxceleb_resnet34_LM.onnx'),num_threads=2),clustering=s.FastClusteringConfig(num_clusters=-1,threshold=.5),min_duration_on=.4,min_duration_off=.2)
sd=s.OfflineSpeakerDiarization(cfg)
t=time.monotonic();turns=sd.process(a).sort_by_start_time(); print('diarisation',time.monotonic()-t,flush=True)
for turn in turns:print(turn.start,turn.end,turn.speaker)
