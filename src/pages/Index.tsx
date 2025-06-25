
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';

// =============================================================================
// CONFIGURATION SECTION - CUSTOMIZE YOUR WHEEL HERE
// =============================================================================

const WHEEL_CONFIG = {
  // Google Sheets Integration
  // Replace this URL with your Google Apps Script Web App URL
  // To set up: 1. Create Google Apps Script 2. Deploy as web app 3. Replace URL below
  // Current URL is a placeholder - replace with your actual Apps Script URL
  googleSheetUrl: 'https://script.google.com/macros/s/YOUR_ACTUAL_SCRIPT_ID_HERE/exec',
  
  // Your actual Google Sheet URL (for reference, not used in code):
  // https://docs.google.com/spreadsheets/d/1qB_Sbskcl8QHZW--HZbVtIB82-tqcG-GBl04-IrWwI8/edit?usp=sharing
  
  // Wheel Container Background Image
  // Replace with any image URL or leave empty for gradient background
  // Example: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7'
  containerBackground: '',
  
  // Wheel Slices Configuration
  // Each slice requires: label, color, winRatio
  // winRatio format: "1:100" means 1 win for every 100 spins (1% chance)
  slices: [
    {
      label: 'Grand Prize',
      color: '#16a34a', // Green
      winRatio: '1:100' // 1% chance to win
    },
    {
      label: 'Try Again',
      color: '#dc2626', // Red
      winRatio: '0:1' // Never wins
    },
    {
      label: 'Better Luck',
      color: '#2563eb', // Blue
      winRatio: '0:1' // Never wins
    },
    {
      label: 'Small Prize',
      color: '#ca8a04', // Yellow
      winRatio: '2:100' // 2% chance to win
    },
    {
      label: 'No Prize',
      color: '#ea580c', // Orange
      winRatio: '0:1' // Never wins
    },
    {
      label: 'Next Time',
      color: '#7c3aed', // Purple
      winRatio: '0:1' // Never wins
    }
  ]
};

// =============================================================================
// HOW TO CUSTOMIZE (Documentation for non-developers)
// =============================================================================
/*
TO CHANGE BACKGROUND IMAGE:
- Replace 'containerBackground' with your image URL
- Example: containerBackground: 'https://your-image-url.com/background.jpg'

TO MODIFY SLICE TEXT:
- Change the 'label' field for any slice
- Example: label: 'Your Custom Text Here'

TO CHANGE SLICE COLORS:
- Update the 'color' field with any hex color code
- Example: color: '#ff6b6b' (for a nice red)

TO ADJUST WIN PROBABILITY:
- Modify 'winRatio' using format "wins:total"
- Examples:
  - '1:10' = 10% chance (1 win per 10 spins)
  - '1:100' = 1% chance (1 win per 100 spins)
  - '5:100' = 5% chance (5 wins per 100 spins)
  - '0:1' = Never wins (0% chance)

TO CONNECT TO GOOGLE SHEETS:
1. Go to Google Apps Script (script.google.com)
2. Create new project and paste this code:
   
   function doPost(e) {
     const sheet = SpreadsheetApp.openById('1qB_Sbskcl8QHZW--HZbVtIB82-tqcG-GBl04-IrWwI8').getActiveSheet();
     const data = JSON.parse(e.postData.contents);
     sheet.appendRow([data.email, data.phone, data.timestamp]);
     return ContentService.createTextOutput('Success');
   }

3. Deploy as web app (anyone can access)
4. Copy the web app URL and replace 'googleSheetUrl' above
*/

// =============================================================================
// COMPONENT IMPLEMENTATION
// =============================================================================

const Index = () => {
  // Form state
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState<{email?: string; phone?: string}>({});
  
  // Game state
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winningSlice, setWinningSlice] = useState<typeof WHEEL_CONFIG.slices[0] | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone validation (basic format)
  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  // Submit form data to Google Sheets
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
        mode: 'no-cors' // Required for Google Apps Script
      });
      
      console.log('Data sent to Google Sheet successfully');
    } catch (error) {
      console.error('Error sending data to Google Sheet:', error);
    }
  };

  // Handle form submission
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
      // Submit to Google Sheet
      await submitToGoogleSheet(email, phone);
      setFormSubmitted(true);
    }
  };

  // Parse win ratio and calculate if should win
  const parseWinRatio = (ratio: string) => {
    const [wins, total] = ratio.split(':').map(Number);
    return { wins, total };
  };

  // Determine which slice to land on based on probabilities
  const getTargetSlice = () => {
    // Create weighted array based on win ratios
    const weightedSlices: number[] = [];
    
    WHEEL_CONFIG.slices.forEach((slice, index) => {
      const { wins, total } = parseWinRatio(slice.winRatio);
      const probability = total > 0 ? wins / total : 0;
      
      // Add slice index to weighted array based on probability
      // Scale probabilities to make them workable with random selection
      const weight = Math.max(1, Math.round(probability * 1000)) || 1;
      for (let i = 0; i < weight; i++) {
        weightedSlices.push(index);
      }
    });
    
    // If no winning slices, add all slices equally
    if (weightedSlices.length === 0) {
      WHEEL_CONFIG.slices.forEach((_, index) => {
        weightedSlices.push(index);
      });
    }
    
    // Select random slice from weighted array
    const randomIndex = Math.floor(Math.random() * weightedSlices.length);
    return weightedSlices[randomIndex];
  };

  const handleSpin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    const targetSlice = getTargetSlice();

    // Calculate rotation to land on target slice
    const sliceAngle = 360 / WHEEL_CONFIG.slices.length;
    const targetAngle = targetSlice * sliceAngle + sliceAngle / 2;
    const spins = 5; // Number of full rotations
    const finalRotation = spins * 360 + (360 - targetAngle);
    setRotation(finalRotation);

    // Set result after spin animation
    setTimeout(() => {
      setIsSpinning(false);
      const resultSlice = WHEEL_CONFIG.slices[targetSlice];
      const { wins } = parseWinRatio(resultSlice.winRatio);
      setIsWinner(wins > 0);
      setWinningSlice(resultSlice);
      setShowResult(true);
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

      // Calculate position for text
      const midAngle = (startAngle + endAngle) / 2;
      const textRadius = radius * 0.7;
      const textX = centerX + textRadius * Math.cos(midAngle);
      const textY = centerY + textRadius * Math.sin(midAngle);

      slices.push(
        <g key={i}>
          <path 
            d={pathData} 
            fill={slice.color} 
            stroke="white" 
            strokeWidth="2" 
          />
          
          {/* Slice Label */}
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="12"
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
                Submit Details
              </Button>
            </form>
          </Card>
        )}

        {/* Wheel Container - Always Available */}
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
            <Button 
              onClick={handleSpin} 
              disabled={isSpinning}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-4 px-8 text-xl rounded-full shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSpinning ? 'Spinning...' : 'SPIN NOW!'}
            </Button>
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
