import json
from pathlib import Path
import numpy as np
import sherpa_onnx as s
import soundfile as sf
from scipy.signal import resample_poly
M=Path('/home/mathieu/.local/share/story-studio-voix/modeles')
x,sr=sf.read('/home/mathieu/Documents/story-studio/voix-donjons-dragons/essai-A18-voix.wav',dtype='float32')
x=resample_poly(x.mean(axis=1),160,441).astype('float32')
e=s.SpeakerEmbeddingExtractor(s.SpeakerEmbeddingExtractorConfig(model=str(M/'wespeaker_en_voxceleb_resnet34_LM.onnx'),num_threads=2))
d=json.loads(Path('/home/mathieu/Documents/story-studio/transcriptions-donjons-dragons/dans-les-bas-fonds-deauprofonde/scenes/A18.json').read_text())
rows=[]
for seg in d['segments']:
 if seg['end']-seg['start']<2:continue
 stream=e.create_stream();stream.accept_waveform(16000,x[int(seg['start']*16000):int(seg['end']*16000)]);stream.input_finished()
 if not e.is_ready(stream):continue
 z=np.array(e.compute(stream));z/=np.linalg.norm(z); rows.append(z)
 print(len(rows)-1,seg['text'])
print(np.round(np.array(rows)@np.array(rows).T,2))
for threshold in [.3,.4]:
 cfg=s.OfflineSpeakerDiarizationConfig(segmentation=s.OfflineSpeakerSegmentationModelConfig(pyannote=s.OfflineSpeakerSegmentationPyannoteModelConfig(model=str(M/'sherpa-onnx-pyannote-segmentation-3-0/model.onnx'),window_shift_ratio=.5),num_threads=2),embedding=s.SpeakerEmbeddingExtractorConfig(model=str(M/'wespeaker_en_voxceleb_resnet34_LM.onnx'),num_threads=2),clustering=s.FastClusteringConfig(num_clusters=-1,threshold=threshold),min_duration_on=.4,min_duration_off=.2)
 print('SEUIL',threshold)
 for t in s.OfflineSpeakerDiarization(cfg).process(x).sort_by_start_time():print(round(t.start,2),round(t.end,2),t.speaker)
