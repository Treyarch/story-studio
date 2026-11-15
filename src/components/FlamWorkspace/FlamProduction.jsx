import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import { diagnoseAdventureDocument } from '../../store/flamAdventure/diagnostics.js';
import { useCommonTranslation } from '../../i18n/commonPresentation.js';
import { useErrorDialog } from '../common/Dialog.jsx';
import { Button } from '../common/Button.jsx';

function failureText(code, t) {
  switch (code) {
    case 'InvalidDocument': return t('common:flam.production.failure.InvalidDocument');
    case 'InvalidPack': return t('common:flam.production.failure.InvalidPack');
    case 'MediaUnavailable': return t('common:flam.production.failure.MediaUnavailable');
    case 'AlreadyExists': return t('common:flam.production.failure.AlreadyExists');
    case 'UnsafePath': return t('common:flam.production.failure.UnsafePath');
    case 'UnsupportedDevice': return t('common:flam.production.failure.UnsupportedDevice');
    case 'DeviceChanged': return t('common:flam.production.failure.DeviceChanged');
    case 'RecoveryRequired': return t('common:flam.production.failure.RecoveryRequired');
    case 'Busy': return t('common:flam.production.failure.Busy');
    default: return t('common:flam.production.failure.Io');
  }
}

function progressText(step, t) {
  switch (step) {
    case 'media': return t('common:flam.production.step.media');
    case 'ready': return t('common:flam.production.step.ready');
    case 'copy': return t('common:flam.production.step.copy');
    case 'register': return t('common:flam.production.step.register');
    case 'installed': return t('common:flam.production.step.installed');
    default: return t('common:flam.production.step.verify');
  }
}

// Le pack prêt appartient à un instantané précis du document. Une modification
// ou un changement de projet exige une nouvelle génération avant installation.
export function FlamProduction({ document }) {
  const { t } = useCommonTranslation();
  const { showErrorDialog, showConfirmDialog } = useErrorDialog();
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(null);
  const [ready, setReady] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const active = useRef(false);
  const alive = useRef(true);
  const revision = JSON.stringify(document);
  const blocked = diagnoseAdventureDocument(document).some(d => d.severity === 'error');
  const current = ready?.revision === revision ? ready : null;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (active.current) void invoke('cancel_flam_authoring').catch(() => {});
    };
  }, []);

  async function run(action) {
    if (active.current) return;
    active.current = true;
    setBusy(true);
    setStep('verify');
    setReceipt(null);
    let unlisten;
    try {
      unlisten = await listen('flam-authoring-progress', event => {
        if (alive.current) setStep(event.payload);
      });
      await action();
    } catch (error) {
      if (alive.current) {
        setStep(null);
        if (error?.code !== 'Cancelled') showErrorDialog({
          get title() { return t('common:flam.production.error'); },
          get message() { return failureText(error?.code, t); },
        });
      }
    } finally {
      unlisten?.();
      active.current = false;
      if (alive.current) setBusy(false);
    }
  }

  async function generate() {
    // Réserver le geste avant les dialogues natifs évite deux générations.
    await run(async () => {
      const outputFolder = await open({ directory: true, multiple: false, title: t('common:flam.production.output') });
      if (!outputFolder || !alive.current) { setStep(null); return; }
      setReady(null);
      const packFolder = await invoke('generate_flam_adventure', { document, outputFolder });
      if (alive.current) setReady({ revision, packFolder });
    });
  }

  async function install() {
    if (!current) return;
    await run(async () => {
      const deviceRoot = await open({ directory: true, multiple: false, title: t('common:flam.production.device') });
      if (!deviceRoot || !alive.current) { setStep(null); return; }
      const accepted = await showConfirmDialog({
        get title() { return t('common:flam.production.install'); },
        get message() { return t('common:flam.production.confirm', { title: document.title, device: deviceRoot }); },
      });
      if (!accepted || !alive.current) { setStep(null); return; }
      const result = await invoke('install_flam_adventure', { packFolder: current.packFolder, deviceRoot });
      if (alive.current) setReceipt(result.backupPath);
    });
  }

  return <section className="flam-card flam-production" aria-label={t('common:flam.production.title')}>
    <h2>{t('common:flam.production.title')}</h2>
    <p>{t('common:flam.production.help')}</p>
    <Button disabled={busy || blocked} onClick={generate}>{t('common:flam.production.generate')}</Button>
    <Button disabled={busy || !current} onClick={install}>{t('common:flam.production.install')}</Button>
    {busy && <Button onClick={() => void invoke('cancel_flam_authoring').catch(() => {})}>{t('common:dialog.cancel.label')}</Button>}
    <div role="status" aria-live="polite">
      {step && <p>{progressText(step, t)}</p>}
      {current && <p>{t('common:flam.production.pack', { path: current.packFolder })}</p>}
      {receipt && <p>{t('common:flam.production.receipt', { path: receipt })}</p>}
    </div>
  </section>;
}
