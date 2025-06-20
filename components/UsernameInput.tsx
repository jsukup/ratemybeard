"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, User, Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabase';

interface UsernameInputProps {
  onUsernameConfirm: (username: string) => void;
  disabled?: boolean;
  className?: string;
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export default function UsernameInput({ 
  onUsernameConfirm, 
  disabled = false, 
  className = "" 
}: UsernameInputProps) {
  const [username, setUsername] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');

  // Username validation rules
  const validateUsernameFormat = (name: string): { valid: boolean; error?: string } => {
    if (!name.trim()) {
      return { valid: false };
    }

    if (name.length < 3) {
      return { valid: false, error: 'Username must be at least 3 characters long' };
    }

    if (name.length > 20) {
      return { valid: false, error: 'Username must be no more than 20 characters long' };
    }

    // Allow letters, numbers, underscores, and hyphens
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(name)) {
      return { 
        valid: false, 
        error: 'Username can only contain letters, numbers, underscores, and hyphens' 
      };
    }

    // Don't allow usernames that start or end with underscore/hyphen
    if (name.startsWith('_') || name.startsWith('-') || name.endsWith('_') || name.endsWith('-')) {
      return { 
        valid: false, 
        error: 'Username cannot start or end with underscore or hyphen' 
      };
    }

    return { valid: true };
  };

  const checkUsernameAvailability = async (name: string): Promise<boolean> => {
    try {
      // Check if username exists (case-insensitive)
      const { data, error } = await supabase
        .from('images')
        .select('username')
        .ilike('username', name)
        .limit(1);

      if (error) {
        console.error('Error checking username availability:', error);
        throw error;
      }

      // If data array is empty, username is available
      return !data || data.length === 0;
    } catch (error) {
      console.error('Error in checkUsernameAvailability:', error);
      throw error;
    }
  };

  const checkUsername = useCallback(
    debounce(async (name: string) => {
      if (!name.trim()) {
        setIsValid(null);
        setError('');
        return;
      }

      // First check format validation
      const formatValidation = validateUsernameFormat(name);
      if (!formatValidation.valid) {
        setIsValid(false);
        setError(formatValidation.error || 'Invalid username format');
        return;
      }

      setIsChecking(true);
      setError('');

      try {
        const isAvailable = await checkUsernameAvailability(name);
        
        if (!isAvailable) {
          setIsValid(false);
          setError('Username already taken');
        } else {
          setIsValid(true);
          setError('');
        }
      } catch (error) {
        console.error('Error checking username:', error);
        setIsValid(false);
        setError('Error checking username availability. Please try again.');
      } finally {
        setIsChecking(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    checkUsername(username);
  }, [username, checkUsername]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remove any invalid characters while typing
    const cleanValue = value.replace(/[^a-zA-Z0-9_-]/g, '');
    setUsername(cleanValue);
  };

  const handleConfirm = () => {
    if (isValid && username.trim()) {
      onUsernameConfirm(username.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid && username.trim()) {
      handleConfirm();
    }
  };

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Choose Your Username
        </CardTitle>
        <CardDescription>
          Your username will be displayed on the leaderboard
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Username Input */}
        <div className="space-y-2">
          <div className="relative">
            <Input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter username (3-20 characters)"
              disabled={disabled || isChecking}
              maxLength={20}
              className={`pr-10 ${
                isValid === true 
                  ? 'border-green-500 focus:border-green-500' 
                  : isValid === false 
                    ? 'border-red-500 focus:border-red-500' 
                    : ''
              }`}
            />
            
            {/* Status Icon */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : isValid === true ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : isValid === false ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : null}
            </div>
          </div>

          {/* Character Counter */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Letters, numbers, _ and - only</span>
            <span>{username.length}/20</span>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isValid === true && !error && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Great! "{username}" is available
            </AlertDescription>
          </Alert>
        )}

        {/* Confirm Button */}
        <Button
          onClick={handleConfirm}
          disabled={disabled || !isValid || isChecking || !username.trim()}
          className="w-full h-12 text-base font-medium"
          size="lg"
        >
          {isChecking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking Availability...
            </>
          ) : (
            `Confirm Username: ${username || '[enter username]'}`
          )}
        </Button>

        {/* Helper Text */}
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>Username requirements:</p>
          <ul className="list-disc list-inside space-y-1 text-left">
            <li>3-20 characters long</li>
            <li>Letters, numbers, underscores (_), and hyphens (-) only</li>
            <li>Cannot start or end with _ or -</li>
            <li>Must be unique (case-insensitive)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}