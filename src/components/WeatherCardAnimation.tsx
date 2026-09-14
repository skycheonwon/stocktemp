interface WeatherCardAnimationProps {
  temperature: number
  category?: string
}

export default function WeatherCardAnimation({ temperature }: WeatherCardAnimationProps) {
  // 1. 🔥 극심한 고평가 (극단과열 / 화염 & 열기 파티클)
  if (temperature >= 50) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl z-0">
        {/* Background Heat Shimmer Pulse */}
        <div className="absolute inset-0 bg-gradient-to-t from-rose-950/70 via-orange-950/30 to-transparent animate-pulse duration-1000" />
        
        {/* Ambient Glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-48 bg-rose-600/20 rounded-full blur-3xl animate-pulse" />

        {/* Rising Fire Embers */}
        <div className="absolute inset-0">
          {[...Array(14)].map((_, i) => {
            const left = `${(i * 7.5 + (i % 3) * 5) % 95 + 2}%`
            const delay = `${(i * 0.45) % 3.2}s`
            const duration = `${2.2 + (i % 4) * 0.6}s`
            const size = 3 + (i % 4) * 2
            return (
              <span
                key={i}
                className="absolute bottom-2 rounded-full bg-gradient-to-t from-yellow-300 via-orange-400 to-rose-500 animate-riseEmber shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                style={{
                  left,
                  width: `${size}px`,
                  height: `${size * 1.4}px`,
                  animationDelay: delay,
                  animationDuration: duration,
                  opacity: 0.85
                }}
              />
            )
          })}
        </div>

        <style>{`
          @keyframes riseEmber {
            0% {
              transform: translateY(0) translateX(0) scale(1);
              opacity: 0;
            }
            20% {
              opacity: 0.9;
            }
            80% {
              opacity: 0.6;
              transform: translateY(-260px) translateX(${Math.sin(1) * 20}px) scale(0.7);
            }
            100% {
              transform: translateY(-380px) translateX(-25px) scale(0.2);
              opacity: 0;
            }
          }
          .animate-riseEmber {
            animation: riseEmber linear infinite;
          }
        `}</style>
      </div>
    )
  }

  // 2. ☀️ 고평가 (과열 / 뜨거운 땡볕 & 회전 태양광선)
  if (temperature >= 35) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl z-0">
        {/* Warm Golden Backdrop */}
        <div className="absolute inset-0 bg-gradient-to-t from-amber-950/50 via-orange-950/20 to-transparent" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-60 h-48 bg-amber-500/20 rounded-full blur-3xl animate-pulse duration-700" />

        {/* Rotating Sun Rays in Background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 flex items-center justify-center animate-spinSlow opacity-25">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-1.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full"
              style={{ transform: `rotate(${i * 22.5}deg)` }}
            />
          ))}
        </div>

        {/* Heat Wave Ripples */}
        <div className="absolute inset-x-0 bottom-12 flex justify-around opacity-30">
          <div className="w-24 h-24 bg-amber-500/30 rounded-full blur-2xl animate-ping duration-1000" />
          <div className="w-28 h-28 bg-orange-500/20 rounded-full blur-2xl animate-ping duration-1000 delay-300" />
        </div>

        <style>{`
          @keyframes spinSlow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spinSlow {
            animation: spinSlow 20s linear infinite;
          }
        `}</style>
      </div>
    )
  }

  // 3. 🌤️ 적정 밸류 (적정온도 / 쾌적한 봄날 & 산들바람 파티클)
  if (temperature >= 15) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl z-0">
        {/* Soft Emerald Breeze Backdrop */}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/40 via-teal-950/20 to-transparent" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-48 bg-emerald-500/15 rounded-full blur-3xl animate-pulse duration-1000" />

        {/* Floating Gentle Sparkles / Breeze Particles */}
        <div className="absolute inset-0">
          {[...Array(10)].map((_, i) => {
            const left = `${(i * 10 + 5) % 90}%`
            const delay = `${(i * 0.6) % 4}s`
            const duration = `${3.5 + (i % 3) * 1}s`
            return (
              <span
                key={i}
                className="absolute rounded-full bg-emerald-400/70 animate-floatBreeze shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                style={{
                  left,
                  bottom: '10px',
                  width: `${3 + (i % 3) * 1.5}px`,
                  height: `${3 + (i % 3) * 1.5}px`,
                  animationDelay: delay,
                  animationDuration: duration,
                }}
              />
            )
          })}
        </div>

        {/* Gentle Breeze Wave */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center opacity-25">
          <div className="w-72 h-16 bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent blur-xl animate-pulse" />
        </div>

        <style>{`
          @keyframes floatBreeze {
            0% {
              transform: translateY(0) translateX(0) scale(0.8);
              opacity: 0;
            }
            30% {
              opacity: 0.8;
            }
            70% {
              opacity: 0.5;
              transform: translateY(-180px) translateX(25px) scale(1.1);
            }
            100% {
              transform: translateY(-300px) translateX(45px) scale(0.2);
              opacity: 0;
            }
          }
          .animate-floatBreeze {
            animation: floatBreeze ease-in-out infinite;
          }
        `}</style>
      </div>
    )
  }

  // 4. 🌧️/🍃 저평가 구간 (쌀쌀함 / 시원한 가을비 & 서늘한 바람 스트리크)
  if (temperature >= 0) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl z-0">
        {/* Cool Blue Mist Backdrop */}
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/50 via-blue-950/25 to-transparent" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-48 bg-cyan-500/20 rounded-full blur-3xl" />

        {/* Falling Rain / Wind Streaks */}
        <div className="absolute inset-0">
          {[...Array(14)].map((_, i) => {
            const left = `${(i * 7.2) % 95 + 2}%`
            const delay = `${(i * 0.25) % 2.2}s`
            const duration = `${1.2 + (i % 3) * 0.4}s`
            const height = 18 + (i % 4) * 8
            return (
              <span
                key={i}
                className="absolute -top-8 w-[1.5px] bg-gradient-to-b from-transparent via-cyan-300 to-blue-400 rounded-full animate-fallRain opacity-60"
                style={{
                  left,
                  height: `${height}px`,
                  animationDelay: delay,
                  animationDuration: duration,
                  transform: 'rotate(15deg)'
                }}
              />
            )
          })}
        </div>

        <style>{`
          @keyframes fallRain {
            0% {
              transform: translateY(-20px) translateX(0) rotate(15deg);
              opacity: 0;
            }
            30% {
              opacity: 0.7;
            }
            90% {
              opacity: 0.6;
            }
            100% {
              transform: translateY(450px) translateX(60px) rotate(15deg);
              opacity: 0;
            }
          }
          .animate-fallRain {
            animation: fallRain linear infinite;
          }
        `}</style>
      </div>
    )
  }

  // 5. ❄️ 극심한 저평가 (혹한기 / 눈송이 & 얼음 결정 글로우)
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl z-0">
      {/* Deep Frost Aurora Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-950/70 via-indigo-950/30 to-transparent" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-48 bg-cyan-400/20 rounded-full blur-3xl animate-pulse duration-1000" />
      <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl" />

      {/* Falling Snowflakes */}
      <div className="absolute inset-0">
        {[...Array(16)].map((_, i) => {
          const left = `${(i * 6.5 + 2) % 96}%`
          const delay = `${(i * 0.4) % 3.6}s`
          const duration = `${3.2 + (i % 4) * 0.8}s`
          const size = 3 + (i % 4) * 2
          return (
            <span
              key={i}
              className="absolute -top-6 rounded-full bg-white animate-fallSnow shadow-[0_0_8px_rgba(255,255,255,0.9)]"
              style={{
                left,
                width: `${size}px`,
                height: `${size}px`,
                animationDelay: delay,
                animationDuration: duration,
                opacity: 0.85
              }}
            />
          )
        })}
      </div>

      <style>{`
        @keyframes fallSnow {
          0% {
            transform: translateY(-20px) translateX(0) rotate(0deg);
            opacity: 0;
          }
          20% {
            opacity: 0.9;
          }
          80% {
            opacity: 0.7;
            transform: translateY(380px) translateX(${Math.sin(1) * 30}px) rotate(180deg);
          }
          100% {
            transform: translateY(480px) translateX(15px) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-fallSnow {
          animation: fallSnow linear infinite;
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spinSlow {
          animation: spinSlow 15s linear infinite;
        }
      `}</style>
    </div>
  )
}
