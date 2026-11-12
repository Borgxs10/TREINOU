import { useEffect, useState } from 'react';
import { Asset } from 'expo-asset';
import { parseGlb, type GlbNode } from '@/services/glbParser';

// Caminho relativo de propósito: require() de asset não passa pelo alias @/.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MODEL_MODULE: number = require('../../assets/models/anatomy.glb');

type State =
  | { status: 'loading' }
  | { status: 'ready'; nodes: GlbNode[] }
  | { status: 'error'; message: string };

export function useAnatomyModel(): State {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const asset = Asset.fromModule(MODEL_MODULE);
        await asset.downloadAsync();
        const response = await fetch(asset.localUri ?? asset.uri);
        const nodes = parseGlb(await response.arrayBuffer());
        if (!cancelled) setState({ status: 'ready', nodes });
      } catch (error) {
        console.error('Falha ao carregar o modelo anatômico', error);
        if (!cancelled) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Erro desconhecido.',
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
