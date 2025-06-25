
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

  const resetGame = () => {
    localStorage.removeItem('spin-wheel-played');
    setHasPlayed(false);
    setShowResult(false);
    setIsWinner(false);
    setRotation(0);
  };

  // Define slice colors
  const getSliceColor = (index: number) => {
    if (GAME_CONFIG.winningSlices.includes(index)) {
      return 'bg-green-600'; // Green for gift slices
    }
    
    const colorMap = ['bg-red-800', 'bg-blue-800', 'bg-yellow-700', 'bg-orange-700'];
    const nonWinningIndex = index - GAME_CONFIG.winningSlices.filter(w => w < index).length;
    return colorMap[nonWinningIndex % colorMap.length];
  };

  // Generate wheel slices
  const generateSlices = () => {
    const slices = [];
    const sliceAngle = 360 / GAME_CONFIG.wheelSlices;
    
    for (let i = 0; i < GAME_CONFIG.wheelSlices; i++) {
      const isWinningSlice = GAME_CONFIG.winningSlices.includes(i);
      const rotation = i * sliceAngle;
      const nextAngle = (i + 1) * sliceAngle;
      
      // Calculate the polygon points for each slice
      const startX = 50 + 50 * Math.cos((rotation * Math.PI) / 180);
      const startY = 50 - 50 * Math.sin((rotation * Math.PI) / 180);
      const endX = 50 + 50 * Math.cos((nextAngle * Math.PI) / 180);
      const endY = 50 - 50 * Math.sin((nextAngle * Math.PI) / 180);
      
      slices.push(
        <div
          key={i}
          className={`absolute w-full h-full ${getSliceColor(i)}`}
          style={{
            clipPath: `polygon(50% 50%, ${startX}% ${startY}%, ${endX}% ${endY}%)`
          }}
        >
          <div 
            className="absolute w-6 h-6 text-white flex items-center justify-center"
            style={{
              top: '25%',
              left: '50%',
              transform: `translate(-50%, -50%) rotate(${rotation + sliceAngle/2}deg)`
            }}
          >
            {isWinningSlice ? <Gift className="w-5 h-5" /> : <Star className="w-5 h-5" />}
          </div>
        </div>
      );
    }
    return slices;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
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
            <div 
              ref={wheelRef} 
              className={`relative w-80 h-80 rounded-full border-8 border-white shadow-2xl transition-transform duration-4000 ease-out ${isSpinning ? 'animate-pulse' : ''}`} 
              style={{
                transform: `rotate(${rotation}deg)`
              }}
            >
              {generateSlices()}
              
              {/* Center circle */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center z-10">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            {/* Pointer Arrow (Bottom) */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg"></div>
            </div>
          </div>

          {/* Spin Button */}
          <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20">
            {hasPlayed ? (
              <div className="space-y-4">
                <p className="text-white text-lg">You've already played!</p>
                <Button 
                  onClick={resetGame} 
                  variant="outline" 
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  Reset Game (Dev Mode)
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleSpin} 
                disabled={isSpinning} 
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-4 px-8 text-xl rounded-full shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSpinning ? 'Spinning...' : 'SPIN NOW!'}
              </Button>
            )}
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
              {isWinner ? (
                <>
                  <div className="text-6xl">🎁</div>
                  <p className="text-xl">You won a fantastic prize!</p>
                  <div className="flex justify-center space-x-2">
                    <Sparkles className="w-6 h-6 text-yellow-300" />
                    <Sparkles className="w-6 h-6 text-yellow-300" />
                    <Sparkles className="w-6 h-6 text-yellow-300" />
                  </div>
                </>
              ) : (
                <>
                  <div className="text-6xl">⭐</div>
                  <p className="text-xl">Thanks for playing!</p>
                  <p className="text-sm text-blue-200">Come back tomorrow for another chance!</p>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Index;
