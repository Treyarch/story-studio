#!/usr/bin/env python3
"""Adaptateur XTTS local pour le protocole HTTP utilisé par Story Studio."""
import argparse
import hashlib
import json
import logging
import os
import threading
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

os.environ.setdefault('OMP_NUM_THREADS','8')
os.environ.setdefault('TOKENIZERS_PARALLELISM','false')
import numpy as np
import soundfile as sf
import torch
import uvicorn
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

ROOT=Path(__file__).resolve().parent
MODEL_DIR=ROOT/'models/xtts-v2'
MODEL=None
LOCK=threading.Lock()
CONDITIONING={}
LOGGER=logging.getLogger('xtts')


def bank():
    return json.loads((ROOT/'voice-bank.json').read_text())['voices']


def reference_paths(voice):
    entry=bank().get(voice)
    if entry is None:
        raise ValueError(f'Voix inconnue : {voice}')
    paths=[]
    for relative in entry['references']:
        path=(ROOT/relative).resolve()
        if not path.is_relative_to((ROOT/'voices').resolve()) or not path.is_file():
            raise ValueError('Référence absente ou extérieure au dossier voices')
        paths.append(path)
    if not paths:
        raise ValueError('Aucune référence pour cette voix')
    return paths


def conditioning(voice):
    paths=reference_paths(voice)
    digest=hashlib.sha256()
    for p in paths:
        digest.update(p.read_bytes())
    digest.update(str((MODEL_DIR/'model.pth').stat().st_mtime_ns).encode())
    digest.update(b'gpt12-chunk4-ref10-v1')
    key=(voice,digest.hexdigest())
    if key in CONDITIONING:
        return CONDITIONING[key]
    cache=ROOT/'conditioning'/f'{voice}-{key[1]}.npz'
    if cache.exists():
        with np.load(cache,allow_pickle=False) as data:
            pair=(torch.from_numpy(data['gpt'].copy()),torch.from_numpy(data['speaker'].copy()))
    else:
        pair=MODEL.get_conditioning_latents(audio_path=[str(p) for p in paths],
            max_ref_length=10,gpt_cond_len=12,gpt_cond_chunk_len=4,sound_norm_refs=False)
        cache.parent.mkdir(parents=True,exist_ok=True)
        np.savez_compressed(cache,gpt=pair[0].cpu().numpy(),speaker=pair[1].cpu().numpy())
    CONDITIONING[key]=pair
    return pair


@asynccontextmanager
async def lifespan(app):
    global MODEL
    from TTS.tts.configs.xtts_config import XttsConfig
    from TTS.tts.models.xtts import Xtts
    torch.set_num_threads(8)
    torch.set_num_interop_threads(1)
    cfg=XttsConfig()
    cfg.load_json(str(MODEL_DIR/'config.json'))
    MODEL=Xtts.init_from_config(cfg)
    MODEL.load_checkpoint(cfg,checkpoint_dir=str(MODEL_DIR),eval=True,use_deepspeed=False)
    MODEL.cpu().eval()
    (ROOT/'output').mkdir(parents=True,exist_ok=True)
    LOGGER.info('XTTS-v2 prêt sur CPU ; %d voix',len(bank()))
    yield


app=FastAPI(title='Story Studio — XTTS local',lifespan=lifespan)


@app.get('/health')
def health():
    return {'device':'cpu','model':'xtts-v2-donjons-dragons','voices':len(bank())}


@app.get('/voices')
@app.get('/api/voices')
def voices():
    return sorted(bank())


@app.get('/speakers')
@app.get('/api/speakers')
def speakers():
    return []


class Request(BaseModel):
    text:str=Field(min_length=1,max_length=10000)
    language:str='fr'
    voice:str|None=None
    speaker:str|None=None


@app.post('/tts')
def tts(request:Request):
    voice=request.voice or request.speaker or 'dd_narration_faerun'
    text=request.text.strip()
    if not text:
        return JSONResponse({'error':'Le texte est vide'},status_code=400)
    if request.language not in MODEL.config.languages:
        return JSONResponse({'error':'Langue non prise en charge'},status_code=400)
    if voice not in bank():
        return JSONResponse({'error':'Voix inconnue'},status_code=400)
    try:
        with LOCK,torch.inference_mode():
            gpt,speaker=conditioning(voice)
            output=MODEL.inference(text=text,language=request.language,gpt_cond_latent=gpt,
                speaker_embedding=speaker,temperature=.65,repetition_penalty=2.,
                top_k=50,top_p=.85,enable_text_splitting=True)
            wav=np.asarray(output['wav'],dtype=np.float32)
            if not len(wav) or not np.isfinite(wav).all():
                raise RuntimeError('Le modèle a produit un audio vide ou invalide')
            peak=float(np.max(np.abs(wav)))
            if peak>.99:
                wav=wav*(.99/peak)
            filename=f'{voice}--{uuid.uuid4().hex}.wav'
            sf.write(ROOT/'output'/filename,wav,24000,subtype='PCM_16')
        return {'file':filename}
    except Exception as exc:
        LOGGER.exception('Échec de génération XTTS')
        return JSONResponse({'error':str(exc)},status_code=500)


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--cpu',action='store_true',help='Compatibilité avec le démarrage Story Studio ; ce serveur utilise le CPU.')
    parser.add_argument('--port',type=int,default=8020)
    args=parser.parse_args()
    uvicorn.run(app,host='127.0.0.1',port=args.port)
