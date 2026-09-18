interface WeatherCardAnimationProps {
  temperature: number
  category?: string
}

export default function WeatherCardAnimation({ temperature }: WeatherCardAnimationProps) {
  // 1. 🔥 극심한 고평가 (극단과열 / 은은하고 고급스러운 루비·앰버 앰비언트 웜 오로라)
  if (temperature >= 50) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl z-0">
        {/* Soft Ambient Heat Aura */}
        <div className="absolute inset-0 bg-gradient-to-t from-rose-950/30 via-orange-950/15 to-transparent" />
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-56 h-40 bg-rose-600/10 rounded-full blur-3xl animate-pulse duration-1000" />
        <div className="absolute -bottom-8 left-1/3 w-48 h-36 bg-orange-600/10 rounded-full blur-3xl" />

        {/* Delicate Warm Embers (Few, Small, Semi-transparent) */}
        <div className="absolute inset-0 opacity-40">
          {[...Array(7)].map((_, i) => {
            const left = `${(i * 14 + 10) % 85}%`
            const delay = `-${((i * 0.7) % 4.5).toFixed(2)}s`
            const duration = `${4.2 + (i % 3) * 0.8}s`
            const size = 2 + (i % 3) * 1.2
            return (
              <span
                key={i}
                className="absolute bottom-4 rounded-full bg-gradient-to-t from-amber-300 to-rose-400 animate-gentleRiseEmber blur-[0.4px]"
                style={{
                  left,
                  width: `${size}px`,
                  height: `${size * 1.3}px`,
                  animationDelay: delay,
                  animationDuration: duration,
                }}
              />
            )
          })}
        </div>

        <style>{`
          @keyframes gentleRiseEmber {
            0% {
              transform: translateY(0) translateX(0);
              opacity: 0;
            }
            25% {
              opacity: 0.55;
            }
            80% {
              opacity: 0.35;
              transform: translateY(-200px) translateX(${Math.sin(1) * 15}px);
            }
            100% {
              transform: translateY(-320px) translateX(-15px);
              opacity: 0;
            }
          }
          .animate-gentleRiseEmber {
            animation: gentleRiseEmber ease-in-out infinite;
          }
        `}</style>
      </div>
    )
  }

  // 2. ☀️ 고평가 (과열 / 따스한 골든 선셋 글로우 & 잔잔한 온기)
  if (temperature >= 35) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl z-0">
        {/* Soft Golden Ambient Backdrop */}
        <div className="absolute inset-0 bg-gradient-to-t from-amber-950/25 via-orange-950/10 to-transparent" />
        <div className="absolute top-1/4 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl animate-pulse duration-1000" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-500/8 rounded-full blur-3xl" />

        {/* Minimal Subtle Sun-dusted Particles */}
        <div className="absolute inset-0 opacity-35">
          {[...Array(6)].map((_, i) => {
            const left = `${(i * 16 + 8) % 85}%`
            const delay = `-${((i * 0.8) % 5).toFixed(2)}s`
            const duration = `${5.0 + (i % 2) * 1.2}s`
            const size = 2 + (i % 2) * 1
            return (
              <span
                key={i}
                className="absolute bottom-6 rounded-full bg-amber-300 animate-gentleDrift blur-[0.3px]"
                style={{
                  left,
                  width: `${size}px`,
                  height: `${size}px`,
                  animationDelay: delay,
                  animationDuration: duration,
                }}
              />
            )
          })}
        </div>

        <style>{`
          @keyframes gentleDrift {
            0% {
              transform: translateY(0) translateX(0);
              opacity: 0;
            }
            30% {
              opacity: 0.45;
            }
            75% {
              opacity: 0.25;
              transform: translateY(-160px) translateX(18px);
            }
            100% {
              transform: translateY(-260px) translateX(28px);
              opacity: 0;
            }
          }
          .animate-gentleDrift {
            animation: gentleDrift ease-in-out infinite;
          }
        `}</style>
      </div>
    )
  }

  // 3. 🌤️ 적정 밸류 (적정온도 / 맑고 쾌적한 세이지·에메랄드 앰비언트)
  if (temperature >= 15) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl z-0">
        {/* Soft Sage/Emerald Atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/20 via-teal-950/10 to-transparent" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-56 h-44 bg-emerald-500/8 rounded-full blur-3xl" />

        {/* Very Slow, Sparse Floating Green Specks */}
        <div className="absolute inset-0 opacity-35">
          {[...Array(6)].map((_, i) => {
            const left = `${(i * 15 + 10) % 85}%`
            const delay = `-${((i * 0.9) % 5.5).toFixed(2)}s`
            const duration = `${5.5 + (i % 3) * 1.0}s`
            const size = 2 + (i % 2) * 1
            return (
              <span
                key={i}
                className="absolute bottom-4 rounded-full bg-emerald-300 animate-gentleBreeze blur-[0.4px]"
                style={{
                  left,
                  width: `${size}px`,
                  height: `${size}px`,
                  animationDelay: delay,
                  animationDuration: duration,
                }}
              />
            )
          })}
        </div>

        <style>{`
          @keyframes gentleBreeze {
            0% {
              transform: translateY(0) translateX(0);
              opacity: 0;
            }
            25% {
              opacity: 0.4;
            }
            70% {
              opacity: 0.25;
              transform: translateY(-150px) translateX(20px);
            }
            100% {
              transform: translateY(-240px) translateX(35px);
              opacity: 0;
            }
          }
          .animate-gentleBreeze {
            animation: gentleBreeze ease-in-out infinite;
          }
        `}</style>
      </div>
    )
  }

  // 4. 🌧️/🍃 저평가 구간 (시원한 쿨 시안 앰비언트 미스트 & 얇고 부드러운 레인 스트리크)
  if (temperature >= 0) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl z-0">
        {/* Soft Cyan/Indigo Mist */}
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/25 via-blue-950/10 to-transparent" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-56 h-44 bg-cyan-500/8 rounded-full blur-3xl" />

        {/* Subtle, Thin, Semi-transparent Rain Streaks */}
        <div className="absolute inset-0 opacity-35">
          {[...Array(8)].map((_, i) => {
            const left = `${(i * 12 + 6) % 92}%`
            const delay = `-${((i * 0.35) % 2.5).toFixed(2)}s`
            const duration = `${2.0 + (i % 3) * 0.4}s`
            const height = 16 + (i % 3) * 6
            return (
              <span
                key={i}
                className="absolute -top-6 w-[1.5px] bg-gradient-to-b from-transparent via-cyan-300 to-transparent rounded-full animate-gentleRain"
                style={{
                  left,
                  height: `${height}px`,
                  animationDelay: delay,
                  animationDuration: duration,
                  transform: 'rotate(12deg)'
                }}
              />
            )
          })}
        </div>

        <style>{`
          @keyframes gentleRain {
            0% {
              transform: translateY(-10px) translateX(0) rotate(12deg);
              opacity: 0;
            }
            20% {
              opacity: 0.45;
            }
            80% {
              opacity: 0.35;
            }
            100% {
              transform: translateY(380px) translateX(45px) rotate(12deg);
              opacity: 0;
            }
          }
          .animate-gentleRain {
            animation: gentleRain linear infinite;
          }
        `}</style>
      </div>
    )
  }

  // 5. ❄️ 극심한 저평가 (혹한기 / 북극 오로라 & 느리고 몽환적인 소프트 스노우)
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl z-0">
      {/* Deep Celestial Blue Aurora Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-950/30 via-indigo-950/15 to-transparent" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-56 h-44 bg-cyan-400/10 rounded-full blur-3xl animate-pulse duration-1000" />
      <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />

      {/* Very Soft, Slow Falling Snow Specks */}
      <div className="absolute inset-0 opacity-40">
        {[...Array(8)].map((_, i) => {
          const left = `${(i * 12 + 5) % 92}%`
          const delay = `-${((i * 0.6) % 4.8).toFixed(2)}s`
          const duration = `${5.2 + (i % 3) * 1.2}s`
          const size = 2 + (i % 3) * 0.8
          return (
            <span
              key={i}
              className="absolute -top-4 rounded-full bg-cyan-100 animate-gentleSnow blur-[0.3px]"
              style={{
                left,
                width: `${size}px`,
                height: `${size}px`,
                animationDelay: delay,
                animationDuration: duration,
              }}
            />
          )
        })}
      </div>

      <style>{`
        @keyframes gentleSnow {
          0% {
            transform: translateY(-10px) translateX(0);
            opacity: 0;
          }
          20% {
            opacity: 0.5;
          }
          80% {
            opacity: 0.35;
            transform: translateY(320px) translateX(${Math.sin(1) * 20}px);
          }
          100% {
            transform: translateY(420px) translateX(10px);
            opacity: 0;
          }
        }
        .animate-gentleSnow {
          animation: gentleSnow linear infinite;
        }
      `}</style>
    </div>
  )
}
