
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gift, Star, Sparkles } from 'lucide-react';

const WHEEL_CONFIG = {
   googleSheetUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
  
  containerBackground: '', 
  
  totalPlayers: 30,
  totalWinners: 2,
  
  slices: [
    {
      image: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=100&h=100&fit=crop',
      label: 'Prize 1',
      isWinning: true
    },
    {
      image: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=100&h=100&fit=crop',
      label: 'Try Again',
      isWinning: false
    },
    {
      image: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=100&h=100&fit=crop',
      label: 'Better Luck',
      isWinning: false
    },
    {
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100&h=100&fit=crop',
      label: 'Grand Prize',
      isWinning: true
    },
    {
      image: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=100&h=100&fit=crop',
      label: 'No Prize',
      isWinning: false
    },
    {
      image: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=100&h=100&fit=crop',
      label: 'Try Next Time',
      isWinning: false
    }
  ]
};

const Index = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState<{email?: string; phone?: string}>({});
  
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winningSlice, setWinningSlice] = useState<typeof WHEEL_CONFIG.slices[0] | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const playedBefore = localStorage.getItem('spin-wheel-played');
    if (playedBefore) {
      setHasPlayed(true);
    }
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const submitToGoogleSheet = async (email: string, phone: string) => {
    try {
      const response = await fetch(WHEEL_CONFIG.googleSheetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          phone: phone,
          timestamp: new Date().toISOString()
        }),
        mode: 'no-cors' 
      });
      
      console.log('Data sent to Google Sheet successfully');
    } catch (error) {
      console.error('Error sending data to Google Sheet:', error);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: {email?: string; phone?: string} = {};
    
    if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!validatePhone(phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    setFormErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      await submitToGoogleSheet(email, phone);
      setFormSubmitted(true);
    }
  };

  const shouldWin = () => {
    const winProbability = WHEEL_CONFIG.totalWinners / WHEEL_CONFIG.totalPlayers;
    return Math.random() < winProbability;
  };

  const getWinningSlices = () => {
    return WHEEL_CONFIG.slices.map((slice, index) => ({ ...slice, index }))
                              .filter(slice => slice.isWinning);
  };

  // Get non-winning slices
  const getNonWinningSlices = () => {
    return WHEEL_CONFIG.slices.map((slice, index) => ({ ...slice, index }))
                              .filter(slice => !slice.isWinning);
  };

  // Determine which slice to land on
  const getTargetSlice = (shouldWin: boolean) => {
    const winningSlices = getWinningSlices();
    const nonWinningSlices = getNonWinningSlices();
    
    if (shouldWin && winningSlices.length > 0) {
      const randomWinningSlice = winningSlices[Math.floor(Math.random() * winningSlices.length)];
      return randomWinningSlice.index;
    } else if (nonWinningSlices.length > 0) {
      const randomNonWinningSlice = nonWinningSlices[Math.floor(Math.random() * nonWinningSlices.length)];
      return randomNonWinningSlice.index;
    }
    
    return 0; // Fallback
  };

  const handleSpin = () => {
    if (hasPlayed || isSpinning) return;
    
    setIsSpinning(true);
    const willWin = shouldWin();
    const targetSlice = getTargetSlice(willWin);

    // Calculate rotation to land on target slice
    const sliceAngle = 360 / WHEEL_CONFIG.slices.length;
    const targetAngle = targetSlice * sliceAngle + sliceAngle / 2;
    const spins = 5; // Number of full rotations
    const finalRotation = spins * 360 + (360 - targetAngle);
    setRotation(finalRotation);

    // Set result after spin animation
    setTimeout(() => {
      setIsSpinning(false);
      setIsWinner(willWin);
      setWinningSlice(WHEEL_CONFIG.slices[targetSlice]);
      setShowResult(true);
      setHasPlayed(true);
      localStorage.setItem('spin-wheel-played', 'true');
    }, 4000);
  };

  // Generate SVG wheel slices
  const generateSVGSlices = () => {
    const slices = [];
    const sliceAngle = 360 / WHEEL_CONFIG.slices.length;
    const radius = 150;
    const centerX = 160;
    const centerY = 160;

    for (let i = 0; i < WHEEL_CONFIG.slices.length; i++) {
      const slice = WHEEL_CONFIG.slices[i];
      const startAngle = (i * sliceAngle - 90) * (Math.PI / 180);
      const endAngle = ((i + 1) * sliceAngle - 90) * (Math.PI / 180);
      
      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);
      
      const largeArcFlag = sliceAngle > 180 ? 1 : 0;
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');

      // Calculate positions for image and text
      const midAngle = (startAngle + endAngle) / 2;
      const imageRadius = radius * 0.5;
      const textRadius = radius * 0.8;
      const imageX = centerX + imageRadius * Math.cos(midAngle);
      const imageY = centerY + imageRadius * Math.sin(midAngle);
      const textX = centerX + textRadius * Math.cos(midAngle);
      const textY = centerY + textRadius * Math.sin(midAngle);

      slices.push(
        <g key={i}>
          <path 
            d={pathData} 
            fill={slice.isWinning ? '#16a34a' : '#64748b'} 
            stroke="white" 
            strokeWidth="2" 
          />
          
          {/* Slice Image */}
          <foreignObject 
            x={imageX - 20} 
            y={imageY - 20} 
            width="40" 
            height="40"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
              <img 
                src={slice.image} 
                alt={slice.label}
                className="w-full h-full object-cover"
              />
            </div>
          </foreignObject>

          {/* Slice Label */}
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="10"
            fontWeight="bold"
            className="pointer-events-none"
          >
            {slice.label}
          </text>
        </g>
      );
    }
    return slices;
  };

  const containerStyle = WHEEL_CONFIG.containerBackground 
    ? { backgroundImage: `url(${WHEEL_CONFIG.containerBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4"
      style={containerStyle}
    >
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-white mb-2">
            🎡 Spin to Win!
          </h1>
          <p className="text-xl text-blue-200">
            Enter your details and try your luck on the wheel of fortune
          </p>
        </div>

        {/* Contact Form */}
        {!formSubmitted && (
          <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20 max-w-md mx-auto">
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-white">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="mt-1"
                />
                {formErrors.email && (
                  <p className="text-red-300 text-sm mt-1">{formErrors.email}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="phone" className="text-white">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1234567890"
                  className="mt-1"
                />
                {formErrors.phone && (
                  <p className="text-red-300 text-sm mt-1">{formErrors.phone}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600"
              >
                Submit & Spin
              </Button>
            </form>
          </Card>
        )}

        {/* Wheel Container */}
        {formSubmitted && (
          <div className="relative flex flex-col items-center space-y-8">
            {/* Wheel */}
            <div className="relative">
              <div 
                ref={wheelRef} 
                className={`transition-transform duration-4000 ease-out ${isSpinning ? 'animate-pulse' : ''}`}
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                <svg width="320" height="320" className="drop-shadow-2xl">
                  <circle cx="160" cy="160" r="156" fill="none" stroke="white" strokeWidth="8" />
                  {generateSVGSlices()}
                  <circle cx="160" cy="160" r="32" fill="white" stroke="#e5e7eb" strokeWidth="2" />
                  <foreignObject x="144" y="144" width="32" height="32">
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-purple-600" />
                    </div>
                  </foreignObject>
                </svg>
              </div>

              {/* Pointer Arrow */}
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg"></div>
              </div>
            </div>

            {/* Spin Button */}
            <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20">
              {hasPlayed ? (
                <div className="space-y-4">
                  <p className="text-white text-lg">Thanks for playing!</p>
                  <p className="text-blue-200 text-sm">One spin per device allowed</p>
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
        )}

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
                  <p className="text-xl">You won: {winningSlice?.label}!</p>
                  <div className="flex justify-center space-x-2">
                    <Sparkles className="w-6 h-6 text-yellow-300" />
                    <Sparkles className="w-6 h-6 text-yellow-300" />
                    <Sparkles className="w-6 h-6 text-yellow-300" />
                  </div>
                </>
              ) : (
                <>
                  <div className="text-6xl">⭐</div>
                  <p className="text-xl">You landed on: {winningSlice?.label}</p>
                  <p className="text-sm text-blue-200">Thanks for participating!</p>
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
