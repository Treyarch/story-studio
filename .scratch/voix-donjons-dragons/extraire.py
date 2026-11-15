#!/usr/bin/env python3
"""Préparer des références vocales provisoires, sans toucher aux copies FLAM."""
import argparse
import hashlib
import json
import math
import os
import subprocess
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

os.environ.setdefault('OMP_NUM_THREADS', '1')
os.environ.setdefault('OPENBLAS_NUM_THREADS', '1')
import numpy as np
import sherpa_onnx as so
import soundfile as sf
from scipy.signal import resample_poly

ROOT = Path('/home/mathieu/Documents/story-studio/voix-donjons-dragons')
TRANSCRIPTS = Path('/home/mathieu/Projects/story-studio/.scratch/transcriptions-donjons-dragons')
MODELS = Path('/home/mathieu/.local/share/story-studio-voix/modeles')
STORIES = ['sur-les-chemins-de-faerun', 'dans-les-bas-fonds-deauprofonde']
VERSION = 'spleeter-fp16-blocs40s-pyannote-w05-t04-wespeaker-resnet34lm-v2'
SEP = DIAR = EMB = None


def save(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    temp.replace(path)


def init_models():
    global SEP, DIAR, EMB
    ec = so.SpeakerEmbeddingExtractorConfig(
        model=str(MODELS/'wespeaker_en_voxceleb_resnet34_LM.onnx'), num_threads=1)
    SEP = so.OfflineSourceSeparation(so.OfflineSourceSeparationConfig(
        model=so.OfflineSourceSeparationModelConfig(
            spleeter=so.OfflineSourceSeparationSpleeterModelConfig(
                vocals=str(MODELS/'sherpa-onnx-spleeter-2stems-fp16/vocals.fp16.onnx'),
                accompaniment=str(MODELS/'sherpa-onnx-spleeter-2stems-fp16/accompaniment.fp16.onnx')),
            num_threads=1)))
    DIAR = so.OfflineSpeakerDiarization(so.OfflineSpeakerDiarizationConfig(
        segmentation=so.OfflineSpeakerSegmentationModelConfig(
            pyannote=so.OfflineSpeakerSegmentationPyannoteModelConfig(
                model=str(MODELS/'sherpa-onnx-pyannote-segmentation-3-0/model.onnx'),
                window_shift_ratio=.5), num_threads=1),
        embedding=ec, clustering=so.FastClusteringConfig(num_clusters=-1, threshold=.4),
        min_duration_on=.4, min_duration_off=.2))
    EMB = so.SpeakerEmbeddingExtractor(ec)


def embedding(audio):
    stream = EMB.create_stream()
    stream.accept_waveform(16000, np.ascontiguousarray(audio, dtype=np.float32))
    stream.input_finished()
    if not EMB.is_ready(stream):
        return None
    e = np.asarray(EMB.compute(stream), dtype=np.float32)
    if not np.isfinite(e).all() or np.linalg.norm(e) < 1e-8:
        return None
    return (e / np.linalg.norm(e)).tolist()


def decode(path, rate=44100, channels=2, start=None, duration=None):
    cmd = ['ffmpeg', '-v', 'error', '-nostdin']
    if start is not None:
        cmd += ['-ss', str(start)]
    cmd += ['-i', str(path)]
    if duration is not None:
        cmd += ['-t', str(duration)]
    cmd += ['-f', 'f32le', '-ar', str(rate), '-ac', str(channels), '-']
    p = subprocess.run(cmd, capture_output=True, check=True)
    return np.frombuffer(p.stdout, np.float32).reshape(-1, channels).copy()


def separate_in_blocks(x):
    # Borner la mémoire des spectrogrammes, avec 1 s de contexte de part et d'autre.
    block, padding = 40*44100, 44100
    voice = np.zeros(len(x),dtype=np.float32)
    background = np.zeros(len(x),dtype=np.float32)
    for start in range(0,len(x),block):
        end=min(start+block,len(x))
        left,right=max(0,start-padding),min(len(x),end+padding)
        # Spleeter arrondit la longueur de sortie au bloc FFT inférieur.
        # Ajouter du silence garantit que la partie utile est entièrement restituée.
        padded=np.pad(x[left:right],((0,2048),(0,0)))
        output=SEP.process(sample_rate=44100,samples=np.ascontiguousarray(padded.T))
        if output.sample_rate != 44100:
            raise ValueError(f'Fréquence inattendue : {output.sample_rate}')
        a,b=start-left,end-left
        voice[start:end]=output.stems[0].data[:,a:b].mean(axis=0)
        background[start:end]=output.stems[1].data[:,a:b].mean(axis=0)
    return voice,background


def process_scene(path_str):
    p = Path(path_str)
    story = p.parent.parent.name
    record = json.loads(p.read_text())
    audio = Path(record['audio'])
    signature = hashlib.sha256(p.read_bytes() + VERSION.encode() + audio.read_bytes()).hexdigest()
    target = ROOT/'analyse'/story/(p.stem+'.json')
    if target.exists():
        cached = json.loads(target.read_text())
        if cached.get('signature') == signature and Path(cached['vocals_cache']).exists():
            return {'story':story, 'scene':p.stem, 'cached':True, 'windows':len(cached['windows'])}
    started = time.monotonic()
    x = decode(audio)
    if len(x) < 4410:
        raise ValueError('Audio trop court ou vide')
    vocals,accompaniment = separate_in_blocks(x)
    clean16 = resample_poly(vocals, 16000, 44100).astype(np.float32)
    clean22 = resample_poly(vocals, 22050, 44100).astype(np.float32)
    cache = ROOT/'cache-voix'/story/(p.stem+'.flac')
    cache.parent.mkdir(parents=True, exist_ok=True)
    sf.write(cache, clean22, 22050, subtype='PCM_16')
    turns = [dict(start=float(t.start), end=float(t.end), speaker=int(t.speaker))
             for t in DIAR.process(clean16).sort_by_start_time()]
    # Regrouper uniquement les tours du même locuteur séparés de moins de 0,35 s.
    merged = []
    for turn in turns:
        if merged and turn['speaker'] == merged[-1]['speaker'] and 0 <= turn['start']-merged[-1]['end'] < .35:
            merged[-1]['end'] = turn['end']
        else:
            merged.append(turn.copy())
    windows = []
    for turn in merged:
        start, end = turn['start']+.12, min(turn['end']-.12, len(clean16)/16000)
        # Les tours courts restent dans le manifeste, mais ne deviennent pas une référence XTTS.
        if end-start < 2.5:
            continue
        # Éviter les chevauchements et conserver des fenêtres modestes (max. 10 s).
        cuts = [start]
        while end-cuts[-1] > 10:
            candidates = [s['end']+.08 for s in record['segments']
                          if cuts[-1]+6 <= s['end']+.08 <= min(end-2.5, cuts[-1]+10)]
            cuts.append(max(candidates) if candidates else cuts[-1]+8)
        cuts.append(end)
        for a,b in zip(cuts,cuts[1:]):
            if b-a < 2.5:
                continue
            if any(a-.5 < seam < b+.5 for seam in range(40,math.ceil(len(x)/44100),40)):
                continue
            if any(t['speaker'] != turn['speaker'] and min(b,t['end'])-max(a,t['start']) > .05 for t in turns):
                continue
            segment = clean16[int(a*16000):int(b*16000)]
            vec = embedding(segment)
            if vec is None:
                continue
            indexes = [i for i,s in enumerate(record['segments']) if min(b,s['end'])-max(a,s['start']) > .2]
            context = ' '.join(record['segments'][i]['text'].strip() for i in indexes)
            l,r = int(a*44100), int(b*44100)
            # Ce rapport estime l'énergie retirée ; ce n'est pas une mesure de musique résiduelle.
            vocal_rms = float(np.sqrt(np.mean(vocals[l:r]**2)+1e-12))
            background_rms = float(np.sqrt(np.mean(accompaniment[l:r]**2)+1e-12))
            ratio = 20*math.log10(background_rms/vocal_rms)
            mixed = x[int(a*44100):int(b*44100)]
            source_clip_fraction = float(np.mean(np.abs(mixed) >= .999)) if len(mixed) else 1.
            windows.append(dict(start=round(a,4),end=round(b,4),local_speaker=turn['speaker'],
                embedding=vec,context=context,transcript_segments=indexes,
                removed_background_db=round(ratio,2),source_clipping_fraction=source_clip_fraction,
                rms=round(vocal_rms,6),duration=round(b-a,4)))
    save(target,dict(version=VERSION,signature=signature,story=story,scene=p.stem,
        audio=str(audio),transcript=str(p),vocals_cache=str(cache),turns=turns,windows=windows,
        duration=len(x)/44100,elapsed=round(time.monotonic()-started,2)))
    return dict(story=story,scene=p.stem,windows=len(windows),elapsed=round(time.monotonic()-started,2))


def run(args):
    paths = [p for story in STORIES for p in sorted((TRANSCRIPTS/story/'scenes').glob('*.json'))]
    if args.limit:
        paths = paths[:args.limit]
    state = dict(status='en_cours',phase='separation_et_diarisation',total=len(paths),completed=0,errors=[])
    save(ROOT/'etat.json',state)
    with ProcessPoolExecutor(max_workers=args.workers, initializer=init_models) as pool:
        futures = {pool.submit(process_scene,str(p)):p for p in paths}
        for future in as_completed(futures):
            p = futures[future]
            try:
                result = future.result()
                state['completed'] += 1
                print(f"[{state['completed']}/{len(paths)}] {result}",flush=True)
            except Exception as exc:
                state['errors'].append(dict(path=str(p),error=str(exc)))
                print(f'ERREUR {p}: {exc}',flush=True)
            save(ROOT/'etat.json',state)
    state.update(status='analyse_terminee_avec_erreurs' if state['errors'] else 'analyse_terminee')
    save(ROOT/'etat.json',state)
    if not args.limit and not state['errors']:
        state.update(phase='regroupement_et_export')
        save(ROOT/'etat.json',state)
        import cataloguer
        cataloguer.main(argparse.Namespace(threshold=.23))
        state.update(status='echantillons_prets_a_ecouter',phase='termine')
        save(ROOT/'etat.json',state)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--workers',type=int,default=4)
    parser.add_argument('--limit',type=int)
    run(parser.parse_args())
