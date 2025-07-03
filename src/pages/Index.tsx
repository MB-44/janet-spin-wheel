import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gift, Star, Sparkles } from 'lucide-react';

const WHEEL_CONFIG = {
   googleSheetUrl: 'https://script.google.com/macros/s/AKfycbxOZsiwNa2d6JTzoM0gtZXl3giwdcWf8459Ze1-dfGngZ2ch9k44tHa7cntuA-n6TT7/exec',
  
  containerBackground: '', 
  
  // Center image for the wheel (from public folder)
  centerImage: '/logo3.png', // Change this to your desired image path
  
  totalPlayers: 1000,
  totalWinners: 20, // 2% win rate
  
  slices: [
    {
      label: 'Pimple Simple\nGift',
      color: '#16a34a', // Green for winning slices
      textColor: '#ede024',
      isWinning: true
    },
    {
      label: 'So Close!',
      color: '#346213', // Gray for non-winning slices
      textColor: '#ffffff',
      isWinning: false
    },
    {
      label: 'Unlucky',
      color: '#8fc031', // Red for non-winning slices
      textColor: '#ffffff',
      isWinning: false
    },
    {
      label: 'Pimple Simple\nGift',
      color: '#16a34a', // Green for winning slices
      textColor: '#ede024',
      isWinning: true
    },
    {
      label: 'Bad Luck',
      color: '#346213', // Yellow for non-winning slices
      textColor: '#ffffff',
      isWinning: false
    },
    {
      label: 'Sorry',
      color: '#8fc031', // Purple for non-winning slices
      textColor: '#ffffff',
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
    const digits = phone.replace(/\D/g, '');
    return  /^07\d{8}$/.test(digits);
  };

  const submitToGoogleSheet = async (email: string, phone: string) => {
    const digits = phone.replace(/\D/g, '');
    const url = WHEEL_CONFIG.googleSheetUrl
              + `?email=${encodeURIComponent(email)}`
              + `&phone=${encodeURIComponent(digits)}`;
    try {
      await fetch(url, {
        method: 'GET',
        mode: 'no-cors',
      });
      console.log('Sent to Sheet (no-cors)');
    } catch (error) {
      console.error('Fetch Error', error);
      }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: {email?: string; phone?: string} = {};
    
    if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!validatePhone(phone)) {
      errors.phone = 'Please enter a valid phone number (10 digits, starting with 07)';
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

  const getNonWinningSlices = () => {
    return WHEEL_CONFIG.slices.map((slice, index) => ({ ...slice, index }))
                              .filter(slice => !slice.isWinning);
  };

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
    
    return 0;
  };

  const handleSpin = () => {
    if (hasPlayed || isSpinning) return;
    
    setIsSpinning(true);
    const willWin = shouldWin();
    const targetSlice = getTargetSlice(willWin);

    const sliceAngle = 360 / WHEEL_CONFIG.slices.length;
    const targetAngle = targetSlice * sliceAngle + sliceAngle / 2;
    const spins = 5;
    const finalRotation = spins * 360 + (360 - targetAngle);
    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setIsWinner(willWin);
      setWinningSlice(WHEEL_CONFIG.slices[targetSlice]);
      setShowResult(true);
      setHasPlayed(true);
      localStorage.setItem('spin-wheel-played', 'true');
    }, 4000);
  };

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

      const midAngle = (startAngle + endAngle) / 2;
      const textRadius = radius * 0.7;
      const textX = centerX + textRadius * Math.cos(midAngle);
      const textY = centerY + textRadius * Math.sin(midAngle);

  // Split label into lines for multi-line text rendering
  const lines = slice.label.split('\n');
  const lineHeight = 16; // px
  const offsetY = -((lines.length - 1) * lineHeight) / 2;

  slices.push(
    <g key={i}>
      <path 
        d={pathData} 
        fill={slice.color} 
        stroke="white" 
        strokeWidth="2" 
      />
      
      <text
        x={textX}
        y={textY + offsetY}
        textAnchor="middle"
        fill={slice.textColor}
        fontSize="14"
        fontWeight="bold"
        className="pointer-events-none"
      >
        {lines.map((line, idx) => (
          <tspan key={idx} x={textX} dy={idx === 0 ? 0 : `${lineHeight}px`}>
            {line}
          </tspan>
        ))}
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
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        ...containerStyle,
        backgroundImage: "url('/background.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-white mb-2">
            Pimple Simple Spin
          </h1>
          <p className="text-xl text-blue-200">
            Feeling lucky? Let's find out!
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
                <Label htmlFor="phone" className="text-white">Mobile Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XXXXXXXX"
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
            
            {/* Added text below the form */}
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-white/80 text-sm">
                I hereby provide my consent to share and disclose my personal details to be used in internal promotional activities of the brand.
              </p>
            </div>
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
                  
                  {/* Center image instead of gold circle */}
                  <defs>
                    <clipPath id="centerClip">
                      <circle cx="160" cy="160" r="30" />
                    </clipPath>
                  </defs>
                  <circle cx="160" cy="160" r="32" fill="#f5f4f2" stroke="#f5f4f2" strokeWidth="2" />
                  <image
                    href={WHEEL_CONFIG.centerImage}
                    x="130"
                    y="130"
                    width="60"
                    height="60"
                    clipPath="url(#centerClip)"
                    className="pointer-events-none"
                  />
                </svg>
              </div>

              {/* Pointer Arrow */}
              {/* <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg"></div>
              </div> */}

              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
  <img
    src="/arrow-new.png"
    alt="Pointer arrow"
    className="w-12 h-12 drop-shadow-lg"
  />
</div>
            </div>

            {/* Spin Button */}
            <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20">
              {hasPlayed ? (
                <div className="space-y-4">
                  <p className="text-white text-lg">Thanks for playing!</p>
                  <p className="text-blue-200 text-sm">Only one spin allowed per user</p>
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
                {isWinner ? '🎉 CONGRATULATIONS! 🎉' : 'Better Luck Next Time!'}
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
