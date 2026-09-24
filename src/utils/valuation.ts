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
 * Temp = 24 * (Current Price / Fair Price) - 3
 * - Ratio 1.0 (Fair Value) -> 21.0°C (Comfortable Transition/Fair Value)
 * - Ratio 0.5 (Undervalued) -> 9.0°C (Spring)
 * - Ratio 0.1 (Deep Undervalued) -> -0.6°C (Winter / Freezing)
 * - Ratio 1.3 (Overvalued) -> 28.2°C (Summer)
 * - Ratio 1.5+ (Deep Overvalued) -> 33.0°C+ (Hot Summer / Heatwave)
 */
export function calculateStockTemperature(currentPrice: number, fairPrice: number): number {
  if (currentPrice <= 0) return 21.0
  if (fairPrice <= 0) {
    // 완전 자본잠식 또는 산출 불가 적자 기업 -> 최고 온도(60°C) 처리
    return 60.0
  }
  const temp = 24 * (currentPrice / fairPrice) - 3
  // Clamp values between -25°C and 70°C for sensible UI displays
  return Number(Math.max(-25, Math.min(70, temp)).toFixed(1))
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
 * Korean Real Seasonal Climate Benchmarks:
 * - < 0°C: 겨울 (극저평가)
 * - 0 ~ 16°C: 봄 (저평가)
 * - 17 ~ 26°C: 가을 (적정가, 기준점: 21°C)
 * - 27 ~ 32°C: 여름 (고평가)
 * - ≥ 33°C: 한여름 (극고평가, 폭염 기준)
 */
export function getTemperatureDetails(temp: number): TemperatureState {
  if (temp < 0) {
    return {
      label: '극저평가 (겨울)',
      colorClass: 'text-blue-400',
      badgeColorClass: 'bg-blue-950/80 text-blue-300 border-blue-900/50',
      gradientClass: 'from-blue-500 to-cyan-500',
      description: '기업 펀더멘털 대비 주가가 영하권(0°C 미만)의 극심한 저평가 구간에 머물러 있는 상태입니다.',
      iconName: 'snowflake',
    }
  } else if (temp < 17) {
    return {
      label: '저평가 (봄)',
      colorClass: 'text-cyan-400',
      badgeColorClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-900/50',
      gradientClass: 'from-cyan-500 to-teal-500',
      description: '초봄의 서늘한 기온(0~16°C)처럼 적정가치 대비 주가가 할인되어 상승 잠재력을 품은 상태입니다.',
      iconName: 'wind',
    }
  } else if (temp < 27) {
    return {
      label: '가을 (적정가)',
      colorClass: 'text-emerald-400',
      badgeColorClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-900/50',
      gradientClass: 'from-emerald-500 to-green-500',
      description: '가을철 쾌적한 평년 기온(17~26°C)처럼 실적과 기업 가치가 시장 평가와 조화로운 균형 상태입니다.',
      iconName: 'cloud-sun',
    }
  } else if (temp < 33) {
    return {
      label: '고평가 (여름)',
      colorClass: 'text-amber-400',
      badgeColorClass: 'bg-amber-950/80 text-amber-300 border-amber-900/50',
      gradientClass: 'from-amber-500 to-orange-500',
      description: '여름철 더위(27~32°C)처럼 밸류에이션 지표가 평균 상단에 진입하여 과열 조짐을 보이는 상태입니다.',
      iconName: 'sun',
    }
  } else {
    return {
      label: '극고평가 (한여름)',
      colorClass: 'text-rose-500',
      badgeColorClass: 'bg-rose-950/80 text-rose-300 border-rose-900/50',
      gradientClass: 'from-orange-500 to-rose-500',
      description: '기상청 폭염특보(33°C 이상) 수준으로 역사적 밸류에이션 밴드 상단을 초과하여 극단적 과열에 도달한 상태입니다.',
      iconName: 'flame',
    }
  }
}
