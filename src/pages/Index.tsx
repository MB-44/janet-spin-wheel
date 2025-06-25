import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Gift, Star, Sparkles } from 'lucide-react';

// Game configuration - easily adjustable
const GAME_CONFIG = {
  totalPlayers: 30,
  totalWinners: 2,
  wheelSlices: 6,
  winningSlices: [1, 4] // Slice indices that are winning slices (0-based)
};
const Index = () => {
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Check if user has already played
  useEffect(() => {
    const playedBefore = localStorage.getItem('spin-wheel-played');
    if (playedBefore) {
      setHasPlayed(true);
    }
  }, []);

  // Calculate win probability
  const shouldWin = () => {
    const winProbability = GAME_CONFIG.totalWinners / GAME_CONFIG.totalPlayers;
    return Math.random() < winProbability;
  };

  // Determine which slice to land on
  const getTargetSlice = (shouldWin: boolean) => {
    if (shouldWin) {
      // Land on one of the winning slices
      const randomWinningSlice = GAME_CONFIG.winningSlices[Math.floor(Math.random() * GAME_CONFIG.winningSlices.length)];
      return randomWinningSlice;
    } else {
      // Land on a non-winning slice
      const nonWinningSlices = Array.from({
        length: GAME_CONFIG.wheelSlices
      }, (_, i) => i).filter(i => !GAME_CONFIG.winningSlices.includes(i));
      return nonWinningSlices[Math.floor(Math.random() * nonWinningSlices.length)];
    }
  };
  const handleSpin = () => {
    if (hasPlayed || isSpinning) return;
    setIsSpinning(true);
    const willWin = shouldWin();
    const targetSlice = getTargetSlice(willWin);

    // Calculate rotation to land on target slice
    const sliceAngle = 360 / GAME_CONFIG.wheelSlices;
    const targetAngle = targetSlice * sliceAngle + sliceAngle / 2;
    const spins = 5; // Number of full rotations
    const finalRotation = spins * 360 + (360 - targetAngle);
    setRotation(finalRotation);

    // Set result after spin animation
    setTimeout(() => {
      setIsSpinning(false);
      setIsWinner(willWin);
      setShowResult(true);
      setHasPlayed(true);
      localStorage.setItem('spin-wheel-played', 'true');
    }, 4000);
  };

  // Define slice colors
  const getSliceColor = (index: number) => {
    if (GAME_CONFIG.winningSlices.includes(index)) {
      return '#16a34a'; // Green for gift slices
    }
    const colorMap = ['#991b1b', '#1e3a8a', '#a16207', '#c2410c']; // dark red, dark blue, dark yellow, dark orange
    const nonWinningIndex = index - GAME_CONFIG.winningSlices.filter(w => w < index).length;
    return colorMap[nonWinningIndex % colorMap.length];
  };

  // Generate SVG wheel slices
  const generateSVGSlices = () => {
    const slices = [];
    const sliceAngle = 360 / GAME_CONFIG.wheelSlices;
    const radius = 150;
    const centerX = 160;
    const centerY = 160;
    for (let i = 0; i < GAME_CONFIG.wheelSlices; i++) {
      const isWinningSlice = GAME_CONFIG.winningSlices.includes(i);
      const startAngle = (i * sliceAngle - 90) * (Math.PI / 180); // -90 to start from top
      const endAngle = ((i + 1) * sliceAngle - 90) * (Math.PI / 180);
      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);
      const largeArcFlag = sliceAngle > 180 ? 1 : 0;
      const pathData = [`M ${centerX} ${centerY}`, `L ${x1} ${y1}`, `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`, 'Z'].join(' ');

      // Calculate icon position (middle of the slice)
      const iconAngle = (startAngle + endAngle) / 2;
      const iconRadius = radius * 0.65;
      const iconX = centerX + iconRadius * Math.cos(iconAngle);
      const iconY = centerY + iconRadius * Math.sin(iconAngle);
      slices.push(<g key={i}>
          <path d={pathData} fill={getSliceColor(i)} stroke="white" strokeWidth="2" />
        </g>);
    }
    return slices;
  };

  // Generate icons separately to appear on top
  const generateIcons = () => {
    const icons = [];
    const sliceAngle = 360 / GAME_CONFIG.wheelSlices;
    const radius = 150;
    const centerX = 160;
    const centerY = 160;
    for (let i = 0; i < GAME_CONFIG.wheelSlices; i++) {
      const isWinningSlice = GAME_CONFIG.winningSlices.includes(i);
      const startAngle = (i * sliceAngle - 90) * (Math.PI / 180);
      const endAngle = ((i + 1) * sliceAngle - 90) * (Math.PI / 180);
      const iconAngle = (startAngle + endAngle) / 2;
      const iconRadius = radius * 0.65;
      const iconX = centerX + iconRadius * Math.cos(iconAngle);
      const iconY = centerY + iconRadius * Math.sin(iconAngle);
      icons.push(<g key={`icon-${i}`}>
          <circle cx={iconX} cy={iconY} r="16" fill="white" fillOpacity="0.9" />
          {isWinningSlice ? <foreignObject x={iconX - 10} y={iconY - 10} width="20" height="20">
              <Gift className="w-5 h-5 text-green-600" />
            </foreignObject> : <foreignObject x={iconX - 10} y={iconY - 10} width="20" height="20">
              <Star className="w-5 h-5 text-gray-600" />
            </foreignObject>}
        </g>);
    }
    return icons;
  };
  return <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-white mb-2">
            🎡 Spin to Win!
          </h1>
          <p className="text-xl text-blue-200">
            Try your luck on the magical wheel of fortune
          </p>
        </div>

        {/* Wheel Container */}
        <div className="relative flex flex-col items-center space-y-8">
          {/* Wheel */}
          <div className="relative">
            <div ref={wheelRef} className={`transition-transform duration-4000 ease-out ${isSpinning ? 'animate-pulse' : ''}`} style={{
            transform: `rotate(${rotation}deg)`
          }}>
              <svg width="320" height="320" className="drop-shadow-2xl">
                {/* Outer border */}
                <circle cx="160" cy="160" r="156" fill="none" stroke="white" strokeWidth="8" />
                
                {/* Wheel slices */}
                {generateSVGSlices()}
                
                {/* Icons */}
                {generateIcons()}
                
                {/* Center circle */}
                <circle cx="160" cy="160" r="32" fill="white" stroke="#e5e7eb" strokeWidth="2" />
                
                {/* Center icon */}
                <foreignObject x="144" y="144" width="32" height="32">
                  <div className="w-full h-full flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-purple-600" />
                  </div>
                </foreignObject>
              </svg>
            </div>

            {/* Pointer Arrow (Bottom) */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg"></div>
            </div>
          </div>

          {/* Spin Button */}
          <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20">
            {hasPlayed ? <div className="space-y-4">
                <p className="text-white text-lg">You've already played!</p>
                
              </div> : <Button onClick={handleSpin} disabled={isSpinning} className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-4 px-8 text-xl rounded-full shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                {isSpinning ? 'Spinning...' : 'SPIN NOW!'}
              </Button>}
          </Card>
        </div>

        {/* Result Dialog */}
        <Dialog open={showResult} onOpenChange={setShowResult}>
          <DialogContent className="bg-gradient-to-br from-purple-600 to-blue-600 border-none text-white">
            <DialogHeader>
              <DialogTitle className="text-center text-3xl font-bold">
                {isWinner ? '🎉 CONGRATULATIONS! 🎉' : '😔 Better Luck Next Time!'}
              </DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-4 py-6">
              {isWinner ? <>
                  <div className="text-6xl">🎁</div>
                  <p className="text-xl">You won a fantastic prize!</p>
                  <div className="flex justify-center space-x-2">
                    <Sparkles className="w-6 h-6 text-yellow-300" />
                    <Sparkles className="w-6 h-6 text-yellow-300" />
                    <Sparkles className="w-6 h-6 text-yellow-300" />
                  </div>
                </> : <>
                  <div className="text-6xl">⭐</div>
                  <p className="text-xl">Thanks for playing!</p>
                  <p className="text-sm text-blue-200">Come back tomorrow for another chance!</p>
                </>}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>;
};
export default Index;