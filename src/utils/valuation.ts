/**
 * Valuation and Stock Temperature helper functions
 */

/**
 * Calculates the Expected Return based on P/E ratio
 * expectedReturn = (1 / PE) * 100 (%)
 */
export function calculateExpectedReturn(pe: number): number {
  if (pe <= 0) return 0
  return Number(((1 / pe) * 100).toFixed(2))
}

/**
 * Calculates the Fair Price (적정가)
 * fairPrice = EPS * Target P/E Multiplier
 */
export function calculateFairPrice(eps: number, targetPe: number): number {
  return Number((eps * targetPe).toFixed(2))
}

/**
 * Calculates the Investment Value multiplier (투자가치)
 * investmentValue = Fair Price / Current Price
 */
export function calculateInvestmentValue(fairPrice: number, currentPrice: number): number {
  if (currentPrice <= 0) return 0
  return Number((fairPrice / currentPrice).toFixed(2))
}

/**
 * Calculates the Stock Temperature in Celsius (°C)
 * Temp = 30 * (Current Price / Fair Price) - 10
 */
export function calculateStockTemperature(currentPrice: number, fairPrice: number): number {
  if (fairPrice <= 0 || currentPrice <= 0) return 20.0
  const temp = 30 * (currentPrice / fairPrice) - 10
  // Clamp values between -30°C and 100°C for sensible UI displays
  return Number(Math.max(-30, Math.min(100, temp)).toFixed(1))
}

export interface TemperatureState {
  label: string;
  colorClass: string;
  badgeColorClass: string;
  gradientClass: string;
  description: string;
  iconName: 'flame' | 'sun' | 'cloud-sun' | 'wind' | 'snowflake';
}

/**
 * Returns descriptive details and Tailwind color classes based on stock temperature
 */
export function getTemperatureDetails(temp: number): TemperatureState {
  if (temp < 0) {
    return {
      label: '혹한기 (극심한 저평가)',
      colorClass: 'text-blue-400',
      badgeColorClass: 'bg-blue-950/80 text-blue-300 border-blue-900/50',
      gradientClass: 'from-blue-500 to-cyan-500',
      description: '얼어붙었지만 대세 상승의 씨앗이 되는 기회입니다.',
      iconName: 'snowflake',
    }
  } else if (temp < 15) {
    return {
      label: '쌀쌀함 (매력적 저평가)',
      colorClass: 'text-cyan-400',
      badgeColorClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-900/50',
      gradientClass: 'from-cyan-500 to-teal-500',
      description: '쇼핑하기 딱 좋은 날씨입니다. 담아볼까요?',
      iconName: 'wind',
    }
  } else if (temp <= 25) {
    return {
      label: '쾌적함 (적정가)',
      colorClass: 'text-emerald-400',
      badgeColorClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-900/50',
      gradientClass: 'from-emerald-500 to-green-500',
      description: '가치와 가격이 일치합니다. 편안하게 보유하세요.',
      iconName: 'cloud-sun',
    }
  } else if (temp <= 45) {
    return {
      label: '폭염 (고평가/과열)',
      colorClass: 'text-amber-400',
      badgeColorClass: 'bg-amber-950/80 text-amber-300 border-amber-900/50',
      gradientClass: 'from-amber-500 to-orange-500',
      description: '열기가 가득합니다. 신규 매수는 자제하세요.',
      iconName: 'sun',
    }
  } else {
    return {
      label: '용광로 (극단적 고평가)',
      colorClass: 'text-rose-500',
      badgeColorClass: 'bg-rose-950/80 text-rose-300 border-rose-900/50',
      gradientClass: 'from-orange-500 to-rose-500',
      description: '너무 뜨겁습니다! 익절하고 대피하세요.',
      iconName: 'flame',
    }
  }
}
