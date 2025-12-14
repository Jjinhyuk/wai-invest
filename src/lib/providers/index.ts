import { IStockProvider } from './types';
import { fmpProvider } from './fmpProvider';
import { freeStockProvider } from './freeStockProvider';

export * from './types';
export { fmpProvider, freeStockProvider };

// Get the configured provider
export function getProvider(): IStockProvider {
  const providerName = process.env.STOCK_PROVIDER || 'free';

  switch (providerName.toLowerCase()) {
    case 'fmp':
      return fmpProvider;
    case 'free':
    case 'finnhub':
      return freeStockProvider;
    default:
      console.warn(`Unknown provider: ${providerName}, falling back to free provider`);
      return freeStockProvider;
  }
}
