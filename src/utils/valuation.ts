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
 * 1. If EPS > 0: fairPrice = EPS * Target P/E Multiplier
 * 2. If EPS <= 0 (Deficit) and BPS > 0: fairPrice = BPS * Target PBR (1.5x)
 * 3. If BPS not directly available, derive from (currentPrice / pbr)
 */
export function calculateFairPrice(
  eps: number,
  targetPe: number,
  bps?: number,
  pbr?: number,
  currentPrice?: number
): number {
  if (eps > 0) {
    return Number((eps * targetPe).toFixed(2))
  }

  // EPS <= 0 (적자 기업 대체 밸류에이션: BPS 순자산가치 기준)
  let effectiveBps = bps && bps > 0 ? bps : 0
  if (!effectiveBps && pbr && pbr > 0 && currentPrice && currentPrice > 0) {
    effectiveBps = currentPrice / pbr
  }

  if (effectiveBps > 0) {
    // 바이오/성장 적자 기업의 표준 자산 배수 1.5x 적용
    const targetPbr = 1.5
    return Number((effectiveBps * targetPbr).toFixed(2))
  }

  return 0
}

/**
 * Calculates the Investment Value multiplier (투자가치)
 * investmentValue = Fair Price / Current Price
 */
export function calculateInvestmentValue(fairPrice: number, currentPrice: number): number {
  if (currentPrice <= 0 || fairPrice <= 0) return 0
  return Number((fairPrice / currentPrice).toFixed(2))
}

/**
 * Calculates the Stock Temperature in Celsius (°C)
 * Temp = 30 * (Current Price / Fair Price) - 10
 * If fairPrice is 0 (Unvalued deficit / capital impairment): returns 100.0°C (Extreme Overvalued / High Risk)
 */
export function calculateStockTemperature(currentPrice: number, fairPrice: number): number {
  if (currentPrice <= 0) return 20.0
  if (fairPrice <= 0) {
    // 완전 자본잠식 또는 산출 불가 적자 기업 -> 최고 온도(100°C) 처리
    return 100.0
  }
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
      label: '극심한 저평가 (혹한기)',
      colorClass: 'text-blue-400',
      badgeColorClass: 'bg-blue-950/80 text-blue-300 border-blue-900/50',
      gradientClass: 'from-blue-500 to-cyan-500',
      description: '상승 여력 최대 · 역사적 저평가 저점 구간입니다.',
      iconName: 'snowflake',
    }
  } else if (temp < 15) {
    return {
      label: '저평가 구간 (쌀쌀함)',
      colorClass: 'text-cyan-400',
      badgeColorClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-900/50',
      gradientClass: 'from-cyan-500 to-teal-500',
      description: '상승 여력 높음 · 주가 저평가 구간입니다.',
      iconName: 'wind',
    }
  } else if (temp < 35) {
    return {
      label: '적정 밸류 (적정온도)',
      colorClass: 'text-emerald-400',
      badgeColorClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-900/50',
      gradientClass: 'from-emerald-500 to-green-500',
      description: '상승 여력 안정적 · 균형 가치 구간입니다.',
      iconName: 'cloud-sun',
    }
  } else if (temp < 50) {
    return {
      label: '고평가 구간 (과열)',
      colorClass: 'text-amber-400',
      badgeColorClass: 'bg-amber-950/80 text-amber-300 border-amber-900/50',
      gradientClass: 'from-amber-500 to-orange-500',
      description: '단기 급등 상태 · 1년 목표가 근접 구간입니다.',
      iconName: 'sun',
    }
  } else {
    return {
      label: '극심한 고평가 (폭염)',
      colorClass: 'text-rose-500',
      badgeColorClass: 'bg-rose-950/80 text-rose-300 border-rose-900/50',
      gradientClass: 'from-orange-500 to-rose-500',
      description: '1년 목표가 초과 · 단기 과열 주의 구간입니다.',
      iconName: 'flame',
    }
  }
}
