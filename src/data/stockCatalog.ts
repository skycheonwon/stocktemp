import rawCatalog from './stockCatalog.json'

export interface CatalogStock {
  country: 'KR' | 'US' | 'VN' | 'CN'
  ticker: string
  name: string
  koreanName?: string
  industry: string
  targetPe?: number
}

export const STOCK_CATALOG: CatalogStock[] = rawCatalog as CatalogStock[]
