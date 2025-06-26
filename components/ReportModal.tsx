"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, Flag } from "lucide-react";
import { getOrCreateSessionId } from "@/lib/session";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageId: string;
  username: string;
  imageUrl: string;
}

interface ReportOption {
  value: 'not_feet' | 'inappropriate' | 'spam_fake' | 'other';
  label: string;
  description: string;
}

const REPORT_OPTIONS: ReportOption[] = [
  {
    value: 'not_feet',
    label: 'Not feet',
    description: 'This image does not show feet'
  },
  {
    value: 'inappropriate',
    label: 'Inappropriate content',
    description: 'Contains inappropriate or explicit content'
  },
  {
    value: 'spam_fake',
    label: 'Spam/fake',
    description: 'Spam, fake, or duplicate content'
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other reason (please specify below)'
  }
];

export function ReportModal({ isOpen, onClose, imageId, username, imageUrl }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleClose = () => {
    if (isSubmitting) return; // Don't close while submitting
    
    // Reset form state
    setSelectedReason('');
    setDetails('');
    setSubmitStatus('idle');
    setErrorMessage('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      setErrorMessage('Please select a reason for reporting this image.');
      return;
    }

    if (selectedReason === 'other' && !details.trim()) {
      setErrorMessage('Please provide details for "Other" reports.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const sessionId = getOrCreateSessionId();
      
      const response = await fetch('/api/reports/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({
          imageId: imageId,
          reportReason: selectedReason,
          reportDetails: details.trim() || undefined
        })
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        // Auto-close after 2 seconds on success
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setSubmitStatus('error');
        setErrorMessage(result.error || 'Failed to submit report. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setSubmitStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-500" />
            Report Image
          </DialogTitle>
          <DialogDescription>
            Report inappropriate content to help keep our community safe. 
            Reports are reviewed by moderators.
          </DialogDescription>
        </DialogHeader>

        {submitStatus === 'success' ? (
          <div className="py-6">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Thank you for your report. Our moderation team will review this image shortly.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Image Preview */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <img 
                src={imageUrl} 
                alt={`${username}'s submission`}
                className="w-16 h-16 object-cover rounded-md"
              />
              <div>
                <div className="font-medium">{username}'s image</div>
                <div className="text-sm text-muted-foreground">
                  This report will be submitted anonymously
                </div>
              </div>
            </div>

            {/* Report Reason Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Why are you reporting this image?
              </Label>
              <RadioGroup 
                value={selectedReason} 
                onValueChange={setSelectedReason}
                className="space-y-2"
              >
                {REPORT_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-start space-x-2">
                    <RadioGroupItem 
                      value={option.value} 
                      id={option.value}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label 
                        htmlFor={option.value}
                        className="font-medium cursor-pointer"
                      >
                        {option.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Additional Details */}
            <div className="space-y-2">
              <Label htmlFor="details" className="text-base font-medium">
                Additional details {selectedReason === 'other' && (
                  <span className="text-red-500">*</span>
                )}
              </Label>
              <Textarea
                id="details"
                placeholder={
                  selectedReason === 'other' 
                    ? "Please describe the issue..." 
                    : "Optional: Provide additional context..."
                }
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={500}
                rows={3}
                className="resize-none"
              />
              <div className="text-right text-xs text-muted-foreground">
                {details.length}/500 characters
              </div>
            </div>

            {/* Error Message */}
            {(submitStatus === 'error' || errorMessage) && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          {submitStatus === 'success' ? (
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          ) : (
            <div className="flex gap-2 w-full">
              <Button 
                variant="outline" 
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedReason}
                className="flex-1"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit Report'
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}