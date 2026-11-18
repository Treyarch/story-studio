import { useCommonTranslation } from '../../i18n/commonPresentation.js';
import { Button } from '../common/Button.jsx';
import { AudioField } from '../editors/AudioField.jsx';
import { ImageField } from '../editors/ImageField.jsx';
import { IllustrationModeField } from './IllustrationEditor.jsx';
import { CharacterEditor } from './CharacterEditor.jsx';
import { CollectionEditor } from './CollectionEditor.jsx';
import { ChoiceEditor } from './ChoiceEditor.jsx';
import { Field, ReferenceField, TextField } from './Fields.jsx';

// Les accès de consultation n'acceptent aucun effet ni destination narrative.
export function ScreenEditor({ screen, document, path, onPatch, onMedia, onAddCommand, onPatchChoice, onRemoveCommand, onEntryMedia, onLinkMedia, onAudioMedia, projectEpoch }) {
  const { t } = useCommonTranslation();
  const choices = new Map(document.choices.map(choice => [choice.id, choice]));
  const updateLink = (index, patch) => onPatch({ links: screen.links.map((link, i) => i === index ? { ...link, ...patch } : link) });
  const linkImage = (link, index) => screen.illustrationMode === 'selection' && <div data-flam-path={`${path}/links/${index}/image`}>
    <ImageField fieldId={`flam-menu-choice:${screen.id}:${link.id}`} label={t('common:flam.illustration.choiceImage')} file={link.image ?? null}
      onPick={source => onLinkMedia(link.id, source)} onClear={() => onLinkMedia(link.id, null)} />
  </div>;
  return <>
    <p>{screen.type === 'menu' ? t('common:flam.screens.menu') : screen.type === 'grid' ? t('common:flam.grid.title') : screen.type === 'character' ? t('common:flam.character.title') : t('common:flam.screens.detail')}</p>
    <TextField label={t('common:flam.screens.screenTitle')} path={`${path}/title`} value={screen.title} onChange={title => onPatch({ title })} />
    {screen.type === 'menu' && <IllustrationModeField value={screen.illustrationMode} path={`${path}/illustrationMode`} onChange={illustrationMode => onPatch({ illustrationMode })} />}
    {screen.type === 'detail' && <Field label={t('common:flam.detail.layout')} path={`${path}/layout`}>{id => <select id={`${id}-control`} aria-labelledby={id}
      value={screen.layout ?? 'split'} onChange={event => onPatch({ layout: event.target.value })}>
      <option value="split">{t('common:flam.detail.split')}</option>
      <option value="fullImage">{t('common:flam.detail.fullImage')}</option>
    </select>}</Field>}
    {screen.type === 'detail' && <Field label={t('common:flam.grid.contentSource')} path={`${path}/contentSource`}>{id => <select id={`${id}-control`} aria-labelledby={id}
      value={screen.contentSource ?? 'author'} onChange={event => onPatch({ contentSource: event.target.value })}>
      <option value="author">{t('common:flam.grid.author')}</option>
      <option value="item">{t('common:flam.grid.item')}</option>
    </select>}</Field>}
    {screen.type === 'grid' && <>
      <Field label={t('common:flam.collection.source')} path={`${path}/source`}>{id => <select id={`${id}-control`} aria-labelledby={id}
        value={screen.source} onChange={event => onPatch({ source: event.target.value, detailScreenId: null, entries: [] })}>
        <option value="inventory">{t('common:flam.grid.inventory')}</option>
        <option value="collection">{t('common:flam.collection.sourceEntries')}</option>
      </select>}</Field>
      {screen.source === 'collection' ? <CollectionEditor entries={screen.entries ?? []} document={document} path={`${path}/entries`}
        onChange={entries => onPatch({ entries })} onMedia={onEntryMedia} /> : <ReferenceField label={t('common:flam.grid.detail')} path={`${path}/detailScreenId`} value={screen.detailScreenId ?? null}
        entries={(document.screens ?? []).filter(entry => entry.type === 'detail' && entry.contentSource === 'item')} onChange={detailScreenId => onPatch({ detailScreenId })} />}
    </>}
    {screen.contentSource === 'item' && <p className="flam-hint">{t('common:flam.grid.itemHelp')}</p>}
    {screen.type !== 'grid' && screen.contentSource !== 'item' && <><TextField multiline label={t('common:flam.scene.text')} path={`${path}/text`} value={screen.text} onChange={text => onPatch({ text })} />
    <div data-flam-path={`${path}/image`}><ImageField fieldId={`flam-screen:${screen.id}`} label={screen.type === 'character' ? t('common:flam.character.portrait') : t('common:flam.scene.image')} file={screen.image}
      onPick={source => onMedia(source)} onClear={() => onPatch({ image: null })} /></div></>}
    {screen.type === 'character' && <CharacterEditor information={screen.information ?? []} document={document} path={`${path}/information`} onChange={information => onPatch({ information })} />}
    {screen.type === 'detail' && screen.contentSource !== 'item' && <div data-flam-path={`${path}/audio`}>
      <AudioField label={t('common:flam.scene.audio')} labelRef={{ key: 'common:flam.scene.audio' }} file={screen.audio ?? null} required={false}
        ttsTextSuggestion={screen.text} ttsFilenameHint={`fiche-${screen.id}`} xttsTarget={{ kind: 'flamScene', projectEpoch, apply: source => onAudioMedia(source) }}
        onPick={source => onAudioMedia(source)} onClear={() => onAudioMedia(null)} />
    </div>}
    {screen.type === 'menu' && <>
      <p className="flam-hint">{t('common:flam.screens.resumeHelp')}</p>
      {screen.links.map((link, index) => link.type === 'narrative' ? <section className="card flam-card" key={link.id}>
        <h4>{t('common:flam.screens.narrative')}</h4>
        {linkImage(link, index)}
        {choices.get(link.choiceId) ? <ChoiceEditor
          choice={choices.get(link.choiceId)} document={document}
          path={`/choices/${document.choices.findIndex(choice => choice.id === link.choiceId)}`}
          onPatch={patch => onPatchChoice(link.choiceId, patch)} onRemove={() => onRemoveCommand(link)} removeLabel={t('common:flam.screens.removeCommand')} />
          : <><ReferenceField label={t('common:flam.screens.command')} path={`${path}/links/${index}/choiceId`} value={link.choiceId}
            entries={document.choices} onChange={choiceId => updateLink(index, { choiceId })} />
            <Button onClick={() => onPatch({ links: screen.links.filter((_, i) => i !== index) })}>{t('common:flam.rule.remove')}</Button></>}
      </section> : <section className="card flam-card" key={link.id}>
        {linkImage(link, index)}
        <TextField label={t('common:flam.screens.link')} path={`${path}/links/${index}/label`} value={link.label} onChange={label => updateLink(index, { label })} />
        <ReferenceField label={t('common:flam.screens.target')} path={`${path}/links/${index}/screenId`} value={link.screenId}
          entries={(document.screens ?? []).filter(entry => entry.contentSource !== 'item')} onChange={screenId => updateLink(index, { screenId })} />
        <Button size="sm" onClick={() => onPatch({ links: screen.links.filter((_, i) => i !== index) })}>{t('common:flam.rule.remove')}</Button>
      </section>)}
      <Button onClick={onAddCommand}>{t('common:flam.screens.addCommand')}</Button>
      <Button onClick={() => onPatch({ links: [...screen.links, { id: crypto.randomUUID(), label: '', screenId: null }] })}>{t('common:flam.screens.addLink')}</Button>
    </>}
  </>;
}
