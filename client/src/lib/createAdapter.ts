import { IframeAdapter } from './adapter';
import { VkAdapter } from './vkAdapter';
import { RUTUBE_PROTOCOL } from '@shared/protocol';
import type { PlayerAdapter } from './adapter';
import type { Provider } from '@shared/types';

export function createAdapter(provider: Provider, el: HTMLIFrameElement): PlayerAdapter {
  return provider === 'vk'
    ? new VkAdapter(el)
    : new IframeAdapter(el, RUTUBE_PROTOCOL);
}
