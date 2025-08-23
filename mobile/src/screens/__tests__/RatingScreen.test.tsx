import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RatingScreen from '../RatingScreen';
import { submitRating } from '../../services/supabase';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const mockRoute = {
  params: {
    imageUri: 'https://example.com/image.jpg',
    imageId: 'test-image-id',
  },
};

jest.mock('../../services/supabase');

describe('RatingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(
      <RatingScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('Rate this image')).toBeTruthy();
    expect(getByText('Tap a button to rate from 1-10')).toBeTruthy();
    expect(getByText('Submit Rating')).toBeTruthy();
  });

  it('displays rating buttons 1-10', () => {
    const { getByText } = render(
      <RatingScreen navigation={mockNavigation} route={mockRoute} />
    );

    for (let i = 1; i <= 10; i++) {
      expect(getByText(i.toString())).toBeTruthy();
    }
  });

  it('allows selecting a rating', () => {
    const { getByText } = render(
      <RatingScreen navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.press(getByText('8'));
    expect(getByText('⭐ 8/10')).toBeTruthy();
    expect(getByText('Excellent!')).toBeTruthy();
  });

  it('submits rating successfully', async () => {
    (submitRating as jest.Mock).mockResolvedValue({ id: 'rating-id' });

    const { getByText } = render(
      <RatingScreen navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.press(getByText('7'));
    fireEvent.press(getByText('Submit Rating'));

    await waitFor(() => {
      expect(submitRating).toHaveBeenCalledWith('test-image-id', 7);
    });
  });

  it('shows error when submitting without rating', () => {
    const alertSpy = jest.spyOn(require('react-native'), 'Alert').mockImplementation(() => {});

    const { getByText } = render(
      <RatingScreen navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.press(getByText('Submit Rating'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Rating Required',
      'Please select a rating before submitting.'
    );
  });
});