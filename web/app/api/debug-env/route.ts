import { NextResponse } from 'next/server';

export async function GET() {
  const rawValue = process.env.NEXT_PUBLIC_ENABLE_DISCRETE_RATINGS;
  const normalizedValue = rawValue?.trim();
  
  return NextResponse.json({
    raw_value: rawValue,
    raw_value_length: rawValue?.length || 0,
    normalized_value: normalizedValue,
    normalized_value_length: normalizedValue?.length || 0,
    is_exactly_true: rawValue === 'true',
    is_normalized_true: normalizedValue === 'true',
    raw_value_charCodes: rawValue ? Array.from(rawValue).map(char => char.charCodeAt(0)) : [],
  });
}