import raw from './model-manifest.json';

/** Gerado por tools/build-anatomy-model.mjs junto com assets/models/anatomy.glb. */
export type ModelManifest = {
  placeholder: boolean;
  attribution: string;
  availableMuscleIds: string[];
  missingMuscleIds: string[];
};

export const manifest = raw as unknown as ModelManifest;
