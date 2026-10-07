export const WALLET_UPDATED_EVENT = 'frag-naija:wallet-updated';

/** Notify mounted wallet consumers that a wallet-changing operation completed. */
export function notifyWalletUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(WALLET_UPDATED_EVENT));
  }
}
