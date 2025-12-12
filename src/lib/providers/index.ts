import { IStockProvider } from './types';
import { fmpProvider } from './fmpProvider';

export * from './types';
export { fmpProvider };

// Get the configured provider
export function getProvider(): IStockProvider {
  const providerName = process.env.STOCK_PROVIDER || 'fmp';

  switch (providerName.toLowerCase()) {
    case 'fmp':
      return fmpProvider;
    default:
      console.warn(`Unknown provider: ${providerName}, falling back to FMP`);
      return fmpProvider;
  }
}
