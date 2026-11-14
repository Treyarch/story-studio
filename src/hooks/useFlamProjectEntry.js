import { createFlamProject } from '../store/flamAdventure/project.js';
import { createAdventureDocument } from '../store/flamAdventure/document.js';
import { createExampleAdventure } from '../store/flamAdventure/example.js';

export function useFlamProjectEntry({ store, runFunnelLanding, savedSnapshotRef, setMediaLibraryPaths }) {
  return async function startFlamProject({ example = false } = {}) {
    await runFunnelLanding('flam', async () => {
      const document = example ? createExampleAdventure() : createAdventureDocument();
      store.loadProject(createFlamProject({ document, projectName: document.title }));
      savedSnapshotRef.current = null;
      store.markPristine();
      store.setMediaTags({});
      setMediaLibraryPaths([]);
    }, { applyProjectType: false, errorLog: 'flam:create-error' });
  };
}
